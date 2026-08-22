<?php

namespace App\Enums;

enum DeviceStatus: string
{
    case Active = 'active';
    case Revoked = 'revoked';
    case Offline = 'offline';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Revoked => 'Revoked',
            self::Offline => 'Offline',
        };
    }
}
