import { Head } from '@inertiajs/react';
import { ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { Pagination } from '@/components/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { Paginated } from '@/types/models';

type AuditLogRow = {
    id: number;
    action: string;
    action_label: string;
    user_name: string | null;
    event_id: number | null;
    device_id: number | null;
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string | null;
};

export default function AuditLogsIndex({
    logs,
}: {
    logs: Paginated<AuditLogRow>;
}) {
    return (
        <AppLayout title="Audit logs">
            <Head title="Audit logs" />
            {logs.data.length === 0 ? (
                <EmptyState
                    icon={ScrollText}
                    message="No audit events recorded yet."
                />
            ) : (
                <>
                    <div className="flex flex-col gap-3 lg:hidden">
                        {logs.data.map((log) => (
                            <EntityCard
                                key={log.id}
                                icon={ScrollText}
                                title={log.action_label}
                                subtitle={`${log.user_name ?? 'System'} · ${log.ip_address ?? 'No IP'}`}
                                trailing={
                                    log.created_at
                                        ? new Date(
                                              log.created_at,
                                          ).toLocaleString()
                                        : '—'
                                }
                            />
                        ))}
                    </div>
                    <div className="hidden rounded-2xl border bg-card lg:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            {log.created_at
                                                ? new Date(
                                                      log.created_at,
                                                  ).toLocaleString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {log.action_label}
                                        </TableCell>
                                        <TableCell>
                                            {log.user_name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {log.ip_address ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
            <div className="mt-4">
                <Pagination links={logs.links} />
            </div>
        </AppLayout>
    );
}
