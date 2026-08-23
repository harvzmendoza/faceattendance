import { Form, Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    HardDriveDownload,
    ScanFace,
    UserCheck,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { Pagination } from '@/components/pagination';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeviceHeartbeat } from '@/hooks/use-device-heartbeat';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
import { index, prepare, scan, store } from '@/routes/attendance';
import type {
    AttendanceRecordSummary,
    EventSummary,
    Paginated,
    ParticipantSummary,
} from '@/types/models';

export default function AttendanceIndex({
    events,
    event,
    sessions,
    session,
    participants,
    records,
    filters,
    presentIds,
}: {
    events: EventSummary[];
    event: EventSummary | null;
    sessions: { id: number; name: string }[];
    session: { id: number; name: string } | null;
    participants: ParticipantSummary[];
    records: Paginated<AttendanceRecordSummary> | null;
    filters: {
        event_id?: number;
        attendance_session_id?: number;
        search: string;
    };
    presentIds: number[];
}) {
    useOfflineSync(event?.id);
    useDeviceHeartbeat(event?.id);

    return (
        <AppLayout title="Attendance">
            <Head title="Attendance" />
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
                <select
                    className={fieldSelectClass}
                    value={event?.id ?? ''}
                    onChange={(e) =>
                        router.get(
                            index.url({ query: { event_id: e.target.value } }),
                        )
                    }
                >
                    {events.length === 0 && <option value="">No events</option>}
                    {events.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
                <select
                    className={fieldSelectClass}
                    value={session?.id ?? ''}
                    onChange={(e) =>
                        router.get(
                            index.url({
                                query: {
                                    event_id: event?.id,
                                    attendance_session_id: e.target.value,
                                    search: filters.search,
                                },
                            }),
                        )
                    }
                    disabled={!event}
                >
                    {sessions.length === 0 && (
                        <option value="">No sessions</option>
                    )}
                    {sessions.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
                {event && (
                    <>
                        <Button size="lg" className="w-full" asChild>
                            <Link
                                href={scan.url({
                                    query: {
                                        event_id: event.id,
                                        attendance_session_id: session?.id,
                                    },
                                })}
                            >
                                <ScanFace />
                                Start camera
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                            <Link
                                href={prepare.url({
                                    query: { event_id: event.id },
                                })}
                            >
                                <HardDriveDownload />
                                Prepare device
                            </Link>
                        </Button>
                    </>
                )}
                <details className="group rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-medium [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-2">
                            <UserCheck className="size-5" />
                            Mark present
                        </span>
                        <ChevronDown className="size-5 text-muted-foreground transition group-open:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-3 border-t px-4 py-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const search = new FormData(
                                    e.currentTarget,
                                ).get('search');
                                router.get(
                                    index.url({
                                        query: {
                                            event_id: event?.id,
                                            attendance_session_id: session?.id,
                                            search: String(search ?? ''),
                                        },
                                    }),
                                );
                            }}
                        >
                            <Input
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Search registered participants"
                            />
                        </form>
                        {!event && (
                            <EmptyState
                                icon={UserCheck}
                                message="Select an event first."
                            />
                        )}
                        {event && participants.length === 0 && (
                            <EmptyState
                                icon={UserCheck}
                                message="No matching registered participants."
                            />
                        )}
                        {participants.map((participant) => {
                            const present = presentIds.includes(participant.id);

                            return (
                                <EntityCard
                                    key={participant.id}
                                    title={participant.full_name}
                                    subtitle={participant.registration_number}
                                    trailing={
                                        present ? (
                                            <StatusChip
                                                icon={UserCheck}
                                                label="Present"
                                                tone="success"
                                            />
                                        ) : (
                                            <Form {...store.form()}>
                                                {({ processing }) => (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="event_id"
                                                            value={event?.id}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="attendance_session_id"
                                                            value={
                                                                session?.id ??
                                                                ''
                                                            }
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="participant_id"
                                                            value={
                                                                participant.id
                                                            }
                                                        />
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            <UserCheck />
                                                            Mark present
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        )
                                    }
                                />
                            );
                        })}
                    </div>
                </details>
                <section className="flex flex-col gap-3">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Recorded attendance
                    </h2>
                    {!records || records.data.length === 0 ? (
                        <EmptyState
                            icon={ScanFace}
                            message="No attendance recorded yet."
                        />
                    ) : (
                        <>
                            {records.data.map((record) => (
                                <EntityCard
                                    key={record.id}
                                    icon={UserCheck}
                                    title={record.participant.full_name}
                                    subtitle={new Date(
                                        record.recorded_at,
                                    ).toLocaleString()}
                                    trailing={
                                        <StatusChip
                                            icon={UserCheck}
                                            label="Present"
                                            tone="success"
                                        />
                                    }
                                />
                            ))}
                            <Pagination links={records.links} />
                        </>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
