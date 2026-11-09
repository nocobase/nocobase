---
'@nocobase/app-plugin-agents': minor
---

Share queued runs between runners in proportion to each runner's limit for the run's coding tool. A runner's claim now takes at most one run per request, and none when it takes jobs, so jobs are handed out at once. A run is handed out up to one second after it entered the queue, later the more of that tool the runner already runs against its limit, so idler runners take the next run first and a runner busy with one tool still takes another tool's runs at once. A claim that ends while it waits takes nothing. Runners need no update.
