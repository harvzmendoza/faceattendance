<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(
        AuditAction $action,
        ?User $user = null,
        ?Model $auditable = null,
        array $metadata = [],
        ?int $eventId = null,
        ?int $deviceId = null,
    ): AuditLog {
        $request = request();

        return AuditLog::query()->create([
            'user_id' => $user?->id ?? $request?->user()?->id,
            'event_id' => $eventId,
            'device_id' => $deviceId,
            'action' => $action,
            'auditable_type' => $auditable?->getMorphClass(),
            'auditable_id' => $auditable?->getKey(),
            'metadata' => $metadata === [] ? null : $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);
    }
}
