<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceExportController;
use App\Http\Controllers\AttendancePrepareController;
use App\Http\Controllers\AttendanceReportController;
use App\Http\Controllers\AttendanceScanController;
use App\Http\Controllers\AttendanceSessionController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceMonitorController;
use App\Http\Controllers\DeviceRevokeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventParticipantController;
use App\Http\Controllers\EventRecognitionRosterController;
use App\Http\Controllers\FaceProfileController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\ParticipantExportController;
use App\Http\Controllers\ParticipantImportController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware('auth')->group(function (): void {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
    Route::get('attendance/scan', AttendanceScanController::class)->name('attendance.scan');
    Route::get('attendance/prepare', AttendancePrepareController::class)->name('attendance.prepare');

    Route::get('participants/export', ParticipantExportController::class)->name('participants.export');
    Route::post('participants/import', ParticipantImportController::class)->name('participants.import');
    Route::get('participants/{participant}/enroll', [FaceProfileController::class, 'enroll'])->name('participants.enroll');
    Route::put('participants/{participant}/face-profile', [FaceProfileController::class, 'update'])->name('participants.face-profile.update');
    Route::resource('participants', ParticipantController::class);

    Route::post('events/{event}/participants', [EventParticipantController::class, 'store'])->name('events.participants.store');
    Route::delete('events/{event}/participants/{participant}', [EventParticipantController::class, 'destroy'])->name('events.participants.destroy');
    Route::post('events/{event}/sessions', [AttendanceSessionController::class, 'store'])->name('events.sessions.store');
    Route::put('events/{event}/sessions/{session}', [AttendanceSessionController::class, 'update'])->name('events.sessions.update');
    Route::delete('events/{event}/sessions/{session}', [AttendanceSessionController::class, 'destroy'])->name('events.sessions.destroy');
    Route::get('events/{event}/recognition-roster', EventRecognitionRosterController::class)->name('events.recognition-roster');
    Route::resource('events', EventController::class);

    Route::get('reports', AttendanceReportController::class)->name('reports.index');
    Route::get('reports/export', AttendanceExportController::class)->name('reports.export');

    Route::resource('users', UserController::class);

    Route::get('devices', DeviceMonitorController::class)->name('devices.index');
    Route::post('devices/{device}/revoke', DeviceRevokeController::class)->name('devices.revoke');
    Route::get('audit-logs', AuditLogController::class)->name('audit-logs.index');
});
