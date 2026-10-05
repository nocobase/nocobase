---
'@nocobase/db': patch
---

The query builder binds a value compared with a temporal or boolean Field the way a write to that Field binds it, in a select's where clause and now also in an update's and a delete's, including `between`. A comparison bound the caller's value verbatim before: MySQL rejected `next_run_at <= '2026-10-02T03:45:25.880Z'` (`Incorrect datetime value`) although the same string was accepted by `set`, which already encoded it, and an update or delete compared a boolean Field with an unencoded value. Only a value the Field could store is encoded: a `like` pattern, a null test, a date without a time against a `datetime` and any other string that is not a complete literal reach the database as given, as every comparison did before.
