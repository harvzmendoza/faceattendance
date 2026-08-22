import { Form, Head, usePoll } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { revoke } from '@/routes/devices';

type MonitorDevice = {
    id: number;
    name: string;
    location: string | null;
    event_name: string | null;
    presence: 'online' | 'offline' | 'revoked';
    last_sync_at: string | null;
    pending_count: number;
};

export default function DevicesIndex({
    devices,
}: {
    devices: MonitorDevice[];
}) {
    usePoll(15_000);

    return (
        <AppLayout title="Devices">
            <Head title="Devices" />
            <div className="rounded-xl border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Device</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Last Sync</TableHead>
                            <TableHead>Pending Records</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {devices.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground"
                                >
                                    No attendance devices registered yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {devices.map((device) => (
                            <TableRow key={device.id}>
                                <TableCell className="font-medium">
                                    {device.name}
                                    {device.location ? (
                                        <span className="mt-1 block text-sm font-normal text-muted-foreground">
                                            {device.location}
                                        </span>
                                    ) : null}
                                </TableCell>
                                <TableCell>
                                    <PresenceBadge presence={device.presence} />
                                </TableCell>
                                <TableCell>
                                    {device.event_name ?? '—'}
                                </TableCell>
                                <TableCell>
                                    {device.last_sync_at
                                        ? new Date(
                                              device.last_sync_at,
                                          ).toLocaleTimeString()
                                        : '—'}
                                </TableCell>
                                <TableCell>{device.pending_count}</TableCell>
                                <TableCell className="text-right">
                                    {device.presence !== 'revoked' && (
                                        <Form
                                            {...revoke.form(device)}
                                            className="inline"
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={processing}
                                                >
                                                    Revoke
                                                </Button>
                                            )}
                                        </Form>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}

function PresenceBadge({ presence }: { presence: MonitorDevice['presence'] }) {
    const label =
        presence === 'online'
            ? 'ONLINE'
            : presence === 'offline'
              ? 'OFFLINE'
              : 'REVOKED';

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                presence === 'online'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : presence === 'offline'
                      ? 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300'
                      : 'bg-destructive/15 text-destructive'
            }`}
        >
            {label}
        </span>
    );
}
