# Resolved collections: signatures

Read resolved logical Collection definitions and manage the shared registry cache. These operations inspect or refresh definitions; they do not create tables.

[Chapter](../collection-and-schema.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                             | Access               |
| ----------------------------------------------------------------------- | -------------------- |
| [CollectionDiagnosis](#collectiondiagnosis)                             | `@nocobase/db` type  |
| [CollectionDiagnosisIssue](#collectiondiagnosisissue)                   | `@nocobase/db` type  |
| [CollectionDiagnosisIssueCode](#collectiondiagnosisissuecode)           | `@nocobase/db` type  |
| [CollectionRelationValidationError](#collectionrelationvalidationerror) | `@nocobase/db` value |
| [CollectionRelationValidationIssue](#collectionrelationvalidationissue) | Supporting contract  |
| [CollectionResolutionError](#collectionresolutionerror)                 | `@nocobase/db` value |
| [CollectionResolutionIssue](#collectionresolutionissue)                 | Supporting contract  |
| [CollectionResolutionIssueCode](#collectionresolutionissuecode)         | Supporting contract  |
| [CollectionResolutionResult](#collectionresolutionresult)               | `@nocobase/db` type  |
| [CollectionResolutionWarning](#collectionresolutionwarning)             | `@nocobase/db` type  |
| [CollectionResolutionWarningCode](#collectionresolutionwarningcode)     | Supporting contract  |
| [CollectionSummary](#collectionsummary)                                 | Supporting contract  |
| [CollectionSummaryPage](#collectionsummarypage)                         | Supporting contract  |
| [ConnectionCollections](#connectioncollections)                         | `@nocobase/db` type  |
| [ListCollectionsOptions](#listcollectionsoptions)                       | Supporting contract  |
| [ScanCollectionsOptions](#scancollectionsoptions)                       | Supporting contract  |

## CollectionDiagnosis

[Source](../../../src/collection/registry/types.ts)

Import: `import type { CollectionDiagnosis } from '@nocobase/db'`.

```ts
export interface CollectionDiagnosis {
  /** Metadata records examined. */
  readonly checked: number;
  readonly issues: readonly CollectionDiagnosisIssue[];
}
```

Related declarations: [CollectionDiagnosisIssue](./collections.md#collectiondiagnosisissue).

## CollectionDiagnosisIssue

[Source](../../../src/collection/registry/types.ts)

Import: `import type { CollectionDiagnosisIssue } from '@nocobase/db'`.

What a metadata record and its physical table disagree about.

```ts
/** What a metadata record and its physical table disagree about. */
export interface CollectionDiagnosisIssue {
  readonly name: string;
  /** The physical table the record maps to. */
  readonly tableName: string;
  readonly code: CollectionDiagnosisIssueCode | CollectionResolutionIssueCode;
  readonly message: string;
  /**
   * The record describes a table that does not exist, so deleting the record
   * is a complete fix. Every other issue needs a migration: the table is
   * there and something about it no longer matches what was recorded.
   */
  readonly orphaned: boolean;
}
```

Related declarations: [CollectionDiagnosisIssueCode](./collections.md#collectiondiagnosisissuecode), [CollectionResolutionIssueCode](./collections.md#collectionresolutionissuecode).

## CollectionDiagnosisIssueCode

[Source](../../../src/collection/registry/types.ts)

Import: `import type { CollectionDiagnosisIssueCode } from '@nocobase/db'`.

```ts
export type CollectionDiagnosisIssueCode = 'COLLECTION_TABLE_MISSING';
```

## CollectionRelationValidationError

[Source](../../../src/collection/registry/relation-validator.ts)

Import: `import { CollectionRelationValidationError } from '@nocobase/db'`.

```ts
export declare class CollectionRelationValidationError extends Error {
  readonly issues: readonly CollectionRelationValidationIssue[];
  readonly code: 'COLLECTION_RELATION_VALIDATION_FAILED';
  constructor(issues: readonly CollectionRelationValidationIssue[]);
}
```

Related declarations: [CollectionRelationValidationIssue](./collections.md#collectionrelationvalidationissue).

## CollectionRelationValidationIssue

[Source](../../../src/collection/registry/relation-validator.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionRelationValidationIssue {
  readonly code: 'COLLECTION_RELATION_INVALID';
  readonly collection: string;
  readonly path: readonly (string | number)[];
  readonly message: string;
}
```

## CollectionResolutionError

[Source](../../../src/collection/resolver/errors.ts)

Import: `import { CollectionResolutionError } from '@nocobase/db'`.

```ts
export declare class CollectionResolutionError extends Error {
  readonly issues: readonly CollectionResolutionIssue[];
  readonly code: 'COLLECTION_RESOLUTION_FAILED';
  constructor(issues: readonly CollectionResolutionIssue[]);
}
```

Related declarations: [CollectionResolutionIssue](./collections.md#collectionresolutionissue).

## CollectionResolutionIssue

[Source](../../../src/collection/resolver/errors.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionResolutionIssue {
  readonly code: CollectionResolutionIssueCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}
```

Related declarations: [CollectionResolutionIssueCode](./collections.md#collectionresolutionissuecode).

## CollectionResolutionIssueCode

[Source](../../../src/collection/resolver/errors.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type CollectionResolutionIssueCode =
  | 'COLLECTION_SCHEMA_INCOMPLETE'
  | 'COLLECTION_SCHEMA_DRIFT'
  | 'COLLECTION_NAME_CONFLICT'
  | 'COLLECTION_FIELD_CONFLICT'
  | 'COLLECTION_OPTIMISTIC_LOCK_INVALID'
  | 'COLLECTION_PHYSICAL_REFERENCE_INVALID'
  | 'COLLECTION_RELATION_INVALID';
```

## CollectionResolutionResult

[Source](../../../src/collection/resolver/types.ts)

Import: `import type { CollectionResolutionResult } from '@nocobase/db'`.

```ts
export interface CollectionResolutionResult {
  readonly collection: CollectionDefinition;
  readonly inspection: PhysicalSchemaInspection;
  readonly warnings: readonly CollectionResolutionWarning[];
}
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition), [CollectionResolutionWarning](./collections.md#collectionresolutionwarning), [PhysicalSchemaInspection](./schema.md#physicalschemainspection).

## CollectionResolutionWarning

[Source](../../../src/collection/resolver/types.ts)

Import: `import type { CollectionResolutionWarning } from '@nocobase/db'`.

```ts
export interface CollectionResolutionWarning {
  readonly code: CollectionResolutionWarningCode;
  readonly message: string;
  readonly path?: readonly (string | number)[];
  readonly aspect?: PhysicalSchemaAspect;
  readonly sourceCode?: string;
}
```

Related declarations: [CollectionResolutionWarningCode](./collections.md#collectionresolutionwarningcode), [PhysicalSchemaAspect](./schema.md#physicalschemaaspect).

## CollectionResolutionWarningCode

[Source](../../../src/collection/resolver/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type CollectionResolutionWarningCode =
  | 'COLLECTION_INSPECTION_WARNING'
  | 'COLLECTION_INSPECTION_PARTIAL'
  | 'COLLECTION_INSPECTION_UNSUPPORTED'
  /** A json column's default literal is not valid JSON; `db.defaultExpression` keeps the text. */
  | 'COLLECTION_JSON_DEFAULT_INVALID';
```

## CollectionSummary

[Source](../../../src/collection/registry/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionSummary {
  readonly name: string;
  readonly tableName: string;
  readonly schema: string;
  readonly kind: CollectionKind;
  readonly title?: string;
  readonly description?: string;
}
```

Related declarations: [CollectionKind](./builder.md#collectionkind).

## CollectionSummaryPage

[Source](../../../src/collection/registry/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionSummaryPage {
  readonly items: readonly CollectionSummary[];
  readonly nextCursor?: string;
}
```

Related declarations: [CollectionSummary](./collections.md#collectionsummary).

## ConnectionCollections

[Source](../../../src/collection/registry/types.ts)

Import: `import type { ConnectionCollections } from '@nocobase/db'`.

```ts
export interface ConnectionCollections {
  get(name: string): Promise<CollectionDefinition | undefined>;
  /**
   * Reads the physical database schema backing a logical Collection name.
   * Use schemaInspector.getPhysicalCollection() when the input is already a
   * physical table name.
   */
  getPhysical(name: string): Promise<PhysicalCollectionSchema | undefined>;
  getResolution(name: string): Promise<CollectionResolutionResult | undefined>;
  list(options?: ListCollectionsOptions): Promise<CollectionSummaryPage>;
  scan(options?: ScanCollectionsOptions): AsyncIterable<CollectionDefinition>;
  refresh(name: string): Promise<CollectionDefinition | undefined>;
  invalidate(name?: string): void;
  validateRelations(name?: string): Promise<void>;
  /**
   * Compares every stored metadata record with the physical schema behind it.
   *
   * The two are separate records of what exists, and a hand-rolled reset or a
   * table dropped outside a migration leaves them disagreeing — after which
   * resolving that Collection fails, and so does anything that resolves it.
   * Reads only.
   */
  diagnose(): Promise<CollectionDiagnosis>;
}
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition), [CollectionDiagnosis](./collections.md#collectiondiagnosis), [CollectionResolutionResult](./collections.md#collectionresolutionresult), [CollectionSummaryPage](./collections.md#collectionsummarypage), [ListCollectionsOptions](./collections.md#listcollectionsoptions), [PhysicalCollectionSchema](./schema.md#physicalcollectionschema), [ScanCollectionsOptions](./collections.md#scancollectionsoptions).

## ListCollectionsOptions

[Source](../../../src/collection/registry/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ListCollectionsOptions = ListPhysicalCollectionsOptions;
```

Related declarations: [ListPhysicalCollectionsOptions](./schema.md#listphysicalcollectionsoptions).

## ScanCollectionsOptions

[Source](../../../src/collection/registry/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ScanCollectionsOptions = ScanPhysicalCollectionsOptions;
```

Related declarations: [ScanPhysicalCollectionsOptions](./schema.md#scanphysicalcollectionsoptions).
