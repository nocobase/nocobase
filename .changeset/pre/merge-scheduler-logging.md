---
'@nocobase/app-plugin-dag-flow': patch
'@nocobase/app-server': patch
---

Preserve structured workflow context alongside queued run return values when integrating scheduled execution. Route terminal observer failures and registered queue jobs through application loggers while retaining committed workflow outcomes.
