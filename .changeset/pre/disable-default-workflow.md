---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-skills": patch
---

Disable the Workflow plugin by default while retaining its dependency, configuration, and example sources for explicit opt-in use. Remove inactive workflow example entry points and register their schedules only when the plugin is enabled.
