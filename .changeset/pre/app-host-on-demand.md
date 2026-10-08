---
'@nocobase/app-host': minor
---

Apps can now be on-demand. A deployment spec takes `idleStopMs` (stop the runtime after that long without a request; `0` never) and `dormantAfterMs` (after that long, also remove the expanded release while keeping the definition, configuration and data; the next request expands it again from the artifact store). A request to a stopped or dormant App starts it: a browser page waits briefly and then gets a self-refreshing "starting" page, other requests wait and then get a 503 with `Retry-After`. The managed status reports each App's `lifecycle` (`running`, `starting`, `stopped`, `dormant`, last access) and `counters` of activations, idle stops, dormancies and preparations, and a restarted Host keeps dormant Apps dormant. A per-App `resourcePolicy.idleTtlMs` of `0` now means never, and changing only these policies no longer restarts a running App. New Host settings: `activationHoldMs`, `activationWaitMs`.
