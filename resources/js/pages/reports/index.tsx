import { Head, router } from '@inertiajs/react';
import {
    Download,
    FileBarChart,
    Filter,
    UserCheck,
    UserMinus,
    Users,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { StatTile } from '@/components/stat-tile';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
import { exportMethod, index } from '@/routes/reports';
import type { EventSummary } from '@/types/models';

type ReportRow = {
    registration_number: string;
    participant: string;
    organization: string;
    check_in: string;
    check_out: string;
    status: string;
};

type ReportFilters = {
    event_id: number | null;
    session_id: number | null;
    date: string | null;
    participant: string;
    organization: string;
    attendance_status: string;
};

export default function ReportsIndex({
    events,
    sessions,
    rows,
    filters,
    summary,
}: {
    events: Pick<EventSummary, 'id' | 'name' | 'event_code'>[];
    sessions: { id: number; name: string }[];
    rows: ReportRow[];
    filters: ReportFilters;
    summary: { total: number; present: number; absent: number };
}) {
    function applyFilters(form: HTMLFormElement): void {
        const data = new FormData(form);
        router.get(
            index.url({
                query: {
                    event_id: String(data.get('event_id') ?? ''),
                    session_id: String(data.get('session_id') ?? ''),
                    date: String(data.get('date') ?? ''),
                    participant: String(data.get('participant') ?? ''),
                    organization: String(data.get('organization') ?? ''),
                    attendance_status: String(
                        data.get('attendance_status') ?? 'all',
                    ),
                },
            }),
        );
    }

    const exportQuery = {
        event_id: filters.event_id ?? undefined,
        session_id: filters.session_id ?? undefined,
        date: filters.date ?? undefined,
        participant: filters.participant,
        organization: filters.organization,
        attendance_status: filters.attendance_status,
    };

    return (
        <AppLayout title="Reports">
            <Head title="Reports" />
            <form
                className="mb-6 flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    applyFilters(e.currentTarget);
                }}
            >
                <select
                    name="event_id"
                    defaultValue={filters.event_id ?? ''}
                    className={fieldSelectClass}
                >
                    <option value="">Select event</option>
                    {events.map((event) => (
                        <option key={event.id} value={event.id}>
                            {event.name}
                        </option>
                    ))}
                </select>
                <select
                    name="session_id"
                    defaultValue={filters.session_id ?? ''}
                    className={fieldSelectClass}
                >
                    <option value="">All sessions</option>
                    {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                            {session.name}
                        </option>
                    ))}
                </select>
                <Input
                    name="date"
                    type="date"
                    defaultValue={filters.date ?? ''}
                />
                <Input
                    name="participant"
                    placeholder="Participant"
                    defaultValue={filters.participant}
                />
                <Input
                    name="organization"
                    placeholder="Organization"
                    defaultValue={filters.organization}
                />
                <select
                    name="attendance_status"
                    defaultValue={filters.attendance_status}
                    className={fieldSelectClass}
                >
                    <option value="all">All statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                </select>
                <Button type="submit" className="w-full">
                    <Filter />
                    Apply filters
                </Button>
            </form>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatTile
                    icon={Users}
                    label="Participants"
                    value={summary.total}
                />
                <StatTile
                    icon={UserCheck}
                    label="Present"
                    value={summary.present}
                />
                <StatTile
                    icon={UserMinus}
                    label="Absent"
                    value={summary.absent}
                />
            </div>
            {filters.event_id && (
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" asChild>
                        <a
                            href={exportMethod.url({
                                query: { ...exportQuery, format: 'csv' },
                            })}
                        >
                            <Download />
                            CSV
                        </a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a
                            href={exportMethod.url({
                                query: { ...exportQuery, format: 'xls' },
                            })}
                        >
                            <Download />
                            Excel
                        </a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a
                            href={exportMethod.url({
                                query: { ...exportQuery, format: 'pdf' },
                            })}
                        >
                            <Download />
                            PDF
                        </a>
                    </Button>
                </div>
            )}
            {rows.length === 0 ? (
                <EmptyState
                    icon={FileBarChart}
                    message="Select an event to view the attendance report."
                />
            ) : (
                <>
                    <div className="flex flex-col gap-3 lg:hidden">
                        {rows.map((row) => (
                            <EntityCard
                                key={row.registration_number}
                                icon={Users}
                                title={row.participant}
                                subtitle={`${row.registration_number} · ${row.organization || 'No organization'} · In ${row.check_in || '—'} · Out ${row.check_out || '—'}`}
                                trailing={
                                    <StatusChip
                                        icon={
                                            row.status.toLowerCase() ===
                                            'present'
                                                ? UserCheck
                                                : UserMinus
                                        }
                                        label={row.status}
                                        tone={
                                            row.status.toLowerCase() ===
                                            'present'
                                                ? 'success'
                                                : 'neutral'
                                        }
                                    />
                                }
                            />
                        ))}
                    </div>
                    <div className="hidden rounded-2xl border bg-card lg:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Registration No</TableHead>
                                    <TableHead>Participant</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Check-in</TableHead>
                                    <TableHead>Check-out</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.registration_number}>
                                        <TableCell>
                                            {row.registration_number}
                                        </TableCell>
                                        <TableCell>{row.participant}</TableCell>
                                        <TableCell>
                                            {row.organization || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.check_in || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.check_out || '—'}
                                        </TableCell>
                                        <TableCell>{row.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
