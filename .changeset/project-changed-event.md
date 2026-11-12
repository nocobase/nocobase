---
"@nocobase/app-plugin-projects": patch
---

Emit a `project.changed` domain event when a project's members, visibility or lead change, so listeners that keep per-person state about its issues can read them again.
