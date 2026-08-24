import { Head, Link, useHttp } from '@inertiajs/react';
import { LogOut, RefreshCw, UserCheck, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceScanOverlay } from '@/components/face-scan-overlay';
import type { ScanOverlayBox } from '@/components/face-scan-overlay';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { useDeviceHeartbeat } from '@/hooks/use-device-heartbeat';
import { useFaceRecognitionProvider } from '@/hooks/use-face-recognition-provider';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { requestCameraStream, stopMediaStream } from '@/lib/camera';
import { speakThankYou, unlockSpeech } from '@/lib/speech';
import { index as attendanceIndex } from '@/routes/attendance';
import { recognitionRoster } from '@/routes/events';
import { faceErrorMessages } from '@/services/face-recognition';
import {
    matchDescriptor,
    setMatchRoster,
} from '@/services/face-recognition/matchWorker';
import {
    emptyActiveFaceSelection,
    mapVideoBoxToDisplay,
    selectActiveFace,
} from '@/services/face-recognition/scan-overlay';
import type { OverlayFace } from '@/services/face-recognition/scan-overlay';
import type { RosterEntry } from '@/services/face-recognition/types';
import { syncService } from '@/services/offline';
import type { SessionType } from '@/services/offline/db';

type ScanEvent = {
    id: number;
    name: string;
    event_code: string;
    status: string;
};

type ScanSession = {
    id: number;
    name: string;
    type: SessionType;
    present_ids: number[];
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

function presentMapFromSessions(
    sessions: ScanSession[],
): Map<number, Set<number>> {
    return new Map(
        sessions.map((item) => [item.id, new Set(item.present_ids)]),
    );
}

export default function AttendanceScan({
    event,
    sessions,
    session,
    presentCount: initialPresentCount,
    presentIds: initialPresentIds,
    registeredCount: initialRegisteredCount,
}: {
    event: ScanEvent;
    sessions: ScanSession[];
    session: { id: number; name: string; type: SessionType } | null;
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
    const lastMatchRef = useRef<RosterEntry | null>(null);
    const selectionRef = useRef(emptyActiveFaceSelection());
    const presentBySessionRef = useRef(presentMapFromSessions(sessions));
    const emptyRosterHint = 'No enrolled faces. Enroll participants first.';
    const lookAtCameraHint = 'Look at the camera, then tap a session.';
    const [hint, setHint] = useState('Loading roster…');
    const [presentCount, setPresentCount] = useState(initialPresentCount);
    const [registeredCount, setRegisteredCount] = useState(
        initialRegisteredCount,
    );
    const [eventName, setEventName] = useState(event.name);
    const [overlay, setOverlay] = useState<SuccessOverlay | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [boxes, setBoxes] = useState<ScanOverlayBox[]>([]);

    const rosterHttp = useHttp<Record<string, never>, RosterResponse>({});

    useEffect(() => {
        overlayRef.current = overlay !== null;
    }, [overlay]);

    useEffect(() => {
        if (
            presentBySessionRef.current.size === 0 &&
            initialPresentIds.length &&
            session
        ) {
            presentBySessionRef.current.set(
                session.id,
                new Set(initialPresentIds),
            );
        }
    }, [initialPresentIds, session]);

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
                setHint(lookAtCameraHint);
            }
        }

        async function applyCachedRoster(): Promise<void> {
            await hydrateFromCache();

            if (rosterRef.current.length === 0) {
                setHint('Unable to load the recognition roster.');
            } else {
                setHint(lookAtCameraHint);
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
                setRegisteredCount(data.registered_count);
                setHint(
                    data.participants.length === 0
                        ? emptyRosterHint
                        : lookAtCameraHint,
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

    const freshMatch = (): RosterEntry | null => lastMatchRef.current;

    const saveToSession = useCallback(
        async (scanSession: ScanSession) => {
            unlockSpeech();

            const participant = freshMatch();

            if (participant === null) {
                setHint('Look at the camera first.');

                return;
            }

            if (recordingRef.current) {
                return;
            }

            recordingRef.current = true;

            try {
                const row = await syncService.queueAttendance({
                    event_id: event.id,
                    participant_id: participant.id,
                    attendance_session_id: scanSession.id,
                    session_type: scanSession.type,
                });

                const presentIds =
                    presentBySessionRef.current.get(scanSession.id) ??
                    new Set<number>();

                if (!presentIds.has(participant.id)) {
                    presentIds.add(participant.id);
                    presentBySessionRef.current.set(scanSession.id, presentIds);
                    setPresentCount(presentIds.size);
                }

                speakThankYou();

                lastMatchRef.current = null;
                selectionRef.current = emptyActiveFaceSelection();
                setBoxes([]);
                setOverlay({
                    full_name: participant.full_name,
                    registration_number: participant.registration_number,
                    photo_url: participant.photo_url,
                    recorded_at: row.recorded_at,
                });

                window.setTimeout(() => {
                    setOverlay(null);
                    setHint(lookAtCameraHint);
                }, 2000);

                await flush();
            } catch {
                setHint('Unable to save attendance. Try again.');
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

            lastDetectAt.current = now;
            detecting = true;

            void provider
                .detectFace(video)
                .then(async (faces) => {
                    if (cancelled || overlayRef.current) {
                        return;
                    }

                    const overlayFaces: OverlayFace[] = await Promise.all(
                        faces.map(async (face) => {
                            const boxSide = Math.min(
                                face.box.width,
                                face.box.height,
                            );
                            const canMatch =
                                face.descriptor !== null &&
                                face.descriptor.length === 128 &&
                                boxSide >= attendance.min_face_box_px &&
                                face.score >= attendance.min_detection_score;
                            const match =
                                canMatch && face.descriptor !== null
                                    ? await matchDescriptor(face.descriptor)
                                    : null;

                            return {
                                box: face.box,
                                match,
                            };
                        }),
                    );

                    if (cancelled || overlayRef.current) {
                        return;
                    }

                    const selection = selectActiveFace(
                        selectionRef.current,
                        overlayFaces,
                        Date.now(),
                    );
                    selectionRef.current = selection;

                    const liveMatch = overlayFaces.find(
                        (face) =>
                            face.match?.participant.id ===
                            selection.participantId,
                    )?.match;

                    if (liveMatch) {
                        lastMatchRef.current = liveMatch.participant;
                        setHint(liveMatch.participant.full_name);
                    } else if (selection.participantId === null) {
                        lastMatchRef.current = null;
                        setHint(
                            faces.length === 0
                                ? lookAtCameraHint
                                : faceErrorMessages.unknown,
                        );
                    }

                    const display = {
                        width: video.clientWidth,
                        height: video.clientHeight,
                    };

                    setBoxes(
                        overlayFaces.flatMap((face, index) => {
                            const mapped = mapVideoBoxToDisplay(
                                face.box,
                                video,
                                display,
                            );

                            if (mapped === null) {
                                return [];
                            }

                            const active =
                                face.match?.participant.id ===
                                selection.participantId;

                            return [
                                {
                                    key: `${Math.round(face.box.x)}-${Math.round(face.box.y)}-${index}`,
                                    left: mapped.left,
                                    top: mapped.top,
                                    width: mapped.width,
                                    height: mapped.height,
                                    active,
                                    name: active
                                        ? (face.match?.participant.full_name ??
                                          null)
                                        : null,
                                },
                            ];
                        }),
                    );
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
        attendance.min_detection_score,
        attendance.min_face_box_px,
        providerRef,
        ready,
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
            <FaceScanOverlay faces={boxes} />
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
                <div className="flex flex-col gap-3">
                    {sessions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {sessions.map((item) => (
                                <Button
                                    key={item.id}
                                    type="button"
                                    size="lg"
                                    variant="secondary"
                                    className="min-h-14 flex-1 border-0 bg-white/15 text-white hover:bg-white/25"
                                    onClick={() => {
                                        void saveToSession(item);
                                    }}
                                >
                                    {item.name}
                                </Button>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-start">
                        <Button
                            asChild
                            variant="secondary"
                            className="rounded-full"
                        >
                            <Link
                                href={attendanceIndex.url({
                                    query: {
                                        event_id: event.id,
                                        attendance_session_id: session?.id,
                                    },
                                })}
                            >
                                <LogOut />
                                Exit
                            </Link>
                        </Button>
                    </div>
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
                            Thank you
                        </p>
                        <p className="text-base text-zinc-300">Saved locally</p>
                    </div>
                </div>
            )}
        </div>
    );
}
