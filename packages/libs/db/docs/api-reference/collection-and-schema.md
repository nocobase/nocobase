# 4. Collection and Schema

[Contents](./README.md) · [Previous: Migration and Seed](./migration-and-seed.md) · [Next: Query](./query.md)

This chapter covers logical schema authoring, resolved Collections, physical inspection, supplemental metadata and portable artifacts.

| Topic                                        | Full signatures                            |
| -------------------------------------------- | ------------------------------------------ |
| CollectionBuilder and schema definitions     | [Builder](./signatures/builder.md)         |
| Resolved collection registry and diagnostics | [Collections](./signatures/collections.md) |
| Physical database inspection                 | [SchemaInspector](./signatures/schema.md)  |
| Metadata documents, service and stores       | [Metadata](./signatures/metadata.md)       |
| Serialized Collection files and manifests    | [Artifacts](./signatures/artifacts.md)     |

## CollectionBuilder

| CollectionBuilder methods                                               | Purpose                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `createCollection`, `createCollections`                                 | Create logical Collections from object definitions or fluent callbacks                      |
| `hasCollection`, `getCollection`                                        | Inspect current existence or definition                                                     |
| `alterCollection`, `dropCollection`, `renameCollection`                 | Change, remove or rename a Collection                                                       |
| `createViewCollection`, `replaceViewCollection`                         | Manage views                                                                                |
| `createMaterializedViewCollection`, `refreshMaterializedViewCollection` | Manage materialized views where supported                                                   |
| `addField`, `alterField`, `dropField`                                   | Change fields                                                                               |
| `addIndex`, `dropIndex`, `addConstraint`, `dropConstraint`              | Change indexes and constraints                                                              |
| `apply(operations, options?)`                                           | Execute structured `CollectionOperation[]` plans                                            |
| `transaction(fn)`                                                       | Currently invokes the callback with the same builder; does not start a database transaction |

Use the callback interfaces [CollectionDefinitionBuilder](./signatures/builder.md#collectiondefinitionbuilder), [CollectionAlterBuilder](./signatures/builder.md#collectionalterbuilder), [FieldDefinitionBuilder](./signatures/builder.md#fielddefinitionbuilder) and [RelationFieldBuilder](./signatures/builder.md#relationfieldbuilder) for the complete field, relation, index and constraint method lists. They are distinct from the connection's executable CollectionBuilder.

`BuilderExecOptions` includes dry-run, SQL preview, strict capability handling and existence checks. `BuilderResult` reports the logical and schema operations, warnings, impact and optional SQL. The `transaction` execution option is reserved; use a transaction connection's builder for real transaction participation. Naming uses logical Collection/Field names. Physical schema inspection uses physical identities, and Query uses connection naming rather than Collection overrides.

`BuilderResult.metadata` is also reserved and is not populated by the current implementation. These placeholders and the non-transactional `builder.transaction()` are covered by [review finding F2](./release-review.md#f2-builder-transaction-entry-points-do-not-provide-atomicity).

## Fields, relations, indexes, constraints and views

| Definition                                        | Purpose and related contracts                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `CollectionDefinition`                            | Table/view/materialized-view kind, fields, naming, constraints, indexes and optimistic-lock configuration |
| `FieldDefinition`, `FieldDefinitionBuilder`       | Scalar field types, defaults, nullability and database-specific options                                   |
| `RelationFieldDefinition`, `RelationFieldBuilder` | `belongsTo`, `hasOne`, `hasMany`, `belongsToMany`, keys and through collections                           |
| `IndexDefinition`                                 | Indexed fields, uniqueness and dialect-dependent index options                                            |
| `ConstraintDefinition`                            | Primary, unique, foreign-key and check constraints                                                        |
| View definitions                                  | View queries and materialized-view capabilities                                                           |

The [Builder signatures](./signatures/builder.md) identify which names can be imported and which are supporting types. Relation metadata, physical foreign keys and nested Repository writes have different contracts: use [relation schema examples](../zh-CN/builder/relations.md), [view examples](../zh-CN/builder/view-collections.md) and [Repository relation writes](./repository.md#relations-and-nested-writes) for those boundaries.

## Registry, inspection and metadata handles

| Handle                          | Methods                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `connection.collections`        | `get`, `getPhysical`, `getResolution`, `list`, `scan`, `refresh`, `invalidate`, `validateRelations`, `diagnose`                                        |
| `connection.collectionMetadata` | `get`, `replaceDocument`, `removeDocument`, `updateCollection`, `updateField`, `setRelation`, `removeRelation`, `removeField`; `capabilities` property |
| `CollectionMetadataStore`       | `initialize`, `get`, `list`, `put`, `delete`; `capabilities` property                                                                                  |
| `connection.schemaInspector`    | `listSchemas`, `getPhysicalCollection`, `listPhysicalCollections`, `scanPhysicalCollections`                                                           |

## Collections registry and diagnostics

Registry entries combine physical structure with supplemental metadata. `get()` resolves a logical Collection, while physical lookup uses `getPhysical()`. Listing/scanning, resolution reports, `validateRelations()` and `diagnose()` provide discovery and diagnostics. `refresh()` and `invalidate()` act on a cache shared by the connection's handles. See [registry signatures](./signatures/collections.md).

## SchemaInspector and physical schema

`schemaInspector` reads physical schemas, collections, columns, indexes and constraints. Inspection results include completeness and warnings rather than promising every dialect exposes every aspect. Its identifiers are physical names. See [physical schema signatures](./signatures/schema.md) and [inspection examples](../zh-CN/schema-inspector/examples.md).

## Metadata documents, service and stores

`defineCollectionMetadata()` and `validateCollectionMetadataDocument()` describe and validate supplemental metadata; `extractLegacyCollectionMetadata()` supports explicit conversion of old definitions. The service at `connection.collectionMetadata` applies validated patches and invalidates related cached definitions. Metadata updates do not substitute for physical DDL.

`CollectionMetadataStore` defines storage operations and revision-based concurrency checks. Runtime store exports are `InMemoryCollectionMetadataStore`, `ModuleCollectionMetadataStore` and `DirectoryCollectionMetadataStore`; `DatabaseCollectionMetadataStore` is exposed through the testing entry. See [metadata signatures](./signatures/metadata.md) for documents, patches, capabilities, store options and structured errors.

## Artifacts and manifests

`serializeCollectionArtifact()` and `serializeCollectionArtifactManifest()` produce portable representations of Collection definitions, physical schema and supplemental metadata. Artifact exports also include format/file-name constants, directory-name validation and conflict helpers. See [artifact signatures](./signatures/artifacts.md). These helpers serialize and validate artifacts; their presence does not imply a general database import/export API.

[Contents](./README.md) · [Previous: Migration and Seed](./migration-and-seed.md) · [Next: Query](./query.md)
