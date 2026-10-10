---
'@nocobase/db-sqlite': patch
'@nocobase/authorization': patch
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-workflow': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

Preserve the bundled musl binary when building applications for Alpine Linux.
