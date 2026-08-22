import { Head, router } from '@inertiajs/react';
import {
    CalendarClock,
    MonitorSmartphone,
    Percent,
    UserCheck,
    UserMinus,
    Users,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { StatTile } from '@/components/stat-tile';
import { StatusChip } from '@/components/status-chip';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
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
            <div className="mb-5">
                <select
                    className={`${fieldSelectClass} sm:max-w-xs`}
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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    icon={Users}
                    label="Participants"
                    value={stats.participants}
                />
                <StatTile
                    icon={UserCheck}
                    label="Present"
                    value={stats.present}
                />
                <StatTile
                    icon={UserMinus}
                    label="Absent"
                    value={stats.absent}
                />
                <StatTile
                    icon={Percent}
                    label="Attendance"
                    value={`${stats.percentage}%`}
                />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                    <h2 className="font-semibold">Sessions</h2>
                    {sessionStats.length === 0 ? (
                        <EmptyState
                            icon={CalendarClock}
                            message="No sessions for this event."
                        />
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {sessionStats.map((session) => (
                                <li
                                    key={session.id}
                                    className="flex min-h-12 items-center justify-between gap-3"
                                >
                                    <span className="flex items-center gap-2">
                                        <CalendarClock className="size-5 text-muted-foreground" />
                                        {session.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {session.present} / {session.registered}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                    <h2 className="font-semibold">Devices</h2>
                    <div className="flex flex-wrap gap-2">
                        <StatusChip
                            icon={Wifi}
                            label={`${stats.online_devices} online`}
                            tone="success"
                        />
                        <StatusChip
                            icon={WifiOff}
                            label={`${stats.offline_devices} offline`}
                            tone="danger"
                        />
                        <StatusChip
                            icon={MonitorSmartphone}
                            label={`${stats.pending_sync} pending`}
                            tone="warning"
                        />
                    </div>
                    {devices.length === 0 ? (
                        <EmptyState
                            icon={MonitorSmartphone}
                            message="No attendance devices registered yet."
                        />
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {devices.map((device) => (
                                <li
                                    key={device.id}
                                    className="flex min-h-12 items-center justify-between gap-3"
                                >
                                    <span className="flex items-center gap-2">
                                        <MonitorSmartphone className="size-5 text-muted-foreground" />
                                        {device.name}
                                    </span>
                                    <StatusChip
                                        icon={
                                            device.presence === 'online'
                                                ? Wifi
                                                : WifiOff
                                        }
                                        label={
                                            device.presence === 'online'
                                                ? 'Online'
                                                : 'Offline'
                                        }
                                        tone={
                                            device.presence === 'online'
                                                ? 'success'
                                                : 'danger'
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                    <h2 className="font-semibold">Recent attendance</h2>
                    {recentAttendance.length === 0 ? (
                        <EmptyState
                            icon={UserCheck}
                            message="No attendance recorded yet."
                        />
                    ) : (
                        <div className="flex flex-col gap-2">
                            {recentAttendance.map((record) => (
                                <EntityCard
                                    key={record.id}
                                    icon={UserCheck}
                                    title={record.participant.full_name}
                                    subtitle={new Date(
                                        record.recorded_at,
                                    ).toLocaleTimeString()}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
