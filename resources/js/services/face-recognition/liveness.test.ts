import { describe, expect, it } from 'vitest';
import {
    buildGuideLayout,
    createLivenessChallenge,
    estimateYaw,
    eyeAspectRatio,
    GUIDE_RADIUS_RATIO,
    HOLD_FRAMES,
    isFaceInGuide,
    meanEyeAspectRatio,
    minEyeAspectRatio,
    type GuideLayout,
} from '@/services/face-recognition/liveness';
import type {
    DetectedFace,
    FaceBox,
    LandmarkPoint,
} from '@/services/face-recognition/types';

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

function landmarks68(vertical: number, noseOffsetX = 0): LandmarkPoint[] {
    const points = Array.from({ length: 68 }, () => ({ x: 100, y: 100 }));
    const left = eye(vertical);
    const right = eye(vertical);

    for (let index = 0; index < 6; index++) {
        points[36 + index] = { x: 80 + left[index].x, y: 100 + left[index].y };
        points[42 + index] = {
            x: 120 + right[index].x,
            y: 100 + right[index].y,
        };
    }

    points[36] = { x: 80, y: 100 };
    points[45] = { x: 140, y: 100 };
    points[30] = { x: 110 + noseOffsetX, y: 120 };

    return points;
}

function box(): FaceBox {
    return { x: 140, y: 130, width: 120, height: 140 };
}

function layout(): GuideLayout {
    return {
        displayWidth: 400,
        displayHeight: 400,
        videoWidth: 400,
        videoHeight: 400,
        circleCx: 200,
        circleCy: 200,
        circleRadius: 140,
    };
}

function face(overrides: Partial<DetectedFace> = {}): DetectedFace {
    return {
        box: box(),
        score: 0.9,
        descriptor: Array.from({ length: 128 }, (_, index) => index * 0.001),
        landmarks: landmarks68(8),
        ...overrides,
    };
}

function holdStraight(
    challenge: ReturnType<typeof createLivenessChallenge>,
): void {
    for (let index = 0; index < HOLD_FRAMES; index++) {
        challenge.push([face()], layout());
    }
}

describe('eye aspect ratio', () => {
    it('is higher for an open eye than a closed eye', () => {
        const open = eyeAspectRatio(eye(8));
        const closed = eyeAspectRatio(eye(1));

        expect(open).toBeGreaterThan(0.25);
        expect(closed).toBeLessThan(0.21);
        expect(open).toBeGreaterThan(closed ?? 0);
    });

    it('returns null when landmarks are missing', () => {
        expect(eyeAspectRatio([])).toBeNull();
        expect(meanEyeAspectRatio([])).toBeNull();
        expect(minEyeAspectRatio([])).toBeNull();
    });

    it('uses the smaller eye for min EAR', () => {
        expect(minEyeAspectRatio(landmarks68(8))).toBeGreaterThan(0.25);
        expect(minEyeAspectRatio(landmarks68(1))).toBeLessThan(0.21);
    });
});

describe('yaw', () => {
    it('is near zero when looking straight', () => {
        const yaw = estimateYaw(landmarks68(8, 0), box());

        expect(yaw).not.toBeNull();
        expect(Math.abs(yaw ?? 1)).toBeLessThan(0.08);
    });

    it('is positive when the user turns left', () => {
        expect(estimateYaw(landmarks68(8, 30), box()) ?? 0).toBeGreaterThan(
            0.14,
        );
    });

    it('is negative when the user turns right', () => {
        expect(estimateYaw(landmarks68(8, -30), box()) ?? 0).toBeLessThan(
            -0.14,
        );
    });
});

describe('face in guide', () => {
    it('accepts a centered large enough face', () => {
        expect(isFaceInGuide(box(), layout())).toBe(true);
    });

    it('rejects a face outside the circle', () => {
        expect(
            isFaceInGuide({ x: 0, y: 0, width: 40, height: 40 }, layout()),
        ).toBe(false);
    });
});

describe('guide layout', () => {
    it('sizes the circle from the shorter display side', () => {
        const measured = buildGuideLayout(
            { videoWidth: 640, videoHeight: 480 },
            { width: 800, height: 450 },
        );

        expect(measured).not.toBeNull();
        expect(measured?.circleCx).toBe(400);
        expect(measured?.circleCy).toBe(225);
        expect(measured?.circleRadius).toBe(450 * GUIDE_RADIUS_RATIO);
    });

    it('returns null when the video has no size yet', () => {
        expect(
            buildGuideLayout(
                { videoWidth: 0, videoHeight: 0 },
                { width: 400, height: 400 },
            ),
        ).toBeNull();
    });
});

describe('liveness challenge', () => {
    it('does not advance when two faces are present', () => {
        const challenge = createLivenessChallenge();

        const status = challenge.push([face(), face()], layout());

        expect(status.step).toBe('straight');
        expect(status.complete).toBe(false);
        expect(status.error).toContain('Multiple faces');
    });

    it('asks to recenter when the face leaves the circle', () => {
        const challenge = createLivenessChallenge();

        holdStraight(challenge);

        const status = challenge.push(
            [
                face({
                    box: { x: 0, y: 0, width: 30, height: 30 },
                }),
            ],
            layout(),
        );

        expect(status.step).toBe('left');
        expect(status.instruction).toBe('Center your face in the circle.');
        expect(status.complete).toBe(false);
    });

    it('completes straight, left, right, then one blink on close', () => {
        const challenge = createLivenessChallenge();

        holdStraight(challenge);
        expect(challenge.push([face()], layout()).step).toBe('left');

        for (let index = 0; index < HOLD_FRAMES; index++) {
            challenge.push([face({ landmarks: landmarks68(8, 30) })], layout());
        }

        expect(challenge.push([face()], layout()).step).toBe('right');

        for (let index = 0; index < HOLD_FRAMES; index++) {
            challenge.push(
                [face({ landmarks: landmarks68(8, -30) })],
                layout(),
            );
        }

        expect(challenge.push([face()], layout()).instruction).toBe('Blink');

        challenge.push([face({ landmarks: landmarks68(8) })], layout());

        const verified = challenge.push(
            [face({ landmarks: landmarks68(1) })],
            layout(),
        );

        expect(verified.complete).toBe(true);
        expect(verified.instruction).toBe('Liveness Verified');
        expect(verified.held?.descriptor).toHaveLength(128);
        expect(verified.progress).toBe(1);
    });

    it('counts a blink when resting EAR is low, as with glasses', () => {
        const challenge = createLivenessChallenge();

        holdStraight(challenge);

        for (let index = 0; index < HOLD_FRAMES; index++) {
            challenge.push([face({ landmarks: landmarks68(3, 30) })], layout());
        }

        for (let index = 0; index < HOLD_FRAMES; index++) {
            challenge.push(
                [face({ landmarks: landmarks68(3, -30) })],
                layout(),
            );
        }

        challenge.push([face({ landmarks: landmarks68(3) })], layout());
        challenge.push([face({ landmarks: landmarks68(3) })], layout());

        const verified = challenge.push(
            [face({ landmarks: landmarks68(1) })],
            layout(),
        );

        expect(verified.complete).toBe(true);
    });
});
