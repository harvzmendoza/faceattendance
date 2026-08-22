import { Head, router } from '@inertiajs/react';
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
import AppLayout from '@/layouts/app-layout';
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
                className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    applyFilters(e.currentTarget);
                }}
            >
                <select
                    name="event_id"
                    defaultValue={filters.event_id ?? ''}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
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
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
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
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="all">All statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                </select>
                <Button type="submit" className="min-h-11 xl:col-span-6">
                    Apply filters
                </Button>
            </form>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                    {summary.total} participants · {summary.present} present ·{' '}
                    {summary.absent} absent
                </p>
                {filters.event_id && (
                    <div className="ml-auto flex flex-wrap gap-2">
                        <Button variant="outline" asChild className="min-h-11">
                            <a
                                href={exportMethod.url({
                                    query: { ...exportQuery, format: 'csv' },
                                })}
                            >
                                CSV
                            </a>
                        </Button>
                        <Button variant="outline" asChild className="min-h-11">
                            <a
                                href={exportMethod.url({
                                    query: { ...exportQuery, format: 'xls' },
                                })}
                            >
                                Excel
                            </a>
                        </Button>
                        <Button variant="outline" asChild className="min-h-11">
                            <a
                                href={exportMethod.url({
                                    query: { ...exportQuery, format: 'pdf' },
                                })}
                            >
                                PDF
                            </a>
                        </Button>
                    </div>
                )}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Attendance</CardTitle>
                </CardHeader>
                <CardContent>
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
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-muted-foreground"
                                    >
                                        Select an event to view the attendance
                                        report.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((row) => (
                                <TableRow key={row.registration_number}>
                                    <TableCell>
                                        {row.registration_number}
                                    </TableCell>
                                    <TableCell>{row.participant}</TableCell>
                                    <TableCell>
                                        {row.organization || '—'}
                                    </TableCell>
                                    <TableCell>{row.check_in || '—'}</TableCell>
                                    <TableCell>
                                        {row.check_out || '—'}
                                    </TableCell>
                                    <TableCell>{row.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
