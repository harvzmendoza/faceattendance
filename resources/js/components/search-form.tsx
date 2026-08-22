import { Form } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/input';

export function SearchForm({
    action,
    defaultValue = '',
}: {
    action: string;
    defaultValue?: string;
}) {
    function submit(event: FormEvent<HTMLFormElement>) {
        const form = event.currentTarget;
        const search = new FormData(form).get('search');

        if (typeof search === 'string' && search.trim() === '') {
            event.preventDefault();
            window.location.assign(action);
        }
    }

    return (
        <Form
            action={action}
            method="get"
            className="w-full max-w-sm"
            onSubmit={submit}
        >
            <Input
                type="search"
                name="search"
                placeholder="Search..."
                defaultValue={defaultValue}
                className="h-11"
            />
        </Form>
    );
}
