---
'@nocobase/app-plugin-projects': patch
---

On PostgreSQL, a lookup over an empty list of ids no longer fails with an invalid byte sequence: it sent a NUL character as a placeholder that matches nothing, which PostgreSQL refuses. This stopped the default workflow template from installing on a fresh database.
