import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createFaceRecognitionProvider } from '@/services/face-recognition';
import type { FaceRecognitionProvider } from '@/services/face-recognition';
import type { AttendanceConfig } from '@/services/face-recognition/types';

export function useFaceRecognitionProvider(): {
    providerRef: RefObject<FaceRecognitionProvider | null>;
    ready: boolean;
    error: string | null;
    attendance: AttendanceConfig;
} {
    const { attendance } = usePage().props;
    const providerRef = useRef<FaceRecognitionProvider | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const provider = createFaceRecognitionProvider(attendance);
        providerRef.current = provider;

        provider
            .initialize()
            .then(() => provider.loadModels())
            .then(() => {
                if (!cancelled) {
                    setReady(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Unable to load face recognition models.');
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        attendance.models_url,
        attendance.min_detection_score,
        attendance.min_face_box_px,
        attendance,
    ]);

    return { providerRef, ready, error, attendance };
}
