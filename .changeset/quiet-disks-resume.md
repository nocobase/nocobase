---
'@nocobase/agent-protocol': patch
'@nocobase/agent-runner': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Clean idle build artifacts before pushed workspaces when disk space is low, pause new work until heartbeats detect recovery, and report disk-full failures for reassignment without counting a project-manager step failure. Show current disk capacity and workspace size, type and push diagnostics.
