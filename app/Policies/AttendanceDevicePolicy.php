<?php

namespace App\Policies;

use App\Models\AttendanceDevice;
use App\Models\User;

class AttendanceDevicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, AttendanceDevice $attendanceDevice): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, AttendanceDevice $attendanceDevice): bool
    {
        return true;
    }

    public function revoke(User $user, AttendanceDevice $attendanceDevice): bool
    {
        return $user->isAdmin();
    }
}
