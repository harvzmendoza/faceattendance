import { Form, Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <div className="mb-6 flex flex-wrap items-start gap-6">
                {participant.photo_url ? (
                    <img
                        src={participant.photo_url}
                        alt=""
                        className="h-32 w-32 rounded-xl object-cover"
                    />
                ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        No photo
                    </div>
                )}
                <div className="flex-1">
                    <h2 className="text-2xl font-semibold">
                        {participant.full_name}
                    </h2>
                    <p className="text-muted-foreground">
                        {participant.registration_number}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                            variant={
                                participant.status === 'active'
                                    ? 'success'
                                    : 'secondary'
                            }
                        >
                            {participant.status}
                        </Badge>
                        {participant.latest_face_profile ? (
                            <Badge variant="outline">Face enrolled</Badge>
                        ) : (
                            <Badge variant="warning">Face not enrolled</Badge>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {can.enroll && (
                        <Button asChild variant="outline" className="min-h-11">
                            <Link href={enroll.url(participant)}>
                                {participant.latest_face_profile
                                    ? 'Re-enroll face'
                                    : 'Enroll face'}
                            </Link>
                        </Button>
                    )}
                    {can.update && (
                        <Button asChild className="min-h-11">
                            <Link href={edit.url(participant)}>Edit</Link>
                        </Button>
                    )}
                    {can.delete && (
                        <Form {...destroy.form(participant)}>
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="min-h-11"
                                    disabled={processing}
                                >
                                    Delete
                                </Button>
                            )}
                        </Form>
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Contact and events</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                    <p>Email: {participant.email ?? '—'}</p>
                    <p>Phone: {participant.phone ?? '—'}</p>
                    <p>Organization: {participant.organization ?? '—'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {participant.events.length === 0 && (
                            <p className="text-muted-foreground">
                                Not assigned to any event.
                            </p>
                        )}
                        {participant.events.map((event) => (
                            <Link
                                key={event.id}
                                href={showEvent.url(event)}
                                className="rounded-full border px-3 py-1 hover:bg-accent"
                            >
                                {event.name}
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
