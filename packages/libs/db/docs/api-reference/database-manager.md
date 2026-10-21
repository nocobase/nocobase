# 1. DatabaseManager

[Contents](./README.md) · [Next: Connection](./connection.md)

DatabaseManager owns named connections and provides application-level shortcuts to their handles. Start here to configure a database; use the next chapter for one connection's capabilities.

## Configuration and initialization

Use `defineDatabase()` for driver-aware configuration typing. Drivers are supplied by separate dialect packages. For example, this explicit SQLite setup uses a value exported by `@nocobase/db-sqlite`, not by `@nocobase/db`:

```ts
import { createDatabaseManager, defineDatabase } from '@nocobase/db';
import { sqlite } from '@nocobase/db-sqlite';

const db = createDatabaseManager(
  defineDatabase({
    default: 'main',
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  }),
);

const connection = db.connection();
await connection.connect();
await db.destroy();
```

`DatabaseConfig` and `ExtensibleDatabaseConfig` describe the `connections` map, optional `default`, driver registrations and the manager-level metadata store. `DatabaseConfigFromDrivers`, `ConnectionConfigFromDrivers` and `DriverConnectionConfig` preserve driver-specific connection typing. Driver factories and descriptors belong to their dialect packages; the [extension appendix](./driver-extension.md#driver-registration-and-resolution) documents the shared contracts.

If `default` is omitted, the manager selects the first key in `connections`. An empty configuration fails when a default connection is requested. For several connections, an explicit `default` makes the selection independent of map construction order.

See [configuration signatures](./signatures/database-manager.md#databaseconfig) and [connection options](./connection.md#configuration-naming-and-schema-management).

## Named connections and handle shortcuts

[DatabaseManager](./signatures/database-manager.md#databasemanager) is the application-level entry. Its connection-name arguments are optional and select the configured default when omitted.

| Manager method                                                   | Result or purpose                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `connection(name?)`                                              | `DatabaseConnection` for a configured name                        |
| `builder(name?)`                                                 | The connection's `CollectionBuilder`                              |
| `query(name?)`                                                   | The connection's `QueryAdapter`                                   |
| `collections(name?)`                                             | The connection's shared `ConnectionCollections` registry          |
| `repository<TRecord, TCreate, TUpdate>(collection, connection?)` | A Collection-aware repository                                     |
| `createMigrator(options)` / `createSeeder(options)`              | A runner using this manager                                       |
| `connect(name?)` / `reconnect(name?)`                            | A promise of the connection                                       |
| `disconnect(name?)`                                              | Close one connection                                              |
| `destroy()`                                                      | Close all connections managed by this instance                    |
| `transaction(fn, name?)`                                         | Invoke `fn` with the transaction connection and return its result |

Handle shortcuts return the handles belonging to the selected connection. In particular, `collections(name)` shares the connection's registry cache. Connection selection is described by the manager configuration; CRUD methods and schema operations are documented in their own chapters.

## Service container integration

[`databaseManagerToken`](./signatures/database-manager.md#databasemanagertoken) is a `ServiceToken<DatabaseManager>` for the application manager registered in a service container. Obtain the application-managed instance through that token when using the service-provider integration.

## Related contracts

The [complete Manager signatures](./signatures/database-manager.md) include configuration generics, manager methods and metadata-store configuration errors. `transaction()` is listed here as an entry point; [Transactions](./transactions.md) owns propagation, savepoint and callback behavior.

[Contents](./README.md) · [Next: Connection](./connection.md)
