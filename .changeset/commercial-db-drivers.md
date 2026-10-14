---
"@nocobase/app-server": patch
"@nocobase/app-cli": patch
"@nocobase/db-testing": patch
"@nocobase/app-testing": patch
"@nocobase/app-skills": patch
"@nocobase/db": patch
---

Move KingbaseES, Dameng and OceanBase driver ownership to NocoBase Pro. Applications using these drivers must install them through the Pro registry, explicitly register their default exports in database.drivers, and rebuild deployments. The OSS runtime and config initializer now load only OSS dialects. Test fixtures resolve external dialect provisioners from the consuming project without requiring Pro dependencies in OSS.
