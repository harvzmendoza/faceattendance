<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttachEventParticipantRequest;
use App\Models\Event;
use App\Models\Participant;
use App\Services\EventService;
use Illuminate\Http\RedirectResponse;

class EventParticipantController extends Controller
{
    public function __construct(private EventService $events) {}

    public function store(AttachEventParticipantRequest $request, Event $event): RedirectResponse
    {
        $this->events->attachParticipant($event, $request->integer('participant_id'));

        return back()->with('success', 'Participant assigned to the event.');
    }

    public function destroy(Event $event, Participant $participant): RedirectResponse
    {
        $this->authorize('update', $event);

        $this->events->detachParticipant($event, $participant->id);

        return back()->with('success', 'Participant removed from the event.');
    }
}
