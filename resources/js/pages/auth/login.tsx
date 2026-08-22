import { Form, Link } from '@inertiajs/react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { request as passwordRequest } from '@/routes/password';

export default function Login({
    canResetPassword,
    status,
}: {
    canResetPassword: boolean;
    status?: string;
}) {
    return (
        <AuthLayout title="Log in">
            <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                {status && (
                    <p className="mb-4 text-sm text-emerald-700">{status}</p>
                )}
                <Form {...store.form()} className="flex flex-col gap-4">
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="username"
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
                                    autoComplete="current-password"
                                    required
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <label className="flex min-h-12 items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="size-5 rounded border-input"
                                />
                                Remember me
                            </label>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={processing}
                            >
                                <LogIn />
                                Log in
                            </Button>
                            {canResetPassword && (
                                <Link
                                    href={passwordRequest.url()}
                                    className="text-center text-sm text-muted-foreground hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
