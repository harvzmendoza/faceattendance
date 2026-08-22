<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', AuditLog::class);

        return Inertia::render('audit-logs/index', [
            'logs' => AuditLog::query()
                ->with(['user:id,name,email'])
                ->latest('id')
                ->paginate(25)
                ->withQueryString()
                ->through(fn (AuditLog $log): array => [
                    'id' => $log->id,
                    'action' => $log->action->value,
                    'action_label' => $log->action->label(),
                    'user_name' => $log->user?->name,
                    'event_id' => $log->event_id,
                    'device_id' => $log->device_id,
                    'metadata' => $log->metadata,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at?->toIso8601String(),
                ]),
        ]);
    }
}
