import { Head, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <AppLayout title="Prepare Offline Device">
            <Head title="Prepare Offline Device" />
            <Card className="mx-auto max-w-xl">
                <CardHeader>
                    <CardTitle>
                        {ready
                            ? 'READY FOR OFFLINE ATTENDANCE'
                            : 'Preparing Offline Attendance...'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                        {event.name}
                    </p>
                    <ul className="flex flex-col gap-3 text-lg">
                        <ChecklistItem done={checklist.event} label="Event" />
                        <ChecklistItem
                            done={checklist.participants}
                            label={`${participantCount} Participants`}
                        />
                        <ChecklistItem
                            done={checklist.profiles}
                            label="Face Profiles"
                        />
                        <ChecklistItem
                            done={checklist.models}
                            label="Recognition Models"
                        />
                        <ChecklistItem
                            done={checklist.appCache}
                            label="Application Cache"
                        />
                    </ul>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        {ready && (
                            <Button asChild className="min-h-11">
                                <Link
                                    href={scan.url({
                                        query: { event_id: event.id },
                                    })}
                                >
                                    Start camera attendance
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline" className="min-h-11">
                            <Link
                                href={index.url({
                                    query: { event_id: event.id },
                                })}
                            >
                                Back to attendance
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
    return (
        <li className="flex items-center gap-3">
            <span
                className={`flex size-7 items-center justify-center rounded-full ${
                    done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                }`}
            >
                {done ? <Check className="size-4" /> : null}
            </span>
            <span>{label}</span>
        </li>
    );
}
