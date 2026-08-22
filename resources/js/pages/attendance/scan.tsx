import { Head, Link, useHttp } from '@inertiajs/react';
import { LogOut, RefreshCw, UserCheck, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { useDeviceHeartbeat } from '@/hooks/use-device-heartbeat';
import { useFaceRecognitionProvider } from '@/hooks/use-face-recognition-provider';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { requestCameraStream, stopMediaStream } from '@/lib/camera';
import { index as attendanceIndex } from '@/routes/attendance';
import { recognitionRoster } from '@/routes/events';
import { faceErrorMessages } from '@/services/face-recognition';
import {
    matchDescriptor,
    setMatchRoster,
} from '@/services/face-recognition/matchWorker';
import type { RosterEntry } from '@/services/face-recognition/types';
import { syncService } from '@/services/offline';

type ScanEvent = {
    id: number;
    name: string;
    event_code: string;
    status: string;
};

type RosterResponse = {
    participants: RosterEntry[];
    present_count: number;
    registered_count: number;
};

type SuccessOverlay = {
    full_name: string;
    registration_number: string;
    photo_url: string | null;
    recorded_at: string;
};

export default function AttendanceScan({
    event,
    presentCount: initialPresentCount,
    presentIds: initialPresentIds,
    registeredCount: initialRegisteredCount,
}: {
    event: ScanEvent;
    presentCount: number;
    presentIds: number[];
    registeredCount: number;
}) {
    const {
        providerRef,
        ready,
        error: modelError,
        attendance,
    } = useFaceRecognitionProvider();
    const { status, pendingCount, lastResult, flush } = useOfflineSync(
        event.id,
    );
    useDeviceHeartbeat(event.id);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rosterRef = useRef<RosterEntry[]>([]);
    const overlayRef = useRef(false);
    const recordingRef = useRef(false);
    const lastDetectAt = useRef(0);
    const lastRecognitionAt = useRef(0);
    const participantCooldownRef = useRef(new Map<number, number>());
    const presentIdsRef = useRef(new Set(initialPresentIds));
    const emptyRosterHint = 'No enrolled faces. Enroll participants first.';
    const [hint, setHint] = useState('Loading roster…');
    const [presentCount, setPresentCount] = useState(initialPresentCount);
    const [registeredCount, setRegisteredCount] = useState(
        initialRegisteredCount,
    );
    const [eventName, setEventName] = useState(event.name);
    const [overlay, setOverlay] = useState<SuccessOverlay | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const rosterHttp = useHttp<Record<string, never>, RosterResponse>({});

    useEffect(() => {
        overlayRef.current = overlay !== null;
    }, [overlay]);

    useEffect(() => {
        async function hydrateFromCache(): Promise<void> {
            const cachedEvent = await syncService.getCachedEvent(event.id);

            if (cachedEvent) {
                setEventName(cachedEvent.name);
                setRegisteredCount(cachedEvent.registered_count);
            }

            const cached = await syncService.getCachedRoster(event.id);

            if (cached.length > 0) {
                rosterRef.current = cached;
                setMatchRoster(cached, attendance.match_distance_threshold);
                setHint('Looking for face…');
            }
        }

        async function applyCachedRoster(): Promise<void> {
            await hydrateFromCache();

            if (rosterRef.current.length === 0) {
                setHint('Unable to load the recognition roster.');
            } else {
                setHint('Looking for face…');
            }
        }

        void hydrateFromCache();

        rosterHttp.get(recognitionRoster.url(event), {
            onSuccess: (data) => {
                rosterRef.current = data.participants;
                setMatchRoster(
                    data.participants,
                    attendance.match_distance_threshold,
                );
                setPresentCount(data.present_count);
                setRegisteredCount(data.registered_count);
                setHint(
                    data.participants.length === 0
                        ? emptyRosterHint
                        : 'Looking for face…',
                );
                void syncService.cacheRoster(event.id, data.participants);
            },
            onHttpException: () => {
                void applyCachedRoster();
            },
            onNetworkError: () => {
                void applyCachedRoster();
            },
        });
        // Load the roster once per scan session.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.id]);

    useEffect(() => {
        let cancelled = false;

        async function start(): Promise<void> {
            try {
                const stream = await requestCameraStream();

                if (cancelled) {
                    stopMediaStream(stream);

                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch (error) {
                if (!cancelled) {
                    setCameraError(
                        error instanceof Error
                            ? error.message
                            : faceErrorMessages.camera_denied,
                    );
                }
            }
        }

        void start();

        return () => {
            cancelled = true;
            stopMediaStream(streamRef.current);
        };
    }, []);

    const recordMatch = useCallback(
        async (participant: RosterEntry) => {
            recordingRef.current = true;

            try {
                const row = await syncService.queueAttendance({
                    event_id: event.id,
                    participant_id: participant.id,
                });

                if (!presentIdsRef.current.has(participant.id)) {
                    presentIdsRef.current.add(participant.id);
                    setPresentCount(presentIdsRef.current.size);
                }

                setOverlay({
                    full_name: participant.full_name,
                    registration_number: participant.registration_number,
                    photo_url: participant.photo_url,
                    recorded_at: row.recorded_at,
                });

                window.setTimeout(() => {
                    setOverlay(null);
                    setHint(
                        syncService.isOnline()
                            ? 'Looking for face…'
                            : 'Attendance saved locally.',
                    );
                }, 2000);

                void flush();
            } finally {
                recordingRef.current = false;
            }
        },
        [event.id, flush],
    );

    useEffect(() => {
        let cancelled = false;
        let detecting = false;
        let raf = 0;

        const tick = (): void => {
            if (cancelled) {
                return;
            }

            raf = window.requestAnimationFrame(tick);

            if (detecting || overlayRef.current || recordingRef.current) {
                return;
            }

            const video = videoRef.current;
            const provider = providerRef.current;

            if (!ready || !video || video.readyState < 2 || !provider) {
                return;
            }

            if (rosterRef.current.length === 0) {
                return;
            }

            const now = Date.now();

            if (now - lastDetectAt.current < 250) {
                return;
            }

            if (
                now - lastRecognitionAt.current <
                attendance.recognition_cooldown_seconds * 1000
            ) {
                return;
            }

            lastDetectAt.current = now;
            detecting = true;

            void provider
                .generateDescriptor(video)
                .then(async (result) => {
                    if (cancelled) {
                        return;
                    }

                    if (!result.ok) {
                        setHint(result.message);

                        return;
                    }

                    const match = await matchDescriptor(result.descriptor);

                    if (match === null) {
                        setHint(faceErrorMessages.unknown);

                        return;
                    }

                    const cooldownUntil =
                        participantCooldownRef.current.get(
                            match.participant.id,
                        ) ?? 0;

                    if (cooldownUntil > now) {
                        setHint('Looking for face…');

                        return;
                    }

                    lastRecognitionAt.current = now;
                    participantCooldownRef.current.set(
                        match.participant.id,
                        now + attendance.participant_cooldown_seconds * 1000,
                    );
                    void recordMatch(match.participant);
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
    }, [
        attendance.match_distance_threshold,
        attendance.participant_cooldown_seconds,
        attendance.recognition_cooldown_seconds,
        providerRef,
        ready,
        recordMatch,
    ]);

    const kioskChip = 'border-0 bg-white/15 text-white backdrop-blur-sm';

    return (
        <div className="relative min-h-dvh bg-zinc-950 text-white">
            <Head title={`Camera attendance · ${eventName}`} />
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-zinc-950/30" />
            <div className="pt-safe pb-safe relative z-10 flex min-h-dvh flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm tracking-wide text-zinc-300 uppercase">
                            {eventName}
                        </p>
                        <p className="mt-1 text-2xl font-semibold md:text-3xl">
                            {cameraError ?? modelError ?? hint}
                        </p>
                        {status === 'offline' && (
                            <p className="mt-2 text-base text-zinc-300">
                                Attendance saved locally.
                            </p>
                        )}
                        {status === 'syncing' && (
                            <p className="mt-2 text-base text-zinc-300">
                                Synchronizing... {pendingCount}
                            </p>
                        )}
                        {status === 'online' &&
                            pendingCount === 0 &&
                            lastResult !== null &&
                            lastResult.synced + lastResult.duplicates > 0 && (
                                <p className="mt-2 text-base text-emerald-400">
                                    Synchronization complete
                                </p>
                            )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                        {status === 'online' && (
                            <StatusChip
                                icon={Wifi}
                                label="Online"
                                className={kioskChip}
                            />
                        )}
                        {status === 'syncing' && (
                            <StatusChip
                                icon={RefreshCw}
                                label="Syncing"
                                className="border-0 bg-amber-500/90 text-white"
                            />
                        )}
                        {status === 'offline' && (
                            <StatusChip
                                icon={WifiOff}
                                label="Offline"
                                className={kioskChip}
                            />
                        )}
                        <StatusChip
                            icon={UserCheck}
                            label={`${presentCount} / ${registeredCount}`}
                            className={kioskChip}
                        />
                    </div>
                </div>
                <div className="flex justify-start">
                    <Button
                        asChild
                        variant="secondary"
                        className="rounded-full"
                    >
                        <Link
                            href={attendanceIndex.url({
                                query: { event_id: event.id },
                            })}
                        >
                            <LogOut />
                            Exit
                        </Link>
                    </Button>
                </div>
            </div>
            {overlay && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 p-6">
                    <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
                        {overlay.photo_url ? (
                            <img
                                src={overlay.photo_url}
                                alt=""
                                className="size-32 rounded-2xl object-cover"
                            />
                        ) : (
                            <div className="flex size-32 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                                No photo
                            </div>
                        )}
                        <p className="text-3xl font-semibold">
                            {overlay.full_name}
                        </p>
                        <p className="text-lg text-zinc-300">
                            {overlay.registration_number}
                        </p>
                        <p className="text-sm text-zinc-400">
                            {new Date(overlay.recorded_at).toLocaleTimeString()}
                        </p>
                        <p className="text-xl font-medium text-emerald-400">
                            Attendance recorded
                        </p>
                        <p className="text-base text-zinc-300">Saved locally</p>
                    </div>
                </div>
            )}
        </div>
    );
}
