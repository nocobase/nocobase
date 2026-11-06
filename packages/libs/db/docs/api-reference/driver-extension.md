# Appendix A. Driver and adapter extension

[Contents](./README.md) · [Previous: Testing](./testing.md) · [Next: errors and values](./errors-and-values.md)

Dialect authors use `DatabaseDriverDefinition`, `DatabaseDriverFactory`, `DatabaseDriverRegistration`, the runtime-strategy interfaces, `DatabaseCapabilities`, `BaseSchemaInspector`, physical-type normalization and column-capability helpers. `upsertPhysicalRow()` is a physical-table helper and does not provide Repository policy enforcement. Native client and dialect-specific connection configuration belongs to the driver package.

## Driver registration and resolution

`DatabaseDriverDefinition` describes a dialect; `DatabaseDriverFactory` constructs typed configurations; `DatabaseDriverRegistration` accepts either form. Applications register them in the manager configuration. `resolveDatabaseDriver()` resolves a configured driver. See [driver signatures](./signatures/drivers.md) and [DatabaseManager configuration](./database-manager.md#configuration-and-initialization).

## Runtime strategies and capabilities

`DatabaseDriverRuntime`, its factory/context and Query/Repository/Schema/Numeric strategy interfaces describe dialect hooks. `DatabaseCapabilities` declares feature support. `SchemaAdapter` is a supporting contract reachable through the connection; it is not a root-exported constructor. These declarations are in [driver signatures](./signatures/drivers.md).

## Inspector extension and physical normalization

`BaseSchemaInspector` is an exported runtime class with protected extension hooks. Normalization helpers cover physical data types, referential actions, defaults, numeric capabilities, SQLite affinity and temporal precision. Result helpers are `numberValue`, `optionalString` and `rawRows`. See [schema extension signatures](./signatures/schema.md), including supporting option types.

## Physical writes and testing helpers

`upsertPhysicalRow()` operates on a physical table using its own options and locking behavior. It does not apply Repository policy, relation planning or Repository mutation events. See [UpsertPhysicalRowOptions](./signatures/drivers.md#upsertphysicalrowoptions).

Runtime attachment, Knex construction and provisioning helpers exported only by `@nocobase/db/testing` belong to [Testing](./testing.md).
