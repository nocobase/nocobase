---
"@nocobase/concurrency": patch
---

Abort and settle backend waits safely when acquisition deadline monitoring fails, retaining the fault and cleaning any confirmed grant.
