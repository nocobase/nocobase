---
'@nocobase/app-cli': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Replace template development forwarding files with a single dev entry and a direct proxy helper import. Expose the dev lifecycle through the tools launcher and keep development implementation modules and tests inside app-tools.

Consolidate standalone server dependency operations into one template entry and keep build utility implementations and exports private to app-tools.

Organize template scripts by purpose and remove redundant test:all, refine, template pack:check, and plugin:skills:sync shortcuts. Keep the application CLI entry and legacy CLI compatibility command unchanged.
