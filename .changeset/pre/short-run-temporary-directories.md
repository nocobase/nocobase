---
"@nocobase/agent-runner": patch
"@nocobase/app-plugin-agents": patch
---

Use short private per-run temporary directories on Linux and macOS so Unix sockets can start, reserve TMP and TEMP alongside TMPDIR, and reclaim temporary files through the existing run lifecycle and garbage collection.
