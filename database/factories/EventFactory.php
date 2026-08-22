<?php

namespace Database\Factories;

use App\Enums\EventStatus;
use App\Enums\SessionStatus;
use App\Enums\SessionType;
use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+2 months');

        return [
            'name' => fake()->sentence(3),
            'event_code' => Str::upper(fake()->unique()->bothify('EVT-###')),
            'description' => fake()->optional()->paragraph(),
            'venue' => fake()->optional()->city(),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+8 hours'),
            'status' => EventStatus::Draft,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Event $event): void {
            if ($event->sessions()->doesntExist()) {
                $event->sessions()->create([
                    'name' => config('attendance.default_session_name'),
                    'type' => SessionType::CheckIn,
                    'status' => SessionStatus::Active,
                    'starts_at' => $event->starts_at,
                    'ends_at' => $event->ends_at,
                ]);
            }
        });
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Active,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Completed,
        ]);
    }
}
