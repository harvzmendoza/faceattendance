<?php

namespace App\Services;

use App\Enums\ParticipantStatus;
use App\Models\Participant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use SplFileObject;

class ParticipantImportService
{
    /**
     * @return array{imported: int, skipped: int, errors: list<string>}
     */
    public function import(UploadedFile $file): array
    {
        $handle = new SplFileObject($file->getRealPath() ?: $file->getPathname());
        $handle->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::DROP_NEW_LINE);

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $headers = [];

        foreach ($handle as $index => $row) {
            if (! is_array($row) || $this->isEmptyRow($row)) {
                continue;
            }

            if ($index === 0) {
                $headers = array_values(array_map(
                    fn (mixed $header): string => Str::of((string) $header)->trim()->lower()->snake()->toString(),
                    $row,
                ));

                continue;
            }

            $record = $this->mapRow($headers, $row);
            $line = $index + 1;

            if (($record['registration_number'] ?? '') === '' || ($record['first_name'] ?? '') === '' || ($record['last_name'] ?? '') === '') {
                $skipped++;
                $errors[] = "Line {$line}: registration_number, first_name, and last_name are required.";

                continue;
            }

            try {
                DB::transaction(function () use ($record): void {
                    Participant::query()->updateOrCreate(
                        ['registration_number' => $record['registration_number']],
                        [
                            'first_name' => $record['first_name'],
                            'middle_name' => $record['middle_name'] ?: null,
                            'last_name' => $record['last_name'],
                            'email' => $record['email'] ?: null,
                            'phone' => $record['phone'] ?: null,
                            'organization' => $record['organization'] ?: null,
                            'status' => ParticipantStatus::Active,
                        ],
                    );
                });

                $imported++;
            } catch (\Throwable $exception) {
                $skipped++;
                $errors[] = "Line {$line}: ".$exception->getMessage();
            }
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<mixed>  $row
     * @return array<string, string>
     */
    private function mapRow(array $headers, array $row): array
    {
        $mapped = [];

        foreach ($headers as $column => $header) {
            $mapped[$header] = trim((string) ($row[$column] ?? ''));
        }

        return [
            'registration_number' => $mapped['registration_number'] ?? '',
            'first_name' => $mapped['first_name'] ?? '',
            'middle_name' => $mapped['middle_name'] ?? '',
            'last_name' => $mapped['last_name'] ?? '',
            'email' => $mapped['email'] ?? '',
            'phone' => $mapped['phone'] ?? '',
            'organization' => $mapped['organization'] ?? '',
        ];
    }

    /**
     * @param  array<mixed>  $row
     */
    private function isEmptyRow(array $row): bool
    {
        return collect($row)->filter(fn (mixed $value): bool => trim((string) $value) !== '')->isEmpty();
    }
}
