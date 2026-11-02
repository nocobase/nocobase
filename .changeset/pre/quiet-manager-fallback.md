---
'@nocobase/app-plugin-agents': patch
'@nocobase/agent-protocol': patch
'@nocobase/agent-runner': patch
---

Allow the project manager to use an idle fallback after a configurable queue delay, exclude runners that cannot honor its workspace, and show selection and waiting reasons. Persist queue episodes through retries and restarts, withdraw unclaimed manager delegations after a configurable timeout, reliably report their cause in the dispatch thread, and publish identity-aware immediate capacity in each manager roster.
