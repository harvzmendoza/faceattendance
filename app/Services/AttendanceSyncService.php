<?php

namespace App\Services;

use App\Enums\AttendanceType;
use App\Enums\AuditAction;
use App\Exceptions\DuplicateAttendanceException;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Support\Carbon;
use InvalidArgumentException;
use RuntimeException;
use ValueError;

class AttendanceSyncService
{
    public function __construct(
        private AttendanceService $attendance,
        private DeviceService $devices,
        private AuditService $audit,
    ) {}

    /**
     * @param  array{device_id: string, records: list<array<string, mixed>>}  $payload
     * @return array{success: true, synced: int, failed: int, duplicates: int, synced_local_ids: list<string>, failed_local_ids: list<string>}
     */
    public function sync(User $user, array $payload): array
    {
        $synced = 0;
        $failed = 0;
        $duplicates = 0;
        $syncedLocalIds = [];
        $failedLocalIds = [];
        $device = $this->devices->resolveForSync($payload['device_id']);

        foreach ($payload['records'] as $record) {
            $localId = (string) $record['local_id'];

            $existing = AttendanceRecord::query()->where('local_id', $localId)->first();

            if ($existing !== null) {
                $duplicates++;
                $syncedLocalIds[] = $localId;

                continue;
            }

            $event = Event::query()->find($record['event_id']);
            $participant = Participant::query()->find($record['participant_id']);

            if ($event === null || $participant === null) {
                $failed++;
                $failedLocalIds[] = $localId;

                continue;
            }

            try {
                $this->attendance->record(
                    $event,
                    $participant,
                    $user,
                    AttendanceType::from((string) $record['attendance_type']),
                    null,
                    $localId,
                    Carbon::parse((string) $record['recorded_at']),
                    $device,
                );
                $synced++;
                $syncedLocalIds[] = $localId;
            } catch (DuplicateAttendanceException) {
                $duplicates++;
                $syncedLocalIds[] = $localId;
            } catch (InvalidArgumentException|RuntimeException|ValueError) {
                $failed++;
                $failedLocalIds[] = $localId;
            }
        }

        $this->devices->markSynced($device);

        if ($payload['records'] !== []) {
            $this->audit->record(
                AuditAction::AttendanceSynced,
                $user,
                $device,
                [
                    'synced' => $synced,
                    'failed' => $failed,
                    'duplicates' => $duplicates,
                    'record_count' => count($payload['records']),
                ],
                deviceId: $device->id,
            );
        }

        return [
            'success' => true,
            'synced' => $synced,
            'failed' => $failed,
            'duplicates' => $duplicates,
            'synced_local_ids' => $syncedLocalIds,
            'failed_local_ids' => $failedLocalIds,
        ];
    }
}
