<?php

namespace App\Services;

use App\Models\Participant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ParticipantService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $photo = null): Participant
    {
        if ($photo instanceof UploadedFile) {
            $data['photo_path'] = $photo->store('participants', 'public');
        }

        return Participant::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Participant $participant, array $data, ?UploadedFile $photo = null): Participant
    {
        if ($photo instanceof UploadedFile) {
            $this->deletePhoto($participant);
            $data['photo_path'] = $photo->store('participants', 'public');
        }

        $participant->update($data);

        return $participant->refresh();
    }

    public function delete(Participant $participant): void
    {
        if ($participant->attendanceRecords()->exists()) {
            throw new \InvalidArgumentException('Cannot delete a participant who has attendance records.');
        }

        $this->deletePhoto($participant);
        $participant->delete();
    }

    private function deletePhoto(Participant $participant): void
    {
        if ($participant->photo_path === null) {
            return;
        }

        Storage::disk('public')->delete($participant->photo_path);
    }
}
