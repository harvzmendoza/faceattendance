import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
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
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Event details</CardTitle>
                </CardHeader>
                <CardContent>
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
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                        Create event
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
