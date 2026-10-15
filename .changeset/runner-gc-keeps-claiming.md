---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
---

Keep a runner claiming work while it collects working directories. Collection no longer measures every directory's size by reading every file, which on runners with many directories took tens of minutes per round and held all claims meanwhile; only pruning the shared pnpm store still holds claims. Routine collection now runs an hour after the previous round ended (`WORKSPACE_REPORT_INTERVAL_MS`), still at once when the disk runs low, and the runner logs each round's start and duration. Workspace diagnostics show a directory's size only when a runner reported one.
