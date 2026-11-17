---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/create-app': patch
---

Retry private registry authorization failures once with the run's token and cover application creation and template downloads. Deploy the application before upgrading runners to protocol 17.
