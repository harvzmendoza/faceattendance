<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\AttendanceReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventAttendanceController extends Controller
{
    public function __construct(private AttendanceReportService $reports) {}

    public function __invoke(Request $request, Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $rows = $this->reports->rows([
            'event_id' => $event->id,
            'session_id' => $request->integer('session_id') ?: null,
            'date' => $request->string('date')->toString() ?: null,
            'participant' => $request->string('participant')->toString(),
            'organization' => $request->string('organization')->toString(),
            'attendance_status' => $request->string('attendance_status')->toString() ?: 'all',
        ]);

        return response()->json([
            'event' => $event->only(['id', 'name', 'event_code', 'status']),
            'participants' => $rows->values(),
            'present_count' => $rows->where('status', 'Present')->count(),
            'registered_count' => $rows->count(),
        ]);
    }
}
