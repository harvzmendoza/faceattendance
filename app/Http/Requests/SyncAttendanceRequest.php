<?php

namespace App\Http\Requests;

use App\Enums\AttendanceType;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncAttendanceRequest extends FormRequest
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
            'device_id' => ['required', 'string', 'max:64'],
            'records' => ['required', 'array', 'max:200'],
            'records.*.local_id' => ['required', 'uuid'],
            'records.*.event_id' => ['required', 'integer', Rule::exists(Event::class, 'id')],
            'records.*.participant_id' => ['required', 'integer', Rule::exists(Participant::class, 'id')],
            'records.*.attendance_type' => ['required', 'string', Rule::enum(AttendanceType::class)],
            'records.*.recorded_at' => ['required', 'date'],
        ];
    }
}
