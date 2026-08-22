<?php

namespace App\Policies;

use App\Models\AttendanceSession;
use App\Models\User;

class AttendanceSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AttendanceSession $attendanceSession): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, AttendanceSession $attendanceSession): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, AttendanceSession $attendanceSession): bool
    {
        return $user->isAdmin();
    }
}
