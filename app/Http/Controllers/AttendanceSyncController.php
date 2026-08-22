<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncAttendanceRequest;
use App\Models\User;
use App\Services\AttendanceSyncService;
use Illuminate\Http\JsonResponse;

class AttendanceSyncController extends Controller
{
    public function __construct(private AttendanceSyncService $sync) {}

    public function __invoke(SyncAttendanceRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        return response()->json(
            $this->sync->sync($user, $request->validated()),
        );
    }
}
