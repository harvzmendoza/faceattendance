import { Form } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { update } from '@/routes/password';

export default function ResetPassword({
    email,
    token,
}: {
    email: string;
    token: string;
}) {
    return (
        <AuthLayout title="Reset password">
            <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/60">
                <Form {...update.form()} className="flex flex-col gap-4">
                    {({ errors, processing }) => (
                        <>
                            <input type="hidden" name="token" value={token} />
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    defaultValue={email}
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
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={processing}
                            >
                                <KeyRound />
                                Reset password
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
