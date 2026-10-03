---
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-workflow': patch
---

User administration's search and the workflow list's `query` match regardless of case on every database. They used the Repository's default string mode, which follows the database's own comparison: case-insensitive on SQLite and MySQL, case-sensitive on PostgreSQL, where searching `alice` did not find `Alice`. Both now pass `{ mode: 'insensitive' }`.
