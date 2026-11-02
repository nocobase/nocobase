---
"@nocobase/app-plugin-agents": patch
"@nocobase/app-template-examples": patch
---

Repair previous-process native conversation occupancy during server startup while preserving saved results. Keep interrupted tool facts in private model history, remove effect-review admission locks, and allow owners to cancel historical runs while keeping historical conversations read-only. Stop continues to wait for actual native tool termination and finalization; cancellation requests for Runner and historical runs still require terminal confirmation.
