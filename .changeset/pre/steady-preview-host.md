---
'@nocobase/app-host': patch
'@nocobase/realtime': patch
'@nocobase/app-client': patch
'@nocobase/app-plugin-releases': patch
---

Keep active preview connections alive, suspend hidden tabs after ten minutes, limit shared applications by heap budget without reclaiming applications used in the last minute, and rotate busy hosts within a bounded wait.
