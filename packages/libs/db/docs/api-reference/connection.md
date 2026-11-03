# 2. Connection

[Contents](./README.md) · [Previous: DatabaseManager](./database-manager.md) · [Next: Migration and Seed](./migration-and-seed.md)

A DatabaseConnection exposes the handles and lifecycle for one configured connection. Obtain it with `db.connection(name?)`.

## Handles and lifecycle

On a [DatabaseConnection](./signatures/connection.md#databaseconnection), `builder`, `query`, `collections`, `collectionMetadata`, `schemaInspector` and `schema` are **properties**, while `repository()` is a method. Identity/capability properties are `name`, `driver`, `dialect`, `schemaManagement`, `capabilities` and `runtime`. It also exposes `restrict()`, `withPolicies()`, transaction callbacks and mutation subscriptions.

Connection lifecycle methods are `connect()`, `disconnect()`, `reconnect()` and `resetManagedSchema()`. The last operation destructively clears managed objects. `client<T>()` exposes the underlying adapter client. `schema` exposes low-level schema-adapter operations; application schema work normally uses `builder` in migrations. A connection configured with `schemaManagement: 'external'` restricts schema management and requires an explicit metadata store.

| Handle                                                            | Detailed chapter                                    |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| `builder`, `collections`, `collectionMetadata`, `schemaInspector` | [Collection and Schema](./collection-and-schema.md) |
| `query`                                                           | [Query](./query.md)                                 |
| `repository()`                                                    | [Repository](./repository.md)                       |
| `restrict()`, `withPolicies()`                                    | [Permissions](./permissions.md)                     |
| `transaction()`, `afterCommit()`, `afterRollback()`               | [Transactions](./transactions.md)                   |
| `onRepositoryMutation()`, `explainRepositoryEvents()`             | [Events](./events.md)                               |

## Configuration, naming and schema management

[`BaseConnectionConfig`](./signatures/connection.md#baseconnectionconfig) supplies naming, schema-management mode, metadata store, capability overrides, pool/driver options, internal-table declarations and error callbacks. `ConnectionConfig` adds the dialect identifier; native host, file and credential options come from the selected dialect package.

`naming.tablePrefix` and `naming.underscored` set connection naming defaults. Builder and Repository work with logical Collection/Field names; Query uses connection naming without Collection overrides; SchemaInspector uses physical names. See the [naming guide](../zh-CN/concepts/naming/overview.md) before mixing those surfaces.

`schemaManagement` is `managed` or `external`. External connections require an explicit metadata store and restrict schema-management operations. Custom bookkeeping tables can be declared in `internalTables` so the collection registry does not report them as application Collections. See [schema-management signatures](./signatures/connection.md#schemamanagementmode).

## Capabilities, runtime and native access

`capabilities` describes support for schemas, views, materialized views, foreign keys and other database features. `runtime` contains dialect-supplied strategies. Their contracts are in [Driver extension](./driver-extension.md); configuring a capability does not grant database privileges.

`client<T>()` exposes the underlying client with a caller-supplied type. `schema` is the low-level `SchemaAdapter`; its name is reachable through the connection signature but is not a package-entry export. Application schema changes normally go through CollectionBuilder in a migration.

## Complete signatures

[Connection declarations](./signatures/connection.md) contain all properties and methods, including methods whose behavior is explained in later chapters. Permission-derived handles are in [Permissions](./permissions.md), so full connection capabilities and restricted access are documented separately.

[Contents](./README.md) · [Previous: DatabaseManager](./database-manager.md) · [Next: Migration and Seed](./migration-and-seed.md)
