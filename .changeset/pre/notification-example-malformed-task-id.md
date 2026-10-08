---
'@nocobase/app-plugin-notification-example': patch
---

A task route given an id that is not a UUID, such as `/tasks/missing`, answers 403 `TASK_ACCESS_DENIED` like a task the caller cannot see, instead of 500 on PostgreSQL, Kingbase and MSSQL, which reject comparing a malformed value with the `uuid` column where SQLite and MySQL match nothing. An id given in uppercase now names the same task on every dialect, where before it matched only on dialects that compare `uuid` values natively.
