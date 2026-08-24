import { describe, expect, it } from 'vitest';
import {
    createBlinkTracker,
    eyeAspectRatio,
    meanEyeAspectRatio,
} from '@/services/face-recognition/liveness';
import type { LandmarkPoint } from '@/services/face-recognition/types';

function eye(vertical: number): LandmarkPoint[] {
    return [
        { x: 0, y: 0 },
        { x: 5, y: vertical },
        { x: 15, y: vertical },
        { x: 20, y: 0 },
        { x: 15, y: -vertical },
        { x: 5, y: -vertical },
    ];
}

function landmarks68(vertical: number): LandmarkPoint[] {
    const points = Array.from({ length: 68 }, () => ({ x: 0, y: 0 }));
    const left = eye(vertical);
    const right = eye(vertical);

    for (let index = 0; index < 6; index++) {
        points[36 + index] = left[index];
        points[42 + index] = { x: right[index].x + 40, y: right[index].y };
    }

    return points;
}

function blink(tracker: ReturnType<typeof createBlinkTracker>): void {
    tracker.push(0.4);
    tracker.push(0.1);
    tracker.push(0.1);
    tracker.push(0.4);
}

describe('eye aspect ratio', () => {
    it('is higher for an open eye than a closed eye', () => {
        const open = eyeAspectRatio(eye(8));
        const closed = eyeAspectRatio(eye(1));

        expect(open).toBeGreaterThan(0.25);
        expect(closed).toBeLessThan(0.19);
        expect(open).toBeGreaterThan(closed ?? 0);
    });

    it('returns null when landmarks are missing', () => {
        expect(eyeAspectRatio([])).toBeNull();
        expect(meanEyeAspectRatio([])).toBeNull();
    });

    it('averages both eyes from 68-point landmarks', () => {
        expect(meanEyeAspectRatio(landmarks68(8))).toBeGreaterThan(0.25);
        expect(meanEyeAspectRatio(landmarks68(1))).toBeLessThan(0.19);
    });
});

describe('blink tracker', () => {
    it('counts two open-closed-open cycles as complete', () => {
        const tracker = createBlinkTracker();

        blink(tracker);
        expect(tracker.push(0.4)).toEqual({
            blinks: 1,
            complete: false,
            eyesClosed: false,
        });

        blink(tracker);
        expect(tracker.push(0.4)).toEqual({
            blinks: 2,
            complete: true,
            eyesClosed: false,
        });
    });

    it('ignores a single closed-frame dip', () => {
        const tracker = createBlinkTracker();

        tracker.push(0.4);
        tracker.push(0.1);
        expect(tracker.push(0.4)).toEqual({
            blinks: 0,
            complete: false,
            eyesClosed: false,
        });
    });

    it('ignores frames with a missing EAR', () => {
        const tracker = createBlinkTracker();

        blink(tracker);
        expect(tracker.push(null).blinks).toBe(1);
        blink(tracker);
        expect(tracker.push(0.4).complete).toBe(true);
    });
});
