---
'@nocobase/db-sqlite': patch
---

A transaction whose COMMIT fails on SQLite is now rolled back. SQLite keeps the transaction open when COMMIT fails — on a deferred foreign key violation, or with `SQLITE_BUSY` while another process reads the file — and Knex released the connection without rolling it back, so every later `transaction()` failed with `cannot start a transaction within a transaction` and every later query ran inside the failed transaction, seeing its writes and losing its own. The transaction still rejects with the COMMIT's error; if the rollback itself fails, the connection is discarded instead of being reused.
