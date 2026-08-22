import type { LucideIcon } from 'lucide-react';

export function StatTile({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex min-h-28 flex-col justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-5" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
    );
}
