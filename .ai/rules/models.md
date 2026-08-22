---
paths:
  - app/Models/FaceProfile.php
---

# Models

## Descriptors stay off Inertia participant pages
FaceProfile.descriptor stays Hidden on Inertia participant pages. Authenticated JSON may return descriptors on GET /events/{event}/recognition-roster and GET /api/events/{event}/offline-package for users who can view the event.
