<?php

namespace Database\Seeders;

use App\Enums\EventStatus;
use App\Enums\UserRole;
use App\Models\Participant;
use App\Models\User;
use App\Services\EventService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => UserRole::Admin,
        ]);

        User::query()->create([
            'name' => 'Attendance Operator',
            'email' => 'operator@example.com',
            'password' => 'password',
            'role' => UserRole::AttendanceOperator,
        ]);

        $event = app(EventService::class)->create([
            'name' => 'MCLE August 2026',
            'event_code' => 'MCLE-2026-08',
            'description' => 'Mandatory Continuing Legal Education — August 2026.',
            'venue' => 'Manila',
            'starts_at' => now()->setTime(8, 0),
            'ends_at' => now()->setTime(17, 0),
            'status' => EventStatus::Active,
        ]);

        $participants = [
            ['registration_number' => '2026-00123', 'first_name' => 'Juan', 'middle_name' => 'Dela', 'last_name' => 'Cruz', 'organization' => 'IBP Manila'],
            ['registration_number' => '2026-00124', 'first_name' => 'Maria', 'middle_name' => null, 'last_name' => 'Santos', 'organization' => 'IBP Makati'],
            ['registration_number' => '2026-00125', 'first_name' => 'Pedro', 'middle_name' => null, 'last_name' => 'Reyes', 'organization' => 'IBP Quezon City'],
        ];

        foreach ($participants as $attributes) {
            $participant = Participant::query()->create([
                ...$attributes,
                'email' => Str::lower($attributes['first_name']).'@example.com',
            ]);

            $event->participants()->attach($participant);
        }

        Participant::factory()->count(12)->create()->each(function (Participant $participant) use ($event): void {
            $event->participants()->attach($participant);
        });
    }
}
