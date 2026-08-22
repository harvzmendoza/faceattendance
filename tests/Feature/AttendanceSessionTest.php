<?php

use App\Enums\SessionStatus;
use App\Enums\SessionType;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;

test('admins can create additional attendance sessions', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->active()->create();

    $this->actingAs($admin)
        ->post(route('events.sessions.store', $event), [
            'name' => 'Morning Break',
            'type' => SessionType::Break->value,
            'status' => SessionStatus::Active->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($event->sessions()->count())->toBe(2)
        ->and($event->sessions()->where('name', 'Morning Break')->exists())->toBeTrue();
});

test('operators cannot create attendance sessions', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();

    $this->actingAs($operator)
        ->post(route('events.sessions.store', $event), [
            'name' => 'Lunch',
            'type' => SessionType::Break->value,
            'status' => SessionStatus::Active->value,
        ])
        ->assertForbidden();
});

test('the last session cannot be deleted', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->active()->create();
    $session = $event->defaultSession();

    $this->actingAs($admin)
        ->delete(route('events.sessions.destroy', [$event, $session]))
        ->assertRedirect()
        ->assertSessionHas('error');

    $this->assertDatabaseHas('attendance_sessions', ['id' => $session->id]);
});

test('a session with attendance records cannot be deleted', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->active()->create();
    AttendanceSession::factory()->create([
        'event_id' => $event->id,
        'name' => 'Lunch',
    ]);
    $session = $event->defaultSession();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    AttendanceRecord::factory()->create([
        'event_id' => $event->id,
        'attendance_session_id' => $session->id,
        'participant_id' => $participant->id,
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('events.sessions.destroy', [$event, $session]))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('attendance_sessions', ['id' => $session->id]);
});

test('the same participant can attend multiple sessions', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $checkIn = $event->defaultSession();
    $lunch = AttendanceSession::factory()->create([
        'event_id' => $event->id,
        'name' => 'Lunch',
        'type' => SessionType::Break,
    ]);
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    $this->actingAs($operator)
        ->post(route('attendance.store'), [
            'event_id' => $event->id,
            'participant_id' => $participant->id,
            'attendance_session_id' => $checkIn->id,
        ])
        ->assertSessionHas('success');

    $this->actingAs($operator)
        ->post(route('attendance.store'), [
            'event_id' => $event->id,
            'participant_id' => $participant->id,
            'attendance_session_id' => $lunch->id,
        ])
        ->assertSessionHas('success');

    expect(AttendanceRecord::query()->count())->toBe(2);
});
