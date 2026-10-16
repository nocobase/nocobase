---
'@nocobase/db': minor
'@nocobase/db-sqlite': patch
'@nocobase/db-postgres': patch
'@nocobase/db-mysql': patch
'@nocobase/db-oracle': patch
'@nocobase/db-mssql': patch
---

Let a driver declare the connection shape its hooks receive.

Splitting the dialects into packages left the driver descriptor's hooks disagreeing about how to say "a connection": seven took `unknown` and `resolveConnection` took the closed `ConnectionConfig` union. Neither is a type a contributed dialect can work with, so each package asserted its way back to its own — `@nocobase/db-dameng` through `source as unknown as DamengConnectionConfig`, a double assertion, which is what two types with no overlap require.

`DatabaseDriverDefinition<TDialect, TConfig>` now carries the connection type, and every hook receives it. All eight dialect packages name theirs and the assertions are gone; the lint rule that reports a redundant assertion is what removed the last of them.

The hooks are declared as methods rather than function properties. TypeScript checks method parameters bivariantly, which is what lets a driver narrowed to one dialect sit in the `drivers` map holding drivers for all of them. The pairing that gives up on is one the runtime enforces anyway: a driver is looked up by the connection's own dialect, so it is only ever handed a config of the dialect it declares.

`DatabaseConfig` is now an alias of `ExtensibleDatabaseConfig<ConnectionConfig>` rather than a second interface. The two were written out separately and stayed field-for-field identical, which left every consumer choosing between two names for one shape — `@nocobase/app-server` chose the closed one, which is why an application could not configure a contributed dialect at all.

Also: `AnyConnectionConfig` is exported as the constraint to write connection-generic code against; `BaseConnectionConfig.pool` is `Knex.PoolConfig` instead of `unknown`, which is what `configurePool` already said it was; and `@nocobase/db-oceanbase` declares `OceanbaseConnectionConfig` instead of reusing `MysqlConnectionConfig`, whose dialect literal is `'mysql'`.

This is a step toward inferring a database's connections from its registered `drivers`, which would turn `Database dialect "..." is not registered.` from a startup error into a compile error. That inference needs the driver to own its connection type first.
