---
'@nocobase/db': patch
'@nocobase/db-sqlite': patch
'@nocobase/db-postgres': patch
'@nocobase/db-mysql': patch
'@nocobase/db-oracle': patch
'@nocobase/db-mssql': patch
---

Decode JSON columns according to a result form the dialect declares instead of guessing from the value.

A driver either parses a JSON column before returning the row or hands back the stored text, and the returned value carries no evidence of which. Decoding by attempting to parse any string therefore corrupted a JSON string whose content is itself JSON: writing `'{"a":1}'` and reading it back produced the object `{ a: 1 }` on PostgreSQL, Kingbase, MySQL, and OceanBase, whose drivers parse JSON themselves. Each dialect now declares `jsonResults`, and a value that a text driver cannot parse is reported as `INVALID_STORED_VALUE` rather than returned as the raw string.

Where the driver can be told to behave the other way, the declaration is derived from the resolved connection rather than fixed: mysql2 returns a json column as text under `jsonStrings`, which reaches it through `driverOptions`, and the Dameng driver decodes the column under `parseJson`. A fixed declaration would be wrong for exactly those connections, which is the failure this change exists to remove.

Query and Repository also no longer disagree about a column holding the JSON literal `null`: Query fell back to the raw value whenever a decoder legitimately returned `null`, so the stored text leaked back to the caller.

Altering a JSON column on Oracle no longer fails with `ORA-40664`. Knex compiles a JSON column to `varchar2(4000) check (col is json)`, and repeating that definition on a MODIFY asks Oracle for a second IS JSON check constraint on the same column. A dialect now learns whether a column is being created or redefined, and Oracle omits the constraint while altering; the MODIFY leaves the constraint the original definition created in place.

A dialect that builds a JSON column as something other than Knex's `json()` also loses the JSON default handling that comes with it, and an object default would reach the column as `[object Object]` — on Oracle that is text its own IS JSON constraint then rejects. Such a dialect now asks for the default as encoded text, while MySQL keeps receiving the value because that is what makes it compile the expression form its engine requires. A JSON default consequently works on Dameng, where the column is a plain clob and the default was silently stored as something that could not be read back.
