---
paths:
  - 'resources/js/services/face-recognition/**'
---

# Face Recognition

## Liveness math stays library-agnostic
Yaw, circular-guide membership, blink (min EAR vs personal baseline, complete on close), and the four-step machine take DetectedFace — box, 68 landmarks, optional descriptor — not face-api types. Swap the detection library without rewriting enroll.tsx. Preview is CSS-mirrored; invert display X when testing in-guide, and treat positive yaw as the user turning left.
