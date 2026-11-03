# Appendix B. Errors, values and shared helpers

[Contents](./README.md) · [Previous: driver extension](./driver-extension.md) · [Next: complete export index](./exports.md)

## Structured errors

| Family                                         | Contracts and reference                                                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repository operations                          | [RepositoryError](./signatures/values.md#repositoryerror), codes, status metadata and options                                                                                                                |
| Connection configuration and schema management | [CollectionMetadataStoreRequiredError](./signatures/database-manager.md#collectionmetadatastorerequirederror), [SchemaManagementNotAllowedError](./signatures/connection.md#schemamanagementnotallowederror) |
| Collection resolution and relation validation  | [CollectionResolutionError](./signatures/collections.md#collectionresolutionerror), [CollectionRelationValidationError](./signatures/collections.md#collectionrelationvalidationerror)                       |
| Metadata validation, patches and persistence   | [Metadata error classes](./signatures/metadata.md) for invalid documents/patches, revision conflicts and read-only stores                                                                                    |
| Unsupported database features                  | [UnsupportedCapabilityError](./signatures/drivers.md#unsupportedcapabilityerror)                                                                                                                             |
| Migration/seed task contention                 | [TaskLockBusyError](./signatures/migration.md#tasklockbusyerror), `isTaskLockBusyError`                                                                                                                      |
| Artifact directory names                       | [CollectionArtifactNameError](./signatures/artifacts.md#collectionartifactnameerror)                                                                                                                         |
| Rename atomicity in testing                    | [CollectionRenameAtomicityError](./signatures/testing.md#collectionrenameatomicityerror)                                                                                                                     |

Error structures are part of the library contract. `repositoryErrorStatuses` supplies status metadata; it does not define HTTP routes. See each operation's chapter for the conditions that produce an error.

## Values and field capabilities

`RepositoryError` exposes structured codes and metadata. Field discovery helpers include `filterOperatorsForFieldType`, `isSortableFieldType`, `supportsFilterShorthand`, `isManagedField`, `writableFields` and `writePolicyProblems`. Temporal helpers are `isTemporalType` and `normalizeTemporalValue`; portable JSON types are `JsonValue` and `JsonResultForm`. These describe representation or capability and do not authorize a caller.

[Value and helper signatures](./signatures/values.md) include temporal inputs/results, JSON types and writable-field validation. Repository usage is explained in [field capability discovery](./repository.md#field-capability-discovery), and permission configuration validation in [method-level writePolicy](./permissions.md#method-level-writepolicy).

## Importable types and supporting contracts

Each signature page labels root/testing exports separately from supporting contracts. An interface used by a returned object can be public to callers without its name being exported from a package entry. Obtain those objects through their owners, and avoid deep imports. The [complete export index](./exports.md) gives the importable names; generic inputs and results stay alongside their corresponding operations.
