<?php

use App\Models\AttendanceDevice;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Support\Str;

test('guests cannot register a device', function () {
    $this->postJson(route('devices.register'), [
        'device_uuid' => (string) Str::uuid(),
    ])->assertUnauthorized();
});

test('operators can register a device for an event', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $uuid = (string) Str::uuid();

    $this->actingAs($operator)
        ->postJson(route('devices.register'), [
            'device_uuid' => $uuid,
            'name' => 'MCLE-REG-01',
            'location' => 'Lobby',
            'event_id' => $event->id,
        ])
        ->assertOk()
        ->assertJsonPath('name', 'MCLE-REG-01')
        ->assertJsonPath('location', 'Lobby')
        ->assertJsonPath('event_id', $event->id)
        ->assertJsonPath('status', 'active')
        ->assertJsonPath('presence', 'online')
        ->assertJsonPath('device_uuid', $uuid);

    expect(AttendanceDevice::query()->where('device_uuid', $uuid)->count())->toBe(1);
});

test('registering the same uuid updates last seen without duplicating the device', function () {
    $operator = User::factory()->operator()->create();
    $uuid = (string) Str::uuid();

    $this->actingAs($operator)
        ->postJson(route('devices.register'), [
            'device_uuid' => $uuid,
            'name' => 'REG-01',
        ])
        ->assertOk();

    $this->actingAs($operator)
        ->postJson(route('devices.register'), [
            'device_uuid' => $uuid,
        ])
        ->assertOk()
        ->assertJsonPath('name', 'REG-01');

    expect(AttendanceDevice::query()->count())->toBe(1);
});

test('heartbeat updates last seen and pending count', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $device = AttendanceDevice::factory()->create([
        'event_id' => $event->id,
        'last_seen_at' => now()->subMinutes(5),
        'pending_sync_count' => 0,
    ]);

    $this->actingAs($operator)
        ->postJson(route('devices.heartbeat'), [
            'device_uuid' => $device->device_uuid,
            'event_id' => $event->id,
            'pending_count' => 37,
        ])
        ->assertOk()
        ->assertJsonPath('pending_count', 37)
        ->assertJsonPath('presence', 'online');

    expect($device->fresh()->pending_sync_count)->toBe(37)
        ->and($device->fresh()->last_seen_at?->greaterThan(now()->subMinute()))->toBeTrue();
});

test('heartbeat fails for an unregistered device', function () {
    $operator = User::factory()->operator()->create();

    $this->actingAs($operator)
        ->postJson(route('devices.heartbeat'), [
            'device_uuid' => (string) Str::uuid(),
        ])
        ->assertNotFound();
});

test('syncing attendance stores the registered device id', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);
    $uuid = (string) Str::uuid();

    $this->actingAs($operator)
        ->postJson(route('devices.register'), [
            'device_uuid' => $uuid,
            'name' => 'REG-01',
            'event_id' => $event->id,
        ])
        ->assertOk();

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), [
            'device_id' => $uuid,
            'records' => [[
                'local_id' => (string) Str::uuid(),
                'event_id' => $event->id,
                'participant_id' => $participant->id,
                'attendance_type' => 'check_in',
                'recorded_at' => now()->toIso8601String(),
            ]],
        ])
        ->assertOk()
        ->assertJsonPath('synced', 1);

    $device = AttendanceDevice::query()->where('device_uuid', $uuid)->first();
    $record = AttendanceRecord::query()->first();

    expect($device)->not->toBeNull()
        ->and($record?->device_id)->toBe($device->id)
        ->and($device->fresh()->last_sync_at)->not->toBeNull();
});
