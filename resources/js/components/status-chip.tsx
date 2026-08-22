import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatusChip({
    icon: Icon,
    label,
    tone = 'neutral',
    className,
}: {
    icon: LucideIcon;
    label: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                tone === 'success' &&
                    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                tone === 'warning' &&
                    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                tone === 'danger' && 'bg-destructive/15 text-destructive',
                tone === 'neutral' && 'bg-muted text-muted-foreground',
                className,
            )}
        >
            <Icon className="size-4" />
            {label}
        </span>
    );
}
