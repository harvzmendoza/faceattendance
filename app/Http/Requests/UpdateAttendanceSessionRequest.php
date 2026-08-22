<?php

namespace App\Http\Requests;

use App\Enums\SessionStatus;
use App\Enums\SessionType;
use App\Models\AttendanceSession;
use App\Models\Event;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('session');

        return $session instanceof AttendanceSession
            && ($this->user()?->can('update', $session) ?? false);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $event = $this->route('event');
        $session = $this->route('session');
        $eventId = $event instanceof Event ? $event->id : 0;
        $sessionId = $session instanceof AttendanceSession ? $session->id : 0;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('attendance_sessions', 'name')
                    ->where('event_id', $eventId)
                    ->ignore($sessionId),
            ],
            'type' => ['required', 'string', Rule::enum(SessionType::class)],
            'status' => ['required', 'string', Rule::enum(SessionStatus::class)],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
