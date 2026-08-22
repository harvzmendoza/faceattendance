import type { LucideIcon } from 'lucide-react';

export function EmptyState({
    icon: Icon,
    message,
}: {
    icon: LucideIcon;
    message: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Icon className="size-7" />
            </div>
            <p className="text-base text-muted-foreground">{message}</p>
        </div>
    );
}
