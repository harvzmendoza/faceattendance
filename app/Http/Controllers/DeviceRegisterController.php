<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterDeviceRequest;
use App\Services\DeviceService;
use Illuminate\Http\JsonResponse;

class DeviceRegisterController extends Controller
{
    public function __construct(private DeviceService $devices) {}

    public function __invoke(RegisterDeviceRequest $request): JsonResponse
    {
        $device = $this->devices->register($request->validated());

        return response()->json($this->devices->toArray($device));
    }
}
