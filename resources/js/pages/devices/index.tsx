import { Form, Head, usePoll } from '@inertiajs/react';
import { Ban, MonitorSmartphone, Wifi, WifiOff } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { StatusChip } from '@/components/status-chip';
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
            {devices.length === 0 ? (
                <EmptyState
                    icon={MonitorSmartphone}
                    message="No attendance devices registered yet."
                />
            ) : (
                <>
                    <div className="flex flex-col gap-3 lg:hidden">
                        {devices.map((device) => (
                            <EntityCard
                                key={device.id}
                                icon={MonitorSmartphone}
                                title={device.name}
                                subtitle={`${device.location ?? 'No location'} · ${device.event_name ?? 'No event'} · ${device.pending_count} pending`}
                                trailing={
                                    <span className="flex flex-col items-end gap-2">
                                        <PresenceChip
                                            presence={device.presence}
                                        />
                                        {device.presence !== 'revoked' && (
                                            <Form {...revoke.form(device)}>
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        <Ban />
                                                        Revoke
                                                    </Button>
                                                )}
                                            </Form>
                                        )}
                                    </span>
                                }
                            />
                        ))}
                    </div>
                    <div className="hidden rounded-2xl border bg-card lg:block">
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
                                            <PresenceChip
                                                presence={device.presence}
                                            />
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
                                        <TableCell>
                                            {device.pending_count}
                                        </TableCell>
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
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            <Ban />
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
                </>
            )}
        </AppLayout>
    );
}

function PresenceChip({ presence }: { presence: MonitorDevice['presence'] }) {
    if (presence === 'online') {
        return <StatusChip icon={Wifi} label="Online" tone="success" />;
    }

    if (presence === 'offline') {
        return <StatusChip icon={WifiOff} label="Offline" tone="neutral" />;
    }

    return <StatusChip icon={Ban} label="Revoked" tone="danger" />;
}
