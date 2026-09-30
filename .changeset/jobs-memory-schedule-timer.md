---
'@nocobase/jobs': patch
---

Stop the in-memory schedule adapter from crashing the process with `CronError: WARNING: Date in past. Will never be fired.` Each planned firing now waits on a plain timer that re-checks the clock when it wakes, instead of a one-shot `cron` job whose timer could throw uncaught when it woke a moment before its own deadline but after the planned time. A firing still never starts before its planned time, and the `cron` dependency is removed.
