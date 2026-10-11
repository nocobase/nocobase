---
"@nocobase/studio": patch
"@nocobase/app-plugin-agents": minor
"@nocobase/agent-protocol": minor
"@nocobase/agent-runner": patch
---

Require an eligible development executor when approving proposals, route waiting-stage comments to the current stage, and defer pull request signals until development resumes. Reconcile obsolete queued stage inputs by exact run and input versions under the enqueue lock. Requeue a run whose working directory another live process holds without using up its attempts, bounded by a six-hour wait, with a compatible failure fallback for older applications. Tell a status change only to runs already working, so a queued run of the left stage stays withdrawable.
