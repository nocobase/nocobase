---
'@nocobase/app-plugin-agents': patch
---

Preserve the deprecated RunnerNotice export for applications and infer a queued run with a non-null runId when enqueue names no responsible person. Work that names a responsible person still returns the pending-or-queued result.
