<?php

use App\Models\FaceProfile;
use App\Models\Participant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can enroll a participant face', function () {
    $admin = User::factory()->admin()->create();
    $participant = Participant::factory()->create();
    $descriptor = sampleFaceDescriptor();

    $this->actingAs($admin)
        ->get(route('participants.enroll', $participant))
        ->assertOk();

    $this->actingAs($admin)
        ->putJson(route('participants.face-profile.update', $participant), [
            'descriptor' => $descriptor,
            'quality_score' => 0.91,
            'model_version' => config('attendance.model_version'),
        ])
        ->assertRedirect(route('participants.show', $participant));

    $profile = FaceProfile::query()->where('participant_id', $participant->id)->first();

    expect($profile)->not->toBeNull()
        ->and($profile->descriptor)->toHaveCount(128)
        ->and((float) $profile->quality_score)->toEqualWithDelta(0.91, 0.0001);
});

test('admins can re-enroll a participant face', function () {
    $admin = User::factory()->admin()->create();
    $participant = Participant::factory()->create();
    FaceProfile::factory()->create([
        'participant_id' => $participant->id,
        'descriptor' => sampleFaceDescriptor(0.1),
    ]);

    $this->actingAs($admin)
        ->putJson(route('participants.face-profile.update', $participant), [
            'descriptor' => sampleFaceDescriptor(0.4),
            'quality_score' => 0.88,
            'model_version' => config('attendance.model_version'),
        ])
        ->assertRedirect();

    expect(FaceProfile::query()->where('participant_id', $participant->id)->count())->toBe(1)
        ->and((float) FaceProfile::query()->where('participant_id', $participant->id)->first()->descriptor[0])
        ->toEqualWithDelta(0.4, 0.0001);
});

test('operators cannot enroll a participant face', function () {
    $operator = User::factory()->operator()->create();
    $participant = Participant::factory()->create();

    $this->actingAs($operator)
        ->get(route('participants.enroll', $participant))
        ->assertForbidden();

    $this->actingAs($operator)
        ->putJson(route('participants.face-profile.update', $participant), [
            'descriptor' => sampleFaceDescriptor(),
            'quality_score' => 0.9,
            'model_version' => config('attendance.model_version'),
        ])
        ->assertForbidden();
});

test('face descriptors must contain exactly 128 values', function () {
    $admin = User::factory()->admin()->create();
    $participant = Participant::factory()->create();

    $this->actingAs($admin)
        ->putJson(route('participants.face-profile.update', $participant), [
            'descriptor' => array_slice(sampleFaceDescriptor(), 0, 10),
            'quality_score' => 0.9,
            'model_version' => config('attendance.model_version'),
        ])
        ->assertUnprocessable();

    expect(FaceProfile::query()->count())->toBe(0);
});

test('face descriptors are omitted from participant show props', function () {
    $admin = User::factory()->admin()->create();
    $participant = Participant::factory()->create();
    $profile = FaceProfile::factory()->create([
        'participant_id' => $participant->id,
        'descriptor' => sampleFaceDescriptor(0.25),
    ]);

    $this->actingAs($admin)
        ->get(route('participants.show', $participant))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('participant.latest_face_profile.id', $profile->id)
            ->missing('participant.latest_face_profile.descriptor')
        );
});
