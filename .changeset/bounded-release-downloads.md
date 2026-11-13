---
'@nocobase/app-host': patch
'@nocobase/app-plugin-releases': patch
---

Bound release downloads with configurable idle and total timeouts, retry a timed out read once, and allow cancellation while opening or transferring the artifact so queued deployments can continue.
