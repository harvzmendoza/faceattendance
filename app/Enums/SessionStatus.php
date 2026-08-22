<?php

namespace App\Enums;

enum SessionStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Active => 'Active',
            self::Completed => 'Completed',
        };
    }
}
