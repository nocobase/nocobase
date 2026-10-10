---
'@nocobase/app-cli': patch
'@nocobase/app-skills': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-mail-example': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/create-plugin': patch
'@nocobase/dev-config': patch
---

Remove the AI employee packages from the repository

`@nocobase/app-plugin-ai-employee`, `@nocobase/ai-employee` and `@nocobase/app-plugin-ai-employee-example` were already deprecated and no template installed them; they are now deleted and will not be released again. The Default and Examples templates drop `@nocobase/ai-employee-avatars`, which only the plugin's avatars used.

Generated plugins' `AGENTS.md` and the copies shipped with existing plugins no longer list `@nocobase/ai-employee` among the identity-sensitive packages. The HTTP API references in the application development Skill use other plugins for their examples, and the upgrade Skill tells an application that still depends on the removed packages to review their usage before removing them, because the runtime will move past what their peer ranges accept.
