---
'@nocobase/app-plugin-departments-example': patch
---

The organization seed's restriction-rule assignments get ids that fit the 64-character `id` column, such as `departments-example:trading:authorizationExampleQuotes` instead of `departments-example:trading:example-public-authorizationExampleQuotes`. The longer ids made the seed fail on PostgreSQL (`value too long for type character varying(64)`) and MySQL (`Data too long for column 'id'`), so the application did not start; SQLite does not enforce the length. An installation already seeded on SQLite keeps its rows: the seed recognises an assignment by rule and department, not by id.
