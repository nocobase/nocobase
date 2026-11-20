---
"@nocobase/db": patch
"@nocobase/authorization": patch
"@nocobase/app-plugin-authorization": patch
---

Let application services check permissions, record access rules, and collection metadata in the same database transaction as their writes. Authorization binds only to active transactions from its configured database connection.
