---
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-knowledge": patch
---

Reuse runner selection diagnostics and prepared subject data for model fallback. Read PostgreSQL collection definitions before locking the agent, and abort cancelled run claims before dispatch. Prepare and batch knowledge snapshot reads separately from recording the snapshot.
