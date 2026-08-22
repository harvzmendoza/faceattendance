import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
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
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchForm
                    action={index.url()}
                    defaultValue={filters.search}
                />
                <div className="flex flex-wrap gap-2">
                    {can.export && (
                        <Button variant="outline" asChild className="min-h-11">
                            <a
                                href={exportMethod.url({
                                    query: { search: filters.search },
                                })}
                            >
                                Export CSV
                            </a>
                        </Button>
                    )}
                    {can.import && (
                        <Form
                            {...importMethod.form()}
                            encType="multipart/form-data"
                            className="flex gap-2"
                        >
                            {({ processing }) => (
                                <>
                                    <Input
                                        type="file"
                                        name="file"
                                        accept=".csv,text/csv"
                                        className="h-11 max-w-56"
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="min-h-11"
                                        disabled={processing}
                                    >
                                        Import CSV
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                    {can.create && (
                        <Button asChild className="min-h-11">
                            <Link href={create.url()}>Add participant</Link>
                        </Button>
                    )}
                </div>
            </div>
            {importErrors && importErrors.length > 0 && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    {importErrors.map((error) => (
                        <p key={error}>{error}</p>
                    ))}
                </div>
            )}
            <div className="rounded-xl border bg-card">
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
                        {participants.data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground"
                                >
                                    No participants found.
                                </TableCell>
                            </TableRow>
                        )}
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
                                            participant.status === 'active'
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
            <div className="mt-4">
                <Pagination links={participants.links} />
            </div>
        </AppLayout>
    );
}
