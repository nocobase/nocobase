---
'@nocobase/agent-runner': patch
---

Combine strict writer shutdown with full workspace protection for read-only cleanup. Preserve damaged or unknown nonempty directories and files outside recorded repositories instead of rebuilding or deleting them without publication evidence.
