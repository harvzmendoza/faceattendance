<?php

use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

test('attendance sync is rate limited per user', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    RateLimiter::for('attendance-sync', function (Request $request) {
        return Limit::perMinute(1)->by((string) $request->user()?->id);
    });

    $payload = [
        'device_id' => (string) Str::uuid(),
        'records' => [[
            'local_id' => (string) Str::uuid(),
            'event_id' => $event->id,
            'participant_id' => $participant->id,
            'attendance_type' => 'check_in',
            'recorded_at' => now()->toIso8601String(),
        ]],
    ];

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), $payload)
        ->assertOk();

    $payload['records'][0]['local_id'] = (string) Str::uuid();

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), $payload)
        ->assertTooManyRequests();
});
