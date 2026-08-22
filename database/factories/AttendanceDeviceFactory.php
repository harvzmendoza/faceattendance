<?php

namespace Database\Factories;

use App\Enums\DeviceStatus;
use App\Models\AttendanceDevice;
use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AttendanceDevice>
 */
class AttendanceDeviceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'device_uuid' => (string) Str::uuid(),
            'name' => 'REG-'.fake()->unique()->numerify('##'),
            'location' => fake()->optional()->streetName(),
            'event_id' => Event::factory(),
            'status' => DeviceStatus::Active,
            'last_seen_at' => now(),
            'last_sync_at' => now(),
            'pending_sync_count' => 0,
        ];
    }

    public function revoked(): static
    {
        return $this->state(fn (): array => [
            'status' => DeviceStatus::Revoked,
        ]);
    }

    public function offline(): static
    {
        return $this->state(fn (): array => [
            'status' => DeviceStatus::Active,
            'last_seen_at' => now()->subMinutes(10),
        ]);
    }
}
