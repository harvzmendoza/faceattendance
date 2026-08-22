<?php

use App\Models\Event;
use App\Models\Participant;
use App\Models\User;

test('operators cannot manage users', function () {
    $operator = User::factory()->operator()->create();

    $this->actingAs($operator)->get(route('users.index'))->assertForbidden();
    $this->actingAs($operator)->get(route('users.create'))->assertForbidden();
});

test('operators cannot create events', function () {
    $operator = User::factory()->operator()->create();

    $this->actingAs($operator)->get(route('events.create'))->assertForbidden();

    $this->actingAs($operator)->post(route('events.store'), [
        'name' => 'Unauthorized Event',
        'event_code' => 'NOPE-1',
        'starts_at' => now()->toDateTimeString(),
        'ends_at' => now()->addHour()->toDateTimeString(),
        'status' => 'draft',
    ])->assertForbidden();
});

test('operators cannot create participants', function () {
    $operator = User::factory()->operator()->create();

    $this->actingAs($operator)->get(route('participants.create'))->assertForbidden();
});

test('operators can view events and record attendance', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    $this->actingAs($operator)->get(route('events.index'))->assertOk();
    $this->actingAs($operator)->get(route('attendance.index'))->assertOk();
    $this->actingAs($operator)->post(route('attendance.store'), [
        'event_id' => $event->id,
        'participant_id' => $participant->id,
    ])->assertRedirect();
});

test('admins can manage users', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get(route('users.index'))->assertOk();
});
