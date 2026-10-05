---
'@nocobase/db-mysql': minor
---

Connections run their transactions at READ COMMITTED, the isolation level PostgreSQL, SQL Server, Oracle and OceanBase default to and the one NocoBase's code is written and tested against. Under MySQL's REPEATABLE READ default a transaction's snapshot was taken at its first read — the Collection metadata lookup every transaction starts with — so a check made after taking a lock still saw rows a concurrent transaction had committed away. Two administrators could delete each other and leave no enabled administrator, although the guard locks the Permission Set before counting. Each pooled connection sets `transaction isolation level read committed` for its session when it is created; within a transaction, a repeated read now sees what other transactions committed in between, as it does on PostgreSQL.
