<?php

namespace App\Services;

use App\Enums\SessionStatus;
use App\Enums\SessionType;
use App\Models\Event;
use Illuminate\Support\Facades\DB;

class EventService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Event
    {
        return DB::transaction(function () use ($data): Event {
            $event = Event::query()->create($data);

            $event->sessions()->create([
                'name' => config('attendance.default_session_name'),
                'type' => SessionType::CheckIn,
                'status' => SessionStatus::Active,
                'starts_at' => $event->starts_at,
                'ends_at' => $event->ends_at,
            ]);

            return $event;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Event $event, array $data): Event
    {
        $event->update($data);

        return $event->refresh();
    }

    public function delete(Event $event): void
    {
        if ($event->attendanceRecords()->exists()) {
            throw new \InvalidArgumentException('Cannot delete an event that has attendance records.');
        }

        $event->delete();
    }

    public function attachParticipant(Event $event, int $participantId): void
    {
        $event->participants()->syncWithoutDetaching([$participantId]);
    }

    public function detachParticipant(Event $event, int $participantId): void
    {
        $event->participants()->detach($participantId);
    }
}
