<?php

use App\Http\Controllers\AttendanceSyncController;
use App\Http\Controllers\DeviceHeartbeatController;
use App\Http\Controllers\DeviceRegisterController;
use App\Http\Controllers\DeviceShowController;
use App\Http\Controllers\EventAttendanceController;
use App\Http\Controllers\EventOfflinePackageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('attendance/sync', AttendanceSyncController::class)
        ->middleware('throttle:attendance-sync')
        ->name('attendance.sync');
    Route::get('events/{event}/offline-package', EventOfflinePackageController::class)->name('events.offline-package');
    Route::get('events/{event}/attendance', EventAttendanceController::class)->name('events.attendance');
    Route::post('devices/register', DeviceRegisterController::class)->name('devices.register');
    Route::post('devices/heartbeat', DeviceHeartbeatController::class)->name('devices.heartbeat');
    Route::get('devices/{device}', DeviceShowController::class)->name('devices.show');
});
