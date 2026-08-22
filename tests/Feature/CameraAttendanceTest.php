<?php

use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;

test('camera attendance json store records a participant once', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    $payload = [
        'event_id' => $event->id,
        'participant_id' => $participant->id,
    ];

    $this->actingAs($operator)
        ->postJson(route('attendance.store'), $payload)
        ->assertOk()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('participant.id', $participant->id)
        ->assertJsonPath('participant.full_name', $participant->full_name)
        ->assertJsonMissingPath('participant.descriptor');

    $this->actingAs($operator)
        ->postJson(route('attendance.store'), $payload)
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Attendance has already been recorded for this participant.');

    expect(AttendanceRecord::query()->count())->toBe(1);
});

test('operators can open the camera attendance page', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();

    $this->actingAs($operator)
        ->get(route('attendance.scan', ['event_id' => $event->id]))
        ->assertOk();
});
