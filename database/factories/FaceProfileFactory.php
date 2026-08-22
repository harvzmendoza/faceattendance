<?php

namespace Database\Factories;

use App\Models\FaceProfile;
use App\Models\Participant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FaceProfile>
 */
class FaceProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'participant_id' => Participant::factory(),
            'model_version' => config('attendance.model_version'),
            'descriptor' => array_map(fn (): float => fake()->randomFloat(6, -1, 1), range(0, 127)),
            'quality_score' => fake()->randomFloat(4, 0.5, 1),
            'enrolled_at' => now(),
        ];
    }
}
