import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, RefreshCw, Save, ScanFace, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { FaceLivenessGuide } from '@/components/face-liveness-guide';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { useFaceRecognitionProvider } from '@/hooks/use-face-recognition-provider';
import AppLayout from '@/layouts/app-layout';
import { requestCameraStream, stopMediaStream } from '@/lib/camera';
import { show } from '@/routes/participants';
import { update as updateFaceProfile } from '@/routes/participants/face-profile';
import { faceErrorMessages } from '@/services/face-recognition';
import {
    buildGuideLayout,
    createLivenessChallenge,
} from '@/services/face-recognition/liveness';
import type { LivenessStatus } from '@/services/face-recognition/liveness';
import type { ParticipantSummary } from '@/types/models';

const lookHint = 'Look straight';
const capturedHint = 'Liveness Verified';
const idleHint =
    'Enroll this participant using the camera. Look straight, turn left, turn right, then blink.';
const reenrollHint =
    'Re-enroll this participant using the camera. Look straight, turn left, turn right, then blink.';

function chipLabel(
    captured: boolean,
    cameraOn: boolean,
    alreadyEnrolled: boolean,
    instruction: string,
): string {
    if (captured) {
        return capturedHint;
    }

    if (cameraOn) {
        return instruction;
    }

    return alreadyEnrolled ? 'Already enrolled' : 'Not enrolled';
}

function emptyChallenge(): Pick<LivenessStatus, 'progress' | 'instruction'> {
    return {
        progress: 0,
        instruction: lookHint,
    };
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
    const overlayRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const cameraOnRef = useRef(false);
    const capturedRef = useRef(false);
    const lastDetectAt = useRef(0);
    const challengeRef = useRef(createLivenessChallenge());
    const [status, setStatus] = useState(
        participant.latest_face_profile ? reenrollHint : idleHint,
    );
    const [cameraOn, setCameraOn] = useState(false);
    const [challengeUi, setChallengeUi] = useState(emptyChallenge);
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

    function resetChallenge(): void {
        challengeRef.current.reset();
        capturedRef.current = false;
        setChallengeUi(emptyChallenge());
        form.setData({
            descriptor: [],
            quality_score: 0,
            model_version: attendance.model_version,
        });
        setStatus(lookHint);
    }

    async function startCamera(): Promise<void> {
        try {
            stopMediaStream(streamRef.current);

            const stream = await requestCameraStream();
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            cameraOnRef.current = true;
            setCameraOn(true);
            resetChallenge();
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
        resetChallenge();
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

            if (detecting || capturedRef.current || !cameraOnRef.current) {
                return;
            }

            const video = videoRef.current;
            const overlay = overlayRef.current;
            const provider = providerRef.current;

            if (
                !ready ||
                !video ||
                !overlay ||
                video.readyState < 2 ||
                !provider
            ) {
                return;
            }

            const now = Date.now();

            if (now - lastDetectAt.current < 100) {
                return;
            }

            lastDetectAt.current = now;

            const layout = buildGuideLayout(video, {
                width: overlay.clientWidth,
                height: overlay.clientHeight,
            });

            if (layout === null) {
                return;
            }

            detecting = true;

            void provider
                .detectFace(video)
                .then((faces) => {
                    if (cancelled || capturedRef.current) {
                        return;
                    }

                    const result = challengeRef.current.push(faces, layout);

                    setChallengeUi({
                        progress: result.progress,
                        instruction: result.error ?? result.instruction,
                    });
                    setStatus(result.error ?? result.instruction);

                    if (!result.complete) {
                        return;
                    }

                    const descriptor =
                        result.held?.descriptor ??
                        (faces[0]?.descriptor?.length === 128
                            ? faces[0].descriptor
                            : null);
                    const qualityScore =
                        result.held?.qualityScore ?? faces[0]?.score ?? 0;

                    if (descriptor === null) {
                        challengeRef.current.reset();
                        setChallengeUi(emptyChallenge());
                        setStatus(faceErrorMessages.too_blurry);

                        return;
                    }

                    capturedRef.current = true;
                    form.setData({
                        descriptor,
                        quality_score: qualityScore,
                        model_version: attendance.model_version,
                    });
                    setChallengeUi({
                        progress: 1,
                        instruction: capturedHint,
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
    }, [attendance.model_version, providerRef, ready]);

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
            <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">
                        {participant.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {participant.registration_number}
                    </p>
                    <StatusChip
                        icon={ScanFace}
                        label={chipLabel(
                            captured,
                            cameraOn,
                            participant.latest_face_profile !== null,
                            challengeUi.instruction,
                        )}
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
                <div className="relative overflow-hidden rounded-2xl bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="aspect-square w-full -scale-x-100 object-cover md:aspect-video"
                    />
                    {cameraOn && (
                        <FaceLivenessGuide
                            ref={overlayRef}
                            progress={challengeUi.progress}
                            instruction={challengeUi.instruction}
                            verified={captured}
                        />
                    )}
                </div>
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
