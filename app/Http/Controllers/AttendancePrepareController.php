<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendancePrepareController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', AttendanceRecord::class);

        $event = Event::query()->findOrFail($request->integer('event_id'));

        $this->authorize('view', $event);

        return Inertia::render('attendance/prepare', [
            'event' => $event->only(['id', 'name', 'event_code', 'status']),
            'registeredCount' => $event->participants()->count(),
        ]);
    }
}
