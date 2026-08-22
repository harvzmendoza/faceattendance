<?php

use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;

test('operators can record attendance for a registered participant', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    $this->actingAs($operator)
        ->post(route('attendance.store'), [
            'event_id' => $event->id,
            'participant_id' => $participant->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(AttendanceRecord::query()->count())->toBe(1);
});

test('duplicate attendance for the same session is rejected', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    $payload = [
        'event_id' => $event->id,
        'participant_id' => $participant->id,
    ];

    $this->actingAs($operator)->post(route('attendance.store'), $payload)->assertSessionHas('success');
    $this->actingAs($operator)->post(route('attendance.store'), $payload)->assertSessionHas('error');

    expect(AttendanceRecord::query()->count())->toBe(1);
});

test('attendance cannot be recorded for a participant who is not registered', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();

    $this->actingAs($operator)
        ->post(route('attendance.store'), [
            'event_id' => $event->id,
            'participant_id' => $participant->id,
        ])
        ->assertSessionHas('error');

    expect(AttendanceRecord::query()->count())->toBe(0);
});
