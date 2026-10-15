---
'@nocobase/db': patch
'@nocobase/db-mssql': patch
'@nocobase/db-mysql': patch
'@nocobase/db-oracle': patch
'@nocobase/db-postgres': patch
'@nocobase/db-testkit': patch
---

Make dialect integration tests own their disposable Docker Compose environments
with random host ports and automatic cleanup.
