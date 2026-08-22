<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttendanceRequest;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\Participant;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendance) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AttendanceRecord::class);

        $events = Event::query()
            ->orderByDesc('starts_at')
            ->get(['id', 'name', 'event_code', 'status']);

        $event = $request->filled('event_id')
            ? Event::query()->findOrFail($request->integer('event_id'))
            : Event::query()->active()->orderByDesc('starts_at')->first() ?? $events->first();

        $search = $request->string('search')->toString();
        $participants = collect();
        $records = null;
        $sessions = collect();
        $session = null;

        if ($event instanceof Event) {
            $this->authorize('view', $event);
            $event->load(['sessions' => fn ($query) => $query->orderBy('id')]);
            $sessions = $event->sessions;
            $session = $request->filled('attendance_session_id')
                ? $sessions->firstWhere('id', $request->integer('attendance_session_id'))
                : $event->defaultSession();

            $participants = $event->participants()
                ->search($search)
                ->orderBy('last_name')
                ->limit(25)
                ->get();

            $recordsQuery = AttendanceRecord::query()
                ->where('event_id', $event->id)
                ->with(['participant:id,registration_number,first_name,middle_name,last_name,photo_path']);

            if ($session instanceof AttendanceSession) {
                $recordsQuery->where('attendance_session_id', $session->id);
            }

            $records = $recordsQuery
                ->latest('recorded_at')
                ->paginate(20)
                ->withQueryString();
        }

        return Inertia::render('attendance/index', [
            'events' => $events,
            'event' => $event,
            'sessions' => $sessions->map(fn (AttendanceSession $item): array => [
                'id' => $item->id,
                'name' => $item->name,
            ])->values(),
            'session' => $session instanceof AttendanceSession
                ? $session->only(['id', 'name'])
                : null,
            'participants' => $participants,
            'records' => $records,
            'filters' => [
                'event_id' => $event?->id,
                'attendance_session_id' => $session?->id,
                'search' => $search,
            ],
            'presentIds' => $event instanceof Event && $session instanceof AttendanceSession
                ? AttendanceRecord::query()
                    ->where('event_id', $event->id)
                    ->where('attendance_session_id', $session->id)
                    ->pluck('participant_id')
                    ->all()
                : [],
        ]);
    }

    public function store(StoreAttendanceRequest $request): RedirectResponse|JsonResponse
    {
        $event = Event::query()->findOrFail($request->integer('event_id'));
        $participant = Participant::query()->findOrFail($request->integer('participant_id'));
        $session = $request->filled('attendance_session_id')
            ? AttendanceSession::query()->findOrFail($request->integer('attendance_session_id'))
            : null;

        try {
            $record = $this->attendance->record($event, $participant, $request->user(), session: $session);
        } catch (InvalidArgumentException $exception) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $exception->getMessage(),
                ], 422);
            }

            return back()->with('error', $exception->getMessage());
        }

        if ($request->wantsJson()) {
            return response()->json([
                'ok' => true,
                'participant' => [
                    'id' => $participant->id,
                    'full_name' => $participant->full_name,
                    'registration_number' => $participant->registration_number,
                    'photo_url' => $participant->photo_url,
                ],
                'recorded_at' => $record->recorded_at?->toIso8601String(),
            ]);
        }

        return back()->with('success', $participant->full_name.' marked present.');
    }
}
