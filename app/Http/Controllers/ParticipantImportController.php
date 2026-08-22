<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportParticipantsRequest;
use App\Services\ParticipantImportService;
use Illuminate\Http\RedirectResponse;

class ParticipantImportController extends Controller
{
    public function __invoke(ImportParticipantsRequest $request, ParticipantImportService $importer): RedirectResponse
    {
        $result = $importer->import($request->file('file'));

        $message = "Imported {$result['imported']} participants.";

        if ($result['skipped'] > 0) {
            $message .= " {$result['skipped']} rows skipped.";
        }

        return back()
            ->with('success', $message)
            ->with('import_errors', $result['errors']);
    }
}
