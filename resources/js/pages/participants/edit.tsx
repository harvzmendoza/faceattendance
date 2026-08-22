import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index, update } from '@/routes/participants';
import type { ParticipantSummary, StatusOption } from '@/types/models';

export default function ParticipantsEdit({
    participant,
    statuses,
}: {
    participant: ParticipantSummary;
    statuses: StatusOption[];
}) {
    return (
        <AppLayout title="Edit participant">
            <Head title="Edit participant" />
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{participant.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form
                        {...update.form(participant)}
                        encType="multipart/form-data"
                        className="flex flex-col gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <Field
                                    id="registration_number"
                                    label="Registration number"
                                    defaultValue={
                                        participant.registration_number
                                    }
                                    error={errors.registration_number}
                                    required
                                />
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field
                                        id="first_name"
                                        label="First name"
                                        defaultValue={participant.first_name}
                                        error={errors.first_name}
                                        required
                                    />
                                    <Field
                                        id="middle_name"
                                        label="Middle name"
                                        defaultValue={
                                            participant.middle_name ?? ''
                                        }
                                        error={errors.middle_name}
                                    />
                                    <Field
                                        id="last_name"
                                        label="Last name"
                                        defaultValue={participant.last_name}
                                        error={errors.last_name}
                                        required
                                    />
                                </div>
                                <Field
                                    id="email"
                                    label="Email"
                                    type="email"
                                    defaultValue={participant.email ?? ''}
                                    error={errors.email}
                                />
                                <Field
                                    id="phone"
                                    label="Phone"
                                    defaultValue={participant.phone ?? ''}
                                    error={errors.phone}
                                />
                                <Field
                                    id="organization"
                                    label="Organization"
                                    defaultValue={
                                        participant.organization ?? ''
                                    }
                                    error={errors.organization}
                                />
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        name="status"
                                        defaultValue={participant.status}
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
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="photo">Photo</Label>
                                    {participant.photo_url && (
                                        <img
                                            src={participant.photo_url}
                                            alt=""
                                            className="h-24 w-24 rounded-md object-cover"
                                        />
                                    )}
                                    <Input
                                        id="photo"
                                        name="photo"
                                        type="file"
                                        accept="image/*"
                                    />
                                    {errors.photo && (
                                        <p className="text-sm text-destructive">
                                            {errors.photo}
                                        </p>
                                    )}
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
