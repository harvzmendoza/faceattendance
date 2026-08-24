import type { LandmarkPoint } from '@/services/face-recognition/types';

export const REQUIRED_BLINKS = 2;
export const EAR_OPEN_THRESHOLD = 0.25;
export const EAR_CLOSED_THRESHOLD = 0.19;
export const MIN_CLOSED_FRAMES = 2;

export type BlinkTrackerStatus = {
    blinks: number;
    complete: boolean;
    eyesClosed: boolean;
};

function distance(a: LandmarkPoint, b: LandmarkPoint): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.hypot(dx, dy);
}

export function eyeAspectRatio(eye: LandmarkPoint[]): number | null {
    if (eye.length < 6) {
        return null;
    }

    const vertical = distance(eye[1], eye[5]) + distance(eye[2], eye[4]);
    const horizontal = distance(eye[0], eye[3]);

    if (horizontal === 0) {
        return null;
    }

    return vertical / (2 * horizontal);
}

export function meanEyeAspectRatio(landmarks: LandmarkPoint[]): number | null {
    if (landmarks.length < 48) {
        return null;
    }

    const left = eyeAspectRatio(landmarks.slice(36, 42));
    const right = eyeAspectRatio(landmarks.slice(42, 48));

    if (left === null || right === null) {
        return null;
    }

    return (left + right) / 2;
}

export function createBlinkTracker(options?: {
    openThreshold?: number;
    closedThreshold?: number;
    minClosedFrames?: number;
    requiredBlinks?: number;
}): {
    reset: () => void;
    push: (ear: number | null) => BlinkTrackerStatus;
} {
    const openThreshold = options?.openThreshold ?? EAR_OPEN_THRESHOLD;
    const closedThreshold = options?.closedThreshold ?? EAR_CLOSED_THRESHOLD;
    const minClosedFrames = options?.minClosedFrames ?? MIN_CLOSED_FRAMES;
    const requiredBlinks = options?.requiredBlinks ?? REQUIRED_BLINKS;

    let blinks = 0;
    let closedFrames = 0;
    let isClosed = false;

    const snapshot = (): BlinkTrackerStatus => ({
        blinks: Math.min(blinks, requiredBlinks),
        complete: blinks >= requiredBlinks,
        eyesClosed: isClosed,
    });

    return {
        reset(): void {
            blinks = 0;
            closedFrames = 0;
            isClosed = false;
        },
        push(ear: number | null): BlinkTrackerStatus {
            if (ear === null) {
                return snapshot();
            }

            if (ear < closedThreshold) {
                closedFrames += 1;

                if (closedFrames >= minClosedFrames) {
                    isClosed = true;
                }

                return snapshot();
            }

            if (ear > openThreshold) {
                if (isClosed && blinks < requiredBlinks) {
                    blinks += 1;
                }

                isClosed = false;
                closedFrames = 0;
            }

            return snapshot();
        },
    };
}
