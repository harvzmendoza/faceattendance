import { Form, Head, Link, router } from '@inertiajs/react';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useDeviceHeartbeat } from '@/hooks/use-device-heartbeat';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import AppLayout from '@/layouts/app-layout';
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
            <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <select
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
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
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
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
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const search = new FormData(e.currentTarget).get(
                            'search',
                        );
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
                        className="h-11"
                    />
                </form>
                {event && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button asChild className="min-h-11">
                            <Link
                                href={scan.url({
                                    query: { event_id: event.id },
                                })}
                            >
                                Start camera attendance
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="min-h-11">
                            <Link
                                href={prepare.url({
                                    query: { event_id: event.id },
                                })}
                            >
                                Prepare Offline Device
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Mark present</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!event && (
                            <p className="text-sm text-muted-foreground">
                                Select an event first.
                            </p>
                        )}
                        {event && participants.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No matching registered participants.
                            </p>
                        )}
                        <ul className="flex flex-col gap-2">
                            {participants.map((participant) => {
                                const present = presentIds.includes(
                                    participant.id,
                                );

                                return (
                                    <li
                                        key={participant.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {participant.full_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {
                                                    participant.registration_number
                                                }
                                            </p>
                                        </div>
                                        {present ? (
                                            <Badge variant="success">
                                                Present
                                            </Badge>
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
                                                            className="min-h-11"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Mark present
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recorded attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!records || records.data.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No attendance recorded yet.
                            </p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Participant</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {records.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    {
                                                        record.participant
                                                            .full_name
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        record.recorded_at,
                                                    ).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4">
                                    <Pagination links={records.links} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
