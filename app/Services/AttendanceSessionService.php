<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Enums\SessionStatus;
use App\Enums\SessionType;
use App\Models\AttendanceSession;
use App\Models\Event;
use InvalidArgumentException;

class AttendanceSessionService
{
    public function __construct(private AuditService $audit) {}

    /**
     * @param  array{name: string, type: string, status: string, starts_at?: string|null, ends_at?: string|null}  $data
     */
    public function create(Event $event, array $data): AttendanceSession
    {
        $session = $event->sessions()->create([
            'name' => $data['name'],
            'type' => SessionType::from($data['type']),
            'status' => SessionStatus::from($data['status']),
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        $this->audit->record(
            AuditAction::SessionCreated,
            auditable: $session,
            eventId: $event->id,
            metadata: ['name' => $session->name],
        );

        return $session;
    }

    /**
     * @param  array{name: string, type: string, status: string, starts_at?: string|null, ends_at?: string|null}  $data
     */
    public function update(AttendanceSession $session, array $data): AttendanceSession
    {
        $session->update([
            'name' => $data['name'],
            'type' => SessionType::from($data['type']),
            'status' => SessionStatus::from($data['status']),
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        return $session->refresh();
    }

    public function delete(AttendanceSession $session): void
    {
        if ($session->event->sessions()->count() <= 1) {
            throw new InvalidArgumentException('An event must keep at least one attendance session.');
        }

        if ($session->attendanceRecords()->exists()) {
            throw new InvalidArgumentException('Cannot delete a session that has attendance records.');
        }

        $sessionId = $session->id;
        $eventId = $session->event_id;
        $name = $session->name;

        $session->delete();

        $this->audit->record(
            AuditAction::SessionDeleted,
            eventId: $eventId,
            metadata: ['name' => $name, 'session_id' => $sessionId],
        );
    }
}
