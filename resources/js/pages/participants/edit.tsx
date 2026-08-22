import { Form, Head, Link } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
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
            <div className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
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
                                defaultValue={participant.registration_number}
                                error={errors.registration_number}
                                required
                            />
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
                                defaultValue={participant.middle_name ?? ''}
                                error={errors.middle_name}
                            />
                            <Field
                                id="last_name"
                                label="Last name"
                                defaultValue={participant.last_name}
                                error={errors.last_name}
                                required
                            />
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
                                defaultValue={participant.organization ?? ''}
                                error={errors.organization}
                            />
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    name="status"
                                    defaultValue={participant.status}
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
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="photo">Photo</Label>
                                {participant.photo_url && (
                                    <img
                                        src={participant.photo_url}
                                        alt=""
                                        className="size-24 rounded-2xl object-cover"
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
