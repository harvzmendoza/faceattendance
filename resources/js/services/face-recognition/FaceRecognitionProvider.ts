import type {
    DetectedFace,
    EnrollmentResult,
    FaceInput,
    MatchResult,
    RosterEntry,
} from '@/services/face-recognition/types';

export interface FaceRecognitionProvider {
    initialize(): Promise<void>;
    loadModels(): Promise<void>;
    detectFace(input: FaceInput): Promise<DetectedFace[]>;
    generateDescriptor(input: FaceInput): Promise<EnrollmentResult>;
    findMatch(
        descriptor: number[],
        roster: RosterEntry[],
        threshold: number,
    ): MatchResult | null;
    calculateDistance(a: number[], b: number[]): number;
}
