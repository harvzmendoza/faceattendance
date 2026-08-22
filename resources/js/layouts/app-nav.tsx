import { Link, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    ClipboardCheck,
    Ellipsis,
    FileBarChart,
    LayoutDashboard,
    MonitorSmartphone,
    ScanFace,
    ScrollText,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as attendance } from '@/routes/attendance';
import { index as auditLogs } from '@/routes/audit-logs';
import { index as devices } from '@/routes/devices';
import { index as events } from '@/routes/events';
import { index as participants } from '@/routes/participants';
import { index as reports } from '@/routes/reports';
import { index as users } from '@/routes/users';

export const coreNav = [
    {
        title: 'Home',
        href: dashboard.url(),
        icon: LayoutDashboard,
        adminOnly: false,
    },
    {
        title: 'Camera',
        href: attendance.url(),
        icon: ScanFace,
        adminOnly: false,
    },
    {
        title: 'Events',
        href: events.url(),
        icon: CalendarClock,
        adminOnly: false,
    },
    {
        title: 'People',
        href: participants.url(),
        icon: Users,
        adminOnly: false,
    },
];

export const adminNav = [
    {
        title: 'Reports',
        href: reports.url(),
        icon: FileBarChart,
        adminOnly: true,
    },
    {
        title: 'Devices',
        href: devices.url(),
        icon: MonitorSmartphone,
        adminOnly: true,
    },
    {
        title: 'Audit',
        href: auditLogs.url(),
        icon: ScrollText,
        adminOnly: true,
    },
    {
        title: 'Users',
        href: users.url(),
        icon: ClipboardCheck,
        adminOnly: true,
    },
];

function isActive(currentUrl: string, href: string): boolean {
    if (href === dashboard.url()) {
        return currentUrl === href || currentUrl.startsWith(`${href}?`);
    }

    return currentUrl === href || currentUrl.startsWith(`${href}/`);
}

export function NavLinks({
    items,
    onNavigate,
    variant = 'side',
}: {
    items: typeof coreNav;
    onNavigate?: () => void;
    variant?: 'side' | 'bottom' | 'panel';
}) {
    const currentUrl = usePage().url;

    return (
        <>
            {items.map((item) => {
                const active = isActive(currentUrl, item.href);

                return (
                    <Link
                        key={item.title}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            'flex items-center font-medium',
                            variant === 'side' &&
                                'min-h-12 gap-3 rounded-2xl px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            variant === 'side' &&
                                active &&
                                'bg-sidebar-accent text-sidebar-accent-foreground',
                            variant === 'panel' &&
                                'min-h-14 gap-3 rounded-2xl bg-muted/70 px-4 text-foreground',
                            variant === 'panel' &&
                                active &&
                                'bg-primary/10 text-primary',
                            variant === 'bottom' &&
                                'min-h-14 flex-1 flex-col justify-center gap-1 text-[11px] text-muted-foreground',
                            variant === 'bottom' && active && 'text-primary',
                        )}
                    >
                        <item.icon
                            className={cn(
                                variant === 'side' ? 'size-5' : 'size-6',
                            )}
                        />
                        {item.title}
                    </Link>
                );
            })}
        </>
    );
}

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';
    const items = isAdmin ? [...coreNav, ...adminNav] : coreNav;

    return (
        <nav className="flex flex-col gap-1">
            <NavLinks items={items} onNavigate={onNavigate} />
        </nav>
    );
}

export function BottomNav({ onMore }: { onMore?: () => void }) {
    const { auth } = usePage().props;
    const currentUrl = usePage().url;
    const isAdmin = auth.user?.role === 'admin';
    const moreActive = adminNav.some((item) => isActive(currentUrl, item.href));

    return (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 backdrop-blur lg:hidden">
            <NavLinks items={coreNav} variant="bottom" />
            {isAdmin ? (
                <button
                    type="button"
                    onClick={onMore}
                    className={cn(
                        'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground',
                        moreActive && 'text-primary',
                    )}
                >
                    <Ellipsis className="size-6" />
                    More
                </button>
            ) : null}
        </nav>
    );
}
