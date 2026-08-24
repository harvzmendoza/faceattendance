import * as faceapi from '@vladmandic/face-api';
import {
    calculateDistance,
    findMatch,
} from '@/services/face-recognition/matcher';
import type { FaceRecognitionProvider } from '@/services/face-recognition/FaceRecognitionProvider';
import type {
    DetectedFace,
    EnrollmentResult,
    FaceInput,
    MatchResult,
    RosterEntry,
} from '@/services/face-recognition/types';
import { faceErrorMessages } from '@/services/face-recognition/types';

export class VladmandicFaceApiProvider implements FaceRecognitionProvider {
    private modelsLoaded = false;

    public constructor(
        private readonly modelsUrl: string,
        private readonly minDetectionScore: number,
        private readonly minFaceBoxPx: number,
    ) {}

    public async initialize(): Promise<void> {
        const tf = faceapi.tf as unknown as {
            setBackend: (backendName: string) => Promise<boolean>;
            ready: () => Promise<void>;
        };
        const backends = ['webgl', 'wasm', 'cpu'] as const;

        for (const backend of backends) {
            try {
                await tf.setBackend(backend);
                await tf.ready();

                return;
            } catch {
                continue;
            }
        }

        throw new Error('Unable to initialize a TensorFlow.js backend.');
    }

    public async loadModels(): Promise<void> {
        if (this.modelsLoaded) {
            return;
        }

        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelsUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsUrl),
        ]);

        this.modelsLoaded = true;
    }

    public async detectFace(input: FaceInput): Promise<DetectedFace[]> {
        const detections = await faceapi
            .detectAllFaces(
                input,
                new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }),
            )
            .withFaceLandmarks()
            .withFaceDescriptors();

        return detections.map((detection) => ({
            box: {
                x: detection.detection.box.x,
                y: detection.detection.box.y,
                width: detection.detection.box.width,
                height: detection.detection.box.height,
            },
            score: detection.detection.score,
            descriptor: Array.from(detection.descriptor),
            landmarks: detection.landmarks.positions.map((point) => ({
                x: point.x,
                y: point.y,
            })),
        }));
    }

    public async generateDescriptor(
        input: FaceInput,
    ): Promise<EnrollmentResult> {
        const faces = await this.detectFace(input);

        if (faces.length === 0) {
            return {
                ok: false,
                error: 'no_face',
                message: faceErrorMessages.no_face,
            };
        }

        if (faces.length > 1) {
            return {
                ok: false,
                error: 'multiple_faces',
                message: faceErrorMessages.multiple_faces,
            };
        }

        const face = faces[0];
        const boxSide = Math.min(face.box.width, face.box.height);

        if (boxSide < this.minFaceBoxPx) {
            return {
                ok: false,
                error: 'too_far',
                message: faceErrorMessages.too_far,
            };
        }

        if (face.score < this.minDetectionScore) {
            return {
                ok: false,
                error: 'too_blurry',
                message: faceErrorMessages.too_blurry,
            };
        }

        if (face.descriptor === null || face.descriptor.length !== 128) {
            return {
                ok: false,
                error: 'too_blurry',
                message: faceErrorMessages.too_blurry,
            };
        }

        return {
            ok: true,
            descriptor: face.descriptor,
            qualityScore: face.score,
        };
    }

    public findMatch(
        descriptor: number[],
        roster: RosterEntry[],
        threshold: number,
    ): MatchResult | null {
        return findMatch(descriptor, roster, threshold);
    }

    public calculateDistance(a: number[], b: number[]): number {
        return calculateDistance(a, b);
    }
}
