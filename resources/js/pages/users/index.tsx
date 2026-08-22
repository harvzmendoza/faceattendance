import { Head, Link } from '@inertiajs/react';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
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
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchForm
                    action={index.url()}
                    defaultValue={filters.search}
                />
                <Button asChild className="min-h-11">
                    <Link href={create.url()}>Create user</Link>
                </Button>
            </div>
            <div className="rounded-xl border bg-card">
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
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={edit.url(user)}>Edit</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4">
                <Pagination links={users.links} />
            </div>
        </AppLayout>
    );
}
