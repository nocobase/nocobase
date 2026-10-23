---
'@nocobase/jobs': patch
'@nocobase/queue': patch
---

Run memory-adapter jobs, schedule firings and queue handlers outside the async context of whoever enqueued, published or armed them, as Redis workers do. Request-scoped async-local state, such as a write guard, no longer reaches background work through the in-process pump.
