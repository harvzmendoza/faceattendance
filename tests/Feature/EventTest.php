<?php

use App\Enums\EventStatus;
use App\Enums\SessionType;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;

test('admins can create an event with a default check-in session', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('events.store'), [
            'name' => 'MCLE August 2026',
            'event_code' => 'MCLE-2026-08',
            'description' => 'Mandatory Continuing Legal Education',
            'venue' => 'Manila',
            'starts_at' => now()->addDay()->toDateTimeString(),
            'ends_at' => now()->addDay()->addHours(8)->toDateTimeString(),
            'status' => EventStatus::Active->value,
        ])
        ->assertRedirect();

    $event = Event::query()->where('event_code', 'MCLE-2026-08')->with('sessions')->first();

    expect($event)->not->toBeNull()
        ->and($event->sessions)->toHaveCount(1)
        ->and($event->sessions->first()->type)->toBe(SessionType::CheckIn)
        ->and($event->sessions->first()->name)->toBe('Check-in');
});

test('admins can update an event', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->create();

    $this->actingAs($admin)
        ->put(route('events.update', $event), [
            'name' => 'Updated Event',
            'event_code' => $event->event_code,
            'description' => $event->description,
            'venue' => 'Cebu',
            'starts_at' => $event->starts_at->toDateTimeString(),
            'ends_at' => $event->ends_at->toDateTimeString(),
            'status' => EventStatus::Active->value,
        ])
        ->assertRedirect(route('events.show', $event));

    expect($event->refresh()->name)->toBe('Updated Event')
        ->and($event->venue)->toBe('Cebu');
});

test('an event with attendance records cannot be deleted', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    AttendanceRecord::factory()->create([
        'event_id' => $event->id,
        'attendance_session_id' => $event->defaultSession()->id,
        'participant_id' => $participant->id,
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('events.destroy', $event))
        ->assertRedirect();

    $this->assertModelExists($event->refresh());
});
