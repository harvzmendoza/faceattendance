import { Form, Head, Link } from '@inertiajs/react';
import { Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
import { index, store } from '@/routes/events';
import type { StatusOption } from '@/types/models';

export default function EventsCreate({
    statuses,
}: {
    statuses: StatusOption[];
}) {
    return (
        <AppLayout title="Create event">
            <Head title="Create event" />
            <div className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <Form {...store.form()} className="flex flex-col gap-4">
                    {({ errors, processing }) => (
                        <>
                            <Field
                                id="name"
                                label="Name"
                                error={errors.name}
                                required
                            />
                            <Field
                                id="event_code"
                                label="Event code"
                                error={errors.event_code}
                                required
                            />
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    className="min-h-24 rounded-2xl border border-input bg-background px-4 py-3 text-base"
                                />
                            </div>
                            <Field
                                id="venue"
                                label="Venue"
                                error={errors.venue}
                            />
                            <Field
                                id="starts_at"
                                label="Starts at"
                                type="datetime-local"
                                error={errors.starts_at}
                                required
                            />
                            <Field
                                id="ends_at"
                                label="Ends at"
                                type="datetime-local"
                                error={errors.ends_at}
                                required
                            />
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    name="status"
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
                                <Plus />
                                Create event
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
    error,
    required = false,
}: {
    id: string;
    label: string;
    type?: string;
    error?: string;
    required?: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} name={id} type={type} required={required} />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
