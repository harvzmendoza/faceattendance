<?php

use App\Models\Event;
use App\Models\FaceProfile;
use App\Models\Participant;
use App\Models\User;

test('guests cannot fetch the recognition roster', function () {
    $event = Event::factory()->active()->create();

    $this->getJson(route('events.recognition-roster', $event))
        ->assertUnauthorized();
});

test('operators can fetch enrolled participants for an event', function () {
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
        ->getJson(route('events.recognition-roster', $event))
        ->assertOk()
        ->assertJsonCount(1, 'participants')
        ->assertJsonPath('participants.0.id', $enrolled->id)
        ->assertJsonPath('participants.0.full_name', $enrolled->full_name)
        ->assertJsonPath('participants.0.registration_number', $enrolled->registration_number)
        ->assertJsonPath('participants.0.descriptor.0', 0.1);
});
