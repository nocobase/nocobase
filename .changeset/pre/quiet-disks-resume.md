---
'@nocobase/agent-protocol': patch
'@nocobase/agent-runner': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Clean idle build artifacts before pushed workspaces when disk space is low, pause new work until heartbeats detect recovery, and report disk-full failures for reassignment without counting a project-manager step failure. Show current disk capacity and workspace size, type and push diagnostics.

Retry interrupted removal of verified pushed attempt directories from GC or the next run, stop their remaining processes before deleting remnants, and retain cleanup failure reasons without blocking later tasks. Preserve unpublished or uncommitted work for recovery.

Verify the actual checkout branch and HEAD before retrying removal, report disk exhaustion even when local preservation metadata or events cannot be written, and continue safe pressure cleanup when diagnostic cache writes fail.
