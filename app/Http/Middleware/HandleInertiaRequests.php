<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user === null ? null : [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'import_errors' => $request->session()->get('import_errors'),
            ],
            'sidebarOpen' => $request->cookie('sidebar_state') !== 'false',
            'attendance' => [
                'recognition_cooldown_seconds' => (int) config('attendance.recognition_cooldown_seconds'),
                'participant_cooldown_seconds' => (int) config('attendance.participant_cooldown_seconds'),
                'match_distance_threshold' => (float) config('attendance.match_distance_threshold'),
                'model_version' => (string) config('attendance.model_version'),
                'models_url' => (string) config('attendance.models_url'),
                'min_detection_score' => (float) config('attendance.min_detection_score'),
                'min_face_box_px' => (int) config('attendance.min_face_box_px'),
            ],
        ];
    }
}
