export type FaceBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type DetectedFace = {
    box: FaceBox;
    score: number;
    descriptor: number[] | null;
};

export type FaceErrorCode =
    | 'no_face'
    | 'multiple_faces'
    | 'too_far'
    | 'too_blurry'
    | 'unknown'
    | 'low_confidence'
    | 'camera_denied';

export type EnrollmentSuccess = {
    ok: true;
    descriptor: number[];
    qualityScore: number;
};

export type EnrollmentFailure = {
    ok: false;
    error: FaceErrorCode;
    message: string;
};

export type EnrollmentResult = EnrollmentSuccess | EnrollmentFailure;

export type RosterEntry = {
    id: number;
    full_name: string;
    registration_number: string;
    photo_url: string | null;
    descriptor: number[];
};

export type MatchResult = {
    participant: RosterEntry;
    distance: number;
};

export type AttendanceConfig = {
    recognition_cooldown_seconds: number;
    participant_cooldown_seconds: number;
    match_distance_threshold: number;
    model_version: string;
    models_url: string;
    min_detection_score: number;
    min_face_box_px: number;
};

export type FaceInput = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

export const faceErrorMessages: Record<FaceErrorCode, string> = {
    no_face: 'No face detected. Please look at the camera.',
    multiple_faces:
        'Multiple faces detected. Please make sure only one person is in front of the camera.',
    too_far: 'Face too far away. Please move closer.',
    too_blurry: 'Face too blurry. Please hold still.',
    unknown: 'Face not recognized. Please contact the registration desk.',
    low_confidence:
        'Face not recognized. Please contact the registration desk.',
    camera_denied: 'Camera access requires permission and HTTPS.',
};
