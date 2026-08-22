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
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
            <Head title={title} />
            <FlashToaster />
            <div className="mb-8 flex items-center gap-2">
                <ScanFace className="size-8 text-primary" />
                <span className="text-xl font-semibold">Face Attendance</span>
            </div>
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
