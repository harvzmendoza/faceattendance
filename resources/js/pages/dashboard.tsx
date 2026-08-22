import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { AttendanceRecordSummary, EventSummary } from '@/types/models';

export default function Dashboard({
    events,
    event,
    stats,
    devices,
    sessionStats,
    recentAttendance,
}: {
    events: EventSummary[];
    event: EventSummary | null;
    stats: {
        participants: number;
        present: number;
        absent: number;
        percentage: number;
        online_devices: number;
        offline_devices: number;
        pending_sync: number;
    };
    devices: { id: number; name: string; presence: string }[];
    sessionStats: {
        id: number;
        name: string;
        present: number;
        registered: number;
    }[];
    recentAttendance: AttendanceRecordSummary[];
}) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                    Live attendance overview for the selected event.
                </p>
                <select
                    className="h-11 min-w-56 rounded-md border border-input bg-background px-3 text-sm"
                    value={event?.id ?? ''}
                    onChange={(e) =>
                        router.get(
                            dashboard.url({
                                query: { event_id: e.target.value },
                            }),
                        )
                    }
                >
                    {events.length === 0 && (
                        <option value="">No events yet</option>
                    )}
                    {events.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Participants" value={stats.participants} />
                <StatCard label="Present" value={stats.present} />
                <StatCard label="Absent" value={stats.absent} />
                <StatCard label="Attendance" value={`${stats.percentage}%`} />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Sessions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                        {sessionStats.length === 0 ? (
                            <p className="text-muted-foreground">
                                No sessions for this event.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {sessionStats.map((session) => (
                                    <li
                                        key={session.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span>{session.name}</span>
                                        <span className="text-muted-foreground">
                                            {session.present} /{' '}
                                            {session.registered}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Devices</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                        <p>Online devices: {stats.online_devices}</p>
                        <p>Offline devices: {stats.offline_devices}</p>
                        <p>Pending synchronizations: {stats.pending_sync}</p>
                        {devices.length === 0 ? (
                            <p className="text-muted-foreground">
                                No attendance devices registered yet.
                            </p>
                        ) : (
                            <ul className="mt-2 flex flex-col gap-1">
                                {devices.map((device) => (
                                    <li key={device.id}>
                                        {device.presence === 'online'
                                            ? '🟢'
                                            : '🔴'}{' '}
                                        {device.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentAttendance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No attendance recorded yet.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {recentAttendance.map((record) => (
                                    <li
                                        key={record.id}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span className="font-medium">
                                            {record.participant.full_name}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {new Date(
                                                record.recorded_at,
                                            ).toLocaleTimeString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
