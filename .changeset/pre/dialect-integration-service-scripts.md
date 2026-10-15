---
'@nocobase/db-mssql': patch
'@nocobase/db-oracle': patch
---

Each dialect's Compose service for its integration suite is declared in `scripts/integration-service.ts`, which the suite's runner and the repository's `pnpm test:db` both read. Nothing these packages ship changes.
