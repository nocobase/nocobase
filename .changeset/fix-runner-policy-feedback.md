---
'@nocobase/agent-runner': patch
---

Deliver runner policy refusals with their reasons and permitted alternatives instead of user-stop instructions. Deny Claude tool calls directly from the permission hook, send policy feedback to Codex, and share refusal guidance with OpenCode and Pi while retaining reasons in run events.
