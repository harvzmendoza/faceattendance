import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Cpu,
    HardDriveDownload,
    ScanFace,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { useDeviceHeartbeat } from '@/hooks/use-device-heartbeat';
import AppLayout from '@/layouts/app-layout';
import { index, scan } from '@/routes/attendance';
import { offlinePackage } from '@/routes/events';
import type { RosterEntry } from '@/services/face-recognition/types';
import { syncService } from '@/services/offline';
import { getJson } from '@/services/offline/http';
import {
    cacheDocuments,
    cacheUrls,
    modelUrls,
} from '@/services/offline/prepareCache';

type PrepareEvent = {
    id: number;
    name: string;
    event_code: string;
    status: string;
};

type OfflinePackage = {
    event: PrepareEvent;
    participants: RosterEntry[];
    registered_count: number;
    enrolled_count: number;
    model_version: string;
    models_url: string;
};

type Checklist = {
    event: boolean;
    participants: boolean;
    profiles: boolean;
    models: boolean;
    appCache: boolean;
};

const emptyChecklist: Checklist = {
    event: false,
    participants: false,
    profiles: false,
    models: false,
    appCache: false,
};

export default function AttendancePrepare({
    event,
    registeredCount,
}: {
    event: PrepareEvent;
    registeredCount: number;
}) {
    const [checklist, setChecklist] = useState<Checklist>(emptyChecklist);
    const [participantCount, setParticipantCount] = useState(registeredCount);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    useDeviceHeartbeat(event.id);

    useEffect(() => {
        let cancelled = false;

        async function prepare(): Promise<void> {
            setError(null);
            setReady(false);
            setChecklist(emptyChecklist);

            try {
                const pkg = await getJson<OfflinePackage>(
                    offlinePackage.url(event.id),
                );

                if (cancelled) {
                    return;
                }

                await syncService.cacheEvent({
                    id: pkg.event.id,
                    name: pkg.event.name,
                    event_code: pkg.event.event_code,
                    status: pkg.event.status,
                    registered_count: pkg.registered_count,
                });
                setParticipantCount(pkg.registered_count);
                setChecklist((current) => ({ ...current, event: true }));

                await syncService.cacheRoster(event.id, pkg.participants);

                if (cancelled) {
                    return;
                }

                setChecklist((current) => ({
                    ...current,
                    participants: true,
                    profiles: true,
                }));

                await cacheUrls(modelUrls(pkg.models_url), { required: true });

                if (cancelled) {
                    return;
                }

                setChecklist((current) => ({ ...current, models: true }));

                const photoUrls = pkg.participants
                    .map((participant) => participant.photo_url)
                    .filter((url): url is string => Boolean(url));

                await cacheUrls(photoUrls, { required: false });
                await cacheDocuments([
                    index.url({ query: { event_id: event.id } }),
                    scan.url({ query: { event_id: event.id } }),
                ]);

                if (cancelled) {
                    return;
                }

                setChecklist({
                    event: true,
                    participants: true,
                    profiles: true,
                    models: true,
                    appCache: true,
                });
                setReady(true);
            } catch {
                if (!cancelled) {
                    setError(
                        'Unable to prepare this device. Connect to the network and try again.',
                    );
                }
            }
        }

        void prepare();

        return () => {
            cancelled = true;
        };
    }, [event.id]);

    return (
        <AppLayout title="Prepare device">
            <Head title="Prepare Offline Device" />
            <div className="mx-auto flex max-w-xl flex-col gap-5 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <div className="flex flex-col gap-2">
                    <StatusChip
                        icon={ready ? Check : HardDriveDownload}
                        label={
                            ready
                                ? 'Ready for offline attendance'
                                : 'Preparing offline attendance'
                        }
                        tone={ready ? 'success' : 'warning'}
                    />
                    <p className="text-lg font-semibold">{event.name}</p>
                </div>
                <ul className="flex flex-col gap-3">
                    <ChecklistItem done={checklist.event} label="Event" />
                    <ChecklistItem
                        done={checklist.participants}
                        label={`${participantCount} Participants`}
                        icon={Users}
                    />
                    <ChecklistItem
                        done={checklist.profiles}
                        label="Face Profiles"
                        icon={ScanFace}
                    />
                    <ChecklistItem
                        done={checklist.models}
                        label="Recognition Models"
                        icon={Cpu}
                    />
                    <ChecklistItem
                        done={checklist.appCache}
                        label="Application Cache"
                    />
                </ul>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex flex-col gap-2">
                    {ready && (
                        <Button size="lg" className="w-full" asChild>
                            <Link
                                href={scan.url({
                                    query: { event_id: event.id },
                                })}
                            >
                                <ScanFace />
                                Start camera
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" className="w-full" asChild>
                        <Link
                            href={index.url({
                                query: { event_id: event.id },
                            })}
                        >
                            <ArrowLeft />
                            Back to attendance
                        </Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

function ChecklistItem({
    done,
    label,
    icon: Icon = HardDriveDownload,
}: {
    done: boolean;
    label: string;
    icon?: typeof HardDriveDownload;
}) {
    return (
        <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3">
                <Icon className="size-5 text-muted-foreground" />
                <span>{label}</span>
            </span>
            <StatusChip
                icon={Check}
                label={done ? 'Ready' : 'Waiting'}
                tone={done ? 'success' : 'neutral'}
            />
        </li>
    );
}
