---
'@nocobase/app-plugin-scheduler': patch
'@nocobase/jobs': patch
---

Add a public, idempotent Scheduler drain boundary that waits for in-flight reconciliation, executor shutdown, event records, and accepted completion reports before releasing subscriptions. Preserve shutdown failures after remaining work settles, including queued Jobs event delivery when backend close fails.
