---
'@nocobase/app-plugin-authorization': patch
---

Reuse resolved Collection metadata during database authorization to avoid redundant schema reads while preserving primary key and generated value handling.
