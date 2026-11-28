---
'@nocobase/db': patch
'@nocobase/db-postgres': patch
'@nocobase/db-sqlite': patch
'@nocobase/app-plugin-projects': patch
---

Support compact string-list predicates on SQLite and PostgreSQL so reports can apply large project scopes without exhausting SQL parameters.
