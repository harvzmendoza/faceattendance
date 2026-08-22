<?php

namespace App\Http\Controllers;

use App\Models\AttendanceDevice;
use App\Services\DeviceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DeviceRevokeController extends Controller
{
    public function __construct(private DeviceService $devices) {}

    public function __invoke(Request $request, AttendanceDevice $device): JsonResponse|RedirectResponse
    {
        $this->authorize('revoke', $device);

        $device = $this->devices->revoke($device);

        if ($request->expectsJson()) {
            return response()->json($this->devices->toArray($device));
        }

        return back()->with('success', 'Device revoked.');
    }
}
