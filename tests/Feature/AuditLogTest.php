<?php

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Support\Str;

test('admins can view audit logs', function () {
    $admin = User::factory()->admin()->create();
    AuditLog::factory()->create([
        'user_id' => $admin->id,
        'action' => AuditAction::Login,
    ]);

    $this->actingAs($admin)
        ->get(route('audit-logs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('audit-logs/index')
            ->has('logs.data', 1));
});

test('operators cannot view audit logs', function () {
    $operator = User::factory()->operator()->create();

    $this->actingAs($operator)
        ->get(route('audit-logs.index'))
        ->assertForbidden();
});

test('successful login is written to the audit log', function () {
    $user = User::factory()->admin()->create();

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect();

    expect(AuditLog::query()->where('action', AuditAction::Login)->count())->toBe(1);
});

test('attendance sync writes a single audit log for the batch', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), [
            'device_id' => (string) Str::uuid(),
            'records' => [[
                'local_id' => (string) Str::uuid(),
                'event_id' => $event->id,
                'participant_id' => $participant->id,
                'attendance_type' => 'check_in',
                'recorded_at' => now()->toIso8601String(),
            ]],
        ])
        ->assertOk();

    expect(AuditLog::query()->where('action', AuditAction::AttendanceSynced)->count())->toBe(1);
});
