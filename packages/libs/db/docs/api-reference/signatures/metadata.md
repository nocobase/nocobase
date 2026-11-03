# Collection metadata: signatures

Define, validate, store and patch supplemental Collection metadata. Obtain the metadata service from connection.collectionMetadata; it is not a root-exported constructor. Store revisions support conflict detection.

[Chapter](../collection-and-schema.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                                         | Access               |
| ----------------------------------------------------------------------------------- | -------------------- |
| [CollectionFieldMetadataPatch](#collectionfieldmetadatapatch)                       | Supporting contract  |
| [CollectionMetadataConflictError](#collectionmetadataconflicterror)                 | `@nocobase/db` value |
| [CollectionMetadataDocument](#collectionmetadatadocument)                           | `@nocobase/db` type  |
| [CollectionMetadataIssue](#collectionmetadataissue)                                 | Supporting contract  |
| [CollectionMetadataIssueCode](#collectionmetadataissuecode)                         | Supporting contract  |
| [CollectionMetadataNamingSnapshot](#collectionmetadatanamingsnapshot)               | Supporting contract  |
| [CollectionMetadataPage](#collectionmetadatapage)                                   | Supporting contract  |
| [CollectionMetadataPatchError](#collectionmetadatapatcherror)                       | `@nocobase/db` value |
| [CollectionMetadataPropertiesPatch](#collectionmetadatapropertiespatch)             | Supporting contract  |
| [CollectionMetadataService](#collectionmetadataservice)                             | Supporting contract  |
| [CollectionMetadataStore](#collectionmetadatastore)                                 | `@nocobase/db` type  |
| [CollectionMetadataStoreCapabilities](#collectionmetadatastorecapabilities)         | Supporting contract  |
| [CollectionMetadataStoreReadOnlyError](#collectionmetadatastorereadonlyerror)       | `@nocobase/db` value |
| [CollectionMetadataSummary](#collectionmetadatasummary)                             | Supporting contract  |
| [CollectionMetadataValidationError](#collectionmetadatavalidationerror)             | `@nocobase/db` value |
| [DatabaseCollectionMetadataStoreOptions](#databasecollectionmetadatastoreoptions)   | Supporting contract  |
| [DeleteCollectionMetadataOptions](#deletecollectionmetadataoptions)                 | Supporting contract  |
| [DirectoryCollectionMetadataStore](#directorycollectionmetadatastore)               | `@nocobase/db` value |
| [DirectoryCollectionMetadataStoreOptions](#directorycollectionmetadatastoreoptions) | `@nocobase/db` type  |
| [FieldMetadata](#fieldmetadata)                                                     | `@nocobase/db` type  |
| [InMemoryCollectionMetadataStore](#inmemorycollectionmetadatastore)                 | `@nocobase/db` value |
| [LegacyMetadataExtractionDiagnostic](#legacymetadataextractiondiagnostic)           | Supporting contract  |
| [LegacyMetadataExtractionDiagnosticCode](#legacymetadataextractiondiagnosticcode)   | Supporting contract  |
| [LegacyMetadataExtractionOptions](#legacymetadataextractionoptions)                 | Supporting contract  |
| [LegacyMetadataExtractionResult](#legacymetadataextractionresult)                   | Supporting contract  |
| [ListCollectionMetadataOptions](#listcollectionmetadataoptions)                     | Supporting contract  |
| [ModuleCollectionMetadataStore](#modulecollectionmetadatastore)                     | `@nocobase/db` value |
| [ModuleCollectionMetadataStoreOptions](#modulecollectionmetadatastoreoptions)       | Supporting contract  |
| [NamingSnapshotCache](#namingsnapshotcache)                                         | Supporting contract  |
| [PutCollectionMetadataOptions](#putcollectionmetadataoptions)                       | Supporting contract  |
| [RelationMetadata](#relationmetadata)                                               | `@nocobase/db` type  |
| [StoredCollectionMetadata](#storedcollectionmetadata)                               | Supporting contract  |
| [UpdateCollectionMetadataOptions](#updatecollectionmetadataoptions)                 | Supporting contract  |
| [defineCollectionMetadata](#definecollectionmetadata)                               | `@nocobase/db` value |
| [extractLegacyCollectionMetadata](#extractlegacycollectionmetadata)                 | `@nocobase/db` value |
| [validateCollectionMetadataDocument](#validatecollectionmetadatadocument)           | `@nocobase/db` value |

## CollectionFieldMetadataPatch

[Source](../../../src/metadata/service.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionFieldMetadataPatch {
  readonly type?: FieldMetadata['type'] | null;
  readonly values?: readonly string[] | null;
  readonly title?: string | null;
  readonly description?: string | null;
}
```

Related declarations: [FieldMetadata](./metadata.md#fieldmetadata).

## CollectionMetadataConflictError

[Source](../../../src/metadata/document-store-errors.ts)

Import: `import { CollectionMetadataConflictError } from '@nocobase/db'`.

```ts
export declare class CollectionMetadataConflictError extends Error {
  readonly collection: string;
  readonly expectedRevision: string | number | null;
  readonly actualRevision: string | number | null;
  readonly code: 'METADATA_CONFLICT';
  constructor(
    collection: string,
    expectedRevision: string | number | null,
    actualRevision: string | number | null,
  );
}
```

## CollectionMetadataDocument

[Source](../../../src/metadata/document.ts)

Import: `import type { CollectionMetadataDocument } from '@nocobase/db'`.

```ts
export interface CollectionMetadataDocument {
  version: 1;
  name: string;
  naming?: NamingOptions;
  title?: string;
  description?: string;
  optimisticLock?: OptimisticLockDefinition;
  fields?: Record<string, FieldMetadata>;
  relations?: Record<string, RelationMetadata>;
}
```

Related declarations: [FieldMetadata](./metadata.md#fieldmetadata), [NamingOptions](./builder.md#namingoptions), [OptimisticLockDefinition](./builder.md#optimisticlockdefinition), [RelationMetadata](./metadata.md#relationmetadata).

## CollectionMetadataIssue

[Source](../../../src/metadata/errors.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionMetadataIssue {
  code: CollectionMetadataIssueCode;
  path: readonly (string | number)[];
  message: string;
}
```

Related declarations: [CollectionMetadataIssueCode](./metadata.md#collectionmetadataissuecode).

## CollectionMetadataIssueCode

[Source](../../../src/metadata/errors.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type CollectionMetadataIssueCode =
  | 'COLLECTION_METADATA_VERSION_UNSUPPORTED'
  | 'COLLECTION_METADATA_REQUIRED'
  | 'COLLECTION_METADATA_TYPE_INVALID'
  | 'COLLECTION_METADATA_UNKNOWN_PROPERTY'
  | 'COLLECTION_METADATA_NAME_INVALID'
  | 'COLLECTION_METADATA_NAME_CONFLICT'
  | 'COLLECTION_METADATA_OPTIMISTIC_LOCK_INVALID'
  | 'COLLECTION_METADATA_RELATION_INVALID';
```

## CollectionMetadataNamingSnapshot

[Source](../../../src/metadata/internal/naming-snapshot.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type CollectionMetadataNamingSnapshot =
  readonly CollectionMetadataSummary[];
```

Related declarations: [CollectionMetadataSummary](./metadata.md#collectionmetadatasummary).

## CollectionMetadataPage

[Source](../../../src/metadata/document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionMetadataPage {
  readonly items: readonly CollectionMetadataSummary[];
  readonly nextCursor?: string;
}
```

Related declarations: [CollectionMetadataSummary](./metadata.md#collectionmetadatasummary).

## CollectionMetadataPatchError

[Source](../../../src/metadata/service-errors.ts)

Import: `import { CollectionMetadataPatchError } from '@nocobase/db'`.

```ts
export declare class CollectionMetadataPatchError extends Error {
  readonly issues: readonly CollectionMetadataIssue[];
  readonly code: 'COLLECTION_METADATA_PATCH_INVALID';
  constructor(issues: readonly CollectionMetadataIssue[]);
}
```

Related declarations: [CollectionMetadataIssue](./metadata.md#collectionmetadataissue).

## CollectionMetadataPropertiesPatch

[Source](../../../src/metadata/service.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionMetadataPropertiesPatch {
  readonly naming?: NamingOptions | null;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly optimisticLock?: OptimisticLockDefinition | null;
}
```

Related declarations: [NamingOptions](./builder.md#namingoptions), [OptimisticLockDefinition](./builder.md#optimisticlockdefinition).

## CollectionMetadataService

[Source](../../../src/metadata/service.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export declare class CollectionMetadataService {
  get capabilities(): CollectionMetadataStoreCapabilities;
  get(name: string): Promise<StoredCollectionMetadata | undefined>;
  replaceDocument(
    input: CollectionMetadataDocument,
    options?: UpdateCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata | undefined>;
  removeDocument(
    name: string,
    options?: UpdateCollectionMetadataOptions,
  ): Promise<void>;
  updateCollection(
    name: string,
    patch: CollectionMetadataPropertiesPatch,
    options?: UpdateCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata | undefined>;
  updateField(
    collection: string,
    field: string,
    patch: CollectionFieldMetadataPatch,
    options?: UpdateCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata | undefined>;
  setRelation(
    collection: string,
    name: string,
    relation: RelationMetadata,
    options?: UpdateCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata>;
  removeRelation(
    collection: string,
    name: string,
    options?: UpdateCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata | undefined>;
  removeField(
    collection: string,
    field: string,
    options?: UpdateCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata | undefined>;
}
```

Related declarations: [CollectionFieldMetadataPatch](./metadata.md#collectionfieldmetadatapatch), [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [CollectionMetadataPropertiesPatch](./metadata.md#collectionmetadatapropertiespatch), [CollectionMetadataStoreCapabilities](./metadata.md#collectionmetadatastorecapabilities), [RelationMetadata](./metadata.md#relationmetadata), [StoredCollectionMetadata](./metadata.md#storedcollectionmetadata), [UpdateCollectionMetadataOptions](./metadata.md#updatecollectionmetadataoptions).

## CollectionMetadataStore

[Source](../../../src/metadata/document-store.ts)

Import: `import type { CollectionMetadataStore } from '@nocobase/db'`.

The versioned supplemental Collection Metadata document Store contract.

```ts
/** The versioned supplemental Collection Metadata document Store contract. */
export interface CollectionMetadataStore {
  readonly capabilities: CollectionMetadataStoreCapabilities;
  initialize(): Promise<void>;
  get(name: string): Promise<StoredCollectionMetadata | undefined>;
  list(
    options?: ListCollectionMetadataOptions,
  ): Promise<CollectionMetadataPage>;
  put(
    document: CollectionMetadataDocument,
    options: PutCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata>;
  delete(name: string, options: DeleteCollectionMetadataOptions): Promise<void>;
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [CollectionMetadataPage](./metadata.md#collectionmetadatapage), [CollectionMetadataStoreCapabilities](./metadata.md#collectionmetadatastorecapabilities), [DeleteCollectionMetadataOptions](./metadata.md#deletecollectionmetadataoptions), [ListCollectionMetadataOptions](./metadata.md#listcollectionmetadataoptions), [PutCollectionMetadataOptions](./metadata.md#putcollectionmetadataoptions), [StoredCollectionMetadata](./metadata.md#storedcollectionmetadata).

## CollectionMetadataStoreCapabilities

[Source](../../../src/metadata/document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionMetadataStoreCapabilities {
  readonly writable: boolean;
  readonly optimisticConcurrency: boolean;
}
```

## CollectionMetadataStoreReadOnlyError

[Source](../../../src/metadata/document-store-errors.ts)

Import: `import { CollectionMetadataStoreReadOnlyError } from '@nocobase/db'`.

```ts
export declare class CollectionMetadataStoreReadOnlyError extends Error {
  readonly operation: 'put' | 'delete';
  readonly source?: string | undefined;
  readonly code: 'METADATA_STORE_READ_ONLY';
  constructor(operation: 'put' | 'delete', source?: string | undefined);
}
```

## CollectionMetadataSummary

[Source](../../../src/metadata/document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionMetadataSummary {
  readonly name: string;
  readonly revision: string | number;
  readonly naming?: NamingOptions;
  readonly title?: string;
  readonly description?: string;
}
```

Related declarations: [NamingOptions](./builder.md#namingoptions).

## CollectionMetadataValidationError

[Source](../../../src/metadata/errors.ts)

Import: `import { CollectionMetadataValidationError } from '@nocobase/db'`.

```ts
export declare class CollectionMetadataValidationError extends Error {
  readonly issues: readonly CollectionMetadataIssue[];
  readonly code: 'COLLECTION_METADATA_INVALID';
  constructor(issues: readonly CollectionMetadataIssue[]);
}
```

Related declarations: [CollectionMetadataIssue](./metadata.md#collectionmetadataissue).

## DatabaseCollectionMetadataStoreOptions

[Source](../../../src/metadata/internal/database-document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface DatabaseCollectionMetadataStoreOptions {
  readonly resolveClient: () => Promise<Knex>;
  readonly tableName?: string;
  readonly schema?: string;
}
```

## DeleteCollectionMetadataOptions

[Source](../../../src/metadata/document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface DeleteCollectionMetadataOptions {
  readonly expectedRevision: string | number;
}
```

## DirectoryCollectionMetadataStore

[Source](../../../src/metadata/directory-document-store.ts)

Import: `import { DirectoryCollectionMetadataStore } from '@nocobase/db'`.

Reads supplemental Collection metadata from a directory of `<name>.json` files, each one a Collection metadata document. The files are the source: for an external connection nothing else can hold metadata, so they are written by hand and committed. Read-only, like the Module store. This is deliberately a different layout from the Collection artifacts `serializeCollectionArtifact()` writes, whose `<name>/metadata.json` is a derived copy. A directory in that layout is refused rather than read, so a store pointed at generated artifacts cannot mistake a snapshot for its source.

```ts
export declare class DirectoryCollectionMetadataStore implements CollectionMetadataStore {
  readonly capabilities: CollectionMetadataStoreCapabilities;
  readonly directory: string;
  constructor(options: DirectoryCollectionMetadataStoreOptions);
  initialize(): Promise<void>;
  get(name: string): Promise<StoredCollectionMetadata | undefined>;
  list(
    options?: ListCollectionMetadataOptions,
  ): Promise<CollectionMetadataPage>;
  put(
    _document: CollectionMetadataDocument,
    _options: PutCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata>;
  delete(
    _name: string,
    _options: DeleteCollectionMetadataOptions,
  ): Promise<void>;
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [CollectionMetadataPage](./metadata.md#collectionmetadatapage), [CollectionMetadataStore](./metadata.md#collectionmetadatastore), [CollectionMetadataStoreCapabilities](./metadata.md#collectionmetadatastorecapabilities), [DeleteCollectionMetadataOptions](./metadata.md#deletecollectionmetadataoptions), [DirectoryCollectionMetadataStoreOptions](./metadata.md#directorycollectionmetadatastoreoptions), [ListCollectionMetadataOptions](./metadata.md#listcollectionmetadataoptions), [PutCollectionMetadataOptions](./metadata.md#putcollectionmetadataoptions), [StoredCollectionMetadata](./metadata.md#storedcollectionmetadata).

## DirectoryCollectionMetadataStoreOptions

[Source](../../../src/metadata/directory-document-store.ts)

Import: `import type { DirectoryCollectionMetadataStoreOptions } from '@nocobase/db'`.

```ts
export interface DirectoryCollectionMetadataStoreOptions {
  /**
   * A directory of hand-written metadata: one `<name>.json` per Collection,
   * holding that Collection's metadata document. Relative paths resolve
   * against the process working directory, so callers that know an application
   * root should resolve them first.
   */
  readonly directory: string;
}
```

## FieldMetadata

[Source](../../../src/metadata/document.ts)

Import: `import type { FieldMetadata } from '@nocobase/db'`.

```ts
export interface FieldMetadata {
  /** Explicit scalar semantic type; physical structure remains inspector-owned. */
  type?: FieldType;
  values?: readonly string[];
  title?: string;
  description?: string;
}
```

Related declarations: [FieldType](./builder.md#fieldtype).

## InMemoryCollectionMetadataStore

[Source](../../../src/metadata/in-memory-document-store.ts)

Import: `import { InMemoryCollectionMetadataStore } from '@nocobase/db'`.

```ts
export declare class InMemoryCollectionMetadataStore implements CollectionMetadataStore {
  readonly capabilities: CollectionMetadataStoreCapabilities;
  initialize(): Promise<void>;
  get(name: string): Promise<StoredCollectionMetadata | undefined>;
  list(
    options?: ListCollectionMetadataOptions,
  ): Promise<CollectionMetadataPage>;
  put(
    input: CollectionMetadataDocument,
    options: PutCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata>;
  delete(name: string, options: DeleteCollectionMetadataOptions): Promise<void>;
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [CollectionMetadataPage](./metadata.md#collectionmetadatapage), [CollectionMetadataStore](./metadata.md#collectionmetadatastore), [CollectionMetadataStoreCapabilities](./metadata.md#collectionmetadatastorecapabilities), [DeleteCollectionMetadataOptions](./metadata.md#deletecollectionmetadataoptions), [ListCollectionMetadataOptions](./metadata.md#listcollectionmetadataoptions), [PutCollectionMetadataOptions](./metadata.md#putcollectionmetadataoptions), [StoredCollectionMetadata](./metadata.md#storedcollectionmetadata).

## LegacyMetadataExtractionDiagnostic

[Source](../../../src/metadata/legacy-extraction.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface LegacyMetadataExtractionDiagnostic {
  severity: 'warning' | 'error';
  code: LegacyMetadataExtractionDiagnosticCode;
  path: readonly (string | number)[];
  message: string;
}
```

Related declarations: [LegacyMetadataExtractionDiagnosticCode](./metadata.md#legacymetadataextractiondiagnosticcode).

## LegacyMetadataExtractionDiagnosticCode

[Source](../../../src/metadata/legacy-extraction.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type LegacyMetadataExtractionDiagnosticCode =
  | 'LEGACY_METADATA_INVALID'
  | 'LEGACY_METADATA_PROPERTY_REMOVED'
  | 'LEGACY_METADATA_VIRTUAL_FIELD_UNSUPPORTED'
  | 'LEGACY_METADATA_PHYSICAL_MAPPING_INCOMPATIBLE';
```

## LegacyMetadataExtractionOptions

[Source](../../../src/metadata/legacy-extraction.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface LegacyMetadataExtractionOptions {
  naming?: NamingOptions;
}
```

Related declarations: [NamingOptions](./builder.md#namingoptions).

## LegacyMetadataExtractionResult

[Source](../../../src/metadata/legacy-extraction.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface LegacyMetadataExtractionResult {
  document?: CollectionMetadataDocument;
  diagnostics: readonly LegacyMetadataExtractionDiagnostic[];
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [LegacyMetadataExtractionDiagnostic](./metadata.md#legacymetadataextractiondiagnostic).

## ListCollectionMetadataOptions

[Source](../../../src/metadata/document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ListCollectionMetadataOptions {
  readonly limit?: number;
  readonly cursor?: string;
}
```

## ModuleCollectionMetadataStore

[Source](../../../src/metadata/module-document-store.ts)

Import: `import { ModuleCollectionMetadataStore } from '@nocobase/db'`.

```ts
export declare class ModuleCollectionMetadataStore implements CollectionMetadataStore {
  readonly capabilities: CollectionMetadataStoreCapabilities;
  constructor(options: ModuleCollectionMetadataStoreOptions);
  initialize(): Promise<void>;
  get(name: string): Promise<StoredCollectionMetadata | undefined>;
  list(
    options?: ListCollectionMetadataOptions,
  ): Promise<CollectionMetadataPage>;
  put(
    _document: CollectionMetadataDocument,
    _options: PutCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata>;
  delete(
    _name: string,
    _options: DeleteCollectionMetadataOptions,
  ): Promise<void>;
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [CollectionMetadataPage](./metadata.md#collectionmetadatapage), [CollectionMetadataStore](./metadata.md#collectionmetadatastore), [CollectionMetadataStoreCapabilities](./metadata.md#collectionmetadatastorecapabilities), [DeleteCollectionMetadataOptions](./metadata.md#deletecollectionmetadataoptions), [ListCollectionMetadataOptions](./metadata.md#listcollectionmetadataoptions), [ModuleCollectionMetadataStoreOptions](./metadata.md#modulecollectionmetadatastoreoptions), [PutCollectionMetadataOptions](./metadata.md#putcollectionmetadataoptions), [StoredCollectionMetadata](./metadata.md#storedcollectionmetadata).

## ModuleCollectionMetadataStoreOptions

[Source](../../../src/metadata/module-document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ModuleCollectionMetadataStoreOptions {
  readonly documents: readonly unknown[];
  readonly source?: string;
}
```

## NamingSnapshotCache

[Source](../../../src/metadata/internal/database-document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
interface NamingSnapshotCache {
  generation: number;
  readonly snapshots: Map<string, CollectionMetadataNamingSnapshot>;
}
```

Related declarations: [CollectionMetadataNamingSnapshot](./metadata.md#collectionmetadatanamingsnapshot).

## PutCollectionMetadataOptions

[Source](../../../src/metadata/document-store.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PutCollectionMetadataOptions {
  readonly expectedRevision: string | number | null;
}
```

## RelationMetadata

[Source](../../../src/metadata/document.ts)

Import: `import type { RelationMetadata } from '@nocobase/db'`.

```ts
export interface RelationMetadata {
  type: RelationType;
  target: string;
  sourceKey?: string;
  targetKey?: string;
  foreignKey?: string;
  otherKey?: string;
  through?: string;
  title?: string;
  description?: string;
}
```

Related declarations: [RelationType](./builder.md#relationtype).

## StoredCollectionMetadata

[Source](../../../src/metadata/document.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface StoredCollectionMetadata {
  document: CollectionMetadataDocument;
  revision: string | number;
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument).

## UpdateCollectionMetadataOptions

[Source](../../../src/metadata/service.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface UpdateCollectionMetadataOptions {
  readonly expectedRevision?: string | number | null;
}
```

## defineCollectionMetadata

[Source](../../../src/metadata/define.ts)

Import: `import { defineCollectionMetadata } from '@nocobase/db'`.

```ts
export declare function defineCollectionMetadata<
  T extends CollectionMetadataDocument,
>(document: T): T;
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument).

## extractLegacyCollectionMetadata

[Source](../../../src/metadata/legacy-extraction.ts)

Import: `import { extractLegacyCollectionMetadata } from '@nocobase/db'`.

```ts
export declare function extractLegacyCollectionMetadata(
  input: unknown,
  options?: LegacyMetadataExtractionOptions,
): LegacyMetadataExtractionResult;
```

Related declarations: [LegacyMetadataExtractionOptions](./metadata.md#legacymetadataextractionoptions), [LegacyMetadataExtractionResult](./metadata.md#legacymetadataextractionresult).

## validateCollectionMetadataDocument

[Source](../../../src/metadata/validation.ts)

Import: `import { validateCollectionMetadataDocument } from '@nocobase/db'`.

```ts
export declare function validateCollectionMetadataDocument(
  input: unknown,
): CollectionMetadataDocument;
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument).
