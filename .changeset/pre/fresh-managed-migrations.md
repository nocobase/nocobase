---
'@nocobase/db': minor
'@nocobase/db-sqlite': patch
'@nocobase/db-postgres': patch
'@nocobase/db-mysql': patch
'@nocobase/db-oracle': patch
'@nocobase/db-mssql': patch
'@nocobase/db-dameng': patch
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add the destructive `pnpm migrate --fresh --force` workflow for managed
connections. It clears dialect-owned schema objects, reruns visible migrations,
requires confirmation in interactive terminals, and rejects external
connections.
