<?php

namespace App\Services;

use App\Models\AttendanceSession;
use App\Models\Event;

class EventOfflinePackageService
{
    public function __construct(private RecognitionRosterService $roster) {}

    /**
     * @return array{
     *     event: array{id: int, name: string, event_code: string, status: string},
     *     sessions: list<array{id: int, name: string, type: string}>,
     *     participants: list<array{id: int, full_name: string, registration_number: string, photo_url: string|null, descriptor: list<float|int>}>,
     *     registered_count: int,
     *     enrolled_count: int,
     *     model_version: string,
     *     models_url: string
     * }
     */
    public function build(Event $event): array
    {
        $participants = $this->roster->enrolledRoster($event);

        return [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'event_code' => $event->event_code,
                'status' => $event->status->value,
            ],
            'sessions' => $event->sessions()
                ->orderBy('id')
                ->get(['id', 'name', 'type'])
                ->map(fn (AttendanceSession $session): array => [
                    'id' => $session->id,
                    'name' => $session->name,
                    'type' => $session->type->value,
                ])
                ->values()
                ->all(),
            'participants' => $participants->all(),
            'registered_count' => $this->roster->registeredCount($event),
            'enrolled_count' => $participants->count(),
            'model_version' => (string) config('attendance.model_version'),
            'models_url' => (string) config('attendance.models_url'),
        ];
    }
}
