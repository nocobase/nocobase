---
'@nocobase/agent-runner': patch
---

Deliver runner policy refusals with their reasons and permitted alternatives instead of user-stop instructions. Deny Claude tool calls directly from the permission hook, send policy feedback to Codex, and share refusal guidance with OpenCode and Pi while retaining reasons in run events.

Keep Claude's bidirectional permission channel open for background continuation turns, bound policy decisions, and log redacted denial diagnostics for all adapters. Require Claude Code 2.1.284 or later for the supported SDK lifecycle; older installations must be upgraded before they can run Claude tasks.
