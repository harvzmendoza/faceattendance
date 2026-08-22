<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFaceProfileRequest;
use App\Models\Participant;
use App\Services\FaceProfileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FaceProfileController extends Controller
{
    public function __construct(private FaceProfileService $faceProfiles) {}

    public function enroll(Request $request, Participant $participant): Response
    {
        $this->authorize('enroll', $participant);

        $participant->load('latestFaceProfile');

        return Inertia::render('participants/enroll', [
            'participant' => $participant,
            'can' => [
                'enroll' => $request->user()?->can('enroll', $participant) ?? false,
            ],
        ]);
    }

    public function update(StoreFaceProfileRequest $request, Participant $participant): RedirectResponse
    {
        $modelVersion = $request->validated('model_version');
        $wasEnrolled = $participant->faceProfiles()
            ->where('model_version', $modelVersion)
            ->exists();

        $this->faceProfiles->enroll(
            $participant,
            $request->validated('descriptor'),
            (string) $request->validated('quality_score'),
            $modelVersion,
        );

        return to_route('participants.show', $participant)
            ->with('success', $wasEnrolled ? 'Face re-enrolled.' : 'Face enrolled.');
    }
}
