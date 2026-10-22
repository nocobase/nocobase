---
'@nocobase/app-plugin-agents': patch
---

Name each model service's chat models in its row on the Models page: the default chat model first and marked "Default", two names and how many more, every name on hover, with how many embedding and rerank models the service offers. `GET /api/agents/defaultModels` (anyone signed in, `model defaults` on the CLI) answers the default chat model as set and as used now.
