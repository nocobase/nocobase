# Repository operations: signatures

Read and mutate Collection records with field conversion, relations, policy enforcement, optimistic locking and mutation events. RepositoryQuery is both PromiseLike and AsyncIterable; consume a query in one mode.

[Chapter](../repository.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                                     | Access              |
| ------------------------------------------------------------------------------- | ------------------- |
| [CreateManyOptions](#createmanyoptions)                                         | `@nocobase/db` type |
| [CreateManyResult](#createmanyresult)                                           | `@nocobase/db` type |
| [CreateOneOptions](#createoneoptions)                                           | `@nocobase/db` type |
| [CreatedTargetReference](#createdtargetreference)                               | `@nocobase/db` type |
| [DeleteManyOptions](#deletemanyoptions)                                         | `@nocobase/db` type |
| [DeleteManyResult](#deletemanyresult)                                           | `@nocobase/db` type |
| [DeleteOneOptions](#deleteoneoptions)                                           | `@nocobase/db` type |
| [DeleteOneResult](#deleteoneresult)                                             | `@nocobase/db` type |
| [DescribeMutationOptions](#describemutationoptions)                             | `@nocobase/db` type |
| [FilterOnlyOptions](#filteronlyoptions)                                         | `@nocobase/db` type |
| [FindManyOptions](#findmanyoptions)                                             | `@nocobase/db` type |
| [FindOneOptions](#findoneoptions)                                               | `@nocobase/db` type |
| [MutationScope](#mutationscope)                                                 | `@nocobase/db` type |
| [MutationValidationError](#mutationvalidationerror)                             | `@nocobase/db` type |
| [MutationValidationResult](#mutationvalidationresult)                           | `@nocobase/db` type |
| [Repository](#repository)                                                       | `@nocobase/db` type |
| [RepositoryMutationDescription](#repositorymutationdescription)                 | `@nocobase/db` type |
| [RepositoryQuery](#repositoryquery)                                             | `@nocobase/db` type |
| [RepositoryReadOptions](#repositoryreadoptions)                                 | `@nocobase/db` type |
| [RepositoryRelationMutationDescription](#repositoryrelationmutationdescription) | `@nocobase/db` type |
| [RepositoryUniqueFieldSetDescription](#repositoryuniquefieldsetdescription)     | `@nocobase/db` type |
| [SingleMutationResult](#singlemutationresult)                                   | `@nocobase/db` type |
| [SingleMutationSelector](#singlemutationselector)                               | `@nocobase/db` type |
| [UpdateManyOptions](#updatemanyoptions)                                         | `@nocobase/db` type |
| [UpdateManyResult](#updatemanyresult)                                           | `@nocobase/db` type |
| [UpdateOneOptions](#updateoneoptions)                                           | `@nocobase/db` type |
| [UpsertOneOptions](#upsertoneoptions)                                           | `@nocobase/db` type |
| [ValidateMutationOptions](#validatemutationoptions)                             | `@nocobase/db` type |

## CreateManyOptions

[Source](../../../src/repository/types.ts)

Import: `import type { CreateManyOptions } from '@nocobase/db'`.

```ts
export interface CreateManyOptions<
  TCreate extends object,
  TRecord extends object = RepositoryRecord,
> {
  readonly values: MutationValuesInput<
    readonly [ScalarCreateValues<TCreate>, ...ScalarCreateValues<TCreate>[]]
  >;
  readonly select?: RepositorySelect<TRecord>;
  readonly context?: RepositoryContext;
  readonly writePolicy?: boolean | FieldWritePolicyInput;
  /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
  readonly meta?: readonly RepositoryEventMetaEntry[];
}
```

Related declarations: [FieldWritePolicyInput](./policies.md#fieldwritepolicyinput), [MutationValuesInput](./inputs.md#mutationvaluesinput), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryEventMetaEntry](./events.md#repositoryeventmetaentry), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySelect](./inputs.md#repositoryselect), [ScalarCreateValues](./inputs.md#scalarcreatevalues).

## CreateManyResult

[Source](../../../src/repository/types.ts)

Import: `import type { CreateManyResult } from '@nocobase/db'`.

```ts
export type CreateManyResult<TResult = never> = [TResult] extends [never]
  ? {
      readonly createdCount: number;
    }
  : {
      readonly createdCount: number;
      readonly records: readonly TResult[];
    };
```

## CreateOneOptions

[Source](../../../src/repository/types.ts)

Import: `import type { CreateOneOptions } from '@nocobase/db'`.

```ts
export interface CreateOneOptions<
  TCreate extends object,
  TRecord extends object = RepositoryRecord,
> {
  readonly values: MutationValuesInput<CreateMutationValues<TCreate>>;
  readonly select?: RepositorySelect<TRecord>;
  readonly context?: RepositoryContext;
  /** Server-only policy; omitted or true adds no write restrictions, false denies the mutation. */
  readonly writePolicy?: boolean | WritePolicyInput;
  /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
  readonly meta?: readonly RepositoryEventMetaEntry[];
}
```

Related declarations: [CreateMutationValues](./inputs.md#createmutationvalues), [MutationValuesInput](./inputs.md#mutationvaluesinput), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryEventMetaEntry](./events.md#repositoryeventmetaentry), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySelect](./inputs.md#repositoryselect), [WritePolicyInput](./policies.md#writepolicyinput).

## CreatedTargetReference

[Source](../../../src/repository/types.ts)

Import: `import type { CreatedTargetReference } from '@nocobase/db'`.

```ts
export interface CreatedTargetReference {
  readonly clientKey: string;
  readonly collection: string;
  readonly unique: UniqueSelector;
}
```

Related declarations: [UniqueSelector](./inputs.md#uniqueselector).

## DeleteManyOptions

[Source](../../../src/repository/types.ts)

Import: `import type { DeleteManyOptions } from '@nocobase/db'`.

```ts
export type DeleteManyOptions<TRecord extends object> =
  MutationScope<TRecord> & {
    readonly select?: RepositorySelect<TRecord>;
    readonly context?: RepositoryContext;
    /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
    readonly meta?: readonly RepositoryEventMetaEntry[];
  };
```

Related declarations: [MutationScope](./repository.md#mutationscope), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryEventMetaEntry](./events.md#repositoryeventmetaentry), [RepositorySelect](./inputs.md#repositoryselect).

## DeleteManyResult

[Source](../../../src/repository/types.ts)

Import: `import type { DeleteManyResult } from '@nocobase/db'`.

```ts
export type DeleteManyResult<TResult = never> = [TResult] extends [never]
  ? {
      readonly deletedCount: number;
    }
  : {
      readonly deletedCount: number;
      readonly records: readonly TResult[];
    };
```

## DeleteOneOptions

[Source](../../../src/repository/types.ts)

Import: `import type { DeleteOneOptions } from '@nocobase/db'`.

```ts
export type DeleteOneOptions<TRecord extends object = RepositoryRecord> =
  SingleMutationSelector<TRecord> & {
    readonly select?: RepositorySelect<TRecord>;
    readonly ifVersion?: string | number;
    readonly context?: RepositoryContext;
    /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
    readonly meta?: readonly RepositoryEventMetaEntry[];
  };
```

Related declarations: [RepositoryContext](./inputs.md#repositorycontext), [RepositoryEventMetaEntry](./events.md#repositoryeventmetaentry), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySelect](./inputs.md#repositoryselect), [SingleMutationSelector](./repository.md#singlemutationselector).

## DeleteOneResult

[Source](../../../src/repository/types.ts)

Import: `import type { DeleteOneResult } from '@nocobase/db'`.

```ts
export type DeleteOneResult<TResult = never> = [TResult] extends [never]
  ? {
      readonly deleted: true;
    }
  : {
      readonly deleted: true;
      readonly record: TResult;
    };
```

## DescribeMutationOptions

[Source](../../../src/repository/types.ts)

Import: `import type { DescribeMutationOptions } from '@nocobase/db'`.

```ts
export interface DescribeMutationOptions {
  readonly operation: 'createOne' | 'updateOne';
}
```

## FilterOnlyOptions

[Source](../../../src/repository/types.ts)

Import: `import type { FilterOnlyOptions } from '@nocobase/db'`.

```ts
export interface FilterOnlyOptions<TRecord extends object> {
  readonly filter?: RepositoryFilter<TRecord>;
  readonly context?: RepositoryContext;
}
```

Related declarations: [RepositoryContext](./inputs.md#repositorycontext), [RepositoryFilter](./inputs.md#repositoryfilter).

## FindManyOptions

[Source](../../../src/repository/types.ts)

Import: `import type { FindManyOptions } from '@nocobase/db'`.

```ts
export interface FindManyOptions<
  TRecord extends object,
> extends RepositoryReadOptions<TRecord> {
  readonly filter?: RepositoryFilter<TRecord>;
  readonly sort?: RepositorySort<TRecord>;
  readonly distinct?: readonly [
    keyof TRecord & string,
    ...(keyof TRecord & string)[],
  ];
  readonly cursor?: RepositoryCursor<TRecord>;
  readonly direction?: RepositoryCursorDirection;
  readonly limit?: number;
  readonly offset?: number;
}
```

Related declarations: [RepositoryCursor](./inputs.md#repositorycursor), [RepositoryCursorDirection](./inputs.md#repositorycursordirection), [RepositoryFilter](./inputs.md#repositoryfilter), [RepositoryReadOptions](./repository.md#repositoryreadoptions), [RepositorySort](./inputs.md#repositorysort).

## FindOneOptions

[Source](../../../src/repository/types.ts)

Import: `import type { FindOneOptions } from '@nocobase/db'`.

```ts
export type FindOneOptions<TRecord extends object> =
  RepositoryReadOptions<TRecord> &
    (
      | {
          readonly filter: RepositoryFilter<TRecord>;
          readonly sort?: RepositorySort<TRecord>;
        }
      | {
          readonly filter?: RepositoryFilter<TRecord>;
          readonly sort: NonEmptyRepositorySort<TRecord>;
        }
    );
```

Related declarations: [NonEmptyRepositorySort](./inputs.md#nonemptyrepositorysort), [RepositoryFilter](./inputs.md#repositoryfilter), [RepositoryReadOptions](./repository.md#repositoryreadoptions), [RepositorySort](./inputs.md#repositorysort).

## MutationScope

[Source](../../../src/repository/types.ts)

Import: `import type { MutationScope } from '@nocobase/db'`.

```ts
export type MutationScope<TRecord extends object> =
  | {
      readonly filter: RepositoryFilter<TRecord>;
      readonly all?: never;
    }
  | {
      readonly filter?: never;
      readonly all: true;
    };
```

Related declarations: [RepositoryFilter](./inputs.md#repositoryfilter).

## MutationValidationError

[Source](../../../src/repository/types.ts)

Import: `import type { MutationValidationError } from '@nocobase/db'`.

```ts
export interface MutationValidationError {
  readonly code: RepositoryErrorCode;
  readonly message: string;
  readonly path?: readonly (string | number)[];
  readonly collection?: string;
  readonly field?: string;
  readonly relation?: string;
  readonly retryable: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
}
```

Related declarations: [RepositoryErrorCode](./values.md#repositoryerrorcode).

## MutationValidationResult

[Source](../../../src/repository/types.ts)

Import: `import type { MutationValidationResult } from '@nocobase/db'`.

```ts
export interface MutationValidationResult {
  readonly valid: boolean;
  readonly errors: readonly MutationValidationError[];
}
```

Related declarations: [MutationValidationError](./repository.md#mutationvalidationerror).

## Repository

[Source](../../../src/repository/types.ts)

Import: `import type { Repository } from '@nocobase/db'`.

```ts
export interface Repository<
  TRecord extends object = RepositoryRecord,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
> {
  withPolicy<const TPolicy extends RepositoryPolicy<TRecord>>(
    policy: TPolicy,
  ): ScopedRepository<PolicyRecord<TRecord, TPolicy>, TCreate, TUpdate>;
  withPolicy<P, const TPolicy extends RepositoryPolicy<TRecord>>(
    policy: (principal: P) => TPolicy,
    principal: P,
  ): ScopedRepository<PolicyRecord<TRecord, TPolicy>, TCreate, TUpdate>;
  findMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: FindManyOptions<TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): RepositoryQuery<SelectedBuilderRecord<TRecord, TSelection>>;
  findMany(options?: FindManyOptions<TRecord>): RepositoryQuery<TRecord>;
  findOne<TSelection extends AnySelectBuilder<TRecord>>(
    options: FindOneOptions<TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<SelectedBuilderRecord<TRecord, TSelection> | undefined>;
  findOne(options: FindOneOptions<TRecord>): Promise<TRecord | undefined>;
  count(options?: FilterOnlyOptions<TRecord>): Promise<number>;
  exists(options?: FilterOnlyOptions<TRecord>): Promise<boolean>;
  aggregate<TSelection extends AggregateSelection>(
    options: AggregateOptions<TRecord> & {
      readonly aggregate: (aggregate: AggregateBuilder<TRecord>) => TSelection;
    },
  ): Promise<AggregateSelectionResult<TSelection>>;
  aggregate(
    options: AggregateOptions<TRecord> & {
      readonly aggregate: AggregateAst;
    },
  ): Promise<AggregateResult>;
  aggregate(options: AggregateOptions<TRecord>): Promise<AggregateResult>;
  groupBy<
    const TBy extends readonly [
      keyof TRecord & string,
      ...(keyof TRecord & string)[],
    ],
    TSelection extends AggregateSelection,
  >(
    options: GroupByOptions<
      TRecord,
      GroupBySelectionResult<TRecord, TBy, TSelection>
    > & {
      readonly by: TBy;
      readonly aggregate: (aggregate: AggregateBuilder<TRecord>) => TSelection;
    },
  ): Promise<Array<GroupBySelectionResult<TRecord, TBy, TSelection>>>;
  groupBy(
    options: GroupByOptions<TRecord> & {
      readonly aggregate: AggregateAst;
    },
  ): Promise<GroupByResult[]>;
  groupBy(options: GroupByOptions<TRecord>): Promise<GroupByResult[]>;
  describeMutation(
    options: DescribeMutationOptions,
  ): Promise<RepositoryMutationDescription>;
  validateMutation(
    options: ValidateMutationOptions<TCreate, TUpdate, TRecord>,
  ): Promise<MutationValidationResult>;
  createOne<TSelection extends AnySelectBuilder<TRecord>>(
    options: CreateOneOptions<TCreate, TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<SingleMutationResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  createOne(
    options: CreateOneOptions<TCreate, TRecord>,
  ): Promise<SingleMutationResult<TRecord>>;
  createMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: CreateManyOptions<TCreate, TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<CreateManyResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  createMany(
    options: CreateManyOptions<TCreate, TRecord> & {
      readonly select: SelectAst;
    },
  ): Promise<CreateManyResult<TRecord>>;
  createMany(
    options: CreateManyOptions<TCreate, TRecord>,
  ): Promise<CreateManyResult>;
  updateOne<TSelection extends AnySelectBuilder<TRecord>>(
    options: UpdateOneOptions<TUpdate, TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<SingleMutationResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  updateOne(
    options: UpdateOneOptions<TUpdate, TRecord>,
  ): Promise<SingleMutationResult<TRecord>>;
  upsertOne<TSelection extends AnySelectBuilder<TRecord>>(
    options: UpsertOneOptions<TCreate, TUpdate, TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<SingleMutationResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  upsertOne(
    options: UpsertOneOptions<TCreate, TUpdate, TRecord>,
  ): Promise<SingleMutationResult<TRecord>>;
  updateMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: UpdateManyOptions<TRecord, TUpdate> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<UpdateManyResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  updateMany(
    options: UpdateManyOptions<TRecord, TUpdate> & {
      readonly select: SelectAst;
    },
  ): Promise<UpdateManyResult<TRecord>>;
  updateMany(
    options: UpdateManyOptions<TRecord, TUpdate>,
  ): Promise<UpdateManyResult>;
  deleteOne<TSelection extends AnySelectBuilder<TRecord>>(
    options: DeleteOneOptions<TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<DeleteOneResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  deleteOne(
    options: DeleteOneOptions<TRecord> & {
      readonly select: SelectAst;
    },
  ): Promise<DeleteOneResult<TRecord>>;
  deleteOne(options: DeleteOneOptions<TRecord>): Promise<DeleteOneResult>;
  deleteMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: DeleteManyOptions<TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<DeleteManyResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  deleteMany(
    options: DeleteManyOptions<TRecord> & {
      readonly select: SelectAst;
    },
  ): Promise<DeleteManyResult<TRecord>>;
  deleteMany(options: DeleteManyOptions<TRecord>): Promise<DeleteManyResult>;
}
```

Related declarations: [AggregateAst](./inputs.md#aggregateast), [AggregateBuilder](./inputs.md#aggregatebuilder), [AggregateOptions](./inputs.md#aggregateoptions), [AggregateResult](./inputs.md#aggregateresult), [AggregateSelection](./inputs.md#aggregateselection), [AggregateSelectionResult](./inputs.md#aggregateselectionresult), [AnySelectBuilder](./inputs.md#anyselectbuilder), [CreateManyOptions](./repository.md#createmanyoptions), [CreateManyResult](./repository.md#createmanyresult), [CreateOneOptions](./repository.md#createoneoptions), [DeleteManyOptions](./repository.md#deletemanyoptions), [DeleteManyResult](./repository.md#deletemanyresult), [DeleteOneOptions](./repository.md#deleteoneoptions), [DeleteOneResult](./repository.md#deleteoneresult), [DescribeMutationOptions](./repository.md#describemutationoptions), [FilterOnlyOptions](./repository.md#filteronlyoptions), [FindManyOptions](./repository.md#findmanyoptions), [FindOneOptions](./repository.md#findoneoptions), [GroupByOptions](./inputs.md#groupbyoptions), [GroupByResult](./inputs.md#groupbyresult), [GroupBySelectionResult](./inputs.md#groupbyselectionresult), [MutationValidationResult](./repository.md#mutationvalidationresult), [PolicyRecord](./policies.md#policyrecord), [RepositoryMutationDescription](./repository.md#repositorymutationdescription), [RepositoryPolicy](./policies.md#repositorypolicy), [RepositoryQuery](./repository.md#repositoryquery), [RepositoryRecord](./inputs.md#repositoryrecord), [ScopedRepository](./policies.md#scopedrepository), [SelectAst](./inputs.md#selectast), [SelectBuilder](./inputs.md#selectbuilder), [SelectedBuilderRecord](./inputs.md#selectedbuilderrecord), [SingleMutationResult](./repository.md#singlemutationresult), [UpdateManyOptions](./repository.md#updatemanyoptions), [UpdateManyResult](./repository.md#updatemanyresult), [UpdateOneOptions](./repository.md#updateoneoptions), [UpsertOneOptions](./repository.md#upsertoneoptions), [ValidateMutationOptions](./repository.md#validatemutationoptions).

## RepositoryMutationDescription

[Source](../../../src/repository/types.ts)

Import: `import type { RepositoryMutationDescription } from '@nocobase/db'`.

```ts
export interface RepositoryMutationDescription {
  readonly collection: string;
  readonly operation: 'createOne' | 'updateOne';
  readonly relations: readonly RepositoryRelationMutationDescription[];
  readonly limits: {
    readonly maxDepth: number;
    readonly maxNodes: number;
  };
}
```

Related declarations: [RepositoryRelationMutationDescription](./repository.md#repositoryrelationmutationdescription).

## RepositoryQuery

[Source](../../../src/repository/types.ts)

Import: `import type { RepositoryQuery } from '@nocobase/db'`.

```ts
export interface RepositoryQuery<T> extends PromiseLike<T[]>, AsyncIterable<T> {
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T[] | TResult>;
  finally(onfinally?: (() => void) | null): Promise<T[]>;
}
```

## RepositoryReadOptions

[Source](../../../src/repository/types.ts)

Import: `import type { RepositoryReadOptions } from '@nocobase/db'`.

```ts
export interface RepositoryReadOptions<
  TRecord extends object = RepositoryRecord,
> {
  readonly select?: RepositorySelect<TRecord>;
  readonly context?: RepositoryContext;
}
```

Related declarations: [RepositoryContext](./inputs.md#repositorycontext), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySelect](./inputs.md#repositoryselect).

## RepositoryRelationMutationDescription

[Source](../../../src/repository/types.ts)

Import: `import type { RepositoryRelationMutationDescription } from '@nocobase/db'`.

```ts
export interface RepositoryRelationMutationDescription {
  readonly field: string;
  readonly cardinality: 'one' | 'many';
  readonly targetCollection: string;
  readonly through?: {
    readonly collection: string;
    readonly writableFields: readonly string[];
    readonly requiredOnCreate: readonly string[];
  };
  readonly allowedActions: readonly (
    'set' | 'clear' | 'patch' | 'replace' | 'modify'
  )[];
  readonly modifyOperations?: readonly ('update' | 'upsert' | 'delete')[];
  readonly patchOperations?: readonly (
    'connect' | 'create' | 'disconnect' | 'update' | 'upsert' | 'delete'
  )[];
  readonly uniqueFieldSets: readonly RepositoryUniqueFieldSetDescription[];
}
```

Related declarations: [RepositoryUniqueFieldSetDescription](./repository.md#repositoryuniquefieldsetdescription).

## RepositoryUniqueFieldSetDescription

[Source](../../../src/repository/types.ts)

Import: `import type { RepositoryUniqueFieldSetDescription } from '@nocobase/db'`.

```ts
export interface RepositoryUniqueFieldSetDescription {
  readonly fields: readonly string[];
  readonly primary: boolean;
}
```

## SingleMutationResult

[Source](../../../src/repository/types.ts)

Import: `import type { SingleMutationResult } from '@nocobase/db'`.

```ts
export interface SingleMutationResult<TResult> {
  readonly record: TResult;
  readonly createdTargets: readonly CreatedTargetReference[];
  readonly version?: string | number;
}
```

Related declarations: [CreatedTargetReference](./repository.md#createdtargetreference).

## SingleMutationSelector

[Source](../../../src/repository/types.ts)

Import: `import type { SingleMutationSelector } from '@nocobase/db'`.

```ts
export interface SingleMutationSelector<TRecord extends object> {
  readonly filter: RepositoryFilter<TRecord>;
}
```

Related declarations: [RepositoryFilter](./inputs.md#repositoryfilter).

## UpdateManyOptions

[Source](../../../src/repository/types.ts)

Import: `import type { UpdateManyOptions } from '@nocobase/db'`.

```ts
export type UpdateManyOptions<
  TRecord extends object,
  TUpdate extends object,
> = MutationScope<TRecord> & {
  readonly values: MutationValuesInput<ScalarUpdateValues<TUpdate>>;
  readonly select?: RepositorySelect<TRecord>;
  readonly context?: RepositoryContext;
  readonly writePolicy?: boolean | FieldWritePolicyInput;
  /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
  readonly meta?: readonly RepositoryEventMetaEntry[];
};
```

Related declarations: [FieldWritePolicyInput](./policies.md#fieldwritepolicyinput), [MutationScope](./repository.md#mutationscope), [MutationValuesInput](./inputs.md#mutationvaluesinput), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryEventMetaEntry](./events.md#repositoryeventmetaentry), [RepositorySelect](./inputs.md#repositoryselect), [ScalarUpdateValues](./inputs.md#scalarupdatevalues).

## UpdateManyResult

[Source](../../../src/repository/types.ts)

Import: `import type { UpdateManyResult } from '@nocobase/db'`.

```ts
export type UpdateManyResult<TResult = never> = [TResult] extends [never]
  ? {
      readonly updatedCount: number;
    }
  : {
      readonly updatedCount: number;
      readonly records: readonly TResult[];
    };
```

## UpdateOneOptions

[Source](../../../src/repository/types.ts)

Import: `import type { UpdateOneOptions } from '@nocobase/db'`.

```ts
export type UpdateOneOptions<
  TUpdate extends object,
  TRecord extends object = RepositoryRecord,
> = SingleMutationSelector<TRecord> & {
  readonly select?: RepositorySelect<TRecord>;
  readonly ifVersion?: string | number;
  readonly context?: RepositoryContext;
  /** Server-only policy; omitted or true adds no write restrictions, false denies the mutation. */
  readonly writePolicy?: boolean | WritePolicyInput;
  readonly values: MutationValuesInput<UpdateMutationValues<TUpdate>>;
  /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
  readonly meta?: readonly RepositoryEventMetaEntry[];
};
```

Related declarations: [MutationValuesInput](./inputs.md#mutationvaluesinput), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryEventMetaEntry](./events.md#repositoryeventmetaentry), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySelect](./inputs.md#repositoryselect), [SingleMutationSelector](./repository.md#singlemutationselector), [UpdateMutationValues](./inputs.md#updatemutationvalues), [WritePolicyInput](./policies.md#writepolicyinput).

## UpsertOneOptions

[Source](../../../src/repository/types.ts)

Import: `import type { UpsertOneOptions } from '@nocobase/db'`.

```ts
export type UpsertOneOptions<
  TCreate extends object,
  TUpdate extends object,
  TRecord extends object = RepositoryRecord,
> = SingleMutationSelector<TRecord> & {
  readonly create: MutationValuesInput<CreateMutationValues<TCreate>>;
  readonly update: MutationValuesInput<UpdateMutationValues<TUpdate>>;
  readonly select?: RepositorySelect<TRecord>;
  readonly ifVersion?: string | number;
  readonly context?: RepositoryContext;
  /** Server-only policy; omitted or true adds no write restrictions, false denies the mutation. */
  readonly writePolicy?: boolean | UpsertWritePolicyInput;
  /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
  readonly meta?: readonly RepositoryEventMetaEntry[];
};
```

Related declarations: [CreateMutationValues](./inputs.md#createmutationvalues), [MutationValuesInput](./inputs.md#mutationvaluesinput), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryEventMetaEntry](./events.md#repositoryeventmetaentry), [RepositoryRecord](./inputs.md#repositoryrecord), [RepositorySelect](./inputs.md#repositoryselect), [SingleMutationSelector](./repository.md#singlemutationselector), [UpdateMutationValues](./inputs.md#updatemutationvalues), [UpsertWritePolicyInput](./policies.md#upsertwritepolicyinput).

## ValidateMutationOptions

[Source](../../../src/repository/types.ts)

Import: `import type { ValidateMutationOptions } from '@nocobase/db'`.

```ts
export type ValidateMutationOptions<
  TCreate extends object,
  TUpdate extends object,
  TRecord extends object = RepositoryRecord,
> =
  | {
      readonly operation: 'createOne';
      readonly values: MutationValuesInput<CreateMutationValues<TCreate>>;
      readonly context?: RepositoryContext;
      /** Server-only policy; omitted or true adds no write restrictions, false denies the mutation. */
      readonly writePolicy?: boolean | WritePolicyInput;
    }
  | ({
      readonly operation: 'updateOne';
      readonly ifVersion?: string | number;
      readonly context?: RepositoryContext;
      /** Server-only policy; omitted or true adds no write restrictions, false denies the mutation. */
      readonly writePolicy?: boolean | WritePolicyInput;
      readonly values: MutationValuesInput<UpdateMutationValues<TUpdate>>;
    } & SingleMutationSelector<TRecord>);
```

Related declarations: [CreateMutationValues](./inputs.md#createmutationvalues), [MutationValuesInput](./inputs.md#mutationvaluesinput), [RepositoryContext](./inputs.md#repositorycontext), [RepositoryRecord](./inputs.md#repositoryrecord), [SingleMutationSelector](./repository.md#singlemutationselector), [UpdateMutationValues](./inputs.md#updatemutationvalues), [WritePolicyInput](./policies.md#writepolicyinput).
