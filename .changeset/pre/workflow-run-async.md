---
'@nocobase/app-plugin-dag-flow': patch
---

Yield workflow execution before running script nodes in the background, then resume the persisted node attempt with its result. Preserve error propagation, timeout cancellation, and graceful shutdown draining.
