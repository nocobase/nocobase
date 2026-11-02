---
'@nocobase/app-cli-client': patch
---

Reuse current registered session Skills without filesystem writes and wait for concurrent Skill installation instead of failing immediately. Record each lock owner and safely recover locks belonging to exited local processes, while preserving locks whose owners cannot be verified.
