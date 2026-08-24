import { describe, expect, it } from 'vitest';
import {
    emptyActiveFaceSelection,
    mapVideoBoxToDisplay,
    MISS_FRAMES,
    SELECT_LOCK_MS,
    selectActiveFace,
    type OverlayFace,
} from '@/services/face-recognition/scan-overlay';
import type { RosterEntry } from '@/services/face-recognition/types';

function entry(id: number, name: string): RosterEntry {
    return {
        id,
        full_name: name,
        registration_number: `REG-${id}`,
        photo_url: null,
        descriptor: Array.from({ length: 128 }, () => 0),
    };
}

function recognized(
    id: number,
    name: string,
    distance: number,
    box = { x: 0, y: 0, width: 80, height: 80 },
): OverlayFace {
    return {
        box,
        match: {
            participant: entry(id, name),
            distance,
        },
    };
}

const gray: OverlayFace = {
    box: { x: 200, y: 0, width: 80, height: 80 },
    match: null,
};

describe('mapVideoBoxToDisplay', () => {
    it('maps 1:1 when the video fills the display', () => {
        expect(
            mapVideoBoxToDisplay(
                { x: 100, y: 50, width: 80, height: 120 },
                { videoWidth: 1280, videoHeight: 720 },
                { width: 1280, height: 720 },
            ),
        ).toEqual({
            left: 100,
            top: 50,
            width: 80,
            height: 120,
        });
    });

    it('scales an object-cover 16:9 video into a matching display', () => {
        const mapped = mapVideoBoxToDisplay(
            { x: 128, y: 72, width: 64, height: 72 },
            { videoWidth: 1280, videoHeight: 720 },
            { width: 800, height: 450 },
        );

        expect(mapped).toEqual({
            left: 80,
            top: 45,
            width: 40,
            height: 45,
        });
    });

    it('crops the long side on a square object-cover display', () => {
        const mapped = mapVideoBoxToDisplay(
            { x: 640, y: 360, width: 0, height: 0 },
            { videoWidth: 1280, videoHeight: 720 },
            { width: 400, height: 400 },
        );

        expect(mapped?.left).toBeCloseTo(200);
        expect(mapped?.top).toBeCloseTo(200);
    });

    it('returns null when the video has no size yet', () => {
        expect(
            mapVideoBoxToDisplay(
                { x: 0, y: 0, width: 10, height: 10 },
                { videoWidth: 0, videoHeight: 0 },
                { width: 400, height: 400 },
            ),
        ).toBeNull();
    });
});

describe('selectActiveFace', () => {
    it('selects the closest recognized face', () => {
        const next = selectActiveFace(
            emptyActiveFaceSelection(),
            [gray, recognized(2, 'B', 0.4), recognized(1, 'A', 0.2)],
            1000,
        );

        expect(next.participantId).toBe(1);
        expect(next.lockedUntil).toBe(1000 + SELECT_LOCK_MS);
        expect(next.missed).toBe(0);
    });

    it('does not select an unrecognized face', () => {
        const next = selectActiveFace(emptyActiveFaceSelection(), [gray], 1000);

        expect(next.participantId).toBeNull();
    });

    it('stays on the locked face while another is slightly closer', () => {
        const locked = selectActiveFace(
            emptyActiveFaceSelection(),
            [recognized(1, 'A', 0.3)],
            1000,
        );

        const next = selectActiveFace(
            locked,
            [recognized(1, 'A', 0.3), recognized(2, 'B', 0.2)],
            1100,
        );

        expect(next.participantId).toBe(1);
        expect(next.missed).toBe(0);
    });

    it('switches to a closer face after the lock expires', () => {
        const locked = selectActiveFace(
            emptyActiveFaceSelection(),
            [recognized(1, 'A', 0.3)],
            1000,
        );

        const next = selectActiveFace(
            locked,
            [recognized(1, 'A', 0.3), recognized(2, 'B', 0.1)],
            1000 + SELECT_LOCK_MS,
        );

        expect(next.participantId).toBe(2);
        expect(next.lockedUntil).toBe(1000 + SELECT_LOCK_MS * 2);
    });

    it('clears the selection after enough missed frames', () => {
        let state = selectActiveFace(
            emptyActiveFaceSelection(),
            [recognized(1, 'A', 0.2)],
            1000,
        );

        for (let index = 0; index < MISS_FRAMES; index++) {
            state = selectActiveFace(state, [gray], 2000 + index);
        }

        expect(state.participantId).toBeNull();
        expect(state.missed).toBe(0);
    });

    it('keeps the selection through a short flicker', () => {
        const locked = selectActiveFace(
            emptyActiveFaceSelection(),
            [recognized(1, 'A', 0.2)],
            1000,
        );

        const next = selectActiveFace(locked, [gray], 1100);

        expect(next.participantId).toBe(1);
        expect(next.missed).toBe(1);
    });
});
