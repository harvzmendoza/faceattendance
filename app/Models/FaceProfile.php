<?php

namespace App\Models;

use Database\Factories\FaceProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $participant_id
 * @property string $model_version
 * @property list<float> $descriptor
 * @property string|null $quality_score
 * @property Carbon $enrolled_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['participant_id', 'model_version', 'descriptor', 'quality_score', 'enrolled_at'])]
#[Hidden(['descriptor'])]
class FaceProfile extends Model
{
    /** @use HasFactory<FaceProfileFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'descriptor' => 'array',
            'enrolled_at' => 'datetime',
            'quality_score' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<Participant, $this>
     */
    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }
}
