import { Form, Head, Link } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
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
            <div className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <Form {...update.form(event)} className="flex flex-col gap-4">
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
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    defaultValue={event.description ?? ''}
                                    className="min-h-24 rounded-2xl border border-input bg-background px-4 py-3 text-base"
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
                                    className={fieldSelectClass}
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
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={processing}
                            >
                                <Save />
                                Save changes
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link href={index.url()}>
                                    <X />
                                    Cancel
                                </Link>
                            </Button>
                        </>
                    )}
                </Form>
            </div>
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
