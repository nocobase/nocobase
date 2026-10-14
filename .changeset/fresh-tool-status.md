---
'@nocobase/agent-runner': patch
'@nocobase/acp-bridge': patch
---

Refresh installed tool versions, paths and runner login status in long-running processes using bounded, cancellable background inspections. Rediscover previously unavailable tools and keep model capabilities consistent with the latest inspection. Reprobe ACP agents every minute and allow a session to retry after an authentication-required prompt error without replaying the failed message.

Terminate ACP launcher descendants after the stop grace period even when the launcher exits first.
