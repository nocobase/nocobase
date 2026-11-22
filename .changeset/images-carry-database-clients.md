---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Include the PostgreSQL 17, MySQL 8.4 and MariaDB client tools in the production image so that application backups can dump and restore those databases, and create `/app/backups` for a deployment host's backup volume.
