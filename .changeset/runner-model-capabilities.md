---
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': minor
'@nocobase/app-plugin-agents': minor
---

Report models and available reasoning efforts detected by Pi, OpenCode and Codex through optional protocol 7 capability fields, with explicit detection status and periodic background refresh. Bound model counts and identifier lengths, and keep configuration, paths and credentials out of failure reasons. Store capabilities per runner and return model suggestions through existing visibility rules without changing Agent configuration. Discard invalid or unfamiliar advisory fields without rejecting registration or heartbeats.

Run model discovery with the agent environment whitelist in empty temporary directories, terminate discovery process groups on cancellation and wait for cleanup during runner shutdown. Preserve Pi provider/model identifiers, discard invalid efforts individually and avoid reporting successful detection when every received model is invalid.

Pi's startup version and authentication checks now also use the restricted environment. API keys supplied only through the runner daemon's environment no longer count as a Pi login during detection; configure Pi's persistent authentication for the runner user. Pass run-specific variables explicitly through the application's run environment or passthrough contract instead of relying on implicit daemon environment inheritance. Those run-specific variables are not used for host capability discovery.
