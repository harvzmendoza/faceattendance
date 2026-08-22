import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Pencil,
    Plus,
    ScanFace,
    Trash2,
    UserMinus,
    Users,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
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
            <div className="mb-6 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <StatusChip
                        icon={CalendarClock}
                        label={event.status}
                        tone={event.status === 'active' ? 'success' : 'neutral'}
                    />
                    <span className="text-sm text-muted-foreground">
                        {event.event_code}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {event.venue ?? 'No venue'}
                    </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button size="lg" className="w-full sm:w-auto" asChild>
                        <Link
                            href={attendance.url({
                                query: { event_id: event.id },
                            })}
                        >
                            <ScanFace />
                            Record attendance
                        </Link>
                    </Button>
                    {can.update && (
                        <Button variant="outline" asChild>
                            <Link href={edit.url(event)}>
                                <Pencil />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {can.delete && (
                        <Form {...destroy.form(event)}>
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    <Trash2 />
                                    Delete
                                </Button>
                            )}
                        </Form>
                    )}
                </div>
            </div>
            {importErrors && importErrors.length > 0 && (
                <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    {importErrors.map((error) => (
                        <p key={error}>{error}</p>
                    ))}
                </div>
            )}
            <section className="mb-6 flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                <h2 className="font-semibold">Attendance sessions</h2>
                {can.update && (
                    <Form
                        {...storeSession.form(event)}
                        className="flex flex-col gap-3"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div>
                                    <Label htmlFor="session_name">Name</Label>
                                    <Input
                                        id="session_name"
                                        name="name"
                                        required
                                        className="mt-1"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="session_type">Type</Label>
                                    <select
                                        id="session_type"
                                        name="type"
                                        className={`mt-1 ${fieldSelectClass}`}
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
                                        className={`mt-1 ${fieldSelectClass}`}
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
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={processing}
                                >
                                    <Plus />
                                    Add session
                                </Button>
                            </>
                        )}
                    </Form>
                )}
                {sessions.length === 0 ? (
                    <EmptyState
                        icon={CalendarClock}
                        message="No sessions yet."
                    />
                ) : (
                    <ul className="flex flex-col gap-3">
                        {sessions.map((session) => (
                            <li
                                key={session.id}
                                className="rounded-2xl bg-muted/50 p-4"
                            >
                                {can.update ? (
                                    <div className="flex flex-col gap-3">
                                        <Form
                                            {...updateSession.form({
                                                event,
                                                session,
                                            })}
                                            className="flex flex-col gap-3"
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <Input
                                                        name="name"
                                                        defaultValue={
                                                            session.name
                                                        }
                                                        required
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
                                                        className={
                                                            fieldSelectClass
                                                        }
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
                                                    <p className="text-sm text-muted-foreground">
                                                        {session.type_label} ·{' '}
                                                        {
                                                            session.attendance_records_count
                                                        }{' '}
                                                        records
                                                    </p>
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        disabled={processing}
                                                    >
                                                        Save
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                        <Form
                                            {...destroySession.form({
                                                event,
                                                session,
                                            })}
                                        >
                                            {({ processing: deleting }) => (
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    disabled={deleting}
                                                >
                                                    <Trash2 />
                                                    Delete
                                                </Button>
                                            )}
                                        </Form>
                                    </div>
                                ) : (
                                    <EntityCard
                                        icon={CalendarClock}
                                        title={session.name}
                                        subtitle={`${session.type_label} · ${session.status_label}`}
                                        trailing={`${session.attendance_records_count} records`}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            <section className="mb-6 flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                <h2 className="font-semibold">Registered participants</h2>
                <SearchForm
                    action={show.url(event)}
                    defaultValue={filters.search}
                />
                {can.update && availableParticipants.length > 0 && (
                    <Form
                        {...attachParticipant.form(event)}
                        className="flex flex-col gap-2"
                    >
                        {({ processing }) => (
                            <>
                                <select
                                    name="participant_id"
                                    className={fieldSelectClass}
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
                                    className="w-full"
                                    disabled={processing}
                                >
                                    <Plus />
                                    Assign
                                </Button>
                            </>
                        )}
                    </Form>
                )}
                {participants.data.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        message="No participants registered."
                    />
                ) : (
                    <ul className="flex flex-col gap-3">
                        {participants.data.map((participant) => (
                            <EntityCard
                                key={participant.id}
                                icon={Users}
                                title={participant.full_name}
                                subtitle={`${participant.registration_number} · ${participant.organization ?? 'No organization'}`}
                                trailing={
                                    can.update ? (
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
                                                    <UserMinus />
                                                    Remove
                                                </Button>
                                            )}
                                        </Form>
                                    ) : null
                                }
                            />
                        ))}
                    </ul>
                )}
                <Pagination links={participants.links} />
            </section>
        </AppLayout>
    );
}
