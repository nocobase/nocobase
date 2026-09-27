---
'@nocobase/hub-installer': patch
---

An upgrade whose automatic rollback failed could report the failure as an unhandled rejection instead of the `ROLLBACK_FAILED` result: the rollback's promise was returned from inside the lock's `try`, and rejected before the `finally` that releases the lock had let the caller attach a handler. The rollback is now awaited there.
