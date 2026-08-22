import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ChevronRight, Download, Upload, UserPlus, Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { StatusChip } from '@/components/status-chip';
import { Badge } from '@/components/ui/badge';
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
import {
    create,
    exportMethod,
    importMethod,
    index,
    show,
} from '@/routes/participants';
import type { Paginated, ParticipantSummary } from '@/types/models';

export default function ParticipantsIndex({
    participants,
    filters,
    can,
}: {
    participants: Paginated<ParticipantSummary>;
    filters: { search: string };
    can: { create: boolean; import: boolean; export: boolean };
}) {
    const importErrors = usePage().props.flash.import_errors;

    return (
        <AppLayout title="Participants">
            <Head title="Participants" />
            <PageHeader
                actions={
                    can.create ? (
                        <Button asChild>
                            <Link href={create.url()}>
                                <UserPlus />
                                Add participant
                            </Link>
                        </Button>
                    ) : null
                }
            />
            <div className="mb-4 flex flex-col gap-3">
                <SearchForm
                    action={index.url()}
                    defaultValue={filters.search}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                    {can.export && (
                        <Button variant="outline" asChild>
                            <a
                                href={exportMethod.url({
                                    query: { search: filters.search },
                                })}
                            >
                                <Download />
                                Export CSV
                            </a>
                        </Button>
                    )}
                    {can.import && (
                        <Form
                            {...importMethod.form()}
                            encType="multipart/form-data"
                            className="flex flex-col gap-2 sm:flex-row"
                        >
                            {({ processing }) => (
                                <>
                                    <Input
                                        type="file"
                                        name="file"
                                        accept=".csv,text/csv"
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        <Upload />
                                        Import CSV
                                    </Button>
                                </>
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
            {participants.data.length === 0 ? (
                <EmptyState icon={Users} message="No participants found." />
            ) : (
                <>
                    <div className="flex flex-col gap-3 lg:hidden">
                        {participants.data.map((participant) => (
                            <Link
                                key={participant.id}
                                href={show.url(participant)}
                            >
                                <EntityCard
                                    icon={Users}
                                    title={participant.full_name}
                                    subtitle={`${participant.registration_number} · ${participant.organization ?? 'No organization'}`}
                                    trailing={
                                        <span className="flex items-center gap-2">
                                            <StatusChip
                                                icon={Users}
                                                label={participant.status}
                                                tone={
                                                    participant.status ===
                                                    'active'
                                                        ? 'success'
                                                        : 'neutral'
                                                }
                                            />
                                            <ChevronRight className="size-5" />
                                        </span>
                                    }
                                />
                            </Link>
                        ))}
                    </div>
                    <div className="hidden rounded-2xl border bg-card lg:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Registration</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participants.data.map((participant) => (
                                    <TableRow key={participant.id}>
                                        <TableCell>
                                            {participant.registration_number}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={show.url(participant)}
                                                className="hover:underline"
                                            >
                                                {participant.full_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {participant.organization ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    participant.status ===
                                                    'active'
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                            >
                                                {participant.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
            <div className="mt-4">
                <Pagination links={participants.links} />
            </div>
        </AppLayout>
    );
}
