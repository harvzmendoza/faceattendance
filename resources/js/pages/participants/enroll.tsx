import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <Card className="mx-auto max-w-3xl">
                <CardHeader>
                    <CardTitle>{participant.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {participant.registration_number}
                    </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="aspect-video w-full rounded-xl bg-black object-cover"
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
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            className="min-h-11"
                            onClick={startCamera}
                            disabled={!ready}
                        >
                            Start camera
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="min-h-11"
                            onClick={captureFromVideo}
                            disabled={!ready || capturing}
                        >
                            Capture face
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="photo">Or use a photo</Label>
                        <Input
                            id="photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="h-11"
                            disabled={!ready || capturing}
                            onChange={(event) =>
                                void captureFromPhoto(event.target.files?.[0])
                            }
                        />
                    </div>
                    <form onSubmit={submit} className="flex flex-wrap gap-2">
                        <Button
                            type="submit"
                            className="min-h-11"
                            disabled={!canSave}
                        >
                            {participant.latest_face_profile
                                ? 'Save re-enrollment'
                                : 'Save enrollment'}
                        </Button>
                        <Button asChild variant="outline" className="min-h-11">
                            <Link href={show.url(participant)}>Cancel</Link>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
