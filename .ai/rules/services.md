---
paths:
  - app/Services/AttendanceService.php
  - app/Services/AttendanceSyncService.php
  - app/Services/AttendanceSessionService.php
  - app/Services/AuditService.php
---

# Services

## Attendance unique per session
Attendance uniqueness is per (event_id, participant_id, attendance_session_id, attendance_type). Creating an event auto-creates a Check-in session; Phase 1 records against that session. Duplicate attempts must fail with DuplicateAttendanceException.

## Sync is idempotent by local_id
Camera attendance writes Dexie first, then POST /api/attendance/sync. Sync is idempotent by local_id: repeats and per-session uniqueness collisions count as duplicates (HTTP 200), not new rows. Camera sync resolves the client device UUID to attendance_devices, sets attendance_records.device_id, and updates last_sync_at. Revoked devices receive HTTP 403.

## Session CRUD keeps one session
Admins manage nested event sessions from the event show page. An event must keep at least one session. Sessions with attendance records cannot be deleted. Uniqueness remains per (event, participant, session, attendance_type).

## Audit logs for sensitive actions
Sensitive actions write audit_logs: login, face enrollment, attendance sync batches, device register/revoke, report export, session create/delete. Heartbeats are not logged. Admins view /audit-logs; operators cannot.

## Sync records against the client session
Camera sync may send records.*.attendance_session_id. When present, record against that session. Map session type check_out to AttendanceType::CheckOut; other session types stay check_in. Missing session id still uses the event default session. Uniqueness remains per (event, participant, session, attendance_type).
