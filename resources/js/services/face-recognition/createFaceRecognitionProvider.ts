import { VladmandicFaceApiProvider } from '@/services/face-recognition/VladmandicFaceApiProvider';
import type { FaceRecognitionProvider } from '@/services/face-recognition/FaceRecognitionProvider';
import type { AttendanceConfig } from '@/services/face-recognition/types';

export function createFaceRecognitionProvider(
    config: AttendanceConfig,
): FaceRecognitionProvider {
    return new VladmandicFaceApiProvider(
        config.models_url,
        config.min_detection_score,
        config.min_face_box_px,
    );
}
