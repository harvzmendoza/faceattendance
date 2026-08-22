<?php

namespace App\Policies;

use App\Models\AttendanceRecord;
use App\Models\User;

class AttendanceRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function viewReports(User $user): bool
    {
        return $user->isAdmin();
    }

    public function exportReports(User $user): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, AttendanceRecord $attendanceRecord): bool
    {
        return $user->isAdmin();
    }
}
