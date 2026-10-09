---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
---

Deliver runner policy refusals with their reasons and permitted alternatives instead of user-stop instructions, and tell the model a refused step does not end the task. Deny Claude tool calls directly from the permission hook, send policy feedback to Codex, and share refusal guidance with OpenCode and Pi while retaining reasons in run events.

Keep Claude's bidirectional permission channel open for background continuation turns, bound policy decisions, and log redacted denial diagnostics for all adapters, with a summary of the commands and paths taken before the input is capped and each line kept within 2048 UTF-8 bytes. A Claude refusal the runner never denied now fails the run even when Claude Code also reported its own denial.

Require Claude Code 2.1.284 or later for the supported SDK lifecycle. A runner reports an older Claude Code with `reason: versionTooOld`, its `version` and the `minVersion` (new optional `ToolInfo` fields) and never as signed in, so an application that does not know the fields still sends it no Claude runs. The runtimes page shows such a tool as too old with the `claude update` command, and a queued run waiting for it gives the new `toolVersionTooOld` reason instead of a missing tool. Upgrade the CLI with `claude update` and restart the runner.
