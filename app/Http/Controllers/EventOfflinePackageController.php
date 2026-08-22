<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\EventOfflinePackageService;
use Illuminate\Http\JsonResponse;

class EventOfflinePackageController extends Controller
{
    public function __construct(private EventOfflinePackageService $packages) {}

    public function __invoke(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        return response()->json($this->packages->build($event));
    }
}
