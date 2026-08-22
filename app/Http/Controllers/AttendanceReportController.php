<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Services\AttendanceReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceReportController extends Controller
{
    public function __construct(private AttendanceReportService $reports) {}

    public function __invoke(Request $request): Response
    {
        $this->authorize('viewReports', AttendanceRecord::class);

        $filters = [
            'event_id' => $request->integer('event_id') ?: null,
            'session_id' => $request->integer('session_id') ?: null,
            'date' => $request->string('date')->toString() ?: null,
            'participant' => $request->string('participant')->toString(),
            'organization' => $request->string('organization')->toString(),
            'attendance_status' => $request->string('attendance_status')->toString() ?: 'all',
        ];

        $events = Event::query()
            ->orderByDesc('starts_at')
            ->get(['id', 'name', 'event_code']);

        $sessions = $filters['event_id']
            ? AttendanceSession::query()
                ->where('event_id', $filters['event_id'])
                ->orderBy('id')
                ->get(['id', 'name', 'type', 'status'])
            : collect();

        $rows = $this->reports->rows($filters);
        $present = $rows->where('status', 'Present')->count();

        return Inertia::render('reports/index', [
            'events' => $events,
            'sessions' => $sessions,
            'rows' => $rows->values(),
            'filters' => $filters,
            'summary' => [
                'total' => $rows->count(),
                'present' => $present,
                'absent' => $rows->count() - $present,
            ],
        ]);
    }
}
