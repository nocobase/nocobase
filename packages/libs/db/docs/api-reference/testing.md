# 10. Testing

[Contents](./README.md) · [Previous: Events](./events.md) · [Next: driver extension appendix](./driver-extension.md)

`@nocobase/db/testing` is the package's second public entry. Its 21 exports support dialect tests and database provisioning.

## Scope and imports

The [testing entry](./signatures/testing.md) exports driver-runtime attachment and capability resolution, Knex config/client helpers, JSON-condition and temporal-SQL helpers, `DefaultFilterBuilder`, `DatabaseCollectionMetadataStore`, `CollectionRenameAtomicityError`, and `createSqlTestDatabaseProvisioner` with its supporting types. `TestDatabaseProvisioner` includes `provision` and optional `clone`, `listProvisioned` and `dropProvisioned`; returned databases provide `drop()`. Application integration tests generally consume the separate `@nocobase/db-testing` package rather than constructing these lower-level helpers.

`@nocobase/db-testing` and dialect packages are separate packages. They can be linked as usage context but their additional exports are not counted as APIs of `@nocobase/db`.

## Isolated database provisioning

`createSqlTestDatabaseProvisioner()` accepts dialect capabilities, connection creation and SQL provisioning statements. `TestDatabaseProvisioner` provisions databases and can optionally clone, list and drop provisioned databases. `ProvisionedTestDatabase` returns the connection configuration and a `drop()` operation for cleanup. See [provisioner signatures](./signatures/testing.md#testdatabaseprovisioner).

## Runtime and adapter helpers

| Helpers                                                      | Purpose                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `attachDatabaseDriverRuntime`, `resolveDatabaseCapabilities` | Attach dialect runtime strategies and resolve capabilities |
| `resolveKnexConnectionConfig`, `createKnexClient`            | Test resolved adapter configuration and client creation    |
| `compileJsonCondition`, `validateJsonCondition`              | Test JSON condition validation and compilation             |
| `temporalBinding`, `temporalProjection`                      | Test temporal SQL binding and projection                   |
| `DefaultFilterBuilder`                                       | Construct filters in dialect tests                         |
| `DatabaseCollectionMetadataStore`                            | Exercise the database-backed metadata implementation       |
| `CollectionRenameAtomicityError`                             | Inspect rename atomicity failures                          |

[Testing signatures](./signatures/testing.md) list every import and supporting option/result type. Types referenced from the root entry are linked to their owning chapters.

[Contents](./README.md) · [Previous: Events](./events.md) · [Next: driver extension appendix](./driver-extension.md)
