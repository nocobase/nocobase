---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-template-examples': patch
---

Use `OnlineAgentService` directly as the application service contract and remove redundant service interfaces. Update application dependencies, tests, and integration guidance to use the complete service type while retaining the shared realtime-session and Runner-backend contracts.
