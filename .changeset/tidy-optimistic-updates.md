---
'@nocobase/db': patch
---

Use one conditional UPDATE for unobserved scalar updateOne calls with a safe numeric version and an unchanged unique key, combining field changes with the version increment without a preceding row-locking SELECT. Preserve scoped conflict diagnostics and the existing paths for complex or observed writes.
