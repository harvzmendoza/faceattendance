<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Attendance Session
    |--------------------------------------------------------------------------
    |
    | A session with this name is created automatically when an event is
    | created so attendance can be recorded before session management UI exists.
    |
    */

    'default_session_name' => env('ATTENDANCE_DEFAULT_SESSION_NAME', 'Check-in'),

    /*
    |--------------------------------------------------------------------------
    | Duplicate Prevention
    |--------------------------------------------------------------------------
    |
    | Cooldown values are used by the local recognition loop (Phase 2+) to
    | avoid recording the same face repeatedly while it remains in view.
    |
    */

    'recognition_cooldown_seconds' => (int) env('ATTENDANCE_RECOGNITION_COOLDOWN', 5),

    'participant_cooldown_seconds' => (int) env('ATTENDANCE_PARTICIPANT_COOLDOWN', 30),

    /*
    |--------------------------------------------------------------------------
    | Face Matching
    |--------------------------------------------------------------------------
    |
    | Euclidean distance threshold for local descriptor matching. Lower is
    | stricter. Used once browser-based recognition is enabled.
    |
    */

    'match_distance_threshold' => (float) env('ATTENDANCE_MATCH_THRESHOLD', 0.5),

    'model_version' => env('ATTENDANCE_MODEL_VERSION', 'face-api-ssd-mobilenet-v1'),

    'models_url' => env('ATTENDANCE_MODELS_URL', '/models'),

    /*
    |--------------------------------------------------------------------------
    | Enrollment Quality Gates
    |--------------------------------------------------------------------------
    |
    | Browser-side checks before a descriptor is accepted. Detection score is
    | the SSD MobileNet confidence. Face box is the smaller side of the
    | detected bounding box in pixels.
    |
    */

    'min_detection_score' => (float) env('ATTENDANCE_MIN_DETECTION_SCORE', 0.7),

    'min_face_box_px' => (int) env('ATTENDANCE_MIN_FACE_BOX_PX', 120),

    /*
    |--------------------------------------------------------------------------
    | Device Presence
    |--------------------------------------------------------------------------
    |
    | A device is ONLINE when it is not revoked and last_seen_at is within
    | this window. Heartbeats from attendance screens refresh last_seen_at.
    |
    */

    'device_online_seconds' => (int) env('ATTENDANCE_DEVICE_ONLINE_SECONDS', 90),

    /*
    |--------------------------------------------------------------------------
    | API Rate Limits
    |--------------------------------------------------------------------------
    |
    | Authenticated API routes share a per-user limit. Attendance sync is
    | stricter because devices may retry aggressively while offline queues
    | drain.
    |
    */

    'api_per_minute' => (int) env('ATTENDANCE_API_PER_MINUTE', 60),

    'sync_per_minute' => (int) env('ATTENDANCE_SYNC_PER_MINUTE', 30),

];
