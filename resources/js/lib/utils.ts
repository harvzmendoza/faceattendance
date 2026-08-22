import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const fieldSelectClass =
    'min-h-12 w-full rounded-2xl border border-input bg-background px-4 text-base disabled:cursor-not-allowed disabled:opacity-50';
