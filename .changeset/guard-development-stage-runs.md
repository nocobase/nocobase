---
"@nocobase/studio": patch
"@nocobase/app-plugin-agents": minor
"@nocobase/agent-protocol": minor
"@nocobase/agent-runner": patch
---

Require an eligible development executor when approving proposals, route waiting-stage comments to the current stage, and defer pull request signals until development resumes. Reconcile obsolete queued stage inputs by exact run and input versions under the enqueue lock. Retry preparation when another live process holds the working directory, with a compatible failure fallback for older applications.
