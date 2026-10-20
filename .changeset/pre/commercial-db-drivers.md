---
"@nocobase/app-server": patch
"@nocobase/app-cli": patch
"@nocobase/db-testing": patch
"@nocobase/app-testing": patch
"@nocobase/app-skills": patch
"@nocobase/db": patch
---

Move KingbaseES, Dameng and OceanBase driver ownership to NocoBase Pro while preserving optional peer dependencies, automatic loading and CLI configuration support. Install the selected driver through the Pro registry in the application's production dependencies and rebuild deployments; explicit driver registration remains optional. Test fixtures resolve external dialect provisioners from the consuming project.
