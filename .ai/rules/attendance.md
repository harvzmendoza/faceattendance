---
paths:
  - resources/js/pages/attendance/scan.tsx
---

# Attendance

## Camera path queues Dexie before sync
The scan page queues matches in Dexie. Manual Mark present on attendance/index remains an online Inertia form. Overlay copy is not Saved locally-only until IndexedDB write succeeds.

## Workerize local face matching
Camera matching runs in a Web Worker (match.worker.ts) after the roster is loaded. Detection still runs on the main thread. If Worker is unavailable, matching falls back to findMatch on the main thread.

## Camera session buttons choose the punch session
The camera kiosk shows one large button per event session (same list as the Attendance select). A tap queues Dexie for that attendance_session_id using the currently held face. Overlay is Thank you plus Saved locally after IndexedDB write.

## Click session button saves the current face
Camera matching runs whenever roster and models are ready (skip only overlay or in-flight save). Hold the last match for about 2 seconds. Tapping a session button queues Dexie for that attendance_session_id using whoever is held now; participant cooldown does not block the click. No fresh match: hint Look at the camera first and do not queue. After IndexedDB: overlay Thank you plus Saved locally, and speechSynthesis Thank you. Same person+session stays one Dexie row; different sessions create different rows. Idle hint is Look at the camera, then tap a session.
