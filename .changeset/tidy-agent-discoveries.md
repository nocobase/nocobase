---
'@nocobase/app-plugin-agents': minor
'@nocobase/agent-runner': patch
'@nocobase/studio': patch
---

Keep enabled agents prominent, group new discoveries by tool and catalog model, and persist shared ignore and restore preferences with revision protection. Choose a provider without changing existing execution identities and show personal runner names. Discover only authenticated Pi providers and prevent model overrides from bypassing that filter. In Studio, authorize runs through their running identity and existing command scope instead of intersecting with legacy agent action lists, including reports, while retaining object permissions, credential scopes, read-only modes and human approval requirements.

Show recognizable provider and runner labels when selecting a model and cap atomic bulk discovery operations at 256 selected groups with explicit counts and limits.
