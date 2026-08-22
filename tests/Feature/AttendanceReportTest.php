<?php

use App\Enums\AttendanceType;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;

test('admins can view attendance reports', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->active()->create();
    $present = Participant::factory()->create(['organization' => 'IBP Manila']);
    $absent = Participant::factory()->create(['organization' => 'IBP Cebu']);
    $event->participants()->attach([$present->id, $absent->id]);

    AttendanceRecord::factory()->create([
        'event_id' => $event->id,
        'attendance_session_id' => $event->defaultSession()->id,
        'participant_id' => $present->id,
        'attendance_type' => AttendanceType::CheckIn,
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('reports.index', ['event_id' => $event->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/index')
            ->where('summary.present', 1)
            ->where('summary.absent', 1)
            ->has('rows', 2));
});

test('operators cannot view or export reports', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();

    $this->actingAs($operator)
        ->get(route('reports.index', ['event_id' => $event->id]))
        ->assertForbidden();

    $this->actingAs($operator)
        ->get(route('reports.export', ['event_id' => $event->id, 'format' => 'csv']))
        ->assertForbidden();
});

test('admins can export attendance as csv excel and pdf', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create([
        'first_name' => 'Juan',
        'middle_name' => null,
        'last_name' => 'Dela Cruz',
        'registration_number' => 'REG-100',
    ]);
    $event->participants()->attach($participant);

    AttendanceRecord::factory()->create([
        'event_id' => $event->id,
        'attendance_session_id' => $event->defaultSession()->id,
        'participant_id' => $participant->id,
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('reports.export', ['event_id' => $event->id, 'format' => 'csv']))
        ->assertOk()
        ->assertSee('REG-100', false)
        ->assertSee('Juan Dela Cruz', false);

    $this->actingAs($admin)
        ->get(route('reports.export', ['event_id' => $event->id, 'format' => 'xls']))
        ->assertOk()
        ->assertSee('REG-100', false);

    $this->actingAs($admin)
        ->get(route('reports.export', ['event_id' => $event->id, 'format' => 'pdf']))
        ->assertOk()
        ->assertSee('%PDF', false);
});

test('operators can view event attendance status over the api', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    $this->actingAs($operator)
        ->getJson(route('events.attendance', $event))
        ->assertOk()
        ->assertJsonPath('registered_count', 1)
        ->assertJsonPath('present_count', 0)
        ->assertJsonPath('participants.0.status', 'Absent');
});
