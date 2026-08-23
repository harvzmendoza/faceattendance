<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceScanController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', AttendanceRecord::class);

        $event = Event::query()->findOrFail($request->integer('event_id'));

        $this->authorize('view', $event);

        $event->load(['sessions' => fn ($query) => $query->orderBy('id')]);
        $sessions = $event->sessions;
        $session = $request->filled('attendance_session_id')
            ? $sessions->firstWhere('id', $request->integer('attendance_session_id'))
            : $event->defaultSession();

        $presentBySession = AttendanceRecord::query()
            ->where('event_id', $event->id)
            ->get(['attendance_session_id', 'participant_id'])
            ->groupBy('attendance_session_id')
            ->map(fn ($rows) => $rows->pluck('participant_id')->unique()->values()->all());

        $presentIds = $session instanceof AttendanceSession
            ? $presentBySession->get($session->id, [])
            : [];

        return Inertia::render('attendance/scan', [
            'event' => $event->only(['id', 'name', 'event_code', 'status']),
            'sessions' => $sessions->map(fn (AttendanceSession $item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'type' => $item->type->value,
                'present_ids' => $presentBySession->get($item->id, []),
            ])->values(),
            'session' => $session instanceof AttendanceSession
                ? [
                    'id' => $session->id,
                    'name' => $session->name,
                    'type' => $session->type->value,
                ]
                : null,
            'presentCount' => count($presentIds),
            'presentIds' => $presentIds,
            'registeredCount' => $event->participants()->count(),
        ]);
    }
}
