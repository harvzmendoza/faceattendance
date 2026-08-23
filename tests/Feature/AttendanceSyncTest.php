<?php

use App\Enums\AttendanceType;
use App\Enums\SessionType;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

test('guests cannot sync attendance', function () {
    $this->postJson(route('attendance.sync'), [
        'device_id' => (string) Str::uuid(),
        'records' => [],
    ])->assertUnauthorized();
});

test('operators can sync attendance with a client local id and recorded at', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);
    $localId = (string) Str::uuid();
    $recordedAt = '2026-08-21T08:31:02+08:00';

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), [
            'device_id' => (string) Str::uuid(),
            'records' => [[
                'local_id' => $localId,
                'event_id' => $event->id,
                'participant_id' => $participant->id,
                'attendance_type' => 'check_in',
                'recorded_at' => $recordedAt,
            ]],
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('synced', 1)
        ->assertJsonPath('failed', 0)
        ->assertJsonPath('duplicates', 0);

    $record = AttendanceRecord::query()->first();

    expect($record)->not->toBeNull()
        ->and($record->local_id)->toBe($localId)
        ->and($record->participant_id)->toBe($participant->id)
        ->and($record->recorded_at->utc()->toDateTimeString())->toBe(
            Carbon::parse($recordedAt)->utc()->toDateTimeString(),
        );
});

test('syncing the same local id is idempotent', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);
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

    $this->actingAs($operator)->postJson(route('attendance.sync'), $payload)->assertOk();

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), $payload)
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('synced', 0)
        ->assertJsonPath('duplicates', 1);

    expect(AttendanceRecord::query()->count())->toBe(1);
});

test('a second local id for the same participant is counted as a duplicate', function () {
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
        ->assertOk()
        ->assertJsonPath('duplicates', 1)
        ->assertJsonPath('synced', 0);

    expect(AttendanceRecord::query()->count())->toBe(1);
});

test('unregistered participants increment the failed count', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();

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
        ->assertOk()
        ->assertJsonPath('failed', 1)
        ->assertJsonPath('synced', 0);

    expect(AttendanceRecord::query()->count())->toBe(0);
});

test('syncing with a check-out session records against that session', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);
    $checkOut = AttendanceSession::factory()->create([
        'event_id' => $event->id,
        'name' => 'Check-out',
        'type' => SessionType::CheckOut,
    ]);

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), [
            'device_id' => (string) Str::uuid(),
            'records' => [[
                'local_id' => (string) Str::uuid(),
                'event_id' => $event->id,
                'participant_id' => $participant->id,
                'attendance_session_id' => $checkOut->id,
                'attendance_type' => 'check_in',
                'recorded_at' => now()->toIso8601String(),
            ]],
        ])
        ->assertOk()
        ->assertJsonPath('synced', 1);

    $record = AttendanceRecord::query()->first();

    expect($record)->not->toBeNull()
        ->and($record->attendance_session_id)->toBe($checkOut->id)
        ->and($record->attendance_type)->toBe(AttendanceType::CheckOut);
});
