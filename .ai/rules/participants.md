---
paths:
  - resources/js/pages/participants/enroll.tsx
---

# Participants

## Enrollment is a four-step camera liveness challenge
Face enrollment is camera-only. After Start camera, a circular guide auto-advances Look straight → Turn left → Turn right → Blink (complete on eyes closing, glasses or not). Pose, in-guide, and blink live in liveness.ts from detectFace box+landmarks; the page does not call generateDescriptor. Save still writes the held frontal 128-d descriptor. No photo upload, no stream upload, no Capture button between steps.
