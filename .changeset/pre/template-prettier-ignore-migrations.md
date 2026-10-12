---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Exclude `database/*/migrations/` and `database/*/seeds/` from Prettier in generated applications, so formatting never changes the checksum an installation recorded for an applied migration or seed.
