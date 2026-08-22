import type { ReactNode } from 'react';

export function PageHeader({
    title,
    actions,
}: {
    title?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            {title ? (
                <h2 className="text-xl font-semibold tracking-tight">
                    {title}
                </h2>
            ) : (
                <span />
            )}
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}
