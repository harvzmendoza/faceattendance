import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as attendance } from '@/routes/attendance';
import { destroy, edit, show } from '@/routes/events';
import {
    destroy as detachParticipant,
    store as attachParticipant,
} from '@/routes/events/participants';
import {
    destroy as destroySession,
    store as storeSession,
    update as updateSession,
} from '@/routes/events/sessions';
import type {
    EventSummary,
    Paginated,
    ParticipantSummary,
    StatusOption,
} from '@/types/models';

type EventSession = {
    id: number;
    name: string;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    starts_at: string | null;
    ends_at: string | null;
    attendance_records_count: number;
};

export default function EventsShow({
    event,
    sessions,
    sessionTypes,
    sessionStatuses,
    participants,
    availableParticipants,
    filters,
    can,
}: {
    event: EventSummary;
    sessions: EventSession[];
    sessionTypes: StatusOption[];
    sessionStatuses: StatusOption[];
    participants: Paginated<ParticipantSummary>;
    availableParticipants: ParticipantSummary[];
    filters: { search: string };
    can: { update: boolean; delete: boolean };
}) {
    const importErrors = usePage().props.flash.import_errors;

    return (
        <AppLayout title={event.name}>
            <Head title={event.name} />
            <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge
                    variant={
                        event.status === 'active' ? 'success' : 'secondary'
                    }
                >
                    {event.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                    {event.event_code}
                </span>
                <span className="text-sm text-muted-foreground">
                    {event.venue ?? 'No venue'}
                </span>
                <div className="ml-auto flex flex-wrap gap-2">
                    <Button asChild className="min-h-11">
                        <Link
                            href={attendance.url({
                                query: { event_id: event.id },
                            })}
                        >
                            Record attendance
                        </Link>
                    </Button>
                    {can.update && (
                        <Button variant="outline" asChild className="min-h-11">
                            <Link href={edit.url(event)}>Edit</Link>
                        </Button>
                    )}
                    {can.delete && (
                        <Form {...destroy.form(event)}>
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="min-h-11"
                                    disabled={processing}
                                >
                                    Delete
                                </Button>
                            )}
                        </Form>
                    )}
                </div>
            </div>
            {importErrors && importErrors.length > 0 && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    {importErrors.map((error) => (
                        <p key={error}>{error}</p>
                    ))}
                </div>
            )}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Attendance sessions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {can.update && (
                        <Form
                            {...storeSession.form(event)}
                            className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="xl:col-span-2">
                                        <Label htmlFor="session_name">
                                            Name
                                        </Label>
                                        <Input
                                            id="session_name"
                                            name="name"
                                            required
                                            className="mt-1 h-11"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="session_type">
                                            Type
                                        </Label>
                                        <select
                                            id="session_type"
                                            name="type"
                                            className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            defaultValue="check_in"
                                        >
                                            {sessionTypes.map((type) => (
                                                <option
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="session_status">
                                            Status
                                        </Label>
                                        <select
                                            id="session_status"
                                            name="status"
                                            className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            defaultValue="active"
                                        >
                                            {sessionStatuses.map((status) => (
                                                <option
                                                    key={status.value}
                                                    value={status.value}
                                                >
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="submit"
                                            className="min-h-11 w-full"
                                            disabled={processing}
                                        >
                                            Add session
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Records</TableHead>
                                {can.update && <TableHead />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        {can.update ? (
                                            <Form
                                                {...updateSession.form({
                                                    event,
                                                    session,
                                                })}
                                                className="flex flex-col gap-2 sm:flex-row sm:items-center"
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        <Input
                                                            name="name"
                                                            defaultValue={
                                                                session.name
                                                            }
                                                            required
                                                            className="h-11"
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="type"
                                                            value={session.type}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="starts_at"
                                                            value={
                                                                session.starts_at ??
                                                                ''
                                                            }
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="ends_at"
                                                            value={
                                                                session.ends_at ??
                                                                ''
                                                            }
                                                        />
                                                        <select
                                                            name="status"
                                                            defaultValue={
                                                                session.status
                                                            }
                                                            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                                                        >
                                                            {sessionStatuses.map(
                                                                (status) => (
                                                                    <option
                                                                        key={
                                                                            status.value
                                                                        }
                                                                        value={
                                                                            status.value
                                                                        }
                                                                    >
                                                                        {
                                                                            status.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        <Button
                                                            type="submit"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Save
                                                        </Button>
                                                    </>
                                                )}
                                            </Form>
                                        ) : (
                                            session.name
                                        )}
                                    </TableCell>
                                    <TableCell>{session.type_label}</TableCell>
                                    <TableCell>
                                        {session.status_label}
                                    </TableCell>
                                    <TableCell>
                                        {session.attendance_records_count}
                                    </TableCell>
                                    {can.update && (
                                        <TableCell className="text-right">
                                            <Form
                                                {...destroySession.form({
                                                    event,
                                                    session,
                                                })}
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </Form>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Registered participants</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <SearchForm
                        action={show.url(event)}
                        defaultValue={filters.search}
                    />
                    {can.update && availableParticipants.length > 0 && (
                        <Form
                            {...attachParticipant.form(event)}
                            className="flex flex-col gap-2 sm:flex-row"
                        >
                            {({ processing }) => (
                                <>
                                    <select
                                        name="participant_id"
                                        className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                                        required
                                    >
                                        <option value="">
                                            Assign a participant
                                        </option>
                                        {availableParticipants.map(
                                            (participant) => (
                                                <option
                                                    key={participant.id}
                                                    value={participant.id}
                                                >
                                                    {participant.full_name} (
                                                    {
                                                        participant.registration_number
                                                    }
                                                    )
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <Button
                                        type="submit"
                                        className="min-h-11"
                                        disabled={processing}
                                    >
                                        Assign
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Registration</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.data.map((participant) => (
                                <TableRow key={participant.id}>
                                    <TableCell>
                                        {participant.registration_number}
                                    </TableCell>
                                    <TableCell>
                                        {participant.full_name}
                                    </TableCell>
                                    <TableCell>
                                        {participant.organization ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {can.update && (
                                            <Form
                                                {...detachParticipant.form({
                                                    event,
                                                    participant,
                                                })}
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </Form>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination links={participants.links} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
