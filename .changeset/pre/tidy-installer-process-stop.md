---
'@nocobase/app-installer': patch
---

Wait for timed-out or interrupted command process groups to stop before returning, retaining forced termination for descendants that ignore SIGTERM and distinguishing zombies from processes that can still write.
