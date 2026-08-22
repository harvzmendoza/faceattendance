<?php

namespace App\Http\Controllers;

use App\Enums\AuditAction;
use App\Models\AttendanceRecord;
use App\Services\AttendanceReportService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AttendanceExportController extends Controller
{
    public function __construct(
        private AttendanceReportService $reports,
        private AuditService $audit,
    ) {}

    public function __invoke(Request $request): Response
    {
        $this->authorize('exportReports', AttendanceRecord::class);

        $filters = [
            'event_id' => $request->integer('event_id') ?: null,
            'session_id' => $request->integer('session_id') ?: null,
            'date' => $request->string('date')->toString() ?: null,
            'participant' => $request->string('participant')->toString(),
            'organization' => $request->string('organization')->toString(),
            'attendance_status' => $request->string('attendance_status')->toString() ?: 'all',
        ];

        abort_if($filters['event_id'] === null, 422, 'Select an event to export.');

        $format = $request->string('format')->toString() ?: 'csv';
        $rows = $this->reports->rows($filters);
        $stamp = now()->format('Y-m-d');

        $this->audit->record(
            AuditAction::ReportExported,
            eventId: $filters['event_id'],
            metadata: [
                'format' => $format,
                'row_count' => $rows->count(),
            ],
        );

        return match ($format) {
            'xlsx', 'xls' => response($this->reports->toExcelXml($rows), 200, [
                'Content-Type' => 'application/vnd.ms-excel',
                'Content-Disposition' => 'attachment; filename="attendance-'.$stamp.'.xls"',
            ]),
            'pdf' => response($this->reports->toPdf('Attendance Report', $rows), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="attendance-'.$stamp.'.pdf"',
            ]),
            default => response($this->reports->toCsv($rows), 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="attendance-'.$stamp.'.csv"',
            ]),
        };
    }
}
