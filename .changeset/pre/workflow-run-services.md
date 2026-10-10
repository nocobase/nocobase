---
'@nocobase/app-plugin-dag-flow': minor
---

Replace the run module's Application runtime access with execution options containing a read-only service resolver, abort signal, and contextual logger, so scripts can consume public application services without accessing or mutating the Application container.
