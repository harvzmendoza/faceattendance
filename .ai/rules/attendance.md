---
paths:
  - resources/js/pages/attendance/scan.tsx
---

# Attendance

## Camera path queues Dexie before sync
The scan page queues matches in Dexie and shows Attendance recorded plus Saved locally. Manual Mark present on attendance/index remains an online Inertia form. Overlay copy is not Saved locally-only until IndexedDB write succeeds.

## Workerize local face matching
Camera matching runs in a Web Worker (match.worker.ts) after the roster is loaded. Detection still runs on the main thread. If Worker is unavailable, matching falls back to findMatch on the main thread.

## Camera session buttons choose the punch session
The camera kiosk shows one large button per event session (same list as the Attendance select). The operator or participant taps Check-in, Check-out, or another session before a face is recorded. Queue Dexie for that attendance_session_id; overlay is {session name} recorded plus Saved locally after IndexedDB write. Present count is per selected session.

## Arm session then scan, then Thank you
Camera does not record until the participant taps a session button. After a Dexie write, overlay is Thank you plus Saved locally, speechSynthesis says Thank you (unlocked on the tap), then the session disarms so the next person must tap again.
