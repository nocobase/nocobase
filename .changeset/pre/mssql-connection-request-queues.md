---
'@nocobase/db-mssql': patch
---

Keep queued SQL requests on their owning connection and execute them in order, preventing queries from crossing transaction boundaries during concurrent work.
