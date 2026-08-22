---
paths:
  - vite.config.ts
---

# General

## PWA service worker is production-only
vite-plugin-pwa is production-only: leave devOptions.enabled false. The generated SW is copied to public/sw.js so scope is /. npm run dev stays a normal Vite HMR session; offline cold start is verified against npm run build.
