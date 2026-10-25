---
'@nocobase/app-plugin-agents': patch
---

Resolve OnlineAgent configuration in two phases so every prompt template receives final, independently normalized variables while prompt composition remains ordered and HTTP variables remain limited to selected-scope declarations. Preserve saved session snapshots without reevaluating global prompts on variable-only updates.
