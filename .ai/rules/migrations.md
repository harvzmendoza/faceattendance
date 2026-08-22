---
paths:
  - 'database/migrations/**'
---

# Migrations

## MySQL app, SQLite tests
App default DB is MySQL (face_attendance). Pest uses in-memory SQLite via phpunit.xml. Keep migrations SQLite-safe: no after(), store statuses as strings not native enum columns.
