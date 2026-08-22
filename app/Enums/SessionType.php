<?php

namespace App\Enums;

enum SessionType: string
{
    case CheckIn = 'check_in';
    case CheckOut = 'check_out';
    case Break = 'break';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::CheckIn => 'Check-in',
            self::CheckOut => 'Check-out',
            self::Break => 'Break',
            self::Custom => 'Custom',
        };
    }
}
