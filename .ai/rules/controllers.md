---
paths:
  - app/Http/Controllers/AttendanceController.php
  - app/Http/Controllers/EventOfflinePackageController.php
  - app/Http/Controllers/DeviceMonitorController.php
  - app/Http/Controllers/AttendanceReportController.php
---

# Controllers

## JSON attendance store for camera scan
Camera attendance posts JSON to attendance.store (wantsJson) and shows “Attendance recorded”. Do not send frames or descriptors on that request. DuplicateAttendanceException still rejects a second record for the same session.

## Descriptors only on roster and offline package
Descriptors are returned only on authenticated JSON endpoints: GET /events/{event}/recognition-roster and GET /api/events/{event}/offline-package. Never put FaceProfile.descriptor on Inertia participant pages.

## Device monitoring is admin-only
Device monitoring is admin-only. Operators may register and heartbeat the current browser (SPA cookie) but cannot revoke devices or open /devices. Presence ONLINE/OFFLINE is derived from last_seen_at within attendance.device_online_seconds, not from DeviceStatus::Offline.

## Reports and exports are admin-only
Attendance reports and CSV/Excel/PDF exports are admin-only (viewReports/exportReports on AttendanceRecord). Operators use GET /api/events/{event}/attendance for status. Excel is SpreadsheetML .xls; PDF is a generated text PDF — no extra Composer packages.
