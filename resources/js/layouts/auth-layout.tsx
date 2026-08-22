import { Head } from '@inertiajs/react';
import { ScanFace } from 'lucide-react';
import type { ReactNode } from 'react';
import { FlashToaster } from '@/components/flash-toaster';

export default function AuthLayout({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10">
            <Head title={title} />
            <FlashToaster />
            <div className="mb-8 flex flex-col items-center gap-3">
                <div className="flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
                    <ScanFace className="size-8" />
                </div>
                <span className="text-xl font-semibold">Face Attendance</span>
            </div>
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
