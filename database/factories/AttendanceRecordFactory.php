<?php

namespace Database\Factories;

use App\Enums\AttendanceType;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

/**
 * @extends Factory<AttendanceRecord>
 */
class AttendanceRecordFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'attendance_session_id' => function (array $attributes): int {
                $eventId = $attributes['event_id'] ?? null;

                if (! is_numeric($eventId)) {
                    throw new InvalidArgumentException('An event is required to create an attendance record.');
                }

                $session = Event::query()->findOrFail((int) $eventId)->defaultSession();

                if (! $session instanceof AttendanceSession) {
                    throw new RuntimeException('The event has no attendance session.');
                }

                return $session->id;
            },
            'participant_id' => Participant::factory(),
            'device_id' => null,
            'local_id' => (string) Str::uuid(),
            'attendance_type' => AttendanceType::CheckIn,
            'recorded_at' => now(),
            'synced_at' => now(),
            'created_by' => User::factory(),
        ];
    }
}
