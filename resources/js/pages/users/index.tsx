import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Pencil, UserPlus, Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { EntityCard } from '@/components/entity-card';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { create, edit, index } from '@/routes/users';
import type { User } from '@/types/auth';
import type { Paginated } from '@/types/models';

export default function UsersIndex({
    users,
    filters,
}: {
    users: Paginated<User>;
    filters: { search: string };
}) {
    return (
        <AppLayout title="Users">
            <Head title="Users" />
            <PageHeader
                actions={
                    <Button asChild>
                        <Link href={create.url()}>
                            <UserPlus />
                            Create user
                        </Link>
                    </Button>
                }
            />
            <SearchForm action={index.url()} defaultValue={filters.search} />
            {users.data.length === 0 ? (
                <EmptyState icon={Users} message="No users found." />
            ) : (
                <>
                    <div className="mt-4 flex flex-col gap-3 lg:hidden">
                        {users.data.map((user) => (
                            <Link key={user.id} href={edit.url(user)}>
                                <EntityCard
                                    icon={Users}
                                    title={user.name}
                                    subtitle={user.email}
                                    trailing={
                                        <span className="flex items-center gap-2">
                                            <StatusChip
                                                icon={Users}
                                                label={
                                                    user.role === 'admin'
                                                        ? 'Admin'
                                                        : 'Operator'
                                                }
                                                tone={
                                                    user.role === 'admin'
                                                        ? 'success'
                                                        : 'neutral'
                                                }
                                            />
                                            <ChevronRight className="size-5" />
                                        </span>
                                    }
                                />
                            </Link>
                        ))}
                    </div>
                    <div className="mt-4 hidden rounded-2xl border bg-card lg:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.role === 'admin'
                                                ? 'Admin'
                                                : 'Attendance Operator'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={edit.url(user)}>
                                                    <Pencil />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
            <div className="mt-4">
                <Pagination links={users.links} />
            </div>
        </AppLayout>
    );
}
