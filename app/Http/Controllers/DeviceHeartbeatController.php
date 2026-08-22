<?php

namespace App\Http\Controllers;

use App\Http\Requests\HeartbeatDeviceRequest;
use App\Services\DeviceService;
use Illuminate\Http\JsonResponse;

class DeviceHeartbeatController extends Controller
{
    public function __construct(private DeviceService $devices) {}

    public function __invoke(HeartbeatDeviceRequest $request): JsonResponse
    {
        $device = $this->devices->heartbeat($request->validated());

        return response()->json($this->devices->toArray($device));
    }
}
