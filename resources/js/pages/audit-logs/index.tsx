import { Head } from '@inertiajs/react';
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
            <div className="rounded-xl border bg-card">
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
                        {logs.data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-muted-foreground"
                                >
                                    No audit events recorded yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {logs.data.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    {log.created_at
                                        ? new Date(
                                              log.created_at,
                                          ).toLocaleString()
                                        : '—'}
                                </TableCell>
                                <TableCell>{log.action_label}</TableCell>
                                <TableCell>{log.user_name ?? '—'}</TableCell>
                                <TableCell>{log.ip_address ?? '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4">
                <Pagination links={logs.links} />
            </div>
        </AppLayout>
    );
}
