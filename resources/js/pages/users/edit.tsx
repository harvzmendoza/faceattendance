import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
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
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>{user.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <Form
                        {...update.form(user)}
                        className="flex flex-col gap-4"
                    >
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
                                    <Label htmlFor="password">
                                        New password
                                    </Label>
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
                                        className="h-11 rounded-md border border-input bg-background px-3 text-sm"
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
                    <Form {...destroy.form(user)}>
                        {({ processing }) => (
                            <Button
                                type="submit"
                                variant="destructive"
                                className="min-h-11"
                                disabled={processing}
                            >
                                Delete user
                            </Button>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
