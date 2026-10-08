---
'@nocobase/app-plugin-file': minor
---

Export `FILE_COLUMNS` and its element type `FileColumn` from `@nocobase/app-plugin-file/server`, so application code that selects or checks the columns a file Collection must provide can import the contract instead of copying it. Migrations should still declare their columns explicitly.
