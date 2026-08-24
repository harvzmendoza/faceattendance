import type { FaceBox, MatchResult } from '@/services/face-recognition/types';

export const SELECT_LOCK_MS = 1500;
export const MISS_FRAMES = 3;

export type DisplayBox = {
    left: number;
    top: number;
    width: number;
    height: number;
};

export type OverlayFace = {
    box: FaceBox;
    match: MatchResult | null;
};

export type ActiveFaceSelection = {
    participantId: number | null;
    lockedUntil: number;
    missed: number;
};

export function emptyActiveFaceSelection(): ActiveFaceSelection {
    return {
        participantId: null,
        lockedUntil: 0,
        missed: 0,
    };
}

export function mapVideoBoxToDisplay(
    box: FaceBox,
    video: { videoWidth: number; videoHeight: number },
    display: { width: number; height: number },
): DisplayBox | null {
    if (
        video.videoWidth <= 0 ||
        video.videoHeight <= 0 ||
        display.width <= 0 ||
        display.height <= 0
    ) {
        return null;
    }

    const scale = Math.max(
        display.width / video.videoWidth,
        display.height / video.videoHeight,
    );
    const drawnWidth = video.videoWidth * scale;
    const drawnHeight = video.videoHeight * scale;
    const offsetX = (display.width - drawnWidth) / 2;
    const offsetY = (display.height - drawnHeight) / 2;

    return {
        left: box.x * scale + offsetX,
        top: box.y * scale + offsetY,
        width: box.width * scale,
        height: box.height * scale,
    };
}

function closestMatch(faces: OverlayFace[]): MatchResult | null {
    let closest: MatchResult | null = null;

    for (const face of faces) {
        if (face.match === null) {
            continue;
        }

        if (closest === null || face.match.distance < closest.distance) {
            closest = face.match;
        }
    }

    return closest;
}

function matchForParticipant(
    faces: OverlayFace[],
    participantId: number,
): MatchResult | null {
    for (const face of faces) {
        if (face.match?.participant.id === participantId) {
            return face.match;
        }
    }

    return null;
}

export function selectActiveFace(
    state: ActiveFaceSelection,
    faces: OverlayFace[],
    now: number,
    lockMs = SELECT_LOCK_MS,
    missLimit = MISS_FRAMES,
): ActiveFaceSelection {
    const best = closestMatch(faces);

    if (state.participantId !== null) {
        const current = matchForParticipant(faces, state.participantId);

        if (current !== null) {
            if (
                best !== null &&
                best.participant.id !== state.participantId &&
                now >= state.lockedUntil &&
                best.distance < current.distance
            ) {
                return {
                    participantId: best.participant.id,
                    lockedUntil: now + lockMs,
                    missed: 0,
                };
            }

            return {
                participantId: state.participantId,
                lockedUntil: state.lockedUntil,
                missed: 0,
            };
        }

        const missed = state.missed + 1;

        if (missed >= missLimit) {
            if (best === null) {
                return emptyActiveFaceSelection();
            }

            return {
                participantId: best.participant.id,
                lockedUntil: now + lockMs,
                missed: 0,
            };
        }

        return {
            participantId: state.participantId,
            lockedUntil: state.lockedUntil,
            missed,
        };
    }

    if (best === null) {
        return emptyActiveFaceSelection();
    }

    return {
        participantId: best.participant.id,
        lockedUntil: now + lockMs,
        missed: 0,
    };
}
