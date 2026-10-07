---
'@nocobase/app-plugin-ai-employee': patch
---

Count a run towards the parallel conversation limit for ten minutes from when it started, rather than from when its conversation was created, so a run in a conversation created more than ten minutes earlier is counted too. A conversation's `updatedAt` now moves to the start of its latest run, which also reorders conversation lists sorted by it.
