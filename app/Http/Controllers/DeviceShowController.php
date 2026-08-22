<?php

namespace App\Http\Controllers;

use App\Models\AttendanceDevice;
use App\Services\DeviceService;
use Illuminate\Http\JsonResponse;

class DeviceShowController extends Controller
{
    public function __construct(private DeviceService $devices) {}

    public function __invoke(AttendanceDevice $device): JsonResponse
    {
        $this->authorize('view', $device);

        return response()->json($this->devices->toArray($device));
    }
}
