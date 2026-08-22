<?php

use App\Models\Event;
use App\Models\FaceProfile;
use App\Models\Participant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot fetch the offline package', function () {
    $event = Event::factory()->active()->create();

    $this->getJson(route('events.offline-package', $event))
        ->assertUnauthorized();
});

test('operators receive enrolled participants with descriptors for the event', function () {
    $operator = User::factory()->operator()->create();
    $event = Event::factory()->active()->create();
    $enrolled = Participant::factory()->create();
    $unenrolled = Participant::factory()->create();
    $otherEvent = Event::factory()->active()->create();
    $otherParticipant = Participant::factory()->create();

    $event->participants()->attach([$enrolled->id, $unenrolled->id]);
    $otherEvent->participants()->attach($otherParticipant);

    FaceProfile::factory()->create([
        'participant_id' => $enrolled->id,
        'descriptor' => sampleFaceDescriptor(0.1),
    ]);
    FaceProfile::factory()->create([
        'participant_id' => $otherParticipant->id,
        'descriptor' => sampleFaceDescriptor(0.8),
    ]);

    $this->actingAs($operator)
        ->getJson(route('events.offline-package', $event))
        ->assertOk()
        ->assertJsonPath('event.id', $event->id)
        ->assertJsonPath('event.name', $event->name)
        ->assertJsonPath('event.event_code', $event->event_code)
        ->assertJsonPath('event.status', $event->status->value)
        ->assertJsonCount(1, 'participants')
        ->assertJsonPath('participants.0.id', $enrolled->id)
        ->assertJsonPath('participants.0.full_name', $enrolled->full_name)
        ->assertJsonPath('participants.0.registration_number', $enrolled->registration_number)
        ->assertJsonPath('participants.0.descriptor.0', 0.1)
        ->assertJsonPath('registered_count', 2)
        ->assertJsonPath('enrolled_count', 1)
        ->assertJsonPath('model_version', config('attendance.model_version'))
        ->assertJsonPath('models_url', config('attendance.models_url'))
        ->assertJsonMissingPath('participants.1');
});

test('admins receive enrolled participants with descriptors for the event', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->active()->create();
    $enrolled = Participant::factory()->create();
    $event->participants()->attach($enrolled);

    FaceProfile::factory()->create([
        'participant_id' => $enrolled->id,
        'descriptor' => sampleFaceDescriptor(0.2),
    ]);

    $this->actingAs($admin)
        ->getJson(route('events.offline-package', $event))
        ->assertOk()
        ->assertJsonCount(1, 'participants')
        ->assertJsonPath('participants.0.id', $enrolled->id)
        ->assertJsonPath('participants.0.descriptor.0', 0.2);
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
