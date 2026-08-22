import { Link, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    ClipboardCheck,
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

const nav = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
        icon: LayoutDashboard,
        adminOnly: false,
    },
    {
        title: 'Events',
        href: events.url(),
        icon: CalendarClock,
        adminOnly: false,
    },
    {
        title: 'Participants',
        href: participants.url(),
        icon: Users,
        adminOnly: false,
    },
    {
        title: 'Attendance',
        href: attendance.url(),
        icon: ScanFace,
        adminOnly: false,
    },
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
        title: 'Audit logs',
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

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
    const { auth } = usePage().props;
    const currentUrl = usePage().url;
    const isAdmin = auth.user?.role === 'admin';

    return (
        <nav className="flex flex-col gap-1">
            {nav
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                    const active =
                        currentUrl === item.href ||
                        currentUrl.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                active &&
                                    'bg-sidebar-accent text-sidebar-accent-foreground',
                            )}
                        >
                            <item.icon className="size-4" />
                            {item.title}
                        </Link>
                    );
                })}
        </nav>
    );
}
