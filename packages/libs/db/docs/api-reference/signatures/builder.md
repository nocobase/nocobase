# Collection schema and builders: signatures

Declare and change logical Collections, Fields, Relations, indexes and constraints. Obtain CollectionBuilder through a manager or connection; its class is a type-only root export. Schema changes belong in migrations.

[Chapter](../collection-and-schema.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                         | Access              |
| ------------------------------------------------------------------- | ------------------- |
| [AnyFieldDefinition](#anyfielddefinition)                           | Supporting contract |
| [BuilderExecOptions](#builderexecoptions)                           | `@nocobase/db` type |
| [BuilderImpact](#builderimpact)                                     | Supporting contract |
| [BuilderResult](#builderresult)                                     | `@nocobase/db` type |
| [BuilderWarning](#builderwarning)                                   | Supporting contract |
| [CheckConstraintDefinition](#checkconstraintdefinition)             | Supporting contract |
| [CollectionAlterBuilder](#collectionalterbuilder)                   | `@nocobase/db` type |
| [CollectionAlterDefinition](#collectionalterdefinition)             | Supporting contract |
| [CollectionAlterInput](#collectionalterinput)                       | Supporting contract |
| [CollectionBuilder](#collectionbuilder)                             | `@nocobase/db` type |
| [CollectionCreateInput](#collectioncreateinput)                     | Supporting contract |
| [CollectionDefinition](#collectiondefinition)                       | `@nocobase/db` type |
| [CollectionDefinitionBuilder](#collectiondefinitionbuilder)         | `@nocobase/db` type |
| [CollectionDefinitionInput](#collectiondefinitioninput)             | Supporting contract |
| [CollectionKind](#collectionkind)                                   | Supporting contract |
| [CollectionOperation](#collectionoperation)                         | `@nocobase/db` type |
| [ColumnSchemaDefinition](#columnschemadefinition)                   | Supporting contract |
| [ConstraintDefinition](#constraintdefinition)                       | Supporting contract |
| [DbOptions](#dboptions)                                             | Supporting contract |
| [Deferrable](#deferrable)                                           | Supporting contract |
| [DialectOptions](#dialectoptions)                                   | Supporting contract |
| [FieldAlterInput](#fieldalterinput)                                 | Supporting contract |
| [FieldBase](#fieldbase)                                             | Supporting contract |
| [FieldDefinition](#fielddefinition)                                 | `@nocobase/db` type |
| [FieldDefinitionBuilder](#fielddefinitionbuilder)                   | `@nocobase/db` type |
| [FieldType](#fieldtype)                                             | Supporting contract |
| [FilterExpression](#filterexpression)                               | Supporting contract |
| [ForeignKeyConstraintDefinition](#foreignkeyconstraintdefinition)   | Supporting contract |
| [IndexDefinition](#indexdefinition)                                 | Supporting contract |
| [MaterializedViewCollectionInput](#materializedviewcollectioninput) | Supporting contract |
| [MetadataChangeSet](#metadatachangeset)                             | Supporting contract |
| [NamingOptions](#namingoptions)                                     | Supporting contract |
| [OptimisticLockDefinition](#optimisticlockdefinition)               | `@nocobase/db` type |
| [PhysicalConstraintDefinition](#physicalconstraintdefinition)       | Supporting contract |
| [PhysicalIndexDefinition](#physicalindexdefinition)                 | Supporting contract |
| [PrimaryConstraintDefinition](#primaryconstraintdefinition)         | Supporting contract |
| [QueryViewDefinition](#queryviewdefinition)                         | Supporting contract |
| [RawViewDefinition](#rawviewdefinition)                             | Supporting contract |
| [ReferentialAction](#referentialaction)                             | Supporting contract |
| [RefreshMaterializedViewOptions](#refreshmaterializedviewoptions)   | Supporting contract |
| [RelationFieldBuilder](#relationfieldbuilder)                       | `@nocobase/db` type |
| [RelationFieldDefinition](#relationfielddefinition)                 | `@nocobase/db` type |
| [RelationType](#relationtype)                                       | Supporting contract |
| [SchemaOperation](#schemaoperation)                                 | Supporting contract |
| [TableAlterSchemaOperation](#tablealterschemaoperation)             | Supporting contract |
| [TableSchemaDefinition](#tableschemadefinition)                     | Supporting contract |
| [UniqueConstraintDefinition](#uniqueconstraintdefinition)           | Supporting contract |
| [ViewCollectionDefinitionBuilder](#viewcollectiondefinitionbuilder) | Supporting contract |
| [ViewCollectionInput](#viewcollectioninput)                         | Supporting contract |
| [ViewOptions](#viewoptions)                                         | Supporting contract |
| [ViewQueryBuilder](#viewquerybuilder)                               | Supporting contract |
| [ViewSchemaDefinition](#viewschemadefinition)                       | Supporting contract |

## AnyFieldDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type AnyFieldDefinition = FieldDefinition | RelationFieldDefinition;
```

Related declarations: [FieldDefinition](./builder.md#fielddefinition), [RelationFieldDefinition](./builder.md#relationfielddefinition).

## BuilderExecOptions

[Source](../../../src/collection/types.ts)

Import: `import type { BuilderExecOptions } from '@nocobase/db'`.

```ts
export interface BuilderExecOptions {
  /** Compile operations without executing schema changes or syncing metadata. */
  dryRun?: boolean;
  /** Return adapter SQL when supported. Best used together with dryRun. */
  previewSql?: boolean;
  /** Skip supported create operations when the backing database object already exists. */
  ifNotExists?: boolean;
  /** Skip supported drop operations when the backing database object does not exist. */
  ifExists?: boolean;
  /**
   * Fails on capability warnings during real execution.
   * This is not a destructive-operation confirmation mechanism; inspect impact.
   */
  strict?: boolean;
  /**
   * Reserved for future Builder-managed transactions.
   * Use DatabaseManager.transaction() or DatabaseConnection.transaction() today.
   */
  transaction?: boolean;
}
```

## BuilderImpact

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface BuilderImpact {
  level: 'safe' | 'warning' | 'destructive';
  message: string;
  operation?: string;
}
```

## BuilderResult

[Source](../../../src/collection/types.ts)

Import: `import type { BuilderResult } from '@nocobase/db'`.

```ts
export interface BuilderResult {
  operations: CollectionOperation[];
  schemaOperations?: SchemaOperation[];
  sql?: string[];
  /** Reserved change summary; current Builder implementation does not populate it yet. */
  metadata?: MetadataChangeSet;
  warnings?: BuilderWarning[];
  impact?: BuilderImpact[];
}
```

Related declarations: [BuilderImpact](./builder.md#builderimpact), [BuilderWarning](./builder.md#builderwarning), [CollectionOperation](./builder.md#collectionoperation), [MetadataChangeSet](./builder.md#metadatachangeset), [SchemaOperation](./builder.md#schemaoperation).

## BuilderWarning

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface BuilderWarning {
  code: string;
  message: string;
  path?: Array<string | number>;
  capability?: string;
  dialect?: string;
  fallback?: 'downgrade' | 'skip' | 'ignore';
  severity?: 'warning' | 'unsafe';
}
```

## CheckConstraintDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CheckConstraintDefinition {
  type: 'check';
  name?: string;
  expression: FilterExpression | string;
  db?: DialectOptions;
}
```

Related declarations: [DialectOptions](./builder.md#dialectoptions), [FilterExpression](./builder.md#filterexpression).

## CollectionAlterBuilder

[Source](../../../src/collection/types.ts)

Import: `import type { CollectionAlterBuilder } from '@nocobase/db'`.

```ts
export interface CollectionAlterBuilder extends CollectionDefinitionBuilder {
  clearOptimisticLock(): this;
  alterField(name: string, changes: FieldAlterInput): this;
  dropField(name: string): this;
  dropFields(...names: string[]): this;
  dropIndex(name: string): this;
  dropConstraint(name: string): this;
  toAlterDefinition(): CollectionAlterDefinition;
}
```

Related declarations: [CollectionAlterDefinition](./builder.md#collectionalterdefinition), [CollectionDefinitionBuilder](./builder.md#collectiondefinitionbuilder), [FieldAlterInput](./builder.md#fieldalterinput).

## CollectionAlterDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionAlterDefinition {
  optimisticLock?: OptimisticLockDefinition | null;
  addFields?: AnyFieldDefinition[];
  alterFields?: Array<{
    name: string;
    changes: FieldAlterInput;
  }>;
  dropFields?: string[];
  addIndexes?: IndexDefinition[];
  dropIndexes?: string[];
  addConstraints?: ConstraintDefinition[];
  dropConstraints?: string[];
}
```

Related declarations: [AnyFieldDefinition](./builder.md#anyfielddefinition), [ConstraintDefinition](./builder.md#constraintdefinition), [FieldAlterInput](./builder.md#fieldalterinput), [IndexDefinition](./builder.md#indexdefinition), [OptimisticLockDefinition](./builder.md#optimisticlockdefinition).

## CollectionAlterInput

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type CollectionAlterInput =
  CollectionAlterDefinition | ((collection: CollectionAlterBuilder) => void);
```

Related declarations: [CollectionAlterBuilder](./builder.md#collectionalterbuilder), [CollectionAlterDefinition](./builder.md#collectionalterdefinition).

## CollectionBuilder

[Source](../../../src/collection/builder/builder.ts)

Import: `import type { CollectionBuilder } from '@nocobase/db'`.

```ts
export declare class CollectionBuilder {
  createCollection(
    name: string,
    input: CollectionDefinitionInput,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  createCollections(
    inputs: readonly CollectionCreateInput[],
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  hasCollection(name: string): Promise<boolean>;
  getCollection(name: string): Promise<CollectionDefinition | undefined>;
  alterCollection(
    name: string,
    input: CollectionAlterInput,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  dropCollection(
    name: string,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  renameCollection(
    oldName: string,
    newName: string,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  createViewCollection(
    name: string,
    input: ViewCollectionInput,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  replaceViewCollection(
    name: string,
    input: ViewCollectionInput,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  createMaterializedViewCollection(
    name: string,
    input: MaterializedViewCollectionInput,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  refreshMaterializedViewCollection(
    name: string,
    options?: RefreshMaterializedViewOptions,
  ): Promise<BuilderResult>;
  addField(
    collection: string,
    field: AnyFieldDefinition,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  alterField(
    collection: string,
    field: string,
    changes: FieldAlterInput,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  dropField(
    collection: string,
    field: string,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  addIndex(
    collection: string,
    index: IndexDefinition,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  dropIndex(
    collection: string,
    index: string,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  addConstraint(
    collection: string,
    constraint: ConstraintDefinition,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  dropConstraint(
    collection: string,
    constraint: string,
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  apply(
    operations: CollectionOperation[],
    options?: BuilderExecOptions,
  ): Promise<BuilderResult>;
  transaction<T>(fn: (builder: CollectionBuilder) => Promise<T>): Promise<T>;
}
```

Related declarations: [AnyFieldDefinition](./builder.md#anyfielddefinition), [BuilderExecOptions](./builder.md#builderexecoptions), [BuilderResult](./builder.md#builderresult), [CollectionAlterInput](./builder.md#collectionalterinput), [CollectionCreateInput](./builder.md#collectioncreateinput), [CollectionDefinition](./builder.md#collectiondefinition), [CollectionDefinitionInput](./builder.md#collectiondefinitioninput), [CollectionOperation](./builder.md#collectionoperation), [ConstraintDefinition](./builder.md#constraintdefinition), [FieldAlterInput](./builder.md#fieldalterinput), [IndexDefinition](./builder.md#indexdefinition), [MaterializedViewCollectionInput](./builder.md#materializedviewcollectioninput), [RefreshMaterializedViewOptions](./builder.md#refreshmaterializedviewoptions), [ViewCollectionInput](./builder.md#viewcollectioninput).

## CollectionCreateInput

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CollectionCreateInput {
  readonly name: string;
  readonly definition: CollectionDefinitionInput;
}
```

Related declarations: [CollectionDefinitionInput](./builder.md#collectiondefinitioninput).

## CollectionDefinition

[Source](../../../src/collection/types.ts)

Import: `import type { CollectionDefinition } from '@nocobase/db'`.

```ts
export interface CollectionDefinition {
  kind?: CollectionKind;
  name?: string;
  naming?: NamingOptions;
  title?: string;
  description?: string;
  db?: DbOptions;
  fields?: AnyFieldDefinition[];
  constraints?: ConstraintDefinition[];
  indexes?: IndexDefinition[];
  view?: ViewOptions;
  optimisticLock?: OptimisticLockDefinition;
}
```

Related declarations: [AnyFieldDefinition](./builder.md#anyfielddefinition), [CollectionKind](./builder.md#collectionkind), [ConstraintDefinition](./builder.md#constraintdefinition), [DbOptions](./builder.md#dboptions), [IndexDefinition](./builder.md#indexdefinition), [NamingOptions](./builder.md#namingoptions), [OptimisticLockDefinition](./builder.md#optimisticlockdefinition), [ViewOptions](./builder.md#viewoptions).

## CollectionDefinitionBuilder

[Source](../../../src/collection/types.ts)

Import: `import type { CollectionDefinitionBuilder } from '@nocobase/db'`.

```ts
export interface CollectionDefinitionBuilder {
  naming(options: NamingOptions): this;
  dbSchema(schema: string): this;
  title(title: string): this;
  description(description: string): this;
  optimisticLock(field: string): this;
  field(field: AnyFieldDefinition): FieldDefinitionBuilder;
  increments(name: string): FieldDefinitionBuilder;
  integer(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  bigInt(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  string(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  char(
    name: string,
    options: Partial<FieldDefinition> & {
      length: number;
    },
  ): FieldDefinitionBuilder;
  enum(
    name: string,
    options: Partial<FieldDefinition> & {
      values: readonly string[];
    },
  ): FieldDefinitionBuilder;
  text(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  boolean(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  decimal(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  float(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  double(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  date(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  time(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  datetimeTz(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  datetime(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  json(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  blob(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  uuid(
    name: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  native(
    name: string,
    nativeType: string,
    options?: Partial<FieldDefinition>,
  ): FieldDefinitionBuilder;
  belongsTo(
    name: string,
    target: string,
    options?: Partial<RelationFieldDefinition>,
  ): RelationFieldBuilder;
  hasOne(
    name: string,
    target: string,
    options?: Partial<RelationFieldDefinition>,
  ): RelationFieldBuilder;
  hasMany(
    name: string,
    target: string,
    options?: Partial<RelationFieldDefinition>,
  ): RelationFieldBuilder;
  belongsToMany(
    name: string,
    target: string,
    options?: Partial<RelationFieldDefinition>,
  ): RelationFieldBuilder;
  primary(
    fields: string | string[],
    options?: Omit<PrimaryConstraintDefinition, 'type' | 'fields'>,
  ): this;
  unique(
    fields: string | string[],
    options?: Omit<UniqueConstraintDefinition, 'type' | 'fields'>,
  ): this;
  foreignKey(
    fields: string | string[],
    options: Omit<ForeignKeyConstraintDefinition, 'type' | 'fields'>,
  ): this;
  index(
    fields: string | string[],
    options?: Omit<IndexDefinition, 'fields'>,
  ): this;
  toDefinition(): CollectionDefinition;
}
```

Related declarations: [AnyFieldDefinition](./builder.md#anyfielddefinition), [CollectionDefinition](./builder.md#collectiondefinition), [FieldDefinition](./builder.md#fielddefinition), [FieldDefinitionBuilder](./builder.md#fielddefinitionbuilder), [ForeignKeyConstraintDefinition](./builder.md#foreignkeyconstraintdefinition), [IndexDefinition](./builder.md#indexdefinition), [NamingOptions](./builder.md#namingoptions), [PrimaryConstraintDefinition](./builder.md#primaryconstraintdefinition), [RelationFieldBuilder](./builder.md#relationfieldbuilder), [RelationFieldDefinition](./builder.md#relationfielddefinition), [UniqueConstraintDefinition](./builder.md#uniqueconstraintdefinition).

## CollectionDefinitionInput

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type CollectionDefinitionInput =
  CollectionDefinition | ((collection: CollectionDefinitionBuilder) => void);
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition), [CollectionDefinitionBuilder](./builder.md#collectiondefinitionbuilder).

## CollectionKind

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type CollectionKind = 'table' | 'view' | 'materializedView';
```

## CollectionOperation

[Source](../../../src/collection/types.ts)

Import: `import type { CollectionOperation } from '@nocobase/db'`.

```ts
export type CollectionOperation =
  | {
      type: 'createCollection';
      name: string;
      definition: CollectionDefinition;
      ifNotExists?: boolean;
    }
  | {
      type: 'alterCollection';
      collection: string;
      changes: CollectionAlterDefinition;
    }
  | {
      type: 'dropCollection';
      collection: string;
      ifExists?: boolean;
    }
  | {
      type: 'renameCollection';
      from: string;
      to: string;
    }
  | {
      type: 'createViewCollection';
      name: string;
      definition: CollectionDefinition;
    }
  | {
      type: 'replaceViewCollection';
      name: string;
      definition: CollectionDefinition;
    }
  | {
      type: 'createMaterializedViewCollection';
      name: string;
      definition: CollectionDefinition;
    }
  | {
      type: 'refreshMaterializedViewCollection';
      collection: string;
      concurrently?: boolean;
    }
  | {
      type: 'addField';
      collection: string;
      field: AnyFieldDefinition;
    }
  | {
      type: 'alterField';
      collection: string;
      field: string;
      changes: FieldAlterInput;
    }
  | {
      type: 'dropField';
      collection: string;
      field: string;
    }
  | {
      type: 'addIndex';
      collection: string;
      index: IndexDefinition;
    }
  | {
      type: 'dropIndex';
      collection: string;
      index: string;
    }
  | {
      type: 'addConstraint';
      collection: string;
      constraint: ConstraintDefinition;
    }
  | {
      type: 'dropConstraint';
      collection: string;
      constraint: string;
    };
```

Related declarations: [AnyFieldDefinition](./builder.md#anyfielddefinition), [CollectionAlterDefinition](./builder.md#collectionalterdefinition), [CollectionDefinition](./builder.md#collectiondefinition), [ConstraintDefinition](./builder.md#constraintdefinition), [FieldAlterInput](./builder.md#fieldalterinput), [IndexDefinition](./builder.md#indexdefinition).

## ColumnSchemaDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ColumnSchemaDefinition {
  name: string;
  type: FieldType;
  nullable?: boolean;
  defaultValue?: unknown;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  unsigned?: boolean;
  db?: DbOptions;
}
```

Related declarations: [DbOptions](./builder.md#dboptions), [FieldType](./builder.md#fieldtype).

## ConstraintDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ConstraintDefinition =
  | PrimaryConstraintDefinition
  | UniqueConstraintDefinition
  | ForeignKeyConstraintDefinition
  | CheckConstraintDefinition;
```

Related declarations: [CheckConstraintDefinition](./builder.md#checkconstraintdefinition), [ForeignKeyConstraintDefinition](./builder.md#foreignkeyconstraintdefinition), [PrimaryConstraintDefinition](./builder.md#primaryconstraintdefinition), [UniqueConstraintDefinition](./builder.md#uniqueconstraintdefinition).

## DbOptions

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface DbOptions {
  schema?: string;
  comment?: string;
  nativeType?: string;
  [dialect: string]: unknown;
}
```

## Deferrable

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type Deferrable = boolean | 'immediate' | 'deferred';
```

## DialectOptions

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type DialectOptions = Record<string, unknown>;
```

## FieldAlterInput

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type FieldAlterInput = Partial<Omit<FieldDefinition, 'name'>>;
```

Related declarations: [FieldDefinition](./builder.md#fielddefinition).

## FieldBase

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface FieldBase {
  name: string;
  title?: string;
  description?: string;
  nullable?: boolean;
  defaultValue?: unknown;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  index?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  /** Inspected fractional-second precision; V1 Builder temporal columns use 3. */
  fractionalSecondsPrecision?: number;
  unsigned?: boolean;
  db?: DbOptions;
}
```

Related declarations: [DbOptions](./builder.md#dboptions).

## FieldDefinition

[Source](../../../src/collection/types.ts)

Import: `import type { FieldDefinition } from '@nocobase/db'`.

```ts
export interface FieldDefinition extends FieldBase {
  type: FieldType;
  /** Stable allowed string members for enum fields only. */
  values?: readonly string[];
  target?: never;
  sourceKey?: never;
  targetKey?: never;
  foreignKey?: never;
  foreignKeyType?: never;
  otherKey?: never;
  through?: never;
  constraints?: never;
  onDelete?: never;
  onUpdate?: never;
}
```

Related declarations: [FieldBase](./builder.md#fieldbase), [FieldType](./builder.md#fieldtype).

## FieldDefinitionBuilder

[Source](../../../src/collection/types.ts)

Import: `import type { FieldDefinitionBuilder } from '@nocobase/db'`.

```ts
export interface FieldDefinitionBuilder {
  primary(options?: Omit<PrimaryConstraintDefinition, 'type' | 'fields'>): this;
  autoIncrement(): this;
  notNull(): this;
  nullable(): this;
  defaultTo(value: unknown): this;
  unique(options?: Omit<UniqueConstraintDefinition, 'type' | 'fields'>): this;
  index(options?: Omit<IndexDefinition, 'fields'>): this;
  title(title: string): this;
  description(description: string): this;
  dbComment(comment: string): this;
  db(options: DbOptions): this;
  unsigned(): this;
  references(ref: {
    collection: string;
    field?: string;
    fields?: string[];
  }): this;
  toDefinition(): AnyFieldDefinition;
}
```

Related declarations: [AnyFieldDefinition](./builder.md#anyfielddefinition), [DbOptions](./builder.md#dboptions), [IndexDefinition](./builder.md#indexdefinition), [PrimaryConstraintDefinition](./builder.md#primaryconstraintdefinition), [UniqueConstraintDefinition](./builder.md#uniqueconstraintdefinition).

## FieldType

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type FieldType =
  | 'increments'
  | 'integer'
  | 'bigInt'
  | 'string'
  | 'char'
  | 'enum'
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
  | 'native'
  | 'belongsTo'
  | 'hasOne'
  | 'hasMany'
  | 'belongsToMany'
  | string;
```

## FilterExpression

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type FilterExpression = Record<string, unknown>;
```

## ForeignKeyConstraintDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ForeignKeyConstraintDefinition {
  type: 'foreignKey';
  fields: string[];
  references: {
    collection: string;
    fields?: string[];
  };
  name?: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  deferrable?: Deferrable;
  db?: DialectOptions;
}
```

Related declarations: [Deferrable](./builder.md#deferrable), [DialectOptions](./builder.md#dialectoptions), [ReferentialAction](./builder.md#referentialaction).

## IndexDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface IndexDefinition {
  fields?: string[];
  expressions?: unknown[];
  name?: string;
  type?: string;
  predicate?: FilterExpression;
  order?: Record<string, 'asc' | 'desc'>;
  db?: DialectOptions;
}
```

Related declarations: [DialectOptions](./builder.md#dialectoptions), [FilterExpression](./builder.md#filterexpression).

## MaterializedViewCollectionInput

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type MaterializedViewCollectionInput = ViewCollectionInput;
```

Related declarations: [ViewCollectionInput](./builder.md#viewcollectioninput).

## MetadataChangeSet

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface MetadataChangeSet {
  updated?: string[];
  created?: string[];
  removed?: string[];
}
```

## NamingOptions

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface NamingOptions {
  underscored?: boolean;
  tablePrefix?: string;
}
```

## OptimisticLockDefinition

[Source](../../../src/collection/types.ts)

Import: `import type { OptimisticLockDefinition } from '@nocobase/db'`.

```ts
export interface OptimisticLockDefinition {
  field: string;
  strategy: 'increment';
}
```

## PhysicalConstraintDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type PhysicalConstraintDefinition =
  | (Omit<PrimaryConstraintDefinition, 'fields'> & {
      columns: string[];
    })
  | (Omit<UniqueConstraintDefinition, 'fields'> & {
      columns: string[];
    })
  | (Omit<ForeignKeyConstraintDefinition, 'fields' | 'references'> & {
      columns: string[];
      references: {
        table: string;
        columns: string[];
      };
    })
  | CheckConstraintDefinition;
```

Related declarations: [CheckConstraintDefinition](./builder.md#checkconstraintdefinition), [ForeignKeyConstraintDefinition](./builder.md#foreignkeyconstraintdefinition), [PrimaryConstraintDefinition](./builder.md#primaryconstraintdefinition), [UniqueConstraintDefinition](./builder.md#uniqueconstraintdefinition).

## PhysicalIndexDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PhysicalIndexDefinition extends Omit<
  IndexDefinition,
  'fields'
> {
  columns?: string[];
}
```

Related declarations: [IndexDefinition](./builder.md#indexdefinition).

## PrimaryConstraintDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface PrimaryConstraintDefinition {
  type: 'primary';
  fields: string[];
  name?: string;
  deferrable?: Deferrable;
  db?: DialectOptions;
}
```

Related declarations: [Deferrable](./builder.md#deferrable), [DialectOptions](./builder.md#dialectoptions).

## QueryViewDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface QueryViewDefinition {
  from: string;
  select: string[];
  filter?: FilterExpression;
}
```

Related declarations: [FilterExpression](./builder.md#filterexpression).

## RawViewDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface RawViewDefinition {
  sql: string;
  bindings?: unknown[];
}
```

## ReferentialAction

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ReferentialAction =
  'cascade' | 'restrict' | 'set null' | 'set default' | 'no action';
```

## RefreshMaterializedViewOptions

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface RefreshMaterializedViewOptions extends BuilderExecOptions {
  concurrently?: boolean;
}
```

Related declarations: [BuilderExecOptions](./builder.md#builderexecoptions).

## RelationFieldBuilder

[Source](../../../src/collection/types.ts)

Import: `import type { RelationFieldBuilder } from '@nocobase/db'`.

```ts
export interface RelationFieldBuilder {
  primary(options?: Omit<PrimaryConstraintDefinition, 'type' | 'fields'>): this;
  autoIncrement(): this;
  notNull(): this;
  nullable(): this;
  defaultTo(value: unknown): this;
  unique(options?: Omit<UniqueConstraintDefinition, 'type' | 'fields'>): this;
  index(options?: Omit<IndexDefinition, 'fields'>): this;
  title(title: string): this;
  description(description: string): this;
  dbComment(comment: string): this;
  db(options: DbOptions): this;
  unsigned(): this;
  toDefinition(): RelationFieldDefinition;
  target(target: string): this;
  sourceKey(key: string): this;
  targetKey(key: string): this;
  foreignKey(key: string): this;
  foreignKeyType(type: FieldType): this;
  otherKey(key: string): this;
  through(collection: string): this;
  constraints(value?: boolean): this;
  onDelete(action: ReferentialAction): this;
  onUpdate(action: ReferentialAction): this;
}
```

Related declarations: [DbOptions](./builder.md#dboptions), [FieldType](./builder.md#fieldtype), [IndexDefinition](./builder.md#indexdefinition), [PrimaryConstraintDefinition](./builder.md#primaryconstraintdefinition), [ReferentialAction](./builder.md#referentialaction), [RelationFieldDefinition](./builder.md#relationfielddefinition), [UniqueConstraintDefinition](./builder.md#uniqueconstraintdefinition).

## RelationFieldDefinition

[Source](../../../src/collection/types.ts)

Import: `import type { RelationFieldDefinition } from '@nocobase/db'`.

```ts
export type RelationFieldDefinition = FieldBase & {
  type: RelationType;
  target: string;
  sourceKey?: string;
  targetKey?: string;
  foreignKey?: string;
  foreignKeyType?: FieldType;
  otherKey?: string;
  through?: string;
  constraints?: boolean;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
};
```

Related declarations: [FieldBase](./builder.md#fieldbase), [FieldType](./builder.md#fieldtype), [ReferentialAction](./builder.md#referentialaction), [RelationType](./builder.md#relationtype).

## RelationType

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type RelationType = 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany';
```

## SchemaOperation

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type SchemaOperation =
  | {
      type: 'createTable';
      table: TableSchemaDefinition;
      ifNotExists?: boolean;
    }
  | {
      type: 'alterTable';
      tableName: string;
      db?: DbOptions;
      operations: TableAlterSchemaOperation[];
    }
  | {
      type: 'dropTable';
      tableName: string;
      db?: DbOptions;
      ifExists?: boolean;
    }
  | {
      type: 'renameTable';
      from: string;
      to: string;
      db?: DbOptions;
    }
  | {
      type: 'createView';
      view: ViewSchemaDefinition;
      orReplace?: boolean;
      materialized?: boolean;
    }
  | {
      type: 'refreshMaterializedView';
      viewName: string;
      db?: DbOptions;
      concurrently?: boolean;
    };
```

Related declarations: [DbOptions](./builder.md#dboptions), [TableAlterSchemaOperation](./builder.md#tablealterschemaoperation), [TableSchemaDefinition](./builder.md#tableschemadefinition), [ViewSchemaDefinition](./builder.md#viewschemadefinition).

## TableAlterSchemaOperation

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type TableAlterSchemaOperation =
  | {
      type: 'addColumn';
      column: ColumnSchemaDefinition;
    }
  | {
      type: 'alterColumn';
      column: string;
      changes: Partial<ColumnSchemaDefinition>;
    }
  | {
      type: 'dropColumn';
      column: string;
    }
  | {
      type: 'addIndex';
      index: PhysicalIndexDefinition;
    }
  | {
      type: 'dropIndex';
      name: string;
    }
  | {
      type: 'addConstraint';
      constraint: PhysicalConstraintDefinition;
    }
  | {
      type: 'dropConstraint';
      name: string;
      constraintType?: PhysicalConstraintDefinition['type'];
    };
```

Related declarations: [ColumnSchemaDefinition](./builder.md#columnschemadefinition), [PhysicalConstraintDefinition](./builder.md#physicalconstraintdefinition), [PhysicalIndexDefinition](./builder.md#physicalindexdefinition).

## TableSchemaDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface TableSchemaDefinition {
  name: string;
  db?: DbOptions;
  columns: ColumnSchemaDefinition[];
  indexes: PhysicalIndexDefinition[];
  constraints: PhysicalConstraintDefinition[];
}
```

Related declarations: [ColumnSchemaDefinition](./builder.md#columnschemadefinition), [DbOptions](./builder.md#dboptions), [PhysicalConstraintDefinition](./builder.md#physicalconstraintdefinition), [PhysicalIndexDefinition](./builder.md#physicalindexdefinition).

## UniqueConstraintDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface UniqueConstraintDefinition {
  type: 'unique';
  fields: string[];
  name?: string;
  mode?: 'auto' | 'constraint' | 'index';
  deferrable?: Deferrable;
  indexType?: string;
  predicate?: FilterExpression;
  db?: DialectOptions;
}
```

Related declarations: [Deferrable](./builder.md#deferrable), [DialectOptions](./builder.md#dialectoptions), [FilterExpression](./builder.md#filterexpression).

## ViewCollectionDefinitionBuilder

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ViewCollectionDefinitionBuilder extends CollectionDefinitionBuilder {
  as(
    query:
      QueryViewDefinition | ((query: ViewQueryBuilder) => ViewQueryBuilder),
  ): this;
  asRaw(sql: string, bindings?: unknown[]): this;
  refresh(options: NonNullable<ViewOptions['refresh']>): this;
}
```

Related declarations: [CollectionDefinitionBuilder](./builder.md#collectiondefinitionbuilder), [QueryViewDefinition](./builder.md#queryviewdefinition), [ViewOptions](./builder.md#viewoptions), [ViewQueryBuilder](./builder.md#viewquerybuilder).

## ViewCollectionInput

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ViewCollectionInput =
  CollectionDefinition | ((view: ViewCollectionDefinitionBuilder) => void);
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition), [ViewCollectionDefinitionBuilder](./builder.md#viewcollectiondefinitionbuilder).

## ViewOptions

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ViewOptions {
  as?: QueryViewDefinition;
  asRaw?: RawViewDefinition;
  refresh?: {
    strategy?: 'manual' | 'scheduled';
  };
}
```

Related declarations: [QueryViewDefinition](./builder.md#queryviewdefinition), [RawViewDefinition](./builder.md#rawviewdefinition).

## ViewQueryBuilder

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ViewQueryBuilder {
  from(collection: string): this;
  select(...fields: string[]): this;
  where(field: string, operator: string, value: unknown): this;
  toQuery(): QueryViewDefinition;
}
```

Related declarations: [QueryViewDefinition](./builder.md#queryviewdefinition).

## ViewSchemaDefinition

[Source](../../../src/collection/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface ViewSchemaDefinition {
  name: string;
  db?: DbOptions;
  columns: string[];
  query?: QueryViewDefinition;
  raw?: RawViewDefinition;
  indexes?: PhysicalIndexDefinition[];
}
```

Related declarations: [DbOptions](./builder.md#dboptions), [PhysicalIndexDefinition](./builder.md#physicalindexdefinition), [QueryViewDefinition](./builder.md#queryviewdefinition), [RawViewDefinition](./builder.md#rawviewdefinition).
