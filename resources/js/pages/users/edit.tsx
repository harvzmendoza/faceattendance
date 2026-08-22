import { Form, Head, Link } from '@inertiajs/react';
import { Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
import { destroy, index, update } from '@/routes/users';
import type { User } from '@/types/auth';
import type { StatusOption } from '@/types/models';

export default function UsersEdit({
    user,
    roles,
}: {
    user: User;
    roles: StatusOption[];
}) {
    return (
        <AppLayout title="Edit user">
            <Head title="Edit user" />
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <Form {...update.form(user)} className="flex flex-col gap-4">
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={user.name}
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    defaultValue={user.email}
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password">New password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    name="role"
                                    defaultValue={user.role}
                                    className={fieldSelectClass}
                                >
                                    {roles.map((role) => (
                                        <option
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
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
                <Form {...destroy.form(user)}>
                    {({ processing }) => (
                        <Button
                            type="submit"
                            variant="destructive"
                            className="w-full"
                            disabled={processing}
                        >
                            <Trash2 />
                            Delete user
                        </Button>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
