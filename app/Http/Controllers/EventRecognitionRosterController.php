<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\RecognitionRosterService;
use Illuminate\Http\JsonResponse;

class EventRecognitionRosterController extends Controller
{
    public function __construct(private RecognitionRosterService $roster) {}

    public function __invoke(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $participants = $this->roster->enrolledRoster($event);

        return response()->json([
            'participants' => $participants->all(),
            'present_count' => $this->roster->presentCount($event),
            'registered_count' => $this->roster->registeredCount($event),
        ]);
    }
}
