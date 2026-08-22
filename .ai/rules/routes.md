---
paths:
  - routes/api.php
---

# Routes

## API and sync rate limits
All /api routes use throttle:api (attendance.api_per_minute). POST /api/attendance/sync also uses throttle:attendance-sync (attendance.sync_per_minute). Limiters are registered in FortifyServiceProvider.
