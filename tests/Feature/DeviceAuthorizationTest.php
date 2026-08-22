<?php

use App\Enums\DeviceStatus;
use App\Models\AttendanceDevice;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view device monitoring', function () {
    $this->get(route('devices.index'))->assertRedirect(route('login'));
});

test('operators cannot view device monitoring', function () {
    $operator = User::factory()->operator()->create();

    $this->actingAs($operator)
        ->get(route('devices.index'))
        ->assertForbidden();
});

test('admins can view device monitoring', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->active()->create();
    AttendanceDevice::factory()->create([
        'name' => 'REG-01',
        'event_id' => $event->id,
        'last_seen_at' => now(),
        'pending_sync_count' => 0,
    ]);
    AttendanceDevice::factory()->offline()->create([
        'name' => 'REG-02',
        'event_id' => $event->id,
        'pending_sync_count' => 37,
    ]);

    $this->actingAs($admin)
        ->get(route('devices.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('devices/index')
            ->has('devices', 2)
        );
});

test('operators cannot revoke a device', function () {
    $operator = User::factory()->operator()->create();
    $device = AttendanceDevice::factory()->create();

    $this->actingAs($operator)
        ->post(route('devices.revoke', $device))
        ->assertForbidden();

    expect($device->fresh()->status)->toBe(DeviceStatus::Active);
});

test('admins can revoke a device', function () {
    $admin = User::factory()->admin()->create();
    $device = AttendanceDevice::factory()->create();

    $this->actingAs($admin)
        ->post(route('devices.revoke', $device))
        ->assertRedirect();

    expect($device->fresh()->status)->toBe(DeviceStatus::Revoked);
});

test('a revoked device cannot heartbeat or re-register', function () {
    $operator = User::factory()->operator()->create();
    $device = AttendanceDevice::factory()->revoked()->create();

    $this->actingAs($operator)
        ->postJson(route('devices.heartbeat'), [
            'device_uuid' => $device->device_uuid,
        ])
        ->assertForbidden();

    $this->actingAs($operator)
        ->postJson(route('devices.register'), [
            'device_uuid' => $device->device_uuid,
            'name' => 'REG-99',
        ])
        ->assertForbidden();
});

test('a revoked device cannot sync attendance', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $participant = Participant::factory()->create();
    $event->participants()->attach($participant);
    $device = AttendanceDevice::factory()->revoked()->create([
        'event_id' => $event->id,
    ]);

    $this->actingAs($operator)
        ->postJson(route('attendance.sync'), [
            'device_id' => $device->device_uuid,
            'records' => [[
                'local_id' => (string) Str::uuid(),
                'event_id' => $event->id,
                'participant_id' => $participant->id,
                'attendance_type' => 'check_in',
                'recorded_at' => now()->toIso8601String(),
            ]],
        ])
        ->assertForbidden();

    expect(AttendanceRecord::query()->count())->toBe(0);
});

test('operators can fetch a registered device', function () {
    $operator = User::factory()->operator()->create();
    $device = AttendanceDevice::factory()->create([
        'name' => 'REG-03',
        'last_seen_at' => now(),
    ]);

    $this->actingAs($operator)
        ->getJson(route('devices.show', $device))
        ->assertOk()
        ->assertJsonPath('name', 'REG-03')
        ->assertJsonPath('presence', 'online');
});
