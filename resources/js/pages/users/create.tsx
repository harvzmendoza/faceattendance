import { Form, Head, Link } from '@inertiajs/react';
import { UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { fieldSelectClass } from '@/lib/utils';
import { index, store } from '@/routes/users';
import type { StatusOption } from '@/types/models';

export default function UsersCreate({ roles }: { roles: StatusOption[] }) {
    return (
        <AppLayout title="Create user">
            <Head title="Create user" />
            <div className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <Form {...store.form()} className="flex flex-col gap-4">
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" required />
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
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
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
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    name="role"
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
                                <UserPlus />
                                Create user
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
