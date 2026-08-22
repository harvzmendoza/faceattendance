<?php

namespace App\Http\Controllers;

use App\Models\AttendanceDevice;
use App\Services\DeviceService;
use Inertia\Inertia;
use Inertia\Response;

class DeviceMonitorController extends Controller
{
    public function __construct(private DeviceService $devices) {}

    public function __invoke(): Response
    {
        $this->authorize('viewAny', AttendanceDevice::class);

        $devices = AttendanceDevice::query()
            ->with('event:id,name,event_code')
            ->latest('last_seen_at')
            ->get();

        return Inertia::render('devices/index', [
            'devices' => $devices->map(fn (AttendanceDevice $device): array => $this->devices->toArray($device))->values(),
        ]);
    }
}
