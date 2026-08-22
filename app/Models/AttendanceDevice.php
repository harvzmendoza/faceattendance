<?php

namespace App\Models;

use App\Enums\DeviceStatus;
use Database\Factories\AttendanceDeviceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $device_uuid
 * @property string $name
 * @property string|null $location
 * @property int|null $event_id
 * @property DeviceStatus $status
 * @property Carbon|null $last_seen_at
 * @property Carbon|null $last_sync_at
 * @property int $pending_sync_count
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['device_uuid', 'name', 'location', 'event_id', 'status', 'last_seen_at', 'last_sync_at', 'pending_sync_count'])]
class AttendanceDevice extends Model
{
    /** @use HasFactory<AttendanceDeviceFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'active',
        'pending_sync_count' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => DeviceStatus::class,
            'last_seen_at' => 'datetime',
            'last_sync_at' => 'datetime',
            'pending_sync_count' => 'integer',
        ];
    }

    public function isOnline(): bool
    {
        if ($this->status === DeviceStatus::Revoked || $this->last_seen_at === null) {
            return false;
        }

        $seconds = (int) config('attendance.device_online_seconds');

        return $this->last_seen_at->gte(now()->subSeconds($seconds));
    }

    public function presence(): string
    {
        if ($this->status === DeviceStatus::Revoked) {
            return 'revoked';
        }

        return $this->isOnline() ? 'online' : 'offline';
    }

    /**
     * @param  Builder<AttendanceDevice>  $query
     * @return Builder<AttendanceDevice>
     */
    #[Scope]
    protected function notRevoked(Builder $query): Builder
    {
        return $query->where('status', '!=', DeviceStatus::Revoked);
    }

    /**
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * @return HasMany<AttendanceRecord, $this>
     */
    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'device_id');
    }
}
