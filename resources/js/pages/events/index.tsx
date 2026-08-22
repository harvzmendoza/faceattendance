import { Head, Link } from '@inertiajs/react';
import { CalendarClock, ChevronRight, Pencil, Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { StatusChip } from '@/components/status-chip';
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
            <PageHeader
                actions={
                    can.create ? (
                        <Button asChild>
                            <Link href={create.url()}>
                                <Plus />
                                Create event
                            </Link>
                        </Button>
                    ) : null
                }
            />
            <SearchForm action={index.url()} defaultValue={filters.search} />
            {events.data.length === 0 ? (
                <EmptyState icon={CalendarClock} message="No events found." />
            ) : (
                <>
                    <div className="mt-4 flex flex-col gap-3 lg:hidden">
                        {events.data.map((event) => (
                            <Link key={event.id} href={show.url(event)}>
                                <EntityCard
                                    icon={CalendarClock}
                                    title={event.name}
                                    subtitle={`${event.event_code} · ${event.venue ?? 'No venue'} · ${event.participants_count ?? 0} people`}
                                    trailing={
                                        <span className="flex items-center gap-2">
                                            <StatusChip
                                                icon={CalendarClock}
                                                label={event.status}
                                                tone={
                                                    event.status === 'active'
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
                    <div className="mt-4 hidden rounded-2xl border bg-card lg:block">
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
                                        <TableCell>
                                            {event.event_code}
                                        </TableCell>
                                        <TableCell>
                                            {event.venue ?? '—'}
                                        </TableCell>
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
                                                    <Link
                                                        href={edit.url(event)}
                                                    >
                                                        <Pencil />
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
                </>
            )}
            <div className="mt-4">
                <Pagination links={events.links} />
            </div>
        </AppLayout>
    );
}
