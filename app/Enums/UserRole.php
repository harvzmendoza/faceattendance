<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case AttendanceOperator = 'attendance_operator';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::AttendanceOperator => 'Attendance Operator',
        };
    }
}
