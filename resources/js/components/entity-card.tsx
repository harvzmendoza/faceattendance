import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EntityCard({
    icon: Icon,
    title,
    subtitle,
    trailing,
    className,
}: {
    icon?: LucideIcon;
    title: ReactNode;
    subtitle?: ReactNode;
    trailing?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-h-16 w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border/60',
                className,
            )}
        >
            {Icon ? (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>
            ) : null}
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{title}</p>
                {subtitle ? (
                    <p className="truncate text-sm text-muted-foreground">
                        {subtitle}
                    </p>
                ) : null}
            </div>
            {trailing ? (
                <div className="shrink-0 text-sm text-muted-foreground">
                    {trailing}
                </div>
            ) : null}
        </div>
    );
}
