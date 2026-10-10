---
'@nocobase/db': minor
'@nocobase/db-sqlite': minor
'@nocobase/db-postgres': minor
'@nocobase/db-mysql': minor
'@nocobase/db-oracle': minor
'@nocobase/db-mssql': minor
'@nocobase/db-kingbase': patch
'@nocobase/db-oceanbase': minor
'@nocobase/db-dameng': patch
'@nocobase/app-server': minor
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-dag-flow': patch
---

Move concrete database connection types into their owning dialect packages and keep the core connection contract independent of installed dialects. Import `SqliteConnectionConfig`, `PostgresConnectionConfig`, `MysqlConnectionConfig`, `OracleConnectionConfig`, and `MssqlConnectionConfig` from the corresponding `@nocobase/db-<dialect>` package instead of `@nocobase/db`.

`ConnectionConfig` and the default `DatabaseConfig` and `AppDatabaseConfig` now describe the common runtime contract. For strict configuration checking, supply a concrete connection type or use `DatabaseConfigFromDrivers` and `AppDatabaseConfigFromDrivers`. The core also exports `DriverConnectionConfig` and `ConnectionConfigFromDrivers` for reusable driver inference. Preserve mutually exclusive host and socket targets in MySQL and OceanBase configuration and factory options.
