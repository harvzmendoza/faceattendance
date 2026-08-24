import type {
    DetectedFace,
    FaceBox,
    LandmarkPoint,
} from '@/services/face-recognition/types';
import { faceErrorMessages } from '@/services/face-recognition/types';

export const LIVENESS_STEPS = ['straight', 'left', 'right', 'blink'] as const;

export type LivenessStep = (typeof LIVENESS_STEPS)[number] | 'complete';

export const STRAIGHT_YAW = 0.08;
export const TURN_YAW = 0.14;
export const HOLD_FRAMES = 3;
export const EAR_CLOSED_RATIO = 0.9;
export const MIN_CLOSED_FRAMES = 1;

export const GUIDE_RADIUS_RATIO = 0.38;

export type GuideLayout = {
    displayWidth: number;
    displayHeight: number;
    videoWidth: number;
    videoHeight: number;
    circleCx: number;
    circleCy: number;
    circleRadius: number;
};

export function guideGeometry(
    displayWidth: number,
    displayHeight: number,
): Pick<GuideLayout, 'circleCx' | 'circleCy' | 'circleRadius'> {
    const shortSide = Math.min(displayWidth, displayHeight);

    return {
        circleCx: displayWidth / 2,
        circleCy: displayHeight / 2,
        circleRadius: shortSide * GUIDE_RADIUS_RATIO,
    };
}

export function buildGuideLayout(
    video: Pick<HTMLVideoElement, 'videoWidth' | 'videoHeight'>,
    display: { width: number; height: number },
): GuideLayout | null {
    if (
        video.videoWidth <= 0 ||
        video.videoHeight <= 0 ||
        display.width <= 0 ||
        display.height <= 0
    ) {
        return null;
    }

    return {
        displayWidth: display.width,
        displayHeight: display.height,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        ...guideGeometry(display.width, display.height),
    };
}

export type HeldFace = {
    descriptor: number[];
    qualityScore: number;
};

export type LivenessStatus = {
    step: LivenessStep;
    progress: number;
    instruction: string;
    error: string | null;
    complete: boolean;
    held: HeldFace | null;
};

function distance(a: LandmarkPoint, b: LandmarkPoint): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
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

export function minEyeAspectRatio(landmarks: LandmarkPoint[]): number | null {
    if (landmarks.length < 48) {
        return null;
    }

    const left = eyeAspectRatio(landmarks.slice(36, 42));
    const right = eyeAspectRatio(landmarks.slice(42, 48));

    if (left === null || right === null) {
        return null;
    }

    return Math.min(left, right);
}

export function estimateYaw(
    landmarks: LandmarkPoint[],
    box: FaceBox,
): number | null {
    if (landmarks.length < 46 || box.width === 0) {
        return null;
    }

    const nose = landmarks[30];
    const leftEye = landmarks[36];
    const rightEye = landmarks[45];
    const eyeMidX = (leftEye.x + rightEye.x) / 2;

    return (nose.x - eyeMidX) / box.width;
}

export function mapVideoPointToDisplay(
    x: number,
    y: number,
    layout: GuideLayout,
): { x: number; y: number; scale: number } | null {
    if (
        layout.videoWidth <= 0 ||
        layout.videoHeight <= 0 ||
        layout.displayWidth <= 0 ||
        layout.displayHeight <= 0
    ) {
        return null;
    }

    const scale = Math.max(
        layout.displayWidth / layout.videoWidth,
        layout.displayHeight / layout.videoHeight,
    );
    const drawnWidth = layout.videoWidth * scale;
    const drawnHeight = layout.videoHeight * scale;
    const offsetX = (layout.displayWidth - drawnWidth) / 2;
    const offsetY = (layout.displayHeight - drawnHeight) / 2;

    return {
        x: layout.displayWidth - (x * scale + offsetX),
        y: y * scale + offsetY,
        scale,
    };
}

export function isFaceInGuide(box: FaceBox, layout: GuideLayout): boolean {
    const center = mapVideoPointToDisplay(
        box.x + box.width / 2,
        box.y + box.height / 2,
        layout,
    );

    if (center === null || layout.circleRadius <= 0) {
        return false;
    }

    const offset = Math.hypot(
        center.x - layout.circleCx,
        center.y - layout.circleCy,
    );
    const faceSize = Math.min(box.width, box.height) * center.scale;

    return (
        offset < layout.circleRadius * 0.42 &&
        faceSize > layout.circleRadius * 0.5
    );
}

function instructionFor(step: LivenessStep): string {
    if (step === 'straight') {
        return 'Look straight';
    }

    if (step === 'left') {
        return 'Turn your head left';
    }

    if (step === 'right') {
        return 'Turn your head right';
    }

    if (step === 'blink') {
        return 'Blink';
    }

    return 'Liveness Verified';
}

function progressFor(step: LivenessStep): number {
    if (step === 'straight') {
        return 0;
    }

    if (step === 'left') {
        return 0.25;
    }

    if (step === 'right') {
        return 0.5;
    }

    if (step === 'blink') {
        return 0.75;
    }

    return 1;
}

function isOpenEye(ear: number | null, baseline: number): boolean {
    return ear !== null && ear > baseline * 0.95;
}

export function createLivenessChallenge(): {
    reset: () => void;
    push: (faces: DetectedFace[], layout: GuideLayout) => LivenessStatus;
} {
    let step: LivenessStep = 'straight';
    let holdFrames = 0;
    let held: HeldFace | null = null;
    let openBaseline = 0;
    let hasBaseline = false;
    let closedFrames = 0;

    const snapshot = (
        error: string | null = null,
        instruction?: string,
    ): LivenessStatus => ({
        step,
        progress: progressFor(step),
        instruction: instruction ?? instructionFor(step),
        error,
        complete: step === 'complete',
        held,
    });

    const advance = (): void => {
        holdFrames = 0;
        closedFrames = 0;

        if (step === 'straight') {
            step = 'left';

            return;
        }

        if (step === 'left') {
            step = 'right';

            return;
        }

        if (step === 'right') {
            step = 'blink';

            return;
        }

        step = 'complete';
    };

    return {
        reset(): void {
            step = 'straight';
            holdFrames = 0;
            held = null;
            openBaseline = 0;
            hasBaseline = false;
            closedFrames = 0;
        },
        push(faces: DetectedFace[], layout: GuideLayout): LivenessStatus {
            if (step === 'complete') {
                return snapshot();
            }

            if (faces.length === 0) {
                holdFrames = 0;

                return snapshot(faceErrorMessages.no_face);
            }

            if (faces.length > 1) {
                holdFrames = 0;

                return snapshot(faceErrorMessages.multiple_faces);
            }

            const face = faces[0];

            if (!isFaceInGuide(face.box, layout)) {
                holdFrames = 0;

                return snapshot(null, 'Center your face in the circle.');
            }

            const yaw = estimateYaw(face.landmarks, face.box);
            const ear = minEyeAspectRatio(face.landmarks);

            if (ear !== null) {
                if (!hasBaseline) {
                    openBaseline = ear;
                    hasBaseline = true;
                } else if (ear > openBaseline) {
                    openBaseline = openBaseline * 0.7 + ear * 0.3;
                } else if (isOpenEye(ear, openBaseline)) {
                    openBaseline = openBaseline * 0.95 + ear * 0.05;
                }
            }

            if (
                step === 'straight' &&
                yaw !== null &&
                Math.abs(yaw) < STRAIGHT_YAW &&
                face.descriptor !== null &&
                face.descriptor.length === 128 &&
                ear !== null &&
                isOpenEye(ear, openBaseline || ear)
            ) {
                held = {
                    descriptor: face.descriptor,
                    qualityScore: face.score,
                };
            }

            if (step === 'straight') {
                if (yaw !== null && Math.abs(yaw) < STRAIGHT_YAW) {
                    holdFrames += 1;

                    if (holdFrames >= HOLD_FRAMES) {
                        advance();
                    }
                } else {
                    holdFrames = 0;
                }

                return snapshot();
            }

            if (step === 'left') {
                if (yaw !== null && yaw > TURN_YAW) {
                    holdFrames += 1;

                    if (holdFrames >= HOLD_FRAMES) {
                        advance();
                    }
                } else {
                    holdFrames = 0;
                }

                return snapshot();
            }

            if (step === 'right') {
                if (yaw !== null && yaw < -TURN_YAW) {
                    holdFrames += 1;

                    if (holdFrames >= HOLD_FRAMES) {
                        advance();
                    }
                } else {
                    holdFrames = 0;
                }

                return snapshot();
            }

            if (
                ear !== null &&
                hasBaseline &&
                ear <= openBaseline * EAR_CLOSED_RATIO
            ) {
                closedFrames += 1;

                if (closedFrames >= MIN_CLOSED_FRAMES) {
                    if (
                        held === null &&
                        face.descriptor !== null &&
                        face.descriptor.length === 128
                    ) {
                        held = {
                            descriptor: face.descriptor,
                            qualityScore: face.score,
                        };
                    }

                    advance();
                }
            } else {
                closedFrames = 0;
            }

            return snapshot();
        },
    };
}
