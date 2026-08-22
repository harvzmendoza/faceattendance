<?php

namespace App\Http\Requests;

use App\Models\AttendanceDevice;
use App\Models\Event;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HeartbeatDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', AttendanceDevice::class) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'device_uuid' => ['required', 'uuid'],
            'event_id' => ['nullable', 'integer', Rule::exists(Event::class, 'id')],
            'pending_count' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
