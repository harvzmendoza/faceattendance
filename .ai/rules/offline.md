---
paths:
  - resources/js/services/offline/SyncService.ts
---

# Offline

## Re-queue synced Dexie rows on click
queueAttendance skips a second Dexie row for the same person+session, but a row already marked synced must be set back to pending so flush POSTs it again. Otherwise Thank you shows while MySQL stays empty after a local DB reset. Server sync is idempotent by local_id.
