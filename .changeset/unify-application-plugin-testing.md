---
"@nocobase/app-skills": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-template-hub": patch
"@nocobase/create-plugin": patch
"@nocobase/dev-config": patch
---

Align application and plugin testing guidance around the server, client and CLI entries of `@nocobase/app-testing`. Ship page test examples with real application hooks, strict translations, API responses, permission checks and toast assertions in all application templates, and document isolated database and application fixtures for generated projects.

Inline the client runtime, plugin client entries and published app-testing client fixture in the shared React Vitest preset so its memory router shares the page's router context and plugins share the application's contexts and service tokens in installed applications. Keep server and database fixtures external.
