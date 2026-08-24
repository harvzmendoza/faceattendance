---
paths:
  - resources/js/lib/camera.ts
---

# Lib

## Prefer FaceTime over virtual cameras
After getUserMedia permission, prefer a video input whose label matches FaceTime, then any non-virtual camera (skip OBS/Camo/etc). Do not leave the default device on a virtual webcam.
