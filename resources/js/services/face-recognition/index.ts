export { createFaceRecognitionProvider } from '@/services/face-recognition/createFaceRecognitionProvider';
export {
    calculateDistance,
    findMatch,
} from '@/services/face-recognition/matcher';
export { faceErrorMessages } from '@/services/face-recognition/types';
export type { FaceRecognitionProvider } from '@/services/face-recognition/FaceRecognitionProvider';
export type {
    AttendanceConfig,
    DetectedFace,
    EnrollmentResult,
    FaceErrorCode,
    MatchResult,
    RosterEntry,
} from '@/services/face-recognition/types';
