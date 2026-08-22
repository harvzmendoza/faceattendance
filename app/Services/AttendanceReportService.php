<?php

namespace App\Services;

use App\Enums\AttendanceType;
use App\Models\AttendanceRecord;
use App\Models\Event;
use App\Models\Participant;
use Illuminate\Support\Collection;

class AttendanceReportService
{
    /**
     * @param  array{
     *     event_id?: int|null,
     *     session_id?: int|null,
     *     date?: string|null,
     *     participant?: string|null,
     *     organization?: string|null,
     *     attendance_status?: string|null
     * }  $filters
     * @return Collection<int, array{
     *     registration_number: string,
     *     participant: string,
     *     organization: string,
     *     check_in: string,
     *     check_out: string,
     *     status: string
     * }>
     */
    public function rows(array $filters): Collection
    {
        $eventId = $filters['event_id'] ?? null;

        if ($eventId === null) {
            return collect();
        }

        $event = Event::query()->findOrFail($eventId);
        $sessionId = $filters['session_id'] ?? null;
        $date = $filters['date'] ?? null;
        $participantSearch = trim((string) ($filters['participant'] ?? ''));
        $organization = trim((string) ($filters['organization'] ?? ''));
        $attendanceStatus = $filters['attendance_status'] ?? 'all';

        $participants = $event->participants()
            ->when($participantSearch !== '', function ($query) use ($participantSearch): void {
                $query->search($participantSearch);
            })
            ->when($organization !== '', function ($query) use ($organization): void {
                $query->where('organization', 'like', '%'.$organization.'%');
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $records = AttendanceRecord::query()
            ->where('event_id', $event->id)
            ->when($sessionId, fn ($query) => $query->where('attendance_session_id', $sessionId))
            ->when($date, fn ($query) => $query->whereDate('recorded_at', $date))
            ->get()
            ->groupBy('participant_id');

        return $participants
            ->map(function (Participant $participant) use ($records): array {
                $participantRecords = $records->get($participant->id, collect());

                $checkIn = $participantRecords
                    ->first(fn (AttendanceRecord $record): bool => $record->attendance_type === AttendanceType::CheckIn);
                $checkOut = $participantRecords
                    ->first(fn (AttendanceRecord $record): bool => $record->attendance_type === AttendanceType::CheckOut);

                $present = $participantRecords->isNotEmpty();

                return [
                    'registration_number' => $participant->registration_number,
                    'participant' => $participant->full_name,
                    'organization' => $participant->organization ?? '',
                    'check_in' => $checkIn?->recorded_at?->timezone(config('app.timezone'))->format('Y-m-d H:i') ?? '',
                    'check_out' => $checkOut?->recorded_at?->timezone(config('app.timezone'))->format('Y-m-d H:i') ?? '',
                    'status' => $present ? 'Present' : 'Absent',
                ];
            })
            ->filter(function (array $row) use ($attendanceStatus): bool {
                if ($attendanceStatus === 'present') {
                    return $row['status'] === 'Present';
                }

                if ($attendanceStatus === 'absent') {
                    return $row['status'] === 'Absent';
                }

                return true;
            })
            ->values();
    }

    /**
     * @param  Collection<int, array<string, string>>  $rows
     * @return list<string>
     */
    public function headers(): array
    {
        return [
            'Registration No',
            'Participant',
            'Organization',
            'Check-in',
            'Check-out',
            'Status',
        ];
    }

    /**
     * @param  Collection<int, array<string, string>>  $rows
     */
    public function toCsv(Collection $rows): string
    {
        $handle = fopen('php://temp', 'r+');

        if ($handle === false) {
            return '';
        }

        fputcsv($handle, $this->headers());

        foreach ($rows as $row) {
            fputcsv($handle, [
                $row['registration_number'],
                $row['participant'],
                $row['organization'],
                $row['check_in'],
                $row['check_out'],
                $row['status'],
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle) ?: '';
        fclose($handle);

        return $csv;
    }

    /**
     * @param  Collection<int, array<string, string>>  $rows
     */
    public function toExcelXml(Collection $rows): string
    {
        $cells = static function (array $values): string {
            $xml = '';

            foreach ($values as $value) {
                $xml .= '<Cell><Data ss:Type="String">'.htmlspecialchars((string) $value, ENT_XML1).'</Data></Cell>';
            }

            return '<Row>'.$xml.'</Row>';
        };

        $body = $cells($this->headers());

        foreach ($rows as $row) {
            $body .= $cells([
                $row['registration_number'],
                $row['participant'],
                $row['organization'],
                $row['check_in'],
                $row['check_out'],
                $row['status'],
            ]);
        }

        return '<?xml version="1.0"?>'.
            '<?mso-application progid="Excel.Sheet"?>'.
            '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'.
            '<Worksheet ss:Name="Attendance"><Table>'.$body.'</Table></Worksheet></Workbook>';
    }

    /**
     * @param  Collection<int, array<string, string>>  $rows
     */
    public function toPdf(string $title, Collection $rows): string
    {
        $lines = [$title, ''];
        $lines[] = implode(' | ', $this->headers());

        foreach ($rows as $row) {
            $lines[] = implode(' | ', [
                $row['registration_number'],
                $row['participant'],
                $row['organization'] !== '' ? $row['organization'] : '—',
                $row['check_in'] !== '' ? $row['check_in'] : '—',
                $row['check_out'] !== '' ? $row['check_out'] : '—',
                $row['status'],
            ]);
        }

        return $this->buildPdf($lines);
    }

    /**
     * @param  list<string>  $lines
     */
    private function buildPdf(array $lines): string
    {
        $content = "BT /F1 10 Tf 40 800 Td\n";
        $y = 800;

        foreach ($lines as $index => $line) {
            $safe = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);

            if ($index === 0) {
                $content .= "/F1 14 Tf ({$safe}) Tj\n/F1 10 Tf\n";
            } else {
                $content .= "0 -14 Td ({$safe}) Tj\n";
            }

            $y -= 14;

            if ($y < 60) {
                $content .= "ET\nBT /F1 10 Tf 40 800 Td\n";
                $y = 800;
            }
        }

        $content .= "ET\n";
        $length = strlen($content);

        return "%PDF-1.4\n".
            "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n".
            "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n".
            "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n".
            "4 0 obj << /Length {$length} >> stream\n{$content}endstream endobj\n".
            "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n".
            "xref\n0 6\n0000000000 65535 f \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF";
    }
}
