import type {
  WritePolicyInput,
  FieldWritePolicyInput,
  UpsertWritePolicyInput,
} from './write-policy.js';
import type { RepositoryErrorCode } from './errors.js';
import type { RepositoryEventMetaEntry } from './events/types.js';
import type {
  RepositoryRecord,
  RepositoryContext,
  MutationValuesInput,
  ScalarCreateValues,
  ScalarUpdateValues,
  RepositoryFilter,
  SelectAst,
  SelectBuilder,
  AnySelectBuilder,
  SelectedBuilderRecord,
  RepositorySelect,
  RepositorySort,
  NonEmptyRepositorySort,
  AggregateAst,
  AggregateBuilder,
  AggregateSelection,
  AggregateSelectionResult,
  AggregateResult,
  AggregateOptions,
  GroupByResult,
  GroupBySelectionResult,
  GroupByOptions,
  UniqueSelector,
  CreateMutationValues,
  UpdateMutationValues,
  RepositoryCursor,
  RepositoryCursorDirection,
} from '@nocobase/repository-input';
import type {
  NormalizedRepositoryPolicy,
  PartialRepositoryPolicy,
  RepositoryPolicy,
} from './policy/types.js';
export type * from '@nocobase/repository-input';

export interface RepositoryReadOptions<
  TRecord extends object = RepositoryRecord,
> {
  readonly select?: RepositorySelect<TRecord>;
  readonly context?: RepositoryContext;
}

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

export interface RepositoryQuery<T> extends PromiseLike<T[]>, AsyncIterable<T> {
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T[] | TResult>;
  finally(onfinally?: (() => void) | null): Promise<T[]>;
}

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

export interface FilterOnlyOptions<TRecord extends object> {
  readonly filter?: RepositoryFilter<TRecord>;
  readonly context?: RepositoryContext;
}

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

export interface SingleMutationSelector<TRecord extends object> {
  readonly filter: RepositoryFilter<TRecord>;
}

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

export type MutationScope<TRecord extends object> =
  | {
      readonly filter: RepositoryFilter<TRecord>;
      readonly all?: never;
    }
  | {
      readonly filter?: never;
      readonly all: true;
    };

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

export type DeleteOneOptions<TRecord extends object = RepositoryRecord> =
  SingleMutationSelector<TRecord> & {
    readonly select?: RepositorySelect<TRecord>;
    readonly ifVersion?: string | number;
    readonly context?: RepositoryContext;
    /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
    readonly meta?: readonly RepositoryEventMetaEntry[];
  };

export type DeleteManyOptions<TRecord extends object> =
  MutationScope<TRecord> & {
    readonly select?: RepositorySelect<TRecord>;
    readonly context?: RepositoryContext;
    /** Metadata for this call's mutation event; see `defineRepositoryEventMeta()`. */
    readonly meta?: readonly RepositoryEventMetaEntry[];
  };

export interface CreatedTargetReference {
  readonly clientKey: string;
  readonly collection: string;
  readonly unique: UniqueSelector;
}

export interface SingleMutationResult<TResult> {
  readonly record: TResult;
  readonly createdTargets: readonly CreatedTargetReference[];
  readonly version?: string | number;
}

export type CreateManyResult<TResult = never> = [TResult] extends [never]
  ? { readonly createdCount: number }
  : { readonly createdCount: number; readonly records: readonly TResult[] };

export type UpdateManyResult<TResult = never> = [TResult] extends [never]
  ? { readonly updatedCount: number }
  : { readonly updatedCount: number; readonly records: readonly TResult[] };

export type DeleteOneResult<TResult = never> = [TResult] extends [never]
  ? { readonly deleted: true }
  : { readonly deleted: true; readonly record: TResult };

export type DeleteManyResult<TResult = never> = [TResult] extends [never]
  ? { readonly deletedCount: number }
  : { readonly deletedCount: number; readonly records: readonly TResult[] };

export interface DescribeMutationOptions {
  readonly operation: 'createOne' | 'updateOne';
}

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

export interface RepositoryUniqueFieldSetDescription {
  readonly fields: readonly string[];
  readonly primary: boolean;
}

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

export interface RepositoryMutationDescription {
  readonly collection: string;
  readonly operation: 'createOne' | 'updateOne';
  readonly relations: readonly RepositoryRelationMutationDescription[];
  readonly limits: {
    readonly maxDepth: number;
    readonly maxNodes: number;
  };
}

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

export interface MutationValidationResult {
  readonly valid: boolean;
  readonly errors: readonly MutationValidationError[];
}

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
    options: AggregateOptions<TRecord> & { readonly aggregate: AggregateAst },
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
    options: GroupByOptions<TRecord> & { readonly aggregate: AggregateAst },
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
    options: DeleteOneOptions<TRecord> & { readonly select: SelectAst },
  ): Promise<DeleteOneResult<TRecord>>;
  deleteOne(options: DeleteOneOptions<TRecord>): Promise<DeleteOneResult>;
  deleteMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: DeleteManyOptions<TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<DeleteManyResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  deleteMany(
    options: DeleteManyOptions<TRecord> & { readonly select: SelectAst },
  ): Promise<DeleteManyResult<TRecord>>;
  deleteMany(options: DeleteManyOptions<TRecord>): Promise<DeleteManyResult>;
}

/**
 * What a read returns once a Policy is bound.
 *
 * A `read` node means the returned record is shaped by an allowlist, so the
 * type degrades to `Partial<TRecord>`: a query with no select comes back
 * carrying `read.fields` alone, and an omitted `fields` is an empty allowlist
 * rather than a free pass. `read: true` adds no limits and keeps the full
 * record type.
 *
 * The degradation is deliberately coarse. Narrowing to exactly the listed
 * fields would need the literal list to survive inference at every call site,
 * and a `Partial` that is honest beats a precise type that silently widens
 * when someone stores the policy in a variable.
 *
 * The test asks whether the `read` union *contains* a rule object rather than
 * whether the whole union is one. A policy held in a variable of type
 * `RepositoryPolicy<T>` has `read: true | false | ReadNode`, which is not
 * itself an object — testing the union directly returned the complete record
 * for exactly the policies most likely to restrict it.
 */
export type PolicyRecord<
  TRecord extends object,
  TPolicy extends { readonly read: unknown },
> = [Extract<TPolicy['read'], object>] extends [never]
  ? TRecord
  : Partial<TRecord>;

/**
 * The operations a Repository performs, without the derivation methods.
 *
 * Both a plain and a policy-bound Repository satisfy this, which is what lets
 * code that only runs queries accept either. Neither is a subtype of the
 * other on purpose: `withPolicy` must not be reachable on a bound instance,
 * and `narrow` means nothing on an unbound one.
 */
export type RepositoryOperations<
  TRecord extends object = RepositoryRecord,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
> = Omit<Repository<TRecord, TCreate, TUpdate>, 'withPolicy'>;

export interface ScopedRepository<
  TRecord extends object = RepositoryRecord,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
> extends RepositoryOperations<TRecord, TCreate, TUpdate> {
  /**
   * Narrow the bound Policy further. Scopes intersect, field and relation
   * allowlists intersect, and `false` on either side wins — there is no
   * spelling that widens, so a narrowed Repository cannot climb back out.
   *
   * Absent from an unbound Repository on purpose: narrowing nothing is not a
   * meaningful request, and `withPolicy` is absent here for the mirror reason.
   */
  narrow(
    patch: PartialRepositoryPolicy<TRecord>,
  ): ScopedRepository<TRecord, TCreate, TUpdate>;
  /** The Policy actually in force, after `withPolicy` and every `narrow`. */
  explainPolicy(): NormalizedRepositoryPolicy;
}
