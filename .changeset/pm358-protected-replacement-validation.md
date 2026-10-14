---
'@nocobase/authorization': patch
---

Allow server callers to validate permission set replacements after protection locks and before assignment reads, using their existing transaction. Reject callbacks on unbound APIs and preserve behavior for callers without a callback.
