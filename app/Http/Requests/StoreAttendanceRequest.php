<?php

namespace App\Http\Requests;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\Participant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', AttendanceRecord::class) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_id' => ['required', 'integer', Rule::exists(Event::class, 'id')],
            'participant_id' => ['required', 'integer', Rule::exists(Participant::class, 'id')],
            'attendance_session_id' => ['nullable', 'integer', Rule::exists(AttendanceSession::class, 'id')],
        ];
    }
}
