---
paths:
  - app/Policies/ParticipantPolicy.php
---

# Policies

## Face enrollment is admin-only
Face enrollment (participants.enroll and face-profile update) is admin-only via ParticipantPolicy::enroll. Operators can record attendance and load the event recognition roster, but cannot enroll faces.
