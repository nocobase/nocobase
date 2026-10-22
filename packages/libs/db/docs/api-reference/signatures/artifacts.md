# Collection artifacts: signatures

Serialize resolved schema and supplemental metadata into portable Collection artifacts and manifests, and validate their directory names.

[Chapter](../collection-and-schema.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                                         | Access               |
| ----------------------------------------------------------------------------------- | -------------------- |
| [COLLECTION_ARTIFACT_FILE_NAMES](#collection_artifact_file_names)                   | `@nocobase/db` value |
| [COLLECTION_ARTIFACT_FORMAT_VERSION](#collection_artifact_format_version)           | `@nocobase/db` value |
| [COLLECTION_ARTIFACT_MANIFEST_FILE_NAME](#collection_artifact_manifest_file_name)   | `@nocobase/db` value |
| [CollectionArtifactCollectionFile](#collectionartifactcollectionfile)               | `@nocobase/db` type  |
| [CollectionArtifactFileKind](#collectionartifactfilekind)                           | `@nocobase/db` type  |
| [CollectionArtifactFiles](#collectionartifactfiles)                                 | `@nocobase/db` type  |
| [CollectionArtifactFormatVersion](#collectionartifactformatversion)                 | `@nocobase/db` type  |
| [CollectionArtifactInput](#collectionartifactinput)                                 | `@nocobase/db` type  |
| [CollectionArtifactManifest](#collectionartifactmanifest)                           | `@nocobase/db` type  |
| [CollectionArtifactManifestInput](#collectionartifactmanifestinput)                 | `@nocobase/db` type  |
| [CollectionArtifactMetadataFile](#collectionartifactmetadatafile)                   | `@nocobase/db` type  |
| [CollectionArtifactNameError](#collectionartifactnameerror)                         | `@nocobase/db` value |
| [CollectionArtifactNameErrorCode](#collectionartifactnameerrorcode)                 | `@nocobase/db` type  |
| [CollectionArtifactSchemaFile](#collectionartifactschemafile)                       | `@nocobase/db` type  |
| [assertCollectionArtifactDirectoryNames](#assertcollectionartifactdirectorynames)   | `@nocobase/db` value |
| [findCollectionArtifactNameConflicts](#findcollectionartifactnameconflicts)         | `@nocobase/db` value |
| [serializeCollectionArtifact](#serializecollectionartifact)                         | `@nocobase/db` value |
| [serializeCollectionArtifactManifest](#serializecollectionartifactmanifest)         | `@nocobase/db` value |
| [validateCollectionArtifactDirectoryName](#validatecollectionartifactdirectoryname) | `@nocobase/db` value |

## COLLECTION_ARTIFACT_FILE_NAMES

[Source](../../../src/collection/artifact/format.ts)

Import: `import { COLLECTION_ARTIFACT_FILE_NAMES } from '@nocobase/db'`.

```ts
export declare const COLLECTION_ARTIFACT_FILE_NAMES: Readonly<
  Record<CollectionArtifactFileKind, string>
>;
```

Related declarations: [CollectionArtifactFileKind](./artifacts.md#collectionartifactfilekind).

## COLLECTION_ARTIFACT_FORMAT_VERSION

[Source](../../../src/collection/artifact/format.ts)

Import: `import { COLLECTION_ARTIFACT_FORMAT_VERSION } from '@nocobase/db'`.

Version of the on-disk Collection artifact format. Bump it when the shape of any artifact file changes in a way a reader has to know about; the types it embeds (`CollectionDefinition`, `PhysicalCollectionSchema`, `CollectionMetadataDocument`) are still evolving.

```ts
/**
 * Version of the on-disk Collection artifact format. Bump it when the shape of
 * any artifact file changes in a way a reader has to know about; the types it
 * embeds (`CollectionDefinition`, `PhysicalCollectionSchema`,
 * `CollectionMetadataDocument`) are still evolving.
 */
export declare const COLLECTION_ARTIFACT_FORMAT_VERSION: 1;
```

## COLLECTION_ARTIFACT_MANIFEST_FILE_NAME

[Source](../../../src/collection/artifact/format.ts)

Import: `import { COLLECTION_ARTIFACT_MANIFEST_FILE_NAME } from '@nocobase/db'`.

Connection-level manifest; the underscore keeps it apart from Collection directories.

```ts
/** Connection-level manifest; the underscore keeps it apart from Collection directories. */
export declare const COLLECTION_ARTIFACT_MANIFEST_FILE_NAME = '_manifest.json';
```

## CollectionArtifactCollectionFile

[Source](../../../src/collection/artifact/format.ts)

Import: `import type { CollectionArtifactCollectionFile } from '@nocobase/db'`.

`collection.json`: the resolved logical view plus the warnings resolution raised.

```ts
/** `collection.json`: the resolved logical view plus the warnings resolution raised. */
export interface CollectionArtifactCollectionFile {
  readonly formatVersion: CollectionArtifactFormatVersion;
  readonly name: string;
  readonly collection: CollectionDefinition;
  readonly warnings: readonly CollectionResolutionWarning[];
}
```

Related declarations: [CollectionArtifactFormatVersion](./artifacts.md#collectionartifactformatversion), [CollectionDefinition](./builder.md#collectiondefinition), [CollectionResolutionWarning](./collections.md#collectionresolutionwarning).

## CollectionArtifactFileKind

[Source](../../../src/collection/artifact/format.ts)

Import: `import type { CollectionArtifactFileKind } from '@nocobase/db'`.

The three files written for every Collection, keyed by what each one holds.

```ts
/** The three files written for every Collection, keyed by what each one holds. */
export type CollectionArtifactFileKind = 'collection' | 'metadata' | 'schema';
```

## CollectionArtifactFiles

[Source](../../../src/collection/artifact/serialize.ts)

Import: `import type { CollectionArtifactFiles } from '@nocobase/db'`.

Serialized file contents, keyed by file kind; see `COLLECTION_ARTIFACT_FILE_NAMES` for the names.

```ts
/** Serialized file contents, keyed by file kind; see `COLLECTION_ARTIFACT_FILE_NAMES` for the names. */
export type CollectionArtifactFiles = Readonly<
  Record<CollectionArtifactFileKind, string>
>;
```

Related declarations: [CollectionArtifactFileKind](./artifacts.md#collectionartifactfilekind).

## CollectionArtifactFormatVersion

[Source](../../../src/collection/artifact/format.ts)

Import: `import type { CollectionArtifactFormatVersion } from '@nocobase/db'`.

```ts
export type CollectionArtifactFormatVersion =
  typeof COLLECTION_ARTIFACT_FORMAT_VERSION;
```

Related declarations: [COLLECTION_ARTIFACT_FORMAT_VERSION](./artifacts.md#collection_artifact_format_version).

## CollectionArtifactInput

[Source](../../../src/collection/artifact/serialize.ts)

Import: `import type { CollectionArtifactInput } from '@nocobase/db'`.

Everything one Collection's artifact is built from. `resolution` and `physical` come from `connection.collections.getResolution()` and `getPhysical()`; `metadata` is the stored document from `connection.collectionMetadata.get()`, absent when the store holds none.

```ts
/**
 * Everything one Collection's artifact is built from. `resolution` and
 * `physical` come from `connection.collections.getResolution()` and
 * `getPhysical()`; `metadata` is the stored document from
 * `connection.collectionMetadata.get()`, absent when the store holds none.
 */
export interface CollectionArtifactInput {
  readonly name: string;
  readonly resolution: CollectionResolutionResult;
  readonly physical: PhysicalCollectionSchema;
  readonly metadata?: CollectionMetadataDocument;
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [CollectionResolutionResult](./collections.md#collectionresolutionresult), [PhysicalCollectionSchema](./schema.md#physicalcollectionschema).

## CollectionArtifactManifest

[Source](../../../src/collection/artifact/format.ts)

Import: `import type { CollectionArtifactManifest } from '@nocobase/db'`.

`_manifest.json`: which database state a connection's artifacts were read from. Deliberately carries nothing that changes between two generations of the same state — no timestamp, host, or generator identity — so regenerating produces byte-identical output.

```ts
/**
 * `_manifest.json`: which database state a connection's artifacts were read
 * from. Deliberately carries nothing that changes between two generations of
 * the same state — no timestamp, host, or generator identity — so regenerating
 * produces byte-identical output.
 */
export interface CollectionArtifactManifest {
  readonly formatVersion: CollectionArtifactFormatVersion;
  /**
   * Always `true`. Says to whoever opens the directory that everything in it
   * is derived from the database: it can be deleted and regenerated, and is
   * never edited or read back as a source.
   */
  readonly generated: true;
  readonly connection: string;
  readonly dialect: string;
  /** `managed` connections run migrations; an `external` one is owned by another system and has no history. */
  readonly schemaManagement: SchemaManagementMode;
  /** Name of the last applied migration, or `null` when the connection has no history table. */
  readonly migrationHead: string | null;
  readonly collections: readonly string[];
}
```

Related declarations: [CollectionArtifactFormatVersion](./artifacts.md#collectionartifactformatversion), [SchemaManagementMode](./connection.md#schemamanagementmode).

## CollectionArtifactManifestInput

[Source](../../../src/collection/artifact/serialize.ts)

Import: `import type { CollectionArtifactManifestInput } from '@nocobase/db'`.

```ts
export interface CollectionArtifactManifestInput {
  readonly connection: string;
  readonly dialect: string;
  readonly schemaManagement: SchemaManagementMode;
  readonly migrationHead: string | null;
  readonly collections: readonly string[];
}
```

Related declarations: [SchemaManagementMode](./connection.md#schemamanagementmode).

## CollectionArtifactMetadataFile

[Source](../../../src/collection/artifact/format.ts)

Import: `import type { CollectionArtifactMetadataFile } from '@nocobase/db'`.

`metadata.json`: the stored supplemental document, or `null` when the store holds none.

```ts
/** `metadata.json`: the stored supplemental document, or `null` when the store holds none. */
export interface CollectionArtifactMetadataFile {
  readonly formatVersion: CollectionArtifactFormatVersion;
  readonly name: string;
  readonly document: CollectionMetadataDocument | null;
}
```

Related declarations: [CollectionArtifactFormatVersion](./artifacts.md#collectionartifactformatversion), [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument).

## CollectionArtifactNameError

[Source](../../../src/collection/artifact/names.ts)

Import: `import { CollectionArtifactNameError } from '@nocobase/db'`.

```ts
export declare class CollectionArtifactNameError extends Error {
  readonly code: CollectionArtifactNameErrorCode;
  readonly names: readonly string[];
  constructor(
    code: CollectionArtifactNameErrorCode,
    message: string,
    names: readonly string[],
  );
}
```

Related declarations: [CollectionArtifactNameErrorCode](./artifacts.md#collectionartifactnameerrorcode).

## CollectionArtifactNameErrorCode

[Source](../../../src/collection/artifact/names.ts)

Import: `import type { CollectionArtifactNameErrorCode } from '@nocobase/db'`.

```ts
export type CollectionArtifactNameErrorCode =
  'COLLECTION_ARTIFACT_NAME_INVALID' | 'COLLECTION_ARTIFACT_NAME_CONFLICT';
```

## CollectionArtifactSchemaFile

[Source](../../../src/collection/artifact/format.ts)

Import: `import type { CollectionArtifactSchemaFile } from '@nocobase/db'`.

`schema.json`: what the Schema Inspector reported for the backing physical object.

```ts
/** `schema.json`: what the Schema Inspector reported for the backing physical object. */
export interface CollectionArtifactSchemaFile {
  readonly formatVersion: CollectionArtifactFormatVersion;
  readonly name: string;
  readonly physical: PhysicalCollectionSchema;
}
```

Related declarations: [CollectionArtifactFormatVersion](./artifacts.md#collectionartifactformatversion), [PhysicalCollectionSchema](./schema.md#physicalcollectionschema).

## assertCollectionArtifactDirectoryNames

[Source](../../../src/collection/artifact/names.ts)

Import: `import { assertCollectionArtifactDirectoryNames } from '@nocobase/db'`.

```ts
export declare function assertCollectionArtifactDirectoryNames(
  names: readonly string[],
): void;
```

## findCollectionArtifactNameConflicts

[Source](../../../src/collection/artifact/names.ts)

Import: `import { findCollectionArtifactNameConflicts } from '@nocobase/db'`.

Two names that differ only by case land in one directory on the default file systems of macOS and Windows. Report every such group at once so the caller can fix them together rather than one per run.

```ts
/**
 * Two names that differ only by case land in one directory on the default
 * file systems of macOS and Windows. Report every such group at once so the
 * caller can fix them together rather than one per run.
 */
export declare function findCollectionArtifactNameConflicts(
  names: readonly string[],
): string[][];
```

## serializeCollectionArtifact

[Source](../../../src/collection/artifact/serialize.ts)

Import: `import { serializeCollectionArtifact } from '@nocobase/db'`.

```ts
export declare function serializeCollectionArtifact(
  input: CollectionArtifactInput,
): CollectionArtifactFiles;
```

Related declarations: [CollectionArtifactFiles](./artifacts.md#collectionartifactfiles), [CollectionArtifactInput](./artifacts.md#collectionartifactinput).

## serializeCollectionArtifactManifest

[Source](../../../src/collection/artifact/serialize.ts)

Import: `import { serializeCollectionArtifactManifest } from '@nocobase/db'`.

```ts
export declare function serializeCollectionArtifactManifest(
  input: CollectionArtifactManifestInput,
): string;
```

Related declarations: [CollectionArtifactManifestInput](./artifacts.md#collectionartifactmanifestinput).

## validateCollectionArtifactDirectoryName

[Source](../../../src/collection/artifact/names.ts)

Import: `import { validateCollectionArtifactDirectoryName } from '@nocobase/db'`.

A logical Collection name has to survive as a directory name on every platform a repository is checked out on. `@nocobase/db` only requires the name to be non-empty without surrounding whitespace, so the artifact layer adds what file systems demand.

```ts
/**
 * A logical Collection name has to survive as a directory name on every
 * platform a repository is checked out on. `@nocobase/db` only requires the
 * name to be non-empty without surrounding whitespace, so the artifact layer
 * adds what file systems demand.
 */
export declare function validateCollectionArtifactDirectoryName(
  name: string,
): void;
```
