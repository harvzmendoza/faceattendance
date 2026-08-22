<?php

use App\Enums\ParticipantStatus;
use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('admins can create a participant', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('participants.store'), [
            'registration_number' => '2026-00999',
            'first_name' => 'Juan',
            'middle_name' => 'Dela',
            'last_name' => 'Cruz',
            'email' => 'juan@example.com',
            'phone' => '09170000000',
            'organization' => 'IBP Manila',
            'status' => ParticipantStatus::Active->value,
        ])
        ->assertRedirect();

    $participant = Participant::query()->where('registration_number', '2026-00999')->first();

    expect($participant)->not->toBeNull()
        ->and($participant->full_name)->toBe('Juan Dela Cruz');
});

test('admins can search participants', function () {
    $admin = User::factory()->admin()->create();
    Participant::factory()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);
    Participant::factory()->create(['first_name' => 'Pedro', 'last_name' => 'Reyes']);

    $this->actingAs($admin)
        ->get(route('participants.index', ['search' => 'Santos']))
        ->assertOk()
        ->assertSee('Santos')
        ->assertDontSee('Reyes');
});

test('admins can import participants from csv', function () {
    $admin = User::factory()->admin()->create();
    $csv = UploadedFile::fake()->createWithContent(
        'participants.csv',
        "registration_number,first_name,middle_name,last_name,email,phone,organization\n2026-01000,Ana,,Lopez,ana@example.com,,IBP Cebu\n",
    );

    $this->actingAs($admin)
        ->post(route('participants.import'), ['file' => $csv])
        ->assertRedirect();

    expect(Participant::query()->where('registration_number', '2026-01000')->exists())->toBeTrue();
});

test('admins can assign a participant to an event', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->create();
    $participant = Participant::factory()->create();

    $this->actingAs($admin)
        ->post(route('events.participants.store', $event), [
            'participant_id' => $participant->id,
        ])
        ->assertRedirect();

    expect($event->participants()->whereKey($participant)->exists())->toBeTrue();
});

test('admins can upload a participant photo', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $photo = UploadedFile::fake()->image('portrait.jpg');

    $this->actingAs($admin)
        ->post(route('participants.store'), [
            'registration_number' => '2026-01001',
            'first_name' => 'Luz',
            'last_name' => 'Garcia',
            'status' => ParticipantStatus::Active->value,
            'photo' => $photo,
        ])
        ->assertRedirect();

    $participant = Participant::query()->where('registration_number', '2026-01001')->first();

    expect($participant?->photo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($participant->photo_path);
});
