---
'@nocobase/db': patch
---

Temporal columns that are NULL now read back as `null` on every dialect. A driver's temporal formatting is wrapped in a NULL guard, so a database that concatenates NULL as an empty string, such as KingbaseES in Oracle-compatible mode, no longer turns an empty `datetimeTz` value into `"Z"` and fails the read.
