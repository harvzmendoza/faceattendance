<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ParticipantExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $this->authorize('export', Participant::class);

        $filename = 'participants-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($request): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'registration_number',
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'phone',
                'organization',
                'status',
            ]);

            Participant::query()
                ->search($request->string('search')->toString())
                ->orderBy('last_name')
                ->cursor()
                ->each(function (Participant $participant) use ($handle): void {
                    fputcsv($handle, [
                        $participant->registration_number,
                        $participant->first_name,
                        $participant->middle_name,
                        $participant->last_name,
                        $participant->email,
                        $participant->phone,
                        $participant->organization,
                        $participant->status->value,
                    ]);
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
