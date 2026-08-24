---
paths:
  - resources/js/pages/participants/enroll.tsx
---

# Participants

## Enrollment requires two blinks
Face enrollment is camera-only. The live loop counts two blinks (eye aspect ratio from 68-point landmarks) after the usual one-face size and score gates, then locks a descriptor. There is no photo upload or one-shot Capture. Save stays a separate admin confirm. Liveness is client-side only.
