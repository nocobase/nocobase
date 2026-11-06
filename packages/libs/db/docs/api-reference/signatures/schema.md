# Physical schema inspection: signatures

Inspect physical schemas, tables, columns, indexes and constraints. Names here are physical identities, unlike logical Collection names. Shared normalization helpers and BaseSchemaInspector primarily support dialect implementations.

[Chapter](../collection-and-schema.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                                         | Access               |
| ----------------------------------------------------------------------------------- | -------------------- |
| [BaseSchemaInspector](#baseschemainspector)                                         | `@nocobase/db` value |
| [DecodedPhysicalCollectionCursor](#decodedphysicalcollectioncursor)                 | `@nocobase/db` type  |
| [ListPhysicalCollectionsOptions](#listphysicalcollectionsoptions)                   | Supporting contract  |
| [NormalizedPhysicalCollectionListOptions](#normalizedphysicalcollectionlistoptions) | `@nocobase/db` type  |
| [NumericCapabilities](#numericcapabilities)                                         | Supporting contract  |
| [NumericCapabilityStrategy](#numericcapabilitystrategy)                             | `@nocobase/db` type  |
| [PhysicalCheckConstraintSchema](#physicalcheckconstraintschema)                     | `@nocobase/db` type  |
| [PhysicalCollectionCursorFilter](#physicalcollectioncursorfilter)                   | Supporting contract  |
| [PhysicalCollectionIdentifier](#physicalcollectionidentifier)                       | `@nocobase/db` type  |
| [PhysicalCollectionIdentity](#physicalcollectionidentity)                           | Supporting contract  |
| [PhysicalCollectionKind](#physicalcollectionkind)                                   | `@nocobase/db` type  |
| [PhysicalCollectionPage](#physicalcollectionpage)                                   | Supporting contract  |
| [PhysicalCollectionSchema](#physicalcollectionschema)                               | `@nocobase/db` type  |
| [PhysicalCollectionSummary](#physicalcollectionsummary)                             | `@nocobase/db` type  |
| [PhysicalColumnDefault](#physicalcolumndefault)                                     | Supporting contract  |
| [PhysicalColumnSchema](#physicalcolumnschema)                                       | Supporting contract  |
| [PhysicalDataType](#physicaldatatype)                                               | `@nocobase/db` type  |
| [PhysicalForeignKeySchema](#physicalforeignkeyschema)                               | `@nocobase/db` type  |
| [PhysicalGeneratedColumn](#physicalgeneratedcolumn)                                 | Supporting contract  |
| [PhysicalIndexConstraintReference](#physicalindexconstraintreference)               | Supporting contract  |
| [PhysicalIndexKey](#physicalindexkey)                                               | `@nocobase/db` type  |
| [PhysicalIndexSchema](#physicalindexschema)                                         | `@nocobase/db` type  |
| [PhysicalPrimaryKeySchema](#physicalprimarykeyschema)                               | Supporting contract  |
| [PhysicalReferentialAction](#physicalreferentialaction)                             | Supporting contract  |
| [PhysicalSchemaAspect](#physicalschemaaspect)                                       | Supporting contract  |
| [PhysicalSchemaInfo](#physicalschemainfo)                                           | `@nocobase/db` type  |
| [PhysicalSchemaInspection](#physicalschemainspection)                               | Supporting contract  |
| [PhysicalSchemaInspectionStatus](#physicalschemainspectionstatus)                   | Supporting contract  |
| [PhysicalTypeNormalizationStrategy](#physicaltypenormalizationstrategy)             | `@nocobase/db` type  |
| [PhysicalUniqueConstraintSchema](#physicaluniqueconstraintschema)                   | `@nocobase/db` type  |
| [ScanPhysicalCollectionsOptions](#scanphysicalcollectionsoptions)                   | Supporting contract  |
| [SchemaInspectionWarning](#schemainspectionwarning)                                 | `@nocobase/db` type  |
| [SchemaInspector](#schemainspector)                                                 | `@nocobase/db` type  |
| [SchemaInspectorError](#schemainspectorerror)                                       | Supporting contract  |
| [SchemaInspectorErrorCode](#schemainspectorerrorcode)                               | Supporting contract  |
| [normalizePhysicalDataType](#normalizephysicaldatatype)                             | `@nocobase/db` value |
| [normalizeReferentialAction](#normalizereferentialaction)                           | `@nocobase/db` value |
| [numberValue](#numbervalue)                                                         | `@nocobase/db` value |
| [numericCapabilities](#numericcapabilities-1)                                       | `@nocobase/db` value |
| [optionalString](#optionalstring)                                                   | `@nocobase/db` value |
| [parseColumnDefault](#parsecolumndefault)                                           | `@nocobase/db` value |
| [rawRows](#rawrows)                                                                 | `@nocobase/db` value |
| [sqliteAffinity](#sqliteaffinity)                                                   | `@nocobase/db` value |
| [temporalFractionalSecondsPrecision](#temporalfractionalsecondsprecision)           | `@nocobase/db` value |

## BaseSchemaInspector

[Source](../../../src/schema/inspector/base.ts)

Import: `import { BaseSchemaInspector } from '@nocobase/db'`.

```ts
export declare abstract class BaseSchemaInspector implements SchemaInspector {
  protected readonly connectionName: string;
  protected readonly dialect: DatabaseDialect;
  protected constructor(connectionName: string, dialect: DatabaseDialect);
  listSchemas(): Promise<PhysicalSchemaInfo[]>;
  getPhysicalCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined>;
  listPhysicalCollections(
    options?: ListPhysicalCollectionsOptions,
  ): Promise<PhysicalCollectionPage>;
  scanPhysicalCollections(
    options?: ScanPhysicalCollectionsOptions,
  ): AsyncIterable<PhysicalCollectionSchema>;
  protected abstract inspectSchemas(): Promise<PhysicalSchemaInfo[]>;
  protected abstract inspectCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined>;
  protected abstract inspectCollectionSummaries(
    options: NormalizedPhysicalCollectionListOptions,
    after: DecodedPhysicalCollectionCursor['after'] | undefined,
    fetchLimit: number,
  ): Promise<PhysicalCollectionSummary[]>;
  protected invalidOptions(
    message: string,
    identifier?: Partial<PhysicalCollectionIdentifier>,
  ): SchemaInspectorError;
  protected canRetryDeadlock(): Promise<boolean>;
  protected isRetryableError(error: unknown): boolean;
}
```

Related declarations: [DatabaseDialect](./connection.md#databasedialect), [DecodedPhysicalCollectionCursor](./schema.md#decodedphysicalcollectioncursor), [ListPhysicalCollectionsOptions](./schema.md#listphysicalcollectionsoptions), [NormalizedPhysicalCollectionListOptions](./schema.md#normalizedphysicalcollectionlistoptions), [PhysicalCollectionIdentifier](./schema.md#physicalcollectionidentifier), [PhysicalCollectionPage](./schema.md#physicalcollectionpage), [PhysicalCollectionSchema](./schema.md#physicalcollectionschema), [PhysicalCollectionSummary](./schema.md#physicalcollectionsummary), [PhysicalSchemaInfo](./schema.md#physicalschemainfo), [ScanPhysicalCollectionsOptions](./schema.md#scanphysicalcollectionsoptions), [SchemaInspector](./schema.md#schemainspector), [SchemaInspectorError](./schema.md#schemainspectorerror).

## DecodedPhysicalCollectionCursor

[Source](../../../src/schema/inspector/shared/cursor.ts)

Import: `import type { DecodedPhysicalCollectionCursor } from '@nocobase/db'`.

```ts
export interface DecodedPhysicalCollectionCursor {
  readonly after: Pick<PhysicalCollectionSummary, 'schema' | 'tableName'>;
  readonly filter: PhysicalCollectionCursorFilter;
}
```

Related declarations: [PhysicalCollectionCursorFilter](./schema.md#physicalcollectioncursorfilter), [PhysicalCollectionSummary](./schema.md#physicalcollectionsummary).

## ListPhysicalCollectionsOptions

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ListPhysicalCollectionsOptions {
  readonly limit?: number;
  readonly cursor?: string;
  readonly schemas?: readonly string[];
  readonly tableNamePrefixes?: readonly string[];
  readonly kinds?: readonly PhysicalCollectionKind[];
}
```

Related declarations: [PhysicalCollectionKind](./schema.md#physicalcollectionkind).

## NormalizedPhysicalCollectionListOptions

[Source](../../../src/schema/inspector/base.ts)

Import: `import type { NormalizedPhysicalCollectionListOptions } from '@nocobase/db'`.

```ts
export interface NormalizedPhysicalCollectionListOptions {
  readonly limit: number;
  readonly schemas?: readonly string[];
  readonly tableNamePrefixes?: readonly string[];
  readonly kinds?: ListPhysicalCollectionsOptions['kinds'];
}
```

Related declarations: [ListPhysicalCollectionsOptions](./schema.md#listphysicalcollectionsoptions).

## NumericCapabilities

[Source](../../../src/schema/inspector/shared/column-capabilities.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
type NumericCapabilities = Pick<
  PhysicalColumnSchema,
  'integerBits' | 'binaryPrecision' | 'unsigned'
>;
```

Related declarations: [PhysicalColumnSchema](./schema.md#physicalcolumnschema).

## NumericCapabilityStrategy

[Source](../../../src/schema/inspector/shared/column-capabilities.ts)

Import: `import type { NumericCapabilityStrategy } from '@nocobase/db'`.

```ts
export interface NumericCapabilityStrategy {
  readonly ignore?: (base: string) => boolean;
  readonly special?: (
    type: string,
    base: string,
  ) =>
    | Pick<PhysicalColumnSchema, 'integerBits' | 'binaryPrecision' | 'unsigned'>
    | undefined;
  readonly unsigned?: (type: string, base: string) => boolean;
}
```

Related declarations: [PhysicalColumnSchema](./schema.md#physicalcolumnschema).

## PhysicalCheckConstraintSchema

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalCheckConstraintSchema } from '@nocobase/db'`.

```ts
export interface PhysicalCheckConstraintSchema {
  readonly name?: string;
  readonly expression: string;
}
```

## PhysicalCollectionCursorFilter

[Source](../../../src/schema/inspector/shared/cursor.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalCollectionCursorFilter {
  readonly schemas?: readonly string[];
  readonly tableNamePrefixes?: readonly string[];
  readonly kinds?: readonly string[];
}
```

## PhysicalCollectionIdentifier

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalCollectionIdentifier } from '@nocobase/db'`.

```ts
export interface PhysicalCollectionIdentifier {
  readonly tableName: string;
  readonly schema?: string;
}
```

## PhysicalCollectionIdentity

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalCollectionIdentity {
  readonly tableName: string;
  readonly schema: string;
}
```

## PhysicalCollectionKind

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalCollectionKind } from '@nocobase/db'`.

```ts
export type PhysicalCollectionKind =
  'table' | 'partitionedTable' | 'foreignTable' | 'view' | 'materializedView';
```

## PhysicalCollectionPage

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalCollectionPage {
  readonly items: readonly PhysicalCollectionSummary[];
  readonly nextCursor?: string;
}
```

Related declarations: [PhysicalCollectionSummary](./schema.md#physicalcollectionsummary).

## PhysicalCollectionSchema

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalCollectionSchema } from '@nocobase/db'`.

```ts
export interface PhysicalCollectionSchema extends PhysicalCollectionSummary {
  /** SQLite STRICT table status; undefined for views or unknown status. */
  readonly strict?: boolean;
  /** Traditional inheritance children are queried with this table but not covered by its unique keys. */
  readonly hasInheritedChildren?: boolean;
  readonly viewDefinition?: string;
  readonly columns: readonly PhysicalColumnSchema[];
  readonly primaryKey?: PhysicalPrimaryKeySchema;
  readonly uniqueConstraints: readonly PhysicalUniqueConstraintSchema[];
  readonly indexes: readonly PhysicalIndexSchema[];
  readonly foreignKeys: readonly PhysicalForeignKeySchema[];
  readonly checkConstraints: readonly PhysicalCheckConstraintSchema[];
  readonly inspection: PhysicalSchemaInspection;
}
```

Related declarations: [PhysicalCheckConstraintSchema](./schema.md#physicalcheckconstraintschema), [PhysicalCollectionSummary](./schema.md#physicalcollectionsummary), [PhysicalColumnSchema](./schema.md#physicalcolumnschema), [PhysicalForeignKeySchema](./schema.md#physicalforeignkeyschema), [PhysicalIndexSchema](./schema.md#physicalindexschema), [PhysicalPrimaryKeySchema](./schema.md#physicalprimarykeyschema), [PhysicalSchemaInspection](./schema.md#physicalschemainspection), [PhysicalUniqueConstraintSchema](./schema.md#physicaluniqueconstraintschema).

## PhysicalCollectionSummary

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalCollectionSummary } from '@nocobase/db'`.

```ts
export interface PhysicalCollectionSummary extends PhysicalCollectionIdentity {
  readonly kind: PhysicalCollectionKind;
  readonly comment?: string;
}
```

Related declarations: [PhysicalCollectionIdentity](./schema.md#physicalcollectionidentity), [PhysicalCollectionKind](./schema.md#physicalcollectionkind).

## PhysicalColumnDefault

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalColumnDefault {
  readonly expression: string;
  readonly value?: unknown;
}
```

## PhysicalColumnSchema

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalColumnSchema {
  readonly columnName: string;
  readonly ordinalPosition: number;
  readonly dataType: PhysicalDataType;
  readonly nativeType: string;
  readonly nativeTypeSchema?: string;
  readonly nullable: boolean;
  readonly default?: PhysicalColumnDefault;
  readonly autoIncrement: boolean;
  readonly unsigned?: boolean;
  readonly length?: number;
  /** Unit of the reported physical length, not a portable logical limit. */
  readonly lengthUnit?: 'characters' | 'bytes' | 'utf16CodeUnits';
  readonly maxByteLength?: number;
  readonly characterSet?: string;
  readonly collation?: string;
  readonly collationSchema?: string;
  /** SQLite declaration affinity; not a stored-value type guarantee. */
  readonly affinity?: 'integer' | 'real' | 'numeric' | 'text' | 'blob';
  readonly integerBits?: number;
  /** Significant binary digits, not storage width or decimal precision. */
  readonly binaryPrecision?: number;
  readonly precision?: number;
  readonly scale?: number;
  /** Decimal places in fractional seconds, separate from numeric precision. */
  readonly fractionalSecondsPrecision?: number;
  readonly comment?: string;
  readonly generated?: PhysicalGeneratedColumn;
}
```

Related declarations: [PhysicalColumnDefault](./schema.md#physicalcolumndefault), [PhysicalDataType](./schema.md#physicaldatatype), [PhysicalGeneratedColumn](./schema.md#physicalgeneratedcolumn).

## PhysicalDataType

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalDataType } from '@nocobase/db'`.

```ts
export type PhysicalDataType =
  | 'integer'
  | 'bigInt'
  | 'char'
  | 'string'
  | 'text'
  | 'boolean'
  | 'decimal'
  | 'float'
  | 'double'
  | 'date'
  | 'time'
  | 'datetime'
  | 'datetimeTz'
  | 'json'
  | 'blob'
  | 'uuid'
  | 'native';
```

## PhysicalForeignKeySchema

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalForeignKeySchema } from '@nocobase/db'`.

```ts
export interface PhysicalForeignKeySchema {
  readonly name?: string;
  readonly columns: readonly string[];
  readonly referencedCollection: PhysicalCollectionIdentity;
  readonly referencedColumns: readonly string[];
  readonly onDelete?: PhysicalReferentialAction;
  readonly onUpdate?: PhysicalReferentialAction;
  readonly deferrable?: boolean;
  readonly initiallyDeferred?: boolean;
}
```

Related declarations: [PhysicalCollectionIdentity](./schema.md#physicalcollectionidentity), [PhysicalReferentialAction](./schema.md#physicalreferentialaction).

## PhysicalGeneratedColumn

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalGeneratedColumn {
  readonly expression?: string;
  readonly stored?: boolean;
}
```

## PhysicalIndexConstraintReference

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalIndexConstraintReference {
  readonly kind: 'primaryKey' | 'unique';
  readonly name?: string;
}
```

## PhysicalIndexKey

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalIndexKey } from '@nocobase/db'`.

```ts
export type PhysicalIndexKey = (
  | {
      readonly columnName: string;
      readonly expression?: never;
    }
  | {
      readonly expression: string;
      readonly columnName?: never;
    }
) & {
  readonly order?: 'asc' | 'desc';
  readonly nulls?: 'first' | 'last';
  /** False when equality on the source column is not known to imply equality under this key's comparisons. */
  readonly columnEquality?: boolean;
};
```

## PhysicalIndexSchema

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalIndexSchema } from '@nocobase/db'`.

```ts
export interface PhysicalIndexSchema {
  readonly name: string;
  readonly keys: readonly PhysicalIndexKey[];
  readonly includeColumns?: readonly string[];
  readonly unique: boolean;
  /** False when the index is incomplete or is not maintained for writes. */
  readonly valid?: boolean;
  /** A single backing relationship, retained for compatibility with existing inspectors. */
  readonly backsConstraint?: PhysicalIndexConstraintReference;
  /** Complete backing relationships when an index supports multiple constraints; takes precedence over backsConstraint. */
  readonly backsConstraints?: readonly PhysicalIndexConstraintReference[];
  readonly method?: string;
  /** True even when a partial index's predicate could not be inspected. */
  readonly partial?: boolean;
  readonly predicate?: string;
  /** True when every row with non-null index keys necessarily satisfies the predicate. */
  readonly predicateSatisfiedByNonNullKeys?: boolean;
}
```

Related declarations: [PhysicalIndexConstraintReference](./schema.md#physicalindexconstraintreference), [PhysicalIndexKey](./schema.md#physicalindexkey).

## PhysicalPrimaryKeySchema

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalPrimaryKeySchema {
  readonly name?: string;
  readonly columns: readonly string[];
  readonly deferrable?: boolean;
  readonly initiallyDeferred?: boolean;
  /** False when the constraint is disabled or not validated for existing rows. */
  readonly valid?: boolean;
}
```

## PhysicalReferentialAction

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type PhysicalReferentialAction =
  'noAction' | 'restrict' | 'cascade' | 'setNull' | 'setDefault';
```

## PhysicalSchemaAspect

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type PhysicalSchemaAspect =
  | 'columns'
  | 'primaryKey'
  | 'uniqueConstraints'
  | 'indexes'
  | 'foreignKeys'
  | 'checkConstraints'
  | 'comments'
  | 'viewDefinition';
```

## PhysicalSchemaInfo

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalSchemaInfo } from '@nocobase/db'`.

```ts
export interface PhysicalSchemaInfo {
  readonly name: string;
  readonly default: boolean;
}
```

## PhysicalSchemaInspection

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalSchemaInspection {
  readonly aspects: Readonly<
    Record<PhysicalSchemaAspect, PhysicalSchemaInspectionStatus>
  >;
  readonly warnings: readonly SchemaInspectionWarning[];
}
```

Related declarations: [PhysicalSchemaAspect](./schema.md#physicalschemaaspect), [PhysicalSchemaInspectionStatus](./schema.md#physicalschemainspectionstatus), [SchemaInspectionWarning](./schema.md#schemainspectionwarning).

## PhysicalSchemaInspectionStatus

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type PhysicalSchemaInspectionStatus =
  'complete' | 'partial' | 'unsupported';
```

## PhysicalTypeNormalizationStrategy

[Source](../../../src/schema/inspector/shared/type-normalization.ts)

Import: `import type { PhysicalTypeNormalizationStrategy } from '@nocobase/db'`.

```ts
export interface PhysicalTypeNormalizationStrategy {
  readonly temporal?: (type: string) => PhysicalDataType | undefined;
  readonly special?: (
    type: string,
    base: string,
  ) => PhysicalDataType | undefined;
  readonly temporalPrecision?: (
    type: string,
    temporal: PhysicalDataType | undefined,
  ) => number | undefined;
  readonly defaultTemporalPrecision?: number;
}
```

Related declarations: [PhysicalDataType](./schema.md#physicaldatatype).

## PhysicalUniqueConstraintSchema

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { PhysicalUniqueConstraintSchema } from '@nocobase/db'`.

```ts
export interface PhysicalUniqueConstraintSchema {
  readonly name?: string;
  readonly columns: readonly string[];
  readonly deferrable?: boolean;
  readonly initiallyDeferred?: boolean;
  /** False when the constraint is disabled or not validated for existing rows. */
  readonly valid?: boolean;
}
```

## ScanPhysicalCollectionsOptions

[Source](../../../src/schema/inspector/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ScanPhysicalCollectionsOptions {
  readonly pageSize?: number;
  readonly schemas?: readonly string[];
  readonly tableNamePrefixes?: readonly string[];
  readonly kinds?: readonly PhysicalCollectionKind[];
}
```

Related declarations: [PhysicalCollectionKind](./schema.md#physicalcollectionkind).

## SchemaInspectionWarning

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { SchemaInspectionWarning } from '@nocobase/db'`.

```ts
export interface SchemaInspectionWarning {
  readonly code: string;
  readonly message: string;
  readonly aspect: PhysicalSchemaAspect;
}
```

Related declarations: [PhysicalSchemaAspect](./schema.md#physicalschemaaspect).

## SchemaInspector

[Source](../../../src/schema/inspector/types.ts)

Import: `import type { SchemaInspector } from '@nocobase/db'`.

```ts
export interface SchemaInspector {
  listSchemas(): Promise<PhysicalSchemaInfo[]>;
  getPhysicalCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined>;
  listPhysicalCollections(
    options?: ListPhysicalCollectionsOptions,
  ): Promise<PhysicalCollectionPage>;
  scanPhysicalCollections(
    options?: ScanPhysicalCollectionsOptions,
  ): AsyncIterable<PhysicalCollectionSchema>;
}
```

Related declarations: [ListPhysicalCollectionsOptions](./schema.md#listphysicalcollectionsoptions), [PhysicalCollectionIdentifier](./schema.md#physicalcollectionidentifier), [PhysicalCollectionPage](./schema.md#physicalcollectionpage), [PhysicalCollectionSchema](./schema.md#physicalcollectionschema), [PhysicalSchemaInfo](./schema.md#physicalschemainfo), [ScanPhysicalCollectionsOptions](./schema.md#scanphysicalcollectionsoptions).

## SchemaInspectorError

[Source](../../../src/schema/inspector/errors.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export declare class SchemaInspectorError extends Error {
  readonly code: SchemaInspectorErrorCode;
  readonly connectionName: string;
  readonly dialect: DatabaseDialect;
  readonly schema?: string;
  readonly tableName?: string;
}
```

Related declarations: [DatabaseDialect](./connection.md#databasedialect), [SchemaInspectorErrorCode](./schema.md#schemainspectorerrorcode).

## SchemaInspectorErrorCode

[Source](../../../src/schema/inspector/errors.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type SchemaInspectorErrorCode =
  | 'SCHEMA_INSPECTION_FAILED'
  | 'SCHEMA_INSPECTION_PERMISSION_DENIED'
  | 'SCHEMA_INSPECTION_INVALID_CURSOR'
  | 'SCHEMA_INSPECTION_INVALID_OPTIONS'
  | 'SCHEMA_INSPECTION_UNSUPPORTED_DIALECT';
```

## normalizePhysicalDataType

[Source](../../../src/schema/inspector/shared/type-normalization.ts)

Import: `import { normalizePhysicalDataType } from '@nocobase/db'`.

```ts
export declare function normalizePhysicalDataType(
  strategy: PhysicalTypeNormalizationStrategy,
  nativeType: string,
): PhysicalDataType;
```

Related declarations: [PhysicalDataType](./schema.md#physicaldatatype), [PhysicalTypeNormalizationStrategy](./schema.md#physicaltypenormalizationstrategy).

## normalizeReferentialAction

[Source](../../../src/schema/inspector/shared/type-normalization.ts)

Import: `import { normalizeReferentialAction } from '@nocobase/db'`.

```ts
export declare function normalizeReferentialAction(
  action: unknown,
): PhysicalReferentialAction | undefined;
```

Related declarations: [PhysicalReferentialAction](./schema.md#physicalreferentialaction).

## numberValue

[Source](../../../src/schema/inspector/shared/result.ts)

Import: `import { numberValue } from '@nocobase/db'`.

```ts
export declare function numberValue(value: unknown): number | undefined;
```

## numericCapabilities

[Source](../../../src/schema/inspector/shared/column-capabilities.ts)

Import: `import { numericCapabilities } from '@nocobase/db'`.

```ts
export declare function numericCapabilities(
  strategy: NumericCapabilityStrategy,
  nativeType: string,
): NumericCapabilities;
```

Related declarations: [NumericCapabilities](./schema.md#numericcapabilities), [NumericCapabilityStrategy](./schema.md#numericcapabilitystrategy).

## optionalString

[Source](../../../src/schema/inspector/shared/result.ts)

Import: `import { optionalString } from '@nocobase/db'`.

```ts
export declare function optionalString(value: unknown): string | undefined;
```

## parseColumnDefault

[Source](../../../src/schema/inspector/shared/type-normalization.ts)

Import: `import { parseColumnDefault } from '@nocobase/db'`.

```ts
export declare function parseColumnDefault(
  expression: unknown,
): PhysicalColumnDefault | undefined;
```

Related declarations: [PhysicalColumnDefault](./schema.md#physicalcolumndefault).

## rawRows

[Source](../../../src/schema/inspector/shared/result.ts)

Import: `import { rawRows } from '@nocobase/db'`.

```ts
export declare function rawRows<T extends object>(result: unknown): T[];
```

## sqliteAffinity

[Source](../../../src/schema/inspector/shared/column-capabilities.ts)

Import: `import { sqliteAffinity } from '@nocobase/db'`.

```ts
export declare function sqliteAffinity(
  declaration: string,
): NonNullable<PhysicalColumnSchema['affinity']>;
```

Related declarations: [PhysicalColumnSchema](./schema.md#physicalcolumnschema).

## temporalFractionalSecondsPrecision

[Source](../../../src/schema/inspector/shared/type-normalization.ts)

Import: `import { temporalFractionalSecondsPrecision } from '@nocobase/db'`.

```ts
export declare function temporalFractionalSecondsPrecision(
  strategy: PhysicalTypeNormalizationStrategy,
  nativeType: string,
): number | undefined;
```

Related declarations: [PhysicalTypeNormalizationStrategy](./schema.md#physicaltypenormalizationstrategy).
