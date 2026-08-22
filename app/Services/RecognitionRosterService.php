<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\FaceProfile;
use App\Models\Participant;
use Illuminate\Support\Collection;

class RecognitionRosterService
{
    /**
     * @return Collection<int, array{id: int, full_name: string, registration_number: string, photo_url: string|null, descriptor: list<float|int>}>
     */
    public function enrolledRoster(Event $event): Collection
    {
        $modelVersion = (string) config('attendance.model_version');

        $participants = $event->participants()
            ->whereHas('faceProfiles', function ($query) use ($modelVersion): void {
                $query->where('model_version', $modelVersion);
            })
            ->with(['faceProfiles' => function ($query) use ($modelVersion): void {
                $query->where('model_version', $modelVersion);
            }])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return $participants->map(function (Participant $participant) use ($modelVersion): array {
            $profile = $participant->faceProfiles
                ->first(fn (FaceProfile $faceProfile): bool => $faceProfile->model_version === $modelVersion);

            return [
                'id' => $participant->id,
                'full_name' => $participant->full_name,
                'registration_number' => $participant->registration_number,
                'photo_url' => $participant->photo_url,
                'descriptor' => $profile?->descriptor ?? [],
            ];
        })->values();
    }

    public function presentCount(Event $event): int
    {
        return AttendanceRecord::query()
            ->where('event_id', $event->id)
            ->distinct()
            ->count('participant_id');
    }

    public function registeredCount(Event $event): int
    {
        return $event->participants()->count();
    }
}
