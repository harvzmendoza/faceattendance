<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
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

        return Inertia::render('attendance/scan', [
            'event' => $event->only(['id', 'name', 'event_code', 'status']),
            'presentCount' => AttendanceRecord::query()
                ->where('event_id', $event->id)
                ->distinct()
                ->count('participant_id'),
            'presentIds' => AttendanceRecord::query()
                ->where('event_id', $event->id)
                ->pluck('participant_id')
                ->all(),
            'registeredCount' => $event->participants()->count(),
        ]);
    }
}
