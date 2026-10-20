---
"@nocobase/app-plugin-agents": patch
---

Reuse claim-local run, capacity, skill and sealed variable reads, batch candidate agent reads, and update routine runner activity timestamps without a separate transaction while preserving dispatch writes and delivery audits.
