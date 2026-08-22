<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttendanceSessionRequest;
use App\Http\Requests\UpdateAttendanceSessionRequest;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Services\AttendanceSessionService;
use Illuminate\Http\RedirectResponse;
use InvalidArgumentException;

class AttendanceSessionController extends Controller
{
    public function __construct(private AttendanceSessionService $sessions) {}

    public function store(StoreAttendanceSessionRequest $request, Event $event): RedirectResponse
    {
        $this->sessions->create($event, $request->validated());

        return back()->with('success', 'Session created.');
    }

    public function update(UpdateAttendanceSessionRequest $request, Event $event, AttendanceSession $session): RedirectResponse
    {
        abort_unless($session->event_id === $event->id, 404);

        $this->sessions->update($session, $request->validated());

        return back()->with('success', 'Session updated.');
    }

    public function destroy(Event $event, AttendanceSession $session): RedirectResponse
    {
        abort_unless($session->event_id === $event->id, 404);

        $this->authorize('delete', $session);

        try {
            $this->sessions->delete($session);
        } catch (InvalidArgumentException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Session deleted.');
    }
}
