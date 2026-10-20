---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-skills": patch
"@nocobase/create-plugin": patch
---

Keep installed client plugins in custom scopes on the same application contexts and service tokens as template page tests. Update both application templates' page examples to use real application hooks, permissions and notifications through `@nocobase/app-testing`.

Align application and generated-plugin testing guidance with the shared fixtures, including Node integration tests, database dialect selection, temporary CLI storage and fixture ownership.
