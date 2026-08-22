import { Link, usePage } from '@inertiajs/react';
import { ScanFace } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { FlashToaster } from '@/components/flash-toaster';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { AppNav, BottomNav, NavLinks, adminNav } from '@/layouts/app-nav';
import { logout } from '@/routes';

export default function AppLayout({
    children,
    title,
}: {
    children: ReactNode;
    title: string;
}) {
    const { auth, name } = usePage().props;
    const [moreOpen, setMoreOpen] = useState(false);
    const initials = (auth.user?.name ?? '?')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="min-h-dvh bg-background">
            <FlashToaster />
            <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col bg-sidebar p-4 text-sidebar-foreground lg:flex">
                <div className="mb-8 flex items-center gap-2 px-2">
                    <ScanFace className="size-6 text-sidebar-primary" />
                    <span className="font-semibold">{name}</span>
                </div>
                <AppNav />
            </aside>
            <div className="lg:pl-56">
                <header className="pt-safe sticky top-0 z-30 flex min-h-14 items-center justify-between gap-4 bg-background/90 px-4 backdrop-blur lg:px-8">
                    <h1 className="text-lg font-semibold tracking-tight">
                        {title}
                    </h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full"
                                aria-label="Account"
                            >
                                <span className="text-xs font-semibold">
                                    {initials}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>{auth.user?.name}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {auth.user?.email}
                                    </span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={logout.url()}
                                    method="post"
                                    as="button"
                                    className="w-full"
                                >
                                    Log out
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="px-4 pb-28 lg:px-8 lg:pb-8">{children}</main>
            </div>
            <BottomNav onMore={() => setMoreOpen(true)} />
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent side="bottom">
                    <SheetHeader>
                        <SheetTitle>More</SheetTitle>
                    </SheetHeader>
                    <nav className="mt-4 grid grid-cols-2 gap-2 pb-4">
                        <NavLinks
                            items={adminNav}
                            onNavigate={() => setMoreOpen(false)}
                            variant="panel"
                        />
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    );
}
