---
paths:
  - resources/js/pages/attendance/scan.tsx
---

# Attendance

## Camera path queues Dexie before sync
The scan page queues matches in Dexie and shows Attendance recorded plus Saved locally. Manual Mark present on attendance/index remains an online Inertia form. Overlay copy is not Saved locally-only until IndexedDB write succeeds.

## Workerize local face matching
Camera matching runs in a Web Worker (match.worker.ts) after the roster is loaded. Detection still runs on the main thread. If Worker is unavailable, matching falls back to findMatch on the main thread.
