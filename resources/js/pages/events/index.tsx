import { Head, Link } from '@inertiajs/react';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Badge } from '@/components/ui/badge';
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
import { create, edit, index, show } from '@/routes/events';
import type { EventSummary, Paginated } from '@/types/models';

export default function EventsIndex({
    events,
    filters,
    can,
}: {
    events: Paginated<EventSummary>;
    filters: { search: string };
    can: { create: boolean };
}) {
    return (
        <AppLayout title="Events">
            <Head title="Events" />
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchForm
                    action={index.url()}
                    defaultValue={filters.search}
                />
                {can.create && (
                    <Button asChild className="min-h-11">
                        <Link href={create.url()}>Create event</Link>
                    </Button>
                )}
            </div>
            <div className="rounded-xl border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Participants</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground"
                                >
                                    No events found.
                                </TableCell>
                            </TableRow>
                        )}
                        {events.data.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={show.url(event)}
                                        className="hover:underline"
                                    >
                                        {event.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{event.event_code}</TableCell>
                                <TableCell>{event.venue ?? '—'}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            event.status === 'active'
                                                ? 'success'
                                                : 'secondary'
                                        }
                                    >
                                        {event.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {event.participants_count ?? 0}
                                </TableCell>
                                <TableCell className="text-right">
                                    {can.create && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={edit.url(event)}>
                                                Edit
                                            </Link>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4">
                <Pagination links={events.links} />
            </div>
        </AppLayout>
    );
}
