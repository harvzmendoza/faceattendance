import { Form, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout title="Forgot password">
            <Card>
                <CardHeader>
                    <CardTitle>Forgot password</CardTitle>
                    <CardDescription>
                        Enter your email and we will send a reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status && (
                        <p className="mb-4 text-sm text-emerald-700">
                            {status}
                        </p>
                    )}
                    <Form {...email.form()} className="flex flex-col gap-4">
                        {({ errors, processing }) => (
                            <>
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
                                <Button
                                    type="submit"
                                    className="min-h-11"
                                    disabled={processing}
                                >
                                    Send reset link
                                </Button>
                                <Link
                                    href={login.url()}
                                    className="text-center text-sm text-muted-foreground hover:underline"
                                >
                                    Back to login
                                </Link>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
