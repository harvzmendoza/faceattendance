import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, RefreshCw, Save, ScanFace, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { useFaceRecognitionProvider } from '@/hooks/use-face-recognition-provider';
import AppLayout from '@/layouts/app-layout';
import { requestCameraStream, stopMediaStream } from '@/lib/camera';
import { show } from '@/routes/participants';
import { update as updateFaceProfile } from '@/routes/participants/face-profile';
import { faceErrorMessages } from '@/services/face-recognition';
import {
    createBlinkTracker,
    meanEyeAspectRatio,
    REQUIRED_BLINKS,
} from '@/services/face-recognition/liveness';
import type { ParticipantSummary } from '@/types/models';

const lookHint = 'Look at the camera.';
const capturedHint = 'Face captured. Save to enroll.';

function blinkHint(count: number): string {
    if (count === 0) {
        return 'Blink twice.';
    }

    return `Blink twice · ${count} / ${REQUIRED_BLINKS}`;
}

export default function ParticipantsEnroll({
    participant,
}: {
    participant: ParticipantSummary & {
        latest_face_profile: { id: number; model_version: string } | null;
    };
}) {
    const { attendance } = usePage().props;
    const {
        providerRef,
        ready,
        error: modelError,
    } = useFaceRecognitionProvider();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const cameraOnRef = useRef(false);
    const capturedRef = useRef(false);
    const capturingRef = useRef(false);
    const lastDetectAt = useRef(0);
    const trackerRef = useRef(createBlinkTracker());
    const [status, setStatus] = useState(
        participant.latest_face_profile
            ? 'Re-enroll this participant using the camera. Blink twice when asked.'
            : 'Enroll this participant using the camera. Blink twice when asked.',
    );
    const [cameraOn, setCameraOn] = useState(false);
    const [blinks, setBlinks] = useState(0);
    const form = useForm({
        descriptor: [] as number[],
        quality_score: 0,
        model_version: attendance.model_version,
    });

    useEffect(() => {
        return () => {
            stopMediaStream(streamRef.current);
        };
    }, []);

    async function startCamera(): Promise<void> {
        try {
            stopMediaStream(streamRef.current);

            const stream = await requestCameraStream();
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            trackerRef.current.reset();
            capturedRef.current = false;
            capturingRef.current = false;
            cameraOnRef.current = true;
            setCameraOn(true);
            setBlinks(0);
            form.setData({
                descriptor: [],
                quality_score: 0,
                model_version: attendance.model_version,
            });
            setStatus(lookHint);
        } catch (error) {
            cameraOnRef.current = false;
            setCameraOn(false);
            setStatus(
                error instanceof Error
                    ? error.message
                    : faceErrorMessages.camera_denied,
            );
        }
    }

    function tryAgain(): void {
        trackerRef.current.reset();
        capturedRef.current = false;
        capturingRef.current = false;
        setBlinks(0);
        form.setData({
            descriptor: [],
            quality_score: 0,
            model_version: attendance.model_version,
        });
        setStatus(lookHint);
    }

    useEffect(() => {
        let cancelled = false;
        let detecting = false;
        let raf = 0;

        const tick = (): void => {
            if (cancelled) {
                return;
            }

            raf = window.requestAnimationFrame(tick);

            if (
                detecting ||
                capturingRef.current ||
                capturedRef.current ||
                !cameraOnRef.current
            ) {
                return;
            }

            const video = videoRef.current;
            const provider = providerRef.current;

            if (!ready || !video || video.readyState < 2 || !provider) {
                return;
            }

            const now = Date.now();

            if (now - lastDetectAt.current < 250) {
                return;
            }

            lastDetectAt.current = now;
            detecting = true;

            void provider
                .detectFace(video)
                .then(async (faces) => {
                    if (
                        cancelled ||
                        capturedRef.current ||
                        capturingRef.current
                    ) {
                        return;
                    }

                    if (faces.length === 0) {
                        setStatus(faceErrorMessages.no_face);

                        return;
                    }

                    if (faces.length > 1) {
                        setStatus(faceErrorMessages.multiple_faces);

                        return;
                    }

                    const face = faces[0];
                    const boxSide = Math.min(face.box.width, face.box.height);

                    if (boxSide < attendance.min_face_box_px) {
                        setStatus(faceErrorMessages.too_far);

                        return;
                    }

                    if (face.score < attendance.min_detection_score) {
                        setStatus(faceErrorMessages.too_blurry);

                        return;
                    }

                    const result = trackerRef.current.push(
                        meanEyeAspectRatio(face.landmarks),
                    );
                    setBlinks(result.blinks);

                    if (!result.complete) {
                        setStatus(blinkHint(result.blinks));

                        return;
                    }

                    capturingRef.current = true;

                    const enrollment = await provider.generateDescriptor(video);

                    if (cancelled) {
                        return;
                    }

                    if (!enrollment.ok) {
                        trackerRef.current.reset();
                        capturingRef.current = false;
                        setBlinks(0);
                        setStatus(enrollment.message);

                        return;
                    }

                    capturedRef.current = true;
                    capturingRef.current = false;
                    form.setData({
                        descriptor: enrollment.descriptor,
                        quality_score: enrollment.qualityScore,
                        model_version: attendance.model_version,
                    });
                    setStatus(capturedHint);
                })
                .finally(() => {
                    detecting = false;
                });
        };

        raf = window.requestAnimationFrame(tick);

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(raf);
        };
        // The RAF loop reads refs; form.setData is stable enough across renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        attendance.min_detection_score,
        attendance.min_face_box_px,
        attendance.model_version,
        providerRef,
        ready,
    ]);

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.put(updateFaceProfile.url(participant));
    }

    const canSave =
        form.data.descriptor.length === 128 && ready && !form.processing;
    const captured = form.data.descriptor.length === 128;

    return (
        <AppLayout
            title={
                participant.latest_face_profile
                    ? 'Re-enroll face'
                    : 'Enroll face'
            }
        >
            <Head
                title={
                    participant.latest_face_profile
                        ? `Re-enroll ${participant.full_name}`
                        : `Enroll ${participant.full_name}`
                }
            />
            <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">
                        {participant.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {participant.registration_number}
                    </p>
                    <StatusChip
                        icon={ScanFace}
                        label={
                            captured
                                ? 'Face captured'
                                : cameraOn
                                  ? `Blinks ${blinks} / ${REQUIRED_BLINKS}`
                                  : participant.latest_face_profile
                                    ? 'Already enrolled'
                                    : 'Not enrolled'
                        }
                        tone={
                            captured
                                ? 'success'
                                : cameraOn
                                  ? 'warning'
                                  : participant.latest_face_profile
                                    ? 'success'
                                    : 'warning'
                        }
                    />
                </div>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="aspect-video w-full rounded-2xl bg-black object-cover"
                />
                <p className="text-base">{modelError ?? status}</p>
                {form.errors.descriptor && (
                    <p className="text-sm text-destructive">
                        {form.errors.descriptor}
                    </p>
                )}
                {form.errors.model_version && (
                    <p className="text-sm text-destructive">
                        {form.errors.model_version}
                    </p>
                )}
                <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                        void startCamera();
                    }}
                    disabled={!ready}
                >
                    <Camera />
                    Start camera
                </Button>
                {cameraOn && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="w-full"
                        onClick={tryAgain}
                    >
                        <RefreshCw />
                        Try again
                    </Button>
                )}
                <form onSubmit={submit} className="flex flex-col gap-2">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={!canSave}
                    >
                        <Save />
                        {participant.latest_face_profile
                            ? 'Save re-enrollment'
                            : 'Save enrollment'}
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={show.url(participant)}>
                            <X />
                            Cancel
                        </Link>
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
