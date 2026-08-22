import { Link, usePage } from '@inertiajs/react';
import { Menu, ScanFace } from 'lucide-react';
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
    SheetTrigger,
} from '@/components/ui/sheet';
import { AppNav } from '@/layouts/app-nav';
import { logout } from '@/routes';

export default function AppLayout({
    children,
    title,
}: {
    children: ReactNode;
    title: string;
}) {
    const { auth, name } = usePage().props;
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <FlashToaster />
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar p-4 text-sidebar-foreground lg:flex">
                <div className="mb-8 flex items-center gap-2 px-2">
                    <ScanFace className="size-6 text-sidebar-primary" />
                    <span className="font-semibold">{name}</span>
                </div>
                <AppNav />
            </aside>
            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur lg:px-8">
                    <div className="flex items-center gap-3">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="lg:hidden"
                                >
                                    <Menu className="size-5" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetHeader>
                                    <SheetTitle>{name}</SheetTitle>
                                </SheetHeader>
                                <AppNav onNavigate={() => setOpen(false)} />
                            </SheetContent>
                        </Sheet>
                        <h1 className="text-lg font-semibold">{title}</h1>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="min-h-11">
                                {auth.user?.name}
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
                <main className="p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
