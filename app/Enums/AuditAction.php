<?php

namespace App\Enums;

enum AuditAction: string
{
    case Login = 'auth.login';
    case FaceEnrolled = 'face.enrolled';
    case AttendanceSynced = 'attendance.synced';
    case DeviceRegistered = 'device.registered';
    case DeviceRevoked = 'device.revoked';
    case ReportExported = 'report.exported';
    case SessionCreated = 'session.created';
    case SessionDeleted = 'session.deleted';

    public function label(): string
    {
        return match ($this) {
            self::Login => 'Signed in',
            self::FaceEnrolled => 'Face enrolled',
            self::AttendanceSynced => 'Attendance synced',
            self::DeviceRegistered => 'Device registered',
            self::DeviceRevoked => 'Device revoked',
            self::ReportExported => 'Report exported',
            self::SessionCreated => 'Session created',
            self::SessionDeleted => 'Session deleted',
        };
    }
}
