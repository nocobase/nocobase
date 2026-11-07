---
"@nocobase/concurrency": patch
---

Recheck monotonic deadlines before cancelling bounded waits and return a normal miss when the wait budget expires before any backend acquisition starts.
