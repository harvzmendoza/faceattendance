import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index, update } from '@/routes/events';
import type { EventSummary, StatusOption } from '@/types/models';

function toLocalInput(value: string): string {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EventsEdit({
    event,
    statuses,
}: {
    event: EventSummary;
    statuses: StatusOption[];
}) {
    return (
        <AppLayout title="Edit event">
            <Head title="Edit event" />
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form
                        {...update.form(event)}
                        className="flex flex-col gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <Field
                                    id="name"
                                    label="Name"
                                    defaultValue={event.name}
                                    error={errors.name}
                                    required
                                />
                                <Field
                                    id="event_code"
                                    label="Event code"
                                    defaultValue={event.event_code}
                                    error={errors.event_code}
                                    required
                                />
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        defaultValue={event.description ?? ''}
                                        className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <Field
                                    id="venue"
                                    label="Venue"
                                    defaultValue={event.venue ?? ''}
                                    error={errors.venue}
                                />
                                <Field
                                    id="starts_at"
                                    label="Starts at"
                                    type="datetime-local"
                                    defaultValue={toLocalInput(event.starts_at)}
                                    error={errors.starts_at}
                                    required
                                />
                                <Field
                                    id="ends_at"
                                    label="Ends at"
                                    type="datetime-local"
                                    defaultValue={toLocalInput(event.ends_at)}
                                    error={errors.ends_at}
                                    required
                                />
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        name="status"
                                        defaultValue={event.status}
                                        className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        {statuses.map((status) => (
                                            <option
                                                key={status.value}
                                                value={status.value}
                                            >
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        className="min-h-11"
                                        disabled={processing}
                                    >
                                        Save changes
                                    </Button>
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="min-h-11"
                                    >
                                        <Link href={index.url()}>Cancel</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

function Field({
    id,
    label,
    type = 'text',
    defaultValue,
    error,
    required = false,
}: {
    id: string;
    label: string;
    type?: string;
    defaultValue?: string;
    error?: string;
    required?: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                name={id}
                type={type}
                defaultValue={defaultValue}
                required={required}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
