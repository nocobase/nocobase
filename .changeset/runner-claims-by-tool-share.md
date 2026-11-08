---
'@nocobase/app-plugin-agents': minor
---

Share queued runs between runners in proportion to each runner's limit for the run's coding tool. A runner's claim now takes at most one run per request (jobs are unchanged), and waits up to one second after the run entered the queue, longer the more of that tool it already runs against its limit, so idler runners take the next run first and a runner busy with one tool still takes another tool's runs at once. A claim that ends while it waits takes nothing. Runners need no update.
