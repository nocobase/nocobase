---
"@nocobase/concurrency": patch
---

Release executor leases even when final lease checks fail, preserve independent business errors, and reject leases lost during monitoring startup before delivery.
