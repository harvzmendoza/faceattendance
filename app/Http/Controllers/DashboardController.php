<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Models\AttendanceDevice;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Services\DeviceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private DeviceService $devices) {}

    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', Event::class);

        $events = Event::query()
            ->orderByDesc('starts_at')
            ->get(['id', 'name', 'event_code', 'status']);

        $event = $this->resolveEvent($request, $events->first());

        $registeredCount = 0;
        $presentCount = 0;
        $recentAttendance = [];
        $sessionStats = [];

        if ($event instanceof Event) {
            $this->authorize('view', $event);

            $event->loadMissing('sessions');

            $registeredCount = $event->participants()->count();
            $presentCount = (int) AttendanceRecord::query()
                ->where('event_id', $event->id)
                ->selectRaw('count(distinct participant_id) as present_count')
                ->value('present_count');

            $recentAttendance = AttendanceRecord::query()
                ->where('event_id', $event->id)
                ->with(['participant:id,registration_number,first_name,middle_name,last_name,photo_path'])
                ->latest('recorded_at')
                ->limit(10)
                ->get();

            $presentBySession = AttendanceRecord::query()
                ->where('event_id', $event->id)
                ->selectRaw('attendance_session_id, count(distinct participant_id) as present_count')
                ->groupBy('attendance_session_id')
                ->pluck('present_count', 'attendance_session_id');

            $sessionStats = $event->sessions
                ->map(fn ($session): array => [
                    'id' => $session->id,
                    'name' => $session->name,
                    'present' => (int) ($presentBySession[$session->id] ?? 0),
                    'registered' => $registeredCount,
                ])
                ->values();
        }

        $absentCount = max($registeredCount - $presentCount, 0);
        $percentage = $registeredCount > 0
            ? round(($presentCount / $registeredCount) * 100, 1)
            : 0;

        $trackedDevices = AttendanceDevice::query()
            ->notRevoked()
            ->with('event:id,name')
            ->orderBy('name')
            ->get();

        $onlineSince = $this->devices->onlineSince();
        $onlineDevices = $trackedDevices
            ->filter(fn (AttendanceDevice $device): bool => $device->last_seen_at !== null && $device->last_seen_at->gte($onlineSince));

        return Inertia::render('dashboard', [
            'events' => $events,
            'event' => $event,
            'stats' => [
                'participants' => $registeredCount,
                'present' => $presentCount,
                'absent' => $absentCount,
                'percentage' => $percentage,
                'online_devices' => $onlineDevices->count(),
                'offline_devices' => $trackedDevices->count() - $onlineDevices->count(),
                'pending_sync' => (int) $trackedDevices->sum('pending_sync_count'),
            ],
            'devices' => $trackedDevices
                ->map(fn (AttendanceDevice $device): array => [
                    'id' => $device->id,
                    'name' => $device->name,
                    'presence' => $device->presence(),
                ])
                ->values(),
            'sessionStats' => $sessionStats,
            'recentAttendance' => $recentAttendance,
        ]);
    }

    private function resolveEvent(Request $request, ?Event $fallback): ?Event
    {
        if ($request->filled('event_id')) {
            return Event::query()->findOrFail($request->integer('event_id'));
        }

        return Event::query()
            ->where('status', EventStatus::Active)
            ->orderByDesc('starts_at')
            ->first() ?? $fallback;
    }
}
