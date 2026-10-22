---
"@nocobase/app-plugin-projects": patch
---

Retain full snapshot recovery after a failed Projects refresh so later events from another domain cannot discard the failed batch. Cover both targeted notifications and subscription readiness recovery.
