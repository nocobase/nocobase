---
"@nocobase/agent-runner": patch
---

Retry failed removal of saved and pushed run worktrees without requiring recovery, clean matching legacy records on startup and GC, and allow read-only runs to continue with recovery notices. Preserve Git stderr in removal diagnostics.
