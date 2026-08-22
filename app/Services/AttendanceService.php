<?php

namespace App\Services;

use App\Enums\AttendanceType;
use App\Exceptions\DuplicateAttendanceException;
use App\Models\AttendanceDevice;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttendanceService
{
    public function record(
        Event $event,
        Participant $participant,
        User $recordedBy,
        AttendanceType $type = AttendanceType::CheckIn,
        ?AttendanceSession $session = null,
        ?string $localId = null,
        ?DateTimeInterface $recordedAt = null,
        ?AttendanceDevice $device = null,
    ): AttendanceRecord {
        $session ??= $event->defaultSession();

        if ($session === null) {
            throw new \RuntimeException('This event has no attendance session.');
        }

        if ($session->event_id !== $event->id) {
            throw new \InvalidArgumentException('This session does not belong to the event.');
        }

        if (! $event->participants()->whereKey($participant->id)->exists()) {
            throw new \InvalidArgumentException('This participant is not registered for the event.');
        }

        try {
            return DB::transaction(function () use ($event, $participant, $recordedBy, $type, $session, $localId, $recordedAt, $device): AttendanceRecord {
                $existing = AttendanceRecord::query()
                    ->where('event_id', $event->id)
                    ->where('participant_id', $participant->id)
                    ->where('attendance_session_id', $session->id)
                    ->where('attendance_type', $type)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    throw new DuplicateAttendanceException(
                        'Attendance has already been recorded for this participant.',
                    );
                }

                return AttendanceRecord::query()->create([
                    'event_id' => $event->id,
                    'attendance_session_id' => $session->id,
                    'participant_id' => $participant->id,
                    'device_id' => $device?->id,
                    'local_id' => $localId ?? (string) Str::uuid(),
                    'attendance_type' => $type,
                    'recorded_at' => Carbon::parse($recordedAt ?? now())->utc(),
                    'synced_at' => now(),
                    'created_by' => $recordedBy->id,
                ]);
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                throw new DuplicateAttendanceException(
                    'Attendance has already been recorded for this participant.',
                );
            }

            throw $exception;
        }
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $code = (string) $exception->getCode();
        $message = $exception->getMessage();

        return $code === '23000'
            || str_contains($message, 'UNIQUE constraint failed')
            || str_contains($message, 'attendance_unique_per_session')
            || str_contains($message, 'attendance_records_local_id_unique');
    }
}
