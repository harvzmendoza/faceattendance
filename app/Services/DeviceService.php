<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Enums\DeviceStatus;
use App\Models\AttendanceDevice;
use App\Models\Event;
use Carbon\CarbonInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DeviceService
{
    public function __construct(private AuditService $audit) {}

    /**
     * @param  array{device_uuid: string, name?: string|null, location?: string|null, event_id?: int|null}  $payload
     */
    public function register(array $payload): AttendanceDevice
    {
        $existing = AttendanceDevice::query()
            ->where('device_uuid', $payload['device_uuid'])
            ->first();

        if ($existing?->status === DeviceStatus::Revoked) {
            throw new AccessDeniedHttpException('This device has been revoked.');
        }

        $eventId = $payload['event_id'] ?? $existing?->event_id;

        if ($eventId !== null) {
            Event::query()->findOrFail($eventId);
        }

        $device = AttendanceDevice::query()->updateOrCreate(
            ['device_uuid' => $payload['device_uuid']],
            [
                'name' => filled($payload['name'] ?? null)
                    ? (string) $payload['name']
                    : ($existing?->name ?? $this->defaultName($payload['device_uuid'])),
                'location' => array_key_exists('location', $payload)
                    ? $payload['location']
                    : $existing?->location,
                'event_id' => $eventId,
                'status' => DeviceStatus::Active,
                'last_seen_at' => now(),
            ],
        );

        if ($device->wasRecentlyCreated) {
            $this->audit->record(
                AuditAction::DeviceRegistered,
                auditable: $device,
                eventId: $device->event_id,
                deviceId: $device->id,
                metadata: ['name' => $device->name],
            );
        }

        return $device->fresh(['event']) ?? $device;
    }

    /**
     * @param  array{device_uuid: string, event_id?: int|null, pending_count?: int}  $payload
     */
    public function heartbeat(array $payload): AttendanceDevice
    {
        $device = $this->requireActive($payload['device_uuid']);

        if (array_key_exists('event_id', $payload) && $payload['event_id'] !== null) {
            Event::query()->findOrFail($payload['event_id']);
            $device->event_id = $payload['event_id'];
        }

        if (array_key_exists('pending_count', $payload)) {
            $device->pending_sync_count = (int) $payload['pending_count'];
        }

        $device->last_seen_at = now();
        $device->save();

        return $device->fresh(['event']) ?? $device;
    }

    public function revoke(AttendanceDevice $device): AttendanceDevice
    {
        $device->status = DeviceStatus::Revoked;
        $device->save();

        $this->audit->record(
            AuditAction::DeviceRevoked,
            auditable: $device,
            eventId: $device->event_id,
            deviceId: $device->id,
            metadata: ['name' => $device->name],
        );

        return $device->fresh(['event']) ?? $device;
    }

    public function requireActive(string $deviceUuid): AttendanceDevice
    {
        $device = AttendanceDevice::query()
            ->where('device_uuid', $deviceUuid)
            ->first();

        if ($device === null) {
            throw new NotFoundHttpException('This device is not registered.');
        }

        $this->assertNotRevoked($device);

        return $device;
    }

    public function resolveForSync(string $deviceUuid): AttendanceDevice
    {
        $device = AttendanceDevice::query()
            ->where('device_uuid', $deviceUuid)
            ->first();

        if ($device === null) {
            return $this->register(['device_uuid' => $deviceUuid]);
        }

        $this->assertNotRevoked($device);

        $device->last_seen_at = now();
        $device->save();

        return $device;
    }

    public function markSynced(AttendanceDevice $device): void
    {
        $device->forceFill([
            'last_seen_at' => now(),
            'last_sync_at' => now(),
        ])->save();
    }

    public function assertNotRevoked(AttendanceDevice $device): void
    {
        if ($device->status === DeviceStatus::Revoked) {
            throw new AccessDeniedHttpException('This device has been revoked.');
        }
    }

    public function onlineSince(): CarbonInterface
    {
        return now()->subSeconds((int) config('attendance.device_online_seconds'));
    }

    /**
     * @return array{
     *     id: int,
     *     device_uuid: string,
     *     name: string,
     *     location: string|null,
     *     event_id: int|null,
     *     event_name: string|null,
     *     status: string,
     *     presence: string,
     *     last_seen_at: string|null,
     *     last_sync_at: string|null,
     *     pending_count: int
     * }
     */
    public function toArray(AttendanceDevice $device): array
    {
        $device->loadMissing('event');

        return [
            'id' => $device->id,
            'device_uuid' => $device->device_uuid,
            'name' => $device->name,
            'location' => $device->location,
            'event_id' => $device->event_id,
            'event_name' => $device->event?->name,
            'status' => $device->status->value,
            'presence' => $device->presence(),
            'last_seen_at' => $device->last_seen_at?->toIso8601String(),
            'last_sync_at' => $device->last_sync_at?->toIso8601String(),
            'pending_count' => $device->pending_sync_count,
        ];
    }

    private function defaultName(string $deviceUuid): string
    {
        return 'REG-'.strtoupper(substr($deviceUuid, 0, 8));
    }
}
