---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
---

Require Claude Code 2.1.284 or later and say so when it is older. A runner reports an older Claude Code with `reason: versionTooOld`, its `version` and the `minVersion` (new optional `ToolInfo` fields) and never as signed in, so an application that does not know the fields still sends it no Claude runs; it skips model detection for it and logs that it needs `claude update`. A run that reaches it fails with "Claude Code <version> is too old; 2.1.284 or later is required. Run `claude update`" instead of saying Claude Code is not installed. The runtimes page shows such a tool as too old with the update command, and a queued run waiting for it gives the new `toolVersionTooOld` reason. Upgrade the CLI with `claude update` and restart the runner.

Write each denied `permission` event, such as one from Claude Code's own deny rules, to the run's local log with the tool, call id, reason and a summary of the commands and paths of its input, redacted first and kept within 2048 UTF-8 bytes.
