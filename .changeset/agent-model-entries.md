---
'@nocobase/agent-protocol': patch
'@nocobase/agent-runner': patch
'@nocobase/app-plugin-agents': patch
---

Claude Code now reports its models and their reasoning efforts through the Agent SDK's `supportedModels()`, without sending a prompt, instead of reporting model detection as unsupported.

Codex reasoning efforts are now `low`, `medium`, `high`, `xhigh`, `max` and `ultra`, as current Codex releases advertise them: `minimal` is gone, and `max` is passed to Codex as itself rather than as `xhigh`. An agent entry already saved with an effort its tool no longer takes keeps it until the entry is changed.

In an agent's tools and models, the effort select stays aligned with the rest of its row, and the reported efforts are listed on a line of their own below the entry, naming only efforts that can be chosen. Model suggestions no longer carry a "Built-in" badge. In the agents list, a long description wraps within the name column, two lines at most, with the full text on hover.
