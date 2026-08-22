<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Models\FaceProfile;
use App\Models\Participant;

class FaceProfileService
{
    public function __construct(private AuditService $audit) {}

    /**
     * @param  list<float|int>  $descriptor
     */
    public function enroll(
        Participant $participant,
        array $descriptor,
        string $qualityScore,
        string $modelVersion,
    ): FaceProfile {
        $profile = FaceProfile::query()->updateOrCreate(
            [
                'participant_id' => $participant->id,
                'model_version' => $modelVersion,
            ],
            [
                'descriptor' => array_map(floatval(...), $descriptor),
                'quality_score' => $qualityScore,
                'enrolled_at' => now(),
            ],
        );

        $this->audit->record(
            AuditAction::FaceEnrolled,
            auditable: $participant,
            metadata: [
                'participant_id' => $participant->id,
                'model_version' => $modelVersion,
            ],
        );

        return $profile;
    }
}
