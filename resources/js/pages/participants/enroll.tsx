import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, ImagePlus, Save, ScanFace, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFaceRecognitionProvider } from '@/hooks/use-face-recognition-provider';
import AppLayout from '@/layouts/app-layout';
import {
    loadImageFromFile,
    requestCameraStream,
    stopMediaStream,
} from '@/lib/camera';
import { show } from '@/routes/participants';
import { update as updateFaceProfile } from '@/routes/participants/face-profile';
import type { ParticipantSummary } from '@/types/models';

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
    const [status, setStatus] = useState(
        participant.latest_face_profile
            ? 'Re-enroll this participant using the camera or a photo.'
            : 'Enroll this participant using the camera or a photo.',
    );
    const [capturing, setCapturing] = useState(false);
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
            const stream = await requestCameraStream();
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setStatus('Look at the camera, then capture the face.');
        } catch (error) {
            setStatus(
                error instanceof Error
                    ? error.message
                    : 'Camera access requires permission and HTTPS.',
            );
        }
    }

    async function captureFromVideo(): Promise<void> {
        const video = videoRef.current;
        const provider = providerRef.current;

        if (!video || !provider) {
            return;
        }

        setCapturing(true);

        try {
            const result = await provider.generateDescriptor(video);

            if (!result.ok) {
                form.setData('descriptor', []);
                setStatus(result.message);

                return;
            }

            form.setData({
                descriptor: result.descriptor,
                quality_score: result.qualityScore,
                model_version: attendance.model_version,
            });
            setStatus('Face captured. Save to enroll.');
        } finally {
            setCapturing(false);
        }
    }

    async function captureFromPhoto(file: File | undefined): Promise<void> {
        const provider = providerRef.current;

        if (!file || !provider) {
            return;
        }

        setCapturing(true);

        try {
            const image = await loadImageFromFile(file);
            const result = await provider.generateDescriptor(image);

            if (!result.ok) {
                form.setData('descriptor', []);
                setStatus(result.message);

                return;
            }

            form.setData({
                descriptor: result.descriptor,
                quality_score: result.qualityScore,
                model_version: attendance.model_version,
            });
            setStatus('Face captured from photo. Save to enroll.');
        } catch (error) {
            setStatus(
                error instanceof Error
                    ? error.message
                    : 'Face too blurry. Please hold still.',
            );
        } finally {
            setCapturing(false);
        }
    }

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
                                : participant.latest_face_profile
                                  ? 'Already enrolled'
                                  : 'Not enrolled'
                        }
                        tone={
                            captured
                                ? 'success'
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
                    onClick={startCamera}
                    disabled={!ready}
                >
                    <Camera />
                    Start camera
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={captureFromVideo}
                    disabled={!ready || capturing}
                >
                    <ScanFace />
                    Capture face
                </Button>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="photo">Or use a photo</Label>
                    <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-input px-4 text-sm">
                        <ImagePlus className="size-5 text-muted-foreground" />
                        <span>Choose photo</span>
                        <Input
                            id="photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={!ready || capturing}
                            onChange={(event) =>
                                void captureFromPhoto(event.target.files?.[0])
                            }
                        />
                    </label>
                </div>
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
