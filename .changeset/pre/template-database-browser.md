---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add a permission-aware Database Explorer to System settings for browsing database connections, tables, and fields: every table page is read before searching, primary keys and foreign key references come from table constraints, the connection, table and searches stay in the URL for refresh and Back, and narrow screens show one level at a time.
