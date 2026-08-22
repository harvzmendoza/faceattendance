import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, ScanFace, Trash2 } from 'lucide-react';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { show as showEvent } from '@/routes/events';
import { destroy, edit, enroll } from '@/routes/participants';
import type { EventSummary, ParticipantSummary } from '@/types/models';

export default function ParticipantsShow({
    participant,
    can,
}: {
    participant: ParticipantSummary & {
        events: EventSummary[];
        latest_face_profile: { id: number; model_version: string } | null;
    };
    can: { update: boolean; delete: boolean; enroll: boolean };
}) {
    return (
        <AppLayout title={participant.full_name}>
            <Head title={participant.full_name} />
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    {participant.photo_url ? (
                        <img
                            src={participant.photo_url}
                            alt=""
                            className="size-24 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="flex size-24 items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
                            No photo
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground">
                            {participant.registration_number}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <StatusChip
                                icon={ScanFace}
                                label={participant.status}
                                tone={
                                    participant.status === 'active'
                                        ? 'success'
                                        : 'neutral'
                                }
                            />
                            <StatusChip
                                icon={ScanFace}
                                label={
                                    participant.latest_face_profile
                                        ? 'Face enrolled'
                                        : 'Face not enrolled'
                                }
                                tone={
                                    participant.latest_face_profile
                                        ? 'success'
                                        : 'warning'
                                }
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    {can.enroll && (
                        <Button asChild size="lg" className="w-full">
                            <Link href={enroll.url(participant)}>
                                <ScanFace />
                                {participant.latest_face_profile
                                    ? 'Re-enroll face'
                                    : 'Enroll face'}
                            </Link>
                        </Button>
                    )}
                    {can.update && (
                        <Button asChild variant="outline" className="w-full">
                            <Link href={edit.url(participant)}>
                                <Pencil />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {can.delete && (
                        <Form {...destroy.form(participant)}>
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="w-full"
                                    disabled={processing}
                                >
                                    <Trash2 />
                                    Delete
                                </Button>
                            )}
                        </Form>
                    )}
                </div>
            </div>
            <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                <h2 className="font-semibold">Contact and events</h2>
                <p className="text-sm">Email: {participant.email ?? '—'}</p>
                <p className="text-sm">Phone: {participant.phone ?? '—'}</p>
                <p className="text-sm">
                    Organization: {participant.organization ?? '—'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {participant.events.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Not assigned to any event.
                        </p>
                    )}
                    {participant.events.map((event) => (
                        <Link
                            key={event.id}
                            href={showEvent.url(event)}
                            className="rounded-full border px-3 py-2 text-sm hover:bg-accent"
                        >
                            {event.name}
                        </Link>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
}
