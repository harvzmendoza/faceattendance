<?php

namespace Database\Factories;

use App\Enums\SessionStatus;
use App\Enums\SessionType;
use App\Models\AttendanceSession;
use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceSession>
 */
class AttendanceSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'name' => fake()->unique()->words(2, true),
            'type' => SessionType::CheckIn,
            'starts_at' => now(),
            'ends_at' => now()->addHours(4),
            'status' => SessionStatus::Active,
        ];
    }
}
