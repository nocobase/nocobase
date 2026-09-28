---
'@nocobase/app-plugin-ai-employee': patch
---

Remove the unused `knownRoles` option and getter from the AI employee service, together with the `AI_DEFAULT_ROLES` environment variable it read. Nothing passed the option or read the getter, so setting the variable had no effect; AI employees take roles from the requesting actor.
