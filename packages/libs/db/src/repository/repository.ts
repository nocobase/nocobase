import {
  normalizeWritePolicy,
  normalizeFieldWritePolicy,
  buildUpsertWritePolicy,
  assertWriteEnabled,
} from './write-policy.js';
import { normalizeRepositoryPolicy } from './policy/normalize.js';
import { narrowRepositoryPolicy } from './policy/narrow.js';
import {
  applyCreateDefaults,
  assertCreateScopeSatisfiable,
  assertReadableField,
  detachPolicy,
  combinePolicyFilter,
  readableFields,
  relationReadContext,
  resolveMutationNode,
  resolveWriteShapeNode,
  rootReadContext,
  scopeFieldNames,
  toWritePolicy,
  UNRESTRICTED_READ,
  type PolicyMutationOperation,
  type PolicyReadContext,
} from './policy/enforce.js';
import type {
  NormalizedCreateNode,
  NormalizedRelationWriteNode,
  NormalizedRepositoryPolicy,
  PartialRepositoryPolicy,
  RepositoryPolicy,
} from './policy/types.js';
import type { PolicyRecord } from './types.js';
import { invalid, isPlainRecord } from './internal/guards.js';
import {
  assertMutationWritePolicy,
  assertFieldWrites,
} from './write-policy-check.js';
import { isTemporalType, normalizeTemporalValue } from './temporal.js';
import type {
  AnyFieldDefinition,
  CollectionDefinition,
  ConstraintDefinition,
  FieldDefinition,
  RelationFieldDefinition,
} from '../collection/types.js';
import type { ConnectionCollections } from '../collection/registry/types.js';
import { RepositoryError } from './errors.js';
import { DefaultRepositoryQuery } from './query.js';
import { snapshotQueryInput } from './internal/input-snapshot.js';
import { identityConstraints } from './internal/identity.js';
import {
  isManagedField,
  validatePolicyFields,
  validateWritePolicyMetadata,
} from './writable-fields.js';
import { normalizeNumericMutation } from './numeric-mutation.js';
import { normalizeBooleanValue } from './boolean.js';
import { normalizeCharValue } from './char.js';
import { normalizeEnumValue } from './enum.js';
import {
  evaluateValues,
  resolveMutationValue,
  validateResolvedMutationValue,
} from './values.js';
import { jsonOperators, validateJsonCondition } from './json-filter.js';
import {
  aggregateExpressionToNode,
  DefaultAggregateBuilder,
} from './aggregate-builder.js';
import { DefaultFilterBuilder, getFilterFieldGroup } from './filter-builder.js';
import {
  DefaultRelationFieldMutationBuilder,
  type RelationFieldMutationBuilderState,
} from './relation-mutation-builder.js';
import {
  DefaultSelectBuilder,
  type SelectBuilderState,
  type RelationSelectBranchInput,
} from './select-builder.js';
import { DefaultSortBuilder, sortExpressionToNode } from './sort-builder.js';
import type {
  RepositoryCursorAxis,
  RelationScopeNode,
  RepositoryExecutionAdapter,
  RepositoryScopeCheck,
  RepositoryReadPlan,
} from './internal/execution-adapter.js';
import { normalizeRepositoryEventMeta } from './events/meta.js';
import type {
  AggregateAst,
  AggregateBuilder,
  AggregateNode,
  AggregateOptions,
  AggregateResult,
  AggregateSelection,
  AggregateSelectionResult,
  CreateManyOptions,
  CreateManyResult,
  CreateOneOptions,
  CreateRelationFieldMutationInput,
  CreateTarget,
  ConnectTarget,
  DeleteManyOptions,
  DeleteManyResult,
  DeleteOneOptions,
  DeleteOneResult,
  AnySelectBuilder,
  DescribeMutationOptions,
  FilterAst,
  FilterConditionNode,
  FilterGroupNode,
  FilterNode,
  FilterOnlyOptions,
  FilterOperator,
  FilterValue,
  FilterVariable,
  FindManyOptions,
  FindOneOptions,
  GroupByOptions,
  GroupByResult,
  GroupBySelectionResult,
  MutationValidationError,
  MutationValidationResult,
  RepositoryQuery,
  RepositoryContext,
  RepositoryCursor,
  RepositoryFilter,
  RepositoryMutationDescription,
  RepositoryRecord,
  ScopedRepository,
  RepositorySelect,
  RepositorySort,
  RelationMutationAst,
  RelationMutationNode,
  RelationDeleteInput,
  RelationDeleteTarget,
  RelationUpdateInput,
  RelationUpdateTarget,
  RelationUpsertInput,
  RelationUpsertTarget,
  SelectAst,
  RelationSelectBranchNode,
  SelectBuilder,
  SelectedBuilderRecord,
  SelectIncludeNode,
  SingleMutationResult,
  SortAst,
  SortNode,
  UniqueSelector,
  UpdateManyOptions,
  UpdateManyResult,
  UpdateRelationFieldMutationInput,
  UpdateOneOptions,
  UpsertOneOptions,
  ValidateMutationOptions,
} from './types.js';

export interface DefaultRepositoryOptions {
  readonly collection: string;
  readonly collections: Pick<ConnectionCollections, 'get'>;
  readonly adapter: RepositoryExecutionAdapter;
  readonly policy?: NormalizedRepositoryPolicy;
}

export class DefaultRepository<
  TRecord extends object = RepositoryRecord,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
> implements ScopedRepository<TRecord, TCreate, TUpdate> {
  /**
   * Normalized scopes, resolved once per instance. A bound Policy is frozen,
   * so its scope cannot change while this Repository lives, and normalizing
   * it on every call meant walking the Collection metadata on every write.
   */
  private readonly scopeChecks = new Map<
    'create' | 'update',
    RepositoryScopeCheck
  >();

  constructor(private readonly options: DefaultRepositoryOptions) {}

  withPolicy<const TPolicy extends RepositoryPolicy<TRecord>>(
    policy: TPolicy,
  ): ScopedRepository<PolicyRecord<TRecord, TPolicy>, TCreate, TUpdate>;
  withPolicy<P, const TPolicy extends RepositoryPolicy<TRecord>>(
    policy: (principal: P) => TPolicy,
    principal: P,
  ): ScopedRepository<PolicyRecord<TRecord, TPolicy>, TCreate, TUpdate>;
  withPolicy<P, const TPolicy extends RepositoryPolicy<TRecord>>(
    policy: TPolicy | ((principal: P) => TPolicy),
    principal?: P,
  ): ScopedRepository<PolicyRecord<TRecord, TPolicy>, TCreate, TUpdate> {
    // A Repository handed out by a policy-bound Connection is still a
    // DefaultRepository, and the Connection types it as `Repository`, so this
    // method stays reachable. Replacing the binding there would hand back an
    // unrestricted Repository and undo the Connection's authorization, so
    // rebinding is refused rather than allowed to widen. Tightening further
    // is what `narrow` is for.
    if (this.options.policy) {
      invalid(
        'INVALID_POLICY',
        'This Repository already has a bound Policy. Use narrow() to tighten it; a Policy cannot be replaced.',
        { collection: this.options.collection },
      );
    }
    const input =
      typeof policy === 'function' ? policy(principal as P) : policy;
    return new DefaultRepository<
      PolicyRecord<TRecord, TPolicy>,
      TCreate,
      TUpdate
    >({
      ...this.options,
      policy: normalizeRepositoryPolicy(input),
    });
  }

  narrow(
    patch: PartialRepositoryPolicy<TRecord>,
  ): ScopedRepository<TRecord, TCreate, TUpdate> {
    return new DefaultRepository<TRecord, TCreate, TUpdate>({
      ...this.options,
      policy: narrowRepositoryPolicy(this.explainPolicy(), patch),
    });
  }

  explainPolicy(): NormalizedRepositoryPolicy {
    if (!this.options.policy) {
      throw new RepositoryError(
        'POLICY_REQUIRED',
        'Repository does not have a bound Policy.',
        { collection: this.options.collection },
      );
    }
    return detachPolicy(this.options.policy);
  }

  findMany(options: FindManyOptions<TRecord> = {}): RepositoryQuery<TRecord> {
    return new DefaultRepositoryQuery(
      () => this.executeMany(snapshotQueryInput(options)),
      () =>
        this.executeStream(snapshotQueryInput(options))[Symbol.asyncIterator](),
    );
  }

  private async prepareRead(
    options: FindManyOptions<TRecord>,
  ): Promise<RepositoryReadPlan> {
    this.options.adapter.assertReadable();
    const collection = await this.collection();
    const policy = this.readContext(collection);
    const selection = await this.validateSelect(
      collection,
      options.select,
      options.context,
      policy,
    );
    const filter = await this.normalizeFilter(
      collection,
      options.filter,
      options.context,
      policy,
    );
    const sort = await this.validateSort(
      collection,
      options.sort,
      false,
      policy,
    );
    validatePagination(options.limit, options.offset, sort, options.cursor);
    validateCursorDirection(options.direction, options.cursor);
    const distinct = validateDistinct(
      collection,
      options.distinct,
      sort,
      policy,
    );
    const cursor = validateCursor(
      collection,
      options.cursor,
      sort,
      options.sort !== undefined,
    );
    return {
      collection,
      fields: selection.fields,
      select: selection.select,
      filter,
      sort,
      distinct,
      cursor,
      direction: options.direction,
      limit: options.limit,
      offset: options.offset,
    };
  }

  private async executeMany(
    options: FindManyOptions<TRecord>,
  ): Promise<TRecord[]> {
    return (await this.options.adapter.findMany(
      await this.prepareRead(options),
    )) as TRecord[];
  }

  private async *executeStream(
    options: FindManyOptions<TRecord>,
  ): AsyncIterable<TRecord> {
    for await (const record of this.options.adapter.stream(
      await this.prepareRead(options),
    )) {
      yield record as TRecord;
    }
  }

  async findOne(
    options: FindOneOptions<TRecord>,
  ): Promise<TRecord | undefined> {
    const collection = await this.collection();
    const policy = this.readContext(collection);
    const selection = await this.validateSelect(
      collection,
      options.select,
      options.context,
      policy,
    );
    const callerFilter = await this.normalizeFilterWithoutPolicy(
      collection,
      options.filter,
      options.context,
    );
    if (!callerFilter && options.sort === undefined) {
      invalid(
        'INVALID_FILTER',
        'findOne() requires filter or non-empty sort.',
        {
          collection: collection.name,
        },
      );
    }
    const filter = await this.applyReadPolicy(collection, callerFilter, policy);
    const sort = await this.validateSort(
      collection,
      options.sort,
      !callerFilter,
      policy,
    );
    return (await this.options.adapter.findOne({
      collection,
      fields: selection.fields,
      select: selection.select,
      filter,
      sort,
      limit: 1,
    })) as TRecord | undefined;
  }

  async count(options: FilterOnlyOptions<TRecord> = {}): Promise<number> {
    const collection = await this.collection();
    return this.options.adapter.count({
      collection,
      filter: await this.normalizeFilter(
        collection,
        options.filter,
        options.context,
        this.readContext(collection),
      ),
    });
  }

  async exists(options: FilterOnlyOptions<TRecord> = {}): Promise<boolean> {
    const collection = await this.collection();
    return this.options.adapter.exists({
      collection,
      filter: await this.normalizeFilter(
        collection,
        options.filter,
        options.context,
        this.readContext(collection),
      ),
    });
  }

  async aggregate<TSelection extends AggregateSelection>(
    options: AggregateOptions<TRecord> & {
      readonly aggregate: (aggregate: AggregateBuilder<TRecord>) => TSelection;
    },
  ): Promise<AggregateSelectionResult<TSelection>>;
  async aggregate(
    options: AggregateOptions<TRecord> & { readonly aggregate: AggregateAst },
  ): Promise<AggregateResult>;
  async aggregate(options: AggregateOptions<TRecord>): Promise<AggregateResult>;
  async aggregate(
    options: AggregateOptions<TRecord>,
  ): Promise<AggregateResult> {
    const collection = await this.collection();
    const policy = this.readContext(collection);
    const aggregate = normalizeAggregateInput(collection, options.aggregate);
    validateAggregate(collection, aggregate, policy);
    const filter = await this.normalizeFilter(
      collection,
      options.filter,
      options.context,
      policy,
    );
    return this.options.adapter.aggregate({ collection, aggregate, filter });
  }

  async groupBy<
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
  async groupBy(
    options: GroupByOptions<TRecord> & { readonly aggregate: AggregateAst },
  ): Promise<GroupByResult[]>;
  async groupBy(options: GroupByOptions<TRecord>): Promise<GroupByResult[]>;
  async groupBy(options: GroupByOptions<TRecord>): Promise<GroupByResult[]> {
    const collection = await this.collection();
    const policy = this.readContext(collection);
    const by = validateGroupByFields(collection, options.by, policy);
    const aggregate = normalizeAggregateInput(collection, options.aggregate);
    validateAggregate(collection, aggregate, policy);
    const resultCollection = groupByResultCollection(collection, by, aggregate);
    const filter = await this.normalizeFilter(
      collection,
      options.filter,
      options.context,
      policy,
    );
    const having = await normalizeFilterWithRelations(
      this.options.collections,
      resultCollection,
      options.having,
      options.context,
    );
    const sort = await validateSortWithRelations(
      this.options.collections,
      resultCollection,
      options.sort,
      false,
      UNRESTRICTED_READ,
    );
    return this.options.adapter.groupBy({
      collection,
      by,
      aggregate,
      filter,
      having,
      sort,
    });
  }

  async describeMutation(
    options: DescribeMutationOptions,
  ): Promise<RepositoryMutationDescription> {
    const collection = await this.collection();
    const relations = await Promise.all(
      relationFields(collection).map(async (relation) => {
        const target = await targetCollection(
          this.options.collections,
          relation,
          ['relations', relation.name],
        );
        const toOne =
          relation.type === 'belongsTo' || relation.type === 'hasOne';
        const canDisconnect = await relationCanDisconnect(
          this.options.collections,
          collection,
          relation,
        );
        const throughCollection =
          relation.type === 'belongsToMany' && relation.through
            ? await this.options.collections.get(relation.through)
            : undefined;
        const throughFields = throughCollection
          ? scalarFields(throughCollection).filter(
              (field) =>
                ![
                  relation.foreignKey,
                  relation.otherKey,
                  ...primaryFields(throughCollection),
                ].includes(field.name) &&
                field.type !== 'increments' &&
                !field.autoIncrement &&
                field.db?.generated === undefined &&
                field.name !== throughCollection.optimisticLock?.field,
            )
          : [];
        return {
          field: relation.name,
          cardinality: toOne ? ('one' as const) : ('many' as const),
          targetCollection: relation.target,
          ...(throughCollection
            ? {
                through: {
                  collection: throughCollection.name!,
                  writableFields: throughFields.map((field) => field.name),
                  requiredOnCreate: throughFields
                    .filter(
                      (field) =>
                        field.nullable === false &&
                        field.defaultValue === undefined,
                    )
                    .map((field) => field.name),
                },
              }
            : {}),
          allowedActions: await allowedRelationActions(
            this.options.collections,
            collection,
            relation,
            options.operation,
          ),
          modifyOperations:
            toOne && options.operation === 'updateOne'
              ? canDisconnect
                ? (['update', 'upsert', 'delete'] as const)
                : (['update', 'upsert'] as const)
              : undefined,
          patchOperations: toOne
            ? undefined
            : options.operation === 'createOne'
              ? (['connect', 'create'] as const)
              : canDisconnect
                ? ([
                    'connect',
                    'create',
                    'disconnect',
                    'update',
                    'upsert',
                    'delete',
                  ] as const)
                : ([
                    'connect',
                    'create',
                    'update',
                    'upsert',
                    'delete',
                  ] as const),
          uniqueFieldSets: uniqueConstraints(target).map((constraint) => ({
            fields: constraint.fields,
            primary: constraint.type === 'primary',
          })),
        };
      }),
    );
    return {
      collection: collection.name!,
      operation: options.operation,
      relations,
      limits: { maxDepth: 3, maxNodes: 100 },
    };
  }

  async validateMutation(
    options: ValidateMutationOptions<TCreate, TUpdate, TRecord>,
  ): Promise<MutationValidationResult> {
    try {
      const policyInput =
        options.writePolicy === undefined ? true : options.writePolicy;
      assertWriteEnabled(policyInput);
      const writePolicy =
        policyInput === true
          ? true
          : normalizeWritePolicy(
              policyInput,
              options.operation === 'createOne' ? 'create' : 'update',
            );
      const collection = await this.collection();
      assertWritableCollection(collection);
      await validateWritePolicyMetadata(
        this.options.collections,
        collection,
        writePolicy,
      );
      const mutation = await normalizeModelMutation(
        this.options.collections,
        collection,
        evaluateValues(options.values),
        options.operation,
        1,
        { nodes: 0, clientKeys: new Set(), context: options.context },
      );
      this.assertPolicyMutationFields(
        collection,
        mutation,
        options.operation === 'createOne' ? 'create' : 'update',
        ['values'],
      );
      assertMutationWritePolicy(
        mutation,
        writePolicy,
        ['values'],
        [],
        options.operation === 'createOne' ? 'create' : 'update',
        collection.name,
      );
      if (options.operation === 'updateOne') {
        await this.normalizeSingleMutationFilter(
          collection,
          options.filter,
          options.context,
          'update',
        );
        validateIfVersion(collection, options.ifVersion);
      } else {
        // A create whose scope reads a field it can never set is invalid, and
        // saying so here is the whole point of this method: otherwise it
        // reports valid and the caller finds out from an insert that rolls
        // back on every attempt.
        await this.scopeCheck(collection, 'create');
      }
      return { valid: true, errors: [] };
    } catch (error) {
      if (!(error instanceof RepositoryError)) throw error;
      return { valid: false, errors: [toValidationError(error)] };
    }
  }

  async createOne(
    options: CreateOneOptions<TCreate, TRecord>,
  ): Promise<SingleMutationResult<TRecord>> {
    const policyInput =
      options.writePolicy === undefined ? true : options.writePolicy;
    assertWriteEnabled(policyInput);
    const writePolicy =
      policyInput === true ? true : normalizeWritePolicy(policyInput, 'create');
    const collection = await this.collection();
    assertWritableCollection(collection);
    // Before the payload is looked at: a Policy that forbids this operation
    // refuses the call outright, so an empty or malformed body is reported as
    // forbidden rather than as invalid input. The caller learns nothing about
    // the shape of a write they may not perform.
    resolveWriteShapeNode(this.options.policy, 'create', collection);
    await validateWritePolicyMetadata(
      this.options.collections,
      collection,
      writePolicy,
    );
    const createValues = applyCreateDefaults(
      this.options.policy,
      evaluateValues(options.values),
    );
    const mutation = await normalizeModelMutation(
      this.options.collections,
      collection,
      createValues.values,
      'createOne',
      1,
      { nodes: 0, clientKeys: new Set(), context: options.context },
    );
    this.assertPolicyMutationFields(
      collection,
      mutation,
      'create',
      ['values'],
      createValues.protectedFields,
    );
    assertMutationWritePolicy(
      mutation,
      writePolicy,
      ['values'],
      [],
      'create',
      collection.name,
    );
    const selection = await this.validateSelect(
      collection,
      options.select,
      options.context,
      this.readContext(collection),
    );
    const requestedFields = selection.fields;
    const executionFields = includeExecutionFields(collection, requestedFields);
    const result = await this.options.adapter.createOne({
      collection,
      meta: normalizeRepositoryEventMeta(options.meta, collection.name!),
      fields: executionFields,
      values: mutation.values,
      relations: mutation.relations,
      select: selection.select,
      scopeCheck: await this.scopeCheck(collection, 'create'),
      relationScopes: await this.writeRelationScopes(collection, 'create'),
    });
    return {
      record: pickSelection(
        result.record,
        requestedFields,
        selection.select,
      ) as TRecord,
      createdTargets: result.createdTargets,
      version: result.version,
    };
  }

  async createMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: CreateManyOptions<TCreate, TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<CreateManyResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  async createMany(
    options: CreateManyOptions<TCreate, TRecord> & {
      readonly select: SelectAst;
    },
  ): Promise<CreateManyResult<TRecord>>;
  async createMany(
    options: CreateManyOptions<TCreate, TRecord>,
  ): Promise<CreateManyResult>;
  async createMany(
    options: CreateManyOptions<TCreate, TRecord>,
  ): Promise<
    | CreateManyResult
    | { readonly createdCount: number; readonly records: readonly TRecord[] }
  > {
    const policyInput =
      options.writePolicy === undefined ? true : options.writePolicy;
    assertWriteEnabled(policyInput);
    const writePolicy =
      policyInput === true ? true : normalizeFieldWritePolicy(policyInput);
    const collection = await this.collection();
    assertWritableCollection(collection);
    // Before the payload is looked at: a Policy that forbids this operation
    // refuses the call outright, so an empty or malformed body is reported as
    // forbidden rather than as invalid input. The caller learns nothing about
    // the shape of a write they may not perform.
    resolveWriteShapeNode(this.options.policy, 'create', collection);
    if (writePolicy !== true)
      validatePolicyFields(collection, writePolicy, ['writePolicy']);
    const input = evaluateValues(options.values);
    if (!Array.isArray(input) || input.length === 0) {
      invalid('INVALID_MUTATION', 'createMany() values must not be empty.', {
        collection: collection.name,
        path: ['values'],
      });
    }
    const recordsWithDefaults = input.map((record: unknown, index: number) => {
      const createValues = applyCreateDefaults(this.options.policy, record);
      return {
        values: validateValues(
          collection,
          createValues.values,
          'createMany',
          false,
          options.context,
          ['values', index],
        ),
        protectedFields: createValues.protectedFields,
      };
    });
    const records = recordsWithDefaults.map((record) => record.values);
    recordsWithDefaults.forEach((record, index) =>
      this.assertPolicyMutationFields(
        collection,
        { values: record.values },
        'create',
        ['values', index],
        record.protectedFields,
      ),
    );
    records.forEach((values, index) =>
      assertFieldWrites(
        values,
        writePolicy,
        ['values', index],
        [],
        'create',
        collection.name,
      ),
    );
    const selection = options.select
      ? await this.validateSelect(
          collection,
          options.select,
          options.context,
          this.readContext(collection),
        )
      : undefined;
    if (selection) assertBulkReturningIdentity(collection);
    const result = await this.options.adapter.createMany({
      collection,
      meta: normalizeRepositoryEventMeta(options.meta, collection.name!),
      records,
      fields: selection
        ? includeExecutionFields(collection, selection.fields)
        : undefined,
      select: selection?.select,
      scopeCheck: await this.scopeCheck(collection, 'create'),
    });
    return selection
      ? {
          createdCount: result.count,
          records: pickManySelections(result.records, selection) as TRecord[],
        }
      : { createdCount: result.count };
  }

  async updateOne(
    options: UpdateOneOptions<TUpdate, TRecord>,
  ): Promise<SingleMutationResult<TRecord>> {
    const policyInput =
      options.writePolicy === undefined ? true : options.writePolicy;
    assertWriteEnabled(policyInput);
    const writePolicy =
      policyInput === true ? true : normalizeWritePolicy(policyInput, 'update');
    const collection = await this.collection();
    assertWritableCollection(collection);
    // Before the payload is looked at: a Policy that forbids this operation
    // refuses the call outright, so an empty or malformed body is reported as
    // forbidden rather than as invalid input. The caller learns nothing about
    // the shape of a write they may not perform.
    resolveWriteShapeNode(this.options.policy, 'update', collection);
    await validateWritePolicyMetadata(
      this.options.collections,
      collection,
      writePolicy,
    );
    const mutation = await normalizeModelMutation(
      this.options.collections,
      collection,
      evaluateValues(options.values),
      'updateOne',
      1,
      { nodes: 0, clientKeys: new Set(), context: options.context },
    );
    this.assertPolicyMutationFields(collection, mutation, 'update', ['values']);
    assertMutationWritePolicy(
      mutation,
      writePolicy,
      ['values'],
      [],
      'update',
      collection.name,
    );
    const filter = await this.normalizeSingleMutationFilter(
      collection,
      options.filter,
      options.context,
      'update',
    );
    validateIfVersion(collection, options.ifVersion);
    const selection = await this.validateSelect(
      collection,
      options.select,
      options.context,
      this.readContext(collection),
    );
    const requestedFields = selection.fields;
    const result = await this.options.adapter.updateOne({
      collection,
      meta: normalizeRepositoryEventMeta(options.meta, collection.name!),
      fields: includeExecutionFields(collection, requestedFields),
      filter,
      values: mutation.values,
      ifVersion: options.ifVersion,
      relations: mutation.relations,
      select: selection.select,
      scopeCheck: await this.scopeCheck(collection, 'update'),
      relationScopes: await this.writeRelationScopes(collection, 'update'),
    });
    if (result === 'multiple') multipleRecordsMatched(collection);
    if (result === 'conflict') versionConflict(collection);
    if (result === 'missing') recordNotFound(collection);
    return {
      record: pickSelection(
        result.record,
        requestedFields,
        selection.select,
      ) as TRecord,
      createdTargets: result.createdTargets,
      version: result.version,
    };
  }

  async upsertOne(
    options: UpsertOneOptions<TCreate, TUpdate, TRecord>,
  ): Promise<SingleMutationResult<TRecord>> {
    const policyInput =
      options.writePolicy === undefined ? true : options.writePolicy;
    assertWriteEnabled(policyInput);
    const writePolicy =
      policyInput === true ? true : buildUpsertWritePolicy(policyInput);
    const collection = await this.collection();
    assertWritableCollection(collection);
    if (writePolicy !== true) {
      await validateWritePolicyMetadata(
        this.options.collections,
        collection,
        writePolicy.create,
        ['writePolicy', 'create'],
      );
      await validateWritePolicyMetadata(
        this.options.collections,
        collection,
        writePolicy.update,
        ['writePolicy', 'update'],
      );
    }
    // The Policy scope is deliberately kept out of this filter. An upsert
    // locates its target by a unique key, and a scope merged in would leave a
    // filter that is no longer one key, breaking the uniqueness judgement
    // outright. Whether the caller may touch the target is asked separately,
    // of the record that is actually there: see `updateScopeCheck`.
    const filter = await this.normalizeFilterWithoutPolicy(
      collection,
      options.filter,
      options.context,
    );
    if (!filter || filter.root.items.length === 0) {
      invalid(
        'INVALID_FILTER',
        'Single mutations require a non-empty filter.',
        {
          collection: collection.name,
          path: ['filter'],
        },
      );
    }
    const by = uniqueSelectorFromFilter(collection, filter, ['filter']);
    // A Policy that forbids the operation outright still refuses here.
    resolveWriteShapeNode(this.options.policy, 'update', collection);
    const createValues = applyCreateDefaults(
      this.options.policy,
      evaluateValues(options.create),
    );
    const [createMutation, updateMutation] = await Promise.all([
      normalizeModelMutation(
        this.options.collections,
        collection,
        createValues.values,
        'createOne',
        1,
        { nodes: 0, clientKeys: new Set(), context: options.context },
        ['create'],
      ),
      normalizeModelMutation(
        this.options.collections,
        collection,
        evaluateValues(options.update),
        'updateOne',
        1,
        { nodes: 0, clientKeys: new Set(), context: options.context },
        ['update'],
      ),
    ]);
    assertMutationWritePolicy(
      createMutation,
      writePolicy === true ? true : writePolicy.create,
      ['create'],
      [],
      'create',
      collection.name,
    );
    this.assertPolicyMutationFields(
      collection,
      createMutation,
      'create',
      ['create'],
      createValues.protectedFields,
    );
    this.assertPolicyMutationFields(collection, updateMutation, 'update', [
      'update',
    ]);
    assertMutationWritePolicy(
      updateMutation,
      writePolicy === true ? true : writePolicy.update,
      ['update'],
    );
    if (
      by.fields.some(
        (field) =>
          !Object.hasOwn(createMutation.values, field) ||
          createMutation.values[field] !== by.values[field],
      )
    ) {
      invalid(
        'INVALID_MUTATION',
        'Upsert create values must contain the same unique selector values as filter.',
        { collection: collection.name, path: ['create'] },
      );
    }
    if (
      by.fields.some(
        (field) =>
          Object.hasOwn(updateMutation.values, field) &&
          updateMutation.values[field] !== by.values[field],
      )
    ) {
      invalid(
        'INVALID_MUTATION',
        'Upsert update values must not change the unique selector fields.',
        { collection: collection.name, path: ['update'] },
      );
    }
    validateIfVersion(collection, options.ifVersion);
    const selection = await this.validateSelect(
      collection,
      options.select,
      options.context,
      this.readContext(collection),
    );
    const requestedFields = selection.fields;
    const result = await this.options.adapter.upsertOne({
      collection,
      meta: normalizeRepositoryEventMeta(options.meta, collection.name!),
      fields: includeExecutionFields(collection, requestedFields),
      by,
      createValues: createMutation.values,
      createRelations: createMutation.relations,
      updateValues: updateMutation.values,
      updateRelations: updateMutation.relations,
      ifVersion: options.ifVersion,
      select: selection.select,
      createScopeCheck: await this.scopeCheck(collection, 'create'),
      updateScopeCheck: await this.scopeCheck(collection, 'update'),
      createRelationScopes: await this.writeRelationScopes(
        collection,
        'create',
      ),
      updateRelationScopes: await this.writeRelationScopes(
        collection,
        'update',
      ),
    });
    if (result === 'conflict') versionConflict(collection);
    return {
      record: pickSelection(
        result.record,
        requestedFields,
        selection.select,
      ) as TRecord,
      createdTargets: result.createdTargets,
      version: result.version,
    };
  }

  async updateMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: UpdateManyOptions<TRecord, TUpdate> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<UpdateManyResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  async updateMany(
    options: UpdateManyOptions<TRecord, TUpdate> & {
      readonly select: SelectAst;
    },
  ): Promise<UpdateManyResult<TRecord>>;
  async updateMany(
    options: UpdateManyOptions<TRecord, TUpdate>,
  ): Promise<UpdateManyResult>;
  async updateMany(
    options: UpdateManyOptions<TRecord, TUpdate>,
  ): Promise<
    | UpdateManyResult
    | { readonly updatedCount: number; readonly records: readonly TRecord[] }
  > {
    const policyInput =
      options.writePolicy === undefined ? true : options.writePolicy;
    assertWriteEnabled(policyInput);
    const writePolicy =
      policyInput === true ? true : normalizeFieldWritePolicy(policyInput);
    const collection = await this.collection();
    assertWritableCollection(collection);
    // Before the payload is looked at: a Policy that forbids this operation
    // refuses the call outright, so an empty or malformed body is reported as
    // forbidden rather than as invalid input. The caller learns nothing about
    // the shape of a write they may not perform.
    resolveWriteShapeNode(this.options.policy, 'update', collection);
    if (writePolicy !== true)
      validatePolicyFields(collection, writePolicy, ['writePolicy']);
    const filter = await this.normalizeMutationFilter(
      collection,
      options.filter,
      options.context,
      options.all === true,
      'update',
    );
    const values = validateValues(
      collection,
      evaluateValues(options.values),
      'updateMany',
      false,
      options.context,
    );
    assertFieldWrites(
      values,
      writePolicy,
      ['values'],
      [],
      'update',
      collection.name,
    );
    this.assertPolicyMutationFields(collection, { values }, 'update', [
      'values',
    ]);
    const selection = options.select
      ? await this.validateSelect(
          collection,
          options.select,
          options.context,
          this.readContext(collection),
        )
      : undefined;
    if (selection) assertBulkReturningIdentity(collection);
    const result = await this.options.adapter.updateMany({
      collection,
      meta: normalizeRepositoryEventMeta(options.meta, collection.name!),
      filter,
      all: options.all === true,
      values,
      fields: selection
        ? includeExecutionFields(collection, selection.fields)
        : undefined,
      select: selection?.select,
      scopeCheck: await this.scopeCheck(collection, 'update'),
    });
    return selection
      ? {
          updatedCount: result.count,
          records: pickManySelections(result.records, selection) as TRecord[],
        }
      : { updatedCount: result.count };
  }

  async deleteOne<TSelection extends AnySelectBuilder<TRecord>>(
    options: DeleteOneOptions<TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<DeleteOneResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  async deleteOne(
    options: DeleteOneOptions<TRecord> & { readonly select: SelectAst },
  ): Promise<DeleteOneResult<TRecord>>;
  async deleteOne(options: DeleteOneOptions<TRecord>): Promise<DeleteOneResult>;
  async deleteOne(
    options: DeleteOneOptions<TRecord>,
  ): Promise<
    DeleteOneResult | { readonly deleted: true; readonly record: TRecord }
  > {
    const collection = await this.collection();
    assertWritableCollection(collection);
    const filter = await this.normalizeSingleMutationFilter(
      collection,
      options.filter,
      options.context,
      'delete',
    );
    validateIfVersion(collection, options.ifVersion);
    const selection = options.select
      ? await this.validateSelect(
          collection,
          options.select,
          options.context,
          this.readContext(collection),
        )
      : undefined;
    const result = await this.options.adapter.deleteOne({
      collection,
      meta: normalizeRepositoryEventMeta(options.meta, collection.name!),
      filter,
      ifVersion: options.ifVersion,
      fields: selection
        ? includeExecutionFields(collection, selection.fields)
        : undefined,
      select: selection?.select,
    });
    if (result === 'conflict') versionConflict(collection);
    if (result === 'multiple') multipleRecordsMatched(collection);
    if (result === 'missing') recordNotFound(collection);
    if (typeof result !== 'string' && selection) {
      return {
        deleted: true,
        record: pickSelection(
          result.record,
          selection.fields,
          selection.select,
        ) as TRecord,
      };
    }
    return { deleted: true };
  }

  async deleteMany<TSelection extends AnySelectBuilder<TRecord>>(
    options: DeleteManyOptions<TRecord> & {
      readonly select: (select: SelectBuilder<TRecord>) => TSelection;
    },
  ): Promise<DeleteManyResult<SelectedBuilderRecord<TRecord, TSelection>>>;
  async deleteMany(
    options: DeleteManyOptions<TRecord> & { readonly select: SelectAst },
  ): Promise<DeleteManyResult<TRecord>>;
  async deleteMany(
    options: DeleteManyOptions<TRecord>,
  ): Promise<DeleteManyResult>;
  async deleteMany(
    options: DeleteManyOptions<TRecord>,
  ): Promise<
    | DeleteManyResult
    | { readonly deletedCount: number; readonly records: readonly TRecord[] }
  > {
    const collection = await this.collection();
    assertWritableCollection(collection);
    const filter = await this.normalizeMutationFilter(
      collection,
      options.filter,
      options.context,
      options.all === true,
      'delete',
    );
    const selection = options.select
      ? await this.validateSelect(
          collection,
          options.select,
          options.context,
          this.readContext(collection),
        )
      : undefined;
    if (selection) assertBulkReturningIdentity(collection);
    const result = await this.options.adapter.deleteMany({
      collection,
      meta: normalizeRepositoryEventMeta(options.meta, collection.name!),
      filter,
      all: options.all === true,
      fields: selection
        ? includeExecutionFields(collection, selection.fields)
        : undefined,
      select: selection?.select,
    });
    return selection
      ? {
          deletedCount: result.count,
          records: pickManySelections(result.records, selection) as TRecord[],
        }
      : { deletedCount: result.count };
  }

  private async collection(): Promise<CollectionDefinition> {
    const collection = await this.options.collections.get(
      this.options.collection,
    );
    if (!collection) {
      invalid(
        'COLLECTION_NOT_FOUND',
        `Collection "${this.options.collection}" does not exist.`,
        { collection: this.options.collection },
      );
    }
    return collection;
  }

  private assertPolicyMutationFields(
    collection: CollectionDefinition,
    mutation: {
      readonly values: Readonly<Record<string, unknown>>;
      readonly relations?: RelationMutationAst;
    },
    operation: 'create' | 'update',
    path: readonly (string | number)[],
    protectedFields: readonly string[] = [],
  ): void {
    const policy = resolveWriteShapeNode(
      this.options.policy,
      operation,
      collection,
    );
    if (policy === undefined || policy === true) return;
    validatePolicyFields(collection, { fields: policy.fields }, [
      'policy',
      operation,
    ]);
    assertMutationWritePolicy(
      mutation,
      {
        ...toWritePolicy(policy),
        fields: [...policy.fields, ...protectedFields],
      },
      path,
      [],
      operation,
      collection.name,
    );
  }

  /**
   * The post-write scope check for an operation, or undefined when the Policy
   * puts no limit on where the record may land.
   */
  /**
   * Build the relation target scopes for a write, mirroring the Policy's
   * relation tree onto the Collection graph.
   *
   * Nested shapes each carry their own relation nodes, so a relation reached
   * through more than one of them gets every scope ANDed together — the
   * narrowest reading, since none of them was granted more than once.
   */
  private async relationScopes(
    collection: CollectionDefinition,
    relations: Readonly<Record<string, NormalizedRelationWriteNode>>,
  ): Promise<Readonly<Record<string, RelationScopeNode>> | undefined> {
    const entries = Object.entries(relations);
    if (entries.length === 0) return undefined;
    const result: Record<string, RelationScopeNode> = {};
    for (const [name, node] of entries) {
      const relation = collection.fields?.find(
        (field) => field.name === name && 'target' in field,
      ) as RelationFieldDefinition | undefined;
      if (!relation) continue;
      const target = await this.options.collections.get(relation.target);
      if (!target) continue;
      const scope =
        node.scope === undefined || node.scope === true
          ? undefined
          : await normalizeFilterWithRelations(
              this.options.collections,
              target,
              node.scope,
              undefined,
            );
      const nested = await this.relationScopes(
        target,
        mergeNestedRelationNodes(node),
      );
      if (scope || nested) {
        result[name] = {
          ...(scope ? { scope } : {}),
          ...(nested ? { relations: nested } : {}),
        };
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  private async writeRelationScopes(
    collection: CollectionDefinition,
    operation: 'create' | 'update',
  ): Promise<Readonly<Record<string, RelationScopeNode>> | undefined> {
    const node = resolveWriteShapeNode(
      this.options.policy,
      operation,
      collection,
    );
    if (node === undefined || node === true) return undefined;
    return this.relationScopes(collection, node.relations);
  }

  private async scopeCheck(
    collection: CollectionDefinition,
    operation: 'create' | 'update',
  ): Promise<RepositoryScopeCheck | undefined> {
    const node = resolveWriteShapeNode(
      this.options.policy,
      operation,
      collection,
    );
    if (node === undefined || node === true) return undefined;
    if (operation === 'create') {
      assertCreateScopeSatisfiable(collection, node as NormalizedCreateNode);
    }
    if (node.scope === true) return undefined;
    const cached = this.scopeChecks.get(operation);
    if (cached) return cached;
    const scope = await normalizeFilterWithRelations(
      this.options.collections,
      collection,
      node.scope,
      undefined,
    );
    if (!scope) return undefined;
    const check: RepositoryScopeCheck = {
      scope,
      fields: scopeFieldNames(scope),
    };
    this.scopeChecks.set(operation, check);
    return check;
  }

  private async normalizeFilter<T extends object>(
    collection: CollectionDefinition,
    input: RepositoryFilter<T> | undefined,
    context: Readonly<Record<string, unknown>> | undefined,
    policy: PolicyReadContext,
  ): Promise<FilterAst | undefined> {
    return this.applyReadPolicy(
      collection,
      await this.normalizeFilterWithoutPolicy(collection, input, context),
      policy,
    );
  }

  /**
   * Narrow an already-normalized caller filter by the read policy: reject the
   * fields it may not name, then intersect it with the scope.
   */
  private async applyReadPolicy(
    collection: CollectionDefinition,
    normalized: FilterAst | undefined,
    policy: PolicyReadContext,
  ): Promise<FilterAst | undefined> {
    if (policy.kind === 'unrestricted') return normalized;
    const caller = normalized
      ? {
          ...normalized,
          root: await scopeCallerFilterGroup(
            this.options.collections,
            collection,
            normalized.root,
            policy,
            ['root'],
          ),
        }
      : undefined;
    const scope =
      policy.scope === true
        ? undefined
        : await normalizeFilterWithRelations(
            this.options.collections,
            collection,
            policy.scope,
            undefined,
          );
    return combinePolicyFilter(caller, scope, collection.name!);
  }

  private async validateSelect(
    collection: CollectionDefinition,
    select: RepositorySelect<TRecord> | undefined,
    context: Readonly<Record<string, unknown>> | undefined,
    policy: PolicyReadContext,
  ): Promise<ValidatedSelect> {
    return validateSelectWithRelations(
      this.options.collections,
      collection,
      select,
      context,
      policy,
    );
  }

  /**
   * The read authorization in force on this Repository. Every read surface
   * takes it as a required argument, so a new one cannot skip the checks by
   * forgetting to ask for it.
   */
  private readContext(collection: CollectionDefinition): PolicyReadContext {
    return rootReadContext(this.options.policy, collection);
  }

  private async validateSort(
    collection: CollectionDefinition,
    sort: RepositorySort<TRecord> | undefined,
    requireNonEmpty: boolean,
    policy: PolicyReadContext,
  ): Promise<SortAst | undefined> {
    return validateSortWithRelations(
      this.options.collections,
      collection,
      sort,
      requireNonEmpty,
      policy,
    );
  }

  private async normalizeMutationFilter<T extends object>(
    collection: CollectionDefinition,
    filter: RepositoryFilter<T> | undefined,
    context: Readonly<Record<string, unknown>> | undefined,
    all: boolean,
    operation: PolicyMutationOperation,
  ): Promise<FilterAst | undefined> {
    if (all) {
      if (filter !== undefined) {
        invalid('INVALID_FILTER', 'filter and all are mutually exclusive.', {
          collection: collection.name,
        });
      }
      return this.normalizePolicyMutationScope(collection, operation);
    }
    const normalized = await this.normalizeFilterWithoutPolicy(
      collection,
      filter,
      context,
    );
    const scoped = await this.combineMutationPolicyScope(
      collection,
      normalized,
      operation,
    );
    if (!scoped || scoped.root.items.length === 0) {
      invalid(
        'INVALID_FILTER',
        'Bulk mutations require a non-empty filter or all: true.',
        { collection: collection.name, path: ['filter'] },
      );
    }
    return scoped;
  }

  private async normalizeSingleMutationFilter<T extends object>(
    collection: CollectionDefinition,
    filter: RepositoryFilter<T> | undefined,
    context: Readonly<Record<string, unknown>> | undefined,
    operation: PolicyMutationOperation,
  ): Promise<FilterAst> {
    const normalized = await this.normalizeFilterWithoutPolicy(
      collection,
      filter,
      context,
    );
    const scoped = await this.combineMutationPolicyScope(
      collection,
      normalized,
      operation,
    );
    if (!scoped || scoped.root.items.length === 0) {
      invalid(
        'INVALID_FILTER',
        'Single mutations require a non-empty filter.',
        {
          collection: collection.name,
          path: ['filter'],
        },
      );
    }
    return scoped;
  }

  private async normalizeFilterWithoutPolicy<T extends object>(
    collection: CollectionDefinition,
    input: RepositoryFilter<T> | undefined,
    context: Readonly<Record<string, unknown>> | undefined,
  ): Promise<FilterAst | undefined> {
    return normalizeFilterWithRelations(
      this.options.collections,
      collection,
      input,
      context,
    );
  }

  private async normalizePolicyMutationScope(
    collection: CollectionDefinition,
    operation: PolicyMutationOperation,
  ): Promise<FilterAst | undefined> {
    const node = resolveMutationNode(
      this.options.policy,
      operation,
      collection,
    );
    if (node === undefined || node === true || node.scope === true) {
      return undefined;
    }
    return normalizeFilterWithRelations(
      this.options.collections,
      collection,
      node.scope,
      undefined,
    );
  }

  private async combineMutationPolicyScope(
    collection: CollectionDefinition,
    caller: FilterAst | undefined,
    operation: PolicyMutationOperation,
  ): Promise<FilterAst | undefined> {
    const scope = await this.normalizePolicyMutationScope(
      collection,
      operation,
    );
    return combinePolicyFilter(caller, scope, collection.name!);
  }
}

const OPERATORS_BY_TYPE: Readonly<Record<string, readonly FilterOperator[]>> = {
  enum: ['$eq', '$ne', '$empty', '$notEmpty'],
  char: [
    '$includes',
    '$notIncludes',
    '$startsWith',
    '$endsWith',
    '$eq',
    '$ne',
    '$empty',
    '$notEmpty',
  ],
  json: jsonOperators,
  string: [
    '$includes',
    '$notIncludes',
    '$startsWith',
    '$endsWith',
    '$eq',
    '$ne',
    '$empty',
    '$notEmpty',
  ],
  uuid: [
    '$includes',
    '$notIncludes',
    '$startsWith',
    '$endsWith',
    '$eq',
    '$ne',
    '$empty',
    '$notEmpty',
  ],
  text: [
    '$includes',
    '$notIncludes',
    '$startsWith',
    '$endsWith',
    '$eq',
    '$ne',
    '$empty',
    '$notEmpty',
  ],
  increments: [
    '$eq',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$empty',
    '$notEmpty',
  ],
  integer: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$empty', '$notEmpty'],
  bigInt: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$empty', '$notEmpty'],
  decimal: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$empty', '$notEmpty'],
  float: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$empty', '$notEmpty'],
  double: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$empty', '$notEmpty'],
  date: [
    '$eq',
    '$ne',
    '$dateOn',
    '$dateNotOn',
    '$dateBefore',
    '$dateAfter',
    '$dateNotBefore',
    '$dateNotAfter',
    '$dateBetween',
    '$empty',
    '$notEmpty',
  ],
  datetime: [
    '$eq',
    '$ne',
    '$dateBefore',
    '$dateAfter',
    '$dateNotBefore',
    '$dateNotAfter',
    '$dateBetween',
    '$empty',
    '$notEmpty',
  ],
  datetimeTz: [
    '$eq',
    '$ne',
    '$dateBefore',
    '$dateAfter',
    '$dateNotBefore',
    '$dateNotAfter',
    '$dateBetween',
    '$empty',
    '$notEmpty',
  ],
  time: ['$eq', '$ne', '$empty', '$notEmpty'],
  boolean: ['$isTruly', '$isFalsy', '$empty', '$notEmpty'],
};

const FILTER_GROUP_BY_TYPE: Readonly<Record<string, string>> = {
  enum: 'string',
  char: 'string',
  string: 'string',
  uuid: 'string',
  text: 'text',
  increments: 'number',
  integer: 'number',
  bigInt: 'number',
  decimal: 'number',
  float: 'number',
  double: 'number',
  date: 'date',
  datetime: 'date',
  datetimeTz: 'date',
  time: 'time',
  boolean: 'boolean',
  json: 'json',
};

const FILTER_SHORTHAND_TYPES: ReadonlySet<string> = new Set([
  'enum',
  'char',
  'string',
  'uuid',
  'text',
  'increments',
  'integer',
  'bigInt',
  'decimal',
  'float',
  'double',
  'time',
  'boolean',
]);

const SORTABLE_TYPES = new Set([
  'char',
  'increments',
  'integer',
  'bigInt',
  'decimal',
  'float',
  'double',
  'string',
  'uuid',
  'boolean',
  'date',
  'datetime',
  'datetimeTz',
  'time',
]);

function normalizeScalarFilter<TRecord extends object>(
  collection: CollectionDefinition,
  input: RepositoryFilter<TRecord> | undefined,
  context: Readonly<Record<string, unknown>> | undefined,
): FilterAst | undefined {
  if (input === undefined) return undefined;
  let ast: FilterAst;
  if (typeof input === 'function') {
    ast = wrapFilter(
      input(new DefaultFilterBuilder<TRecord>()),
      collection.name!,
    );
  } else {
    if (!isPlainRecord(input)) {
      invalid('INVALID_FILTER', 'Expected a Repository Filter input.', {
        collection: collection.name,
        path: ['filter'],
      });
    }
    ast = isFilterAstInput(collection, input)
      ? (input as unknown as FilterAst)
      : filterShorthandToAst(collection, input);
  }
  if (
    ast.kind !== 'filter' ||
    ast.version !== 1 ||
    ast.root?.kind !== 'group'
  ) {
    invalid('INVALID_FILTER', 'Expected a Repository Filter AST version 1.', {
      collection: collection.name,
    });
  }
  if (ast.collection !== undefined && ast.collection !== collection.name) {
    invalid(
      'INVALID_FILTER',
      `Filter Collection "${ast.collection}" does not match "${collection.name}".`,
      { collection: collection.name, path: ['collection'] },
    );
  }
  const root = validateFilterGroup(collection, ast.root, context, ['root']);
  return { kind: 'filter', version: 1, collection: collection.name, root };
}

function isFilterAstInput(
  collection: CollectionDefinition,
  input: Readonly<Record<string, unknown>>,
): boolean {
  const keys = Object.keys(input);
  const fieldNames = new Set(
    (collection.fields ?? []).map((field) => field.name),
  );
  if (
    keys.length > 0 &&
    keys.every(
      (key) => fieldNames.has(key) && isFilterShorthandValue(input[key]),
    )
  ) {
    return false;
  }
  return (
    input.kind === 'filter' ||
    Object.hasOwn(input, 'root') ||
    (Object.hasOwn(input, 'kind') && Object.hasOwn(input, 'version'))
  );
}

function isFilterShorthandValue(value: unknown): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function filterShorthandToAst(
  collection: CollectionDefinition,
  input: Readonly<Record<string, unknown>>,
): FilterAst {
  const entries = Object.entries(input);
  if (entries.length === 0) {
    invalid('INVALID_FILTER', 'Filter shorthand must not be empty.', {
      collection: collection.name,
      path: ['filter'],
    });
  }
  return {
    kind: 'filter',
    version: 1,
    collection: collection.name,
    root: {
      kind: 'group',
      logic: 'and',
      items: entries.map(([name, value]) =>
        filterShorthandCondition(collection, name, value),
      ),
    },
  };
}

function filterShorthandCondition(
  collection: CollectionDefinition,
  name: string,
  value: unknown,
): FilterConditionNode {
  const path = ['filter', name] as const;
  const field = scalarField(collection, name, path);
  if (!FILTER_SHORTHAND_TYPES.has(field.type)) {
    invalid(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `Filter shorthand is not supported for Field "${name}" of type "${field.type}".`,
      { collection: collection.name, field: name, path },
    );
  }
  if (value === undefined) {
    invalid(
      'INVALID_FILTER',
      `Filter shorthand value for Field "${name}" must not be undefined.`,
      { collection: collection.name, field: name, path },
    );
  }
  if (field.type === 'boolean') {
    if (value === null) {
      return { kind: 'condition', path: [name], operator: '$empty' };
    }
    if (typeof value !== 'boolean') {
      invalid(
        'INVALID_FILTER',
        `Filter value is invalid for Field "${name}" of type "boolean".`,
        { collection: collection.name, field: name, path },
      );
    }
    return {
      kind: 'condition',
      path: [name],
      operator: value ? '$isTruly' : '$isFalsy',
    };
  }
  if (
    value !== null &&
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    invalid(
      'INVALID_FILTER',
      `Filter shorthand requires a string, number, boolean, or null value for Field "${name}".`,
      { collection: collection.name, field: name, path },
    );
  }
  return {
    kind: 'condition',
    path: [name],
    operator: '$eq',
    value,
  };
}

function wrapFilter(node: FilterNode, collection: string): FilterAst {
  if (!isPlainRecord(node)) {
    invalid('INVALID_FILTER', 'Filter callbacks must return a Filter node.', {
      collection,
      path: ['filter'],
    });
  }
  return {
    kind: 'filter',
    version: 1,
    collection,
    root:
      node.kind === 'group'
        ? node
        : { kind: 'group', logic: 'and', items: [node] },
  };
}

function validateFilterGroup(
  collection: CollectionDefinition,
  group: FilterGroupNode,
  context: Readonly<Record<string, unknown>> | undefined,
  path: readonly (string | number)[],
): FilterGroupNode {
  if (
    !isPlainRecord(group) ||
    group.kind !== 'group' ||
    !Array.isArray(group.items)
  ) {
    invalid('INVALID_FILTER', 'Expected a Filter group with an items array.', {
      collection: collection.name,
      path,
    });
  }
  if (group.logic !== 'and' && group.logic !== 'or') {
    invalid('INVALID_FILTER', 'Filter group logic must be and or or.', {
      collection: collection.name,
      path: [...path, 'logic'],
    });
  }
  return {
    kind: 'group',
    logic: group.logic,
    items: group.items.map((node, index) =>
      validateFilterNode(collection, node, context, [...path, 'items', index]),
    ),
  };
}

function validateFilterNode(
  collection: CollectionDefinition,
  node: FilterNode,
  context: Readonly<Record<string, unknown>> | undefined,
  path: readonly (string | number)[],
): FilterNode {
  if (
    !isPlainRecord(node) ||
    !['group', 'condition', 'relation'].includes(node.kind)
  ) {
    invalid(
      'INVALID_FILTER',
      'Expected a Filter group, condition or relation node.',
      {
        collection: collection.name,
        path,
      },
    );
  }
  if (node.kind === 'group') {
    return validateFilterGroup(collection, node, context, path);
  }
  if (
    !Array.isArray(node.path) ||
    node.path.length === 0 ||
    node.path.some(
      (segment) => typeof segment !== 'string' || segment.length === 0,
    )
  ) {
    invalid(
      'INVALID_FILTER',
      'Filter paths must contain non-empty string segments.',
      {
        collection: collection.name,
        path: [...path, 'path'],
      },
    );
  }
  if (node.kind === 'relation') {
    if (
      !['exists', 'notExists', 'some', 'none', 'empty', 'notEmpty'].includes(
        node.quantifier,
      )
    ) {
      invalid('INVALID_FILTER', 'Unknown relation Filter quantifier.', {
        collection: collection.name,
        path: [...path, 'quantifier'],
      });
    }
    return node;
  }
  if (node.path.length !== 1) return node;
  const field = scalarField(collection, node.path[0], [...path, 'path', 0]);
  const builderGroup = getFilterFieldGroup(node);
  if (
    builderGroup !== undefined &&
    builderGroup !== FILTER_GROUP_BY_TYPE[field.type]
  ) {
    invalid(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `Filter group "${builderGroup}" does not match Field "${field.name}" of type "${field.type}".`,
      { collection: collection.name, field: field.name, path },
    );
  }
  if (!OPERATORS_BY_TYPE[field.type]?.includes(node.operator)) {
    invalid(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `Operator "${node.operator}" is not supported for Field "${field.name}" of type "${field.type}".`,
      {
        collection: collection.name,
        field: field.name,
        path: [...path, 'operator'],
      },
    );
  }
  if (node.jsonPath !== undefined && field.type !== 'json') {
    invalid('INVALID_FILTER', 'JSON paths require a JSON Field.', { path });
  }
  if (
    node.mode !== undefined &&
    ((node.mode !== 'default' && node.mode !== 'insensitive') ||
      !['string', 'char', 'text', 'uuid'].includes(field.type) ||
      ![
        '$eq',
        '$ne',
        '$includes',
        '$notIncludes',
        '$startsWith',
        '$endsWith',
      ].includes(node.operator))
  ) {
    invalid(
      'INVALID_FILTER',
      'String comparison mode requires a supported textual operator.',
      { field: field.name, path: [...path, 'mode'] },
    );
  }
  let value = resolveFilterValue(node.value, context, [...path, 'value']);
  if (field.type === 'enum' && ['$eq', '$ne'].includes(node.operator))
    value = normalizeEnumValue(field, value, 'INVALID_FILTER', [
      ...path,
      'value',
    ]);
  if (
    field.type === 'char' &&
    value !== null &&
    value !== undefined &&
    ['$eq', '$ne'].includes(node.operator)
  )
    value = normalizeCharValue(field, value, 'INVALID_FILTER', [
      ...path,
      'value',
    ]);
  if (
    isTemporalType(field.type) &&
    value !== undefined &&
    !['$empty', '$notEmpty'].includes(node.operator)
  ) {
    value = Array.isArray(value)
      ? value.map((item, index) =>
          normalizeTemporalValue(field, item, 'INVALID_FILTER', [
            ...path,
            'value',
            index,
          ]),
        )
      : normalizeTemporalValue(field, value, 'INVALID_FILTER', [
          ...path,
          'value',
        ]);
  }
  if (field.type === 'json') {
    const resolved = { ...node, value };
    validateJsonCondition(resolved, path);
    return resolved;
  }
  validateConditionValue(field, node, path);
  validateResolvedConditionValue(field, node.operator, value, path);
  return {
    ...node,
    value,
  };
}

function validateResolvedConditionValue(
  field: FieldDefinition,
  operator: FilterOperator,
  value: FilterValue | undefined,
  path: readonly (string | number)[],
): void {
  if (['$empty', '$notEmpty', '$isTruly', '$isFalsy'].includes(operator)) {
    return;
  }
  if (operator === '$dateBetween') {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      value.some((item) => !validDateLiteral(field.type, item))
    ) {
      invalid('INVALID_FILTER', '$dateBetween requires two valid ISO values.', {
        field: field.name,
        path: [...path, 'value'],
      });
    }
    return;
  }
  const valid = (() => {
    switch (field.type) {
      case 'string':
      case 'char':
      case 'enum':
      case 'uuid':
      case 'text':
      case 'time':
        return (
          typeof value === 'string' ||
          (value === null && ['$eq', '$ne'].includes(operator))
        );
      case 'bigInt':
        return (
          (typeof value === 'number' && Number.isSafeInteger(value)) ||
          (typeof value === 'string' && /^[+-]?\d+$/.test(value)) ||
          (value === null && ['$eq', '$ne'].includes(operator))
        );
      case 'decimal':
        return (
          (typeof value === 'number' && Number.isFinite(value)) ||
          (typeof value === 'string' &&
            /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) ||
          (value === null && ['$eq', '$ne'].includes(operator))
        );
      case 'increments':
      case 'integer':
        return (
          (typeof value === 'number' && Number.isSafeInteger(value)) ||
          (value === null && ['$eq', '$ne'].includes(operator))
        );
      case 'float':
      case 'double':
        return (
          (typeof value === 'number' && Number.isFinite(value)) ||
          (value === null && ['$eq', '$ne'].includes(operator))
        );
      case 'date':
      case 'datetime':
      case 'datetimeTz':
        return (
          (value === null && ['$eq', '$ne'].includes(operator)) ||
          validDateLiteral(field.type, value)
        );
      default:
        return false;
    }
  })();
  if (!valid) {
    invalid(
      'INVALID_FILTER',
      `Filter value is invalid for Field "${field.name}" of type "${field.type}".`,
      { field: field.name, path: [...path, 'value'] },
    );
  }
}

function validDateLiteral(type: string, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return type === 'date'
    ? /^\d{4}-\d{2}-\d{2}$/u.test(value)
    : type === 'datetime'
      ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(value)
      : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(
          value,
        );
}

function validateConditionValue(
  field: FieldDefinition,
  node: FilterConditionNode,
  path: readonly (string | number)[],
): void {
  const noValue = ['$empty', '$notEmpty', '$isTruly', '$isFalsy'].includes(
    node.operator,
  );
  if (noValue ? node.value !== undefined : node.value === undefined) {
    invalid(
      'INVALID_FILTER',
      noValue
        ? `Operator "${node.operator}" does not accept a value.`
        : `Operator "${node.operator}" requires a value.`,
      { field: field.name, path: [...path, 'value'] },
    );
  }
  if (
    (node.operator === '$dateOn' || node.operator === '$dateNotOn') &&
    (field.type === 'datetime' || field.type === 'datetimeTz')
  ) {
    invalid(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `${node.operator} is only available for date Fields.`,
      { field: field.name, path: [...path, 'operator'] },
    );
  }
}

function resolveFilterValue(
  value: FilterValue | undefined,
  context: Readonly<Record<string, unknown>> | undefined,
  path: readonly (string | number)[],
): FilterValue | undefined {
  if (isVariable(value)) {
    return resolveVariable(value, context, path) as FilterValue;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      isVariable(item)
        ? resolveVariable(item, context, [...path, index])
        : item,
    ) as FilterValue;
  }
  return value;
}

function isVariable(value: unknown): value is FilterVariable {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { kind?: unknown }).kind === 'variable'
  );
}

function resolveVariable(
  variable: FilterVariable,
  context: Readonly<Record<string, unknown>> | undefined,
  path: readonly (string | number)[],
): unknown {
  if (
    typeof variable.path !== 'string' ||
    !variable.path.startsWith('$') ||
    variable.path.length === 1
  ) {
    invalid('INVALID_CONTEXT', 'Variable paths must start with $.', { path });
  }
  let current: unknown = context;
  for (const segment of variable.path.slice(1).split('.')) {
    if (
      typeof current !== 'object' ||
      current === null ||
      !Object.hasOwn(current, segment)
    ) {
      invalid(
        'VARIABLE_NOT_FOUND',
        `Filter variable "${variable.path}" could not be resolved.`,
        { path, details: { variable: variable.path } },
      );
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

interface SelectInputAst {
  readonly kind: 'select';
  readonly version: 1;
  readonly collection?: string;
  readonly root: SelectBuilderState;
}

function normalizeSelectInput<TRecord extends object>(
  collection: CollectionDefinition,
  input: RepositorySelect<TRecord> | undefined,
): SelectInputAst | undefined {
  if (input === undefined) return undefined;
  if (typeof input !== 'function') return input;
  const builder = new DefaultSelectBuilder<TRecord>();
  const result = input(builder);
  if (result !== builder) {
    invalid('INVALID_SELECT', 'Select callbacks must return their builder.', {
      collection: collection.name,
    });
  }
  return {
    kind: 'select',
    version: 1,
    collection: collection.name,
    root: builder.toState(),
  };
}

function validateScalarSelect(
  collection: CollectionDefinition,
  select: SelectInputAst | undefined,
  policy: PolicyReadContext,
): string[] {
  const policyFields = readableFields(policy);
  if (policyFields !== undefined) {
    for (const field of policyFields) {
      scalarField(collection, field, ['policy', 'read', 'fields']);
    }
  }
  if (select === undefined) {
    return policyFields
      ? [...policyFields]
      : scalarFields(collection).map((field) => field.name);
  }
  if (
    !isPlainRecord(select) ||
    select.kind !== 'select' ||
    select.version !== 1 ||
    !isPlainRecord(select.root) ||
    select.root?.kind !== 'selection'
  ) {
    invalid('INVALID_SELECT', 'Expected a Repository Select AST version 1.', {
      collection: collection.name,
    });
  }
  if (
    select.collection !== undefined &&
    select.collection !== collection.name
  ) {
    invalid('INVALID_SELECT', 'Select Collection does not match Repository.', {
      collection: collection.name,
      path: ['collection'],
    });
  }
  if (select.root.fields !== undefined && !Array.isArray(select.root.fields)) {
    invalid('INVALID_SELECT', 'Select fields must be an array.', {
      collection: collection.name,
      path: ['root', 'fields'],
    });
  }
  if (
    select.root.includes !== undefined &&
    !Array.isArray(select.root.includes)
  ) {
    invalid('INVALID_SELECT', 'Select includes must be an array.', {
      collection: collection.name,
      path: ['root', 'includes'],
    });
  }
  const fields =
    select.root.fields ??
    (policyFields
      ? [...policyFields]
      : scalarFields(collection).map((field) => field.name));
  const seen = new Set<string>();
  for (const [index, field] of fields.entries()) {
    if (typeof field !== 'string') {
      invalid('INVALID_SELECT', 'Selected field names must be strings.', {
        collection: collection.name,
        path: ['root', 'fields', index],
      });
    }
    scalarField(collection, field, ['root', 'fields', index]);
    // The projection defaults to the declared allowlist, but what the caller
    // may ask for includes the foreign keys an authorized relation reveals.
    assertReadableField(policy, collection, field, ['root', 'fields', index]);
    if (seen.has(field)) {
      invalid(
        'INVALID_SELECT',
        `Field "${field}" is selected more than once.`,
        {
          collection: collection.name,
          field,
          path: ['root', 'fields', index],
        },
      );
    }
    seen.add(field);
  }
  return [...fields];
}

function normalizeSortInput<TRecord extends object>(
  collection: CollectionDefinition,
  input: RepositorySort<TRecord> | undefined,
): SortAst | undefined {
  if (input === undefined) return undefined;
  if (typeof input !== 'function') return input;
  const result = input(new DefaultSortBuilder<TRecord>());
  const expressions = Array.isArray(result) ? result : [result];
  let items: SortNode[];
  try {
    items = expressions.map(sortExpressionToNode);
  } catch (error) {
    invalid(
      'INVALID_SORT',
      'Sort callbacks must return Sort Builder expressions.',
      { collection: collection.name, cause: error },
    );
  }
  return {
    kind: 'sort',
    version: 1,
    collection: collection.name,
    items,
  };
}

function normalizeAggregateInput<TRecord extends object>(
  collection: CollectionDefinition,
  input: AggregateOptions<TRecord>['aggregate'],
): AggregateAst {
  if (typeof input !== 'function') return input;
  const builder = new DefaultAggregateBuilder<TRecord>();
  const selection = input(builder);
  if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
    invalid(
      'INVALID_AGGREGATE',
      'Aggregate callbacks must return an object of Aggregate Builder expressions.',
      { collection: collection.name, path: ['aggregate'] },
    );
  }
  let items: AggregateNode[];
  try {
    items = Object.entries(selection).map(([alias, expression]) =>
      aggregateExpressionToNode(alias, expression),
    );
  } catch (error) {
    invalid(
      'INVALID_AGGREGATE',
      'Aggregate callbacks must return Aggregate Builder expressions.',
      { collection: collection.name, path: ['aggregate'], cause: error },
    );
  }
  return {
    kind: 'aggregate',
    version: 1,
    collection: collection.name,
    items,
  };
}

function validateAggregate(
  collection: CollectionDefinition,
  aggregate: AggregateAst,
  policy: PolicyReadContext,
): void {
  if (
    !aggregate ||
    typeof aggregate !== 'object' ||
    aggregate.kind !== 'aggregate' ||
    aggregate.version !== 1 ||
    !Array.isArray(aggregate.items)
  ) {
    invalid(
      'INVALID_AGGREGATE',
      'Expected a Repository Aggregate AST version 1.',
      { collection: collection.name, path: ['aggregate'] },
    );
  }
  if (
    aggregate.collection !== undefined &&
    aggregate.collection !== collection.name
  ) {
    invalid(
      'INVALID_AGGREGATE',
      'Aggregate Collection does not match Repository.',
      { collection: collection.name, path: ['aggregate', 'collection'] },
    );
  }
  if (aggregate.items.length === 0) {
    invalid(
      'INVALID_AGGREGATE',
      'Aggregate must contain at least one selection.',
      { collection: collection.name, path: ['aggregate', 'items'] },
    );
  }
  const aliases = new Set<string>();
  for (const [index, item] of aggregate.items.entries()) {
    const path = ['aggregate', 'items', index] as const;
    if (!item || typeof item !== 'object') {
      invalid('INVALID_AGGREGATE', 'Expected an aggregate selection.', {
        collection: collection.name,
        path,
      });
    }
    if (
      item.kind !== 'count' &&
      item.kind !== 'sum' &&
      item.kind !== 'avg' &&
      item.kind !== 'min' &&
      item.kind !== 'max'
    ) {
      invalid('INVALID_AGGREGATE', 'Unknown aggregate function.', {
        collection: collection.name,
        path: [...path, 'kind'],
      });
    }
    if (typeof item.alias !== 'string' || item.alias.length === 0) {
      invalid('INVALID_AGGREGATE', 'Aggregate alias must not be empty.', {
        collection: collection.name,
        path: [...path, 'alias'],
      });
    }
    if (aliases.has(item.alias)) {
      invalid('INVALID_AGGREGATE', 'Aggregate aliases must be unique.', {
        collection: collection.name,
        path: [...path, 'alias'],
      });
    }
    aliases.add(item.alias);
    if (item.kind !== 'count' && typeof item.field !== 'string') {
      invalid('INVALID_AGGREGATE', 'Value aggregates require a Field.', {
        collection: collection.name,
        path: [...path, 'field'],
      });
    }
    if (item.field === undefined) continue;
    const field = scalarField(collection, item.field, [...path, 'field']);
    assertReadableField(policy, collection, field.name, [...path, 'field']);
    const supported =
      item.kind === 'count' ||
      (item.kind === 'sum' || item.kind === 'avg'
        ? FILTER_GROUP_BY_TYPE[field.type] === 'number'
        : field.type !== 'boolean' && SORTABLE_TYPES.has(field.type));
    if (!supported) {
      invalid(
        'FIELD_CAPABILITY_NOT_SUPPORTED',
        `Aggregate "${item.kind}" is not supported for Field "${field.name}" of type "${field.type}".`,
        {
          collection: collection.name,
          field: field.name,
          path: [...path, 'field'],
        },
      );
    }
  }
}

function validateGroupByFields(
  collection: CollectionDefinition,
  input: readonly string[],
  policy: PolicyReadContext,
): string[] {
  if (!Array.isArray(input) || input.length === 0) {
    invalid('INVALID_GROUP_BY', 'GroupBy requires at least one Field.', {
      collection: collection.name,
      path: ['by'],
    });
  }
  const seen = new Set<string>();
  for (const [index, name] of input.entries()) {
    const field = scalarField(collection, name, ['by', index]);
    assertReadableField(policy, collection, field.name, ['by', index]);
    // Enum equality is defined independently of member ordering.
    if (field.type !== 'enum' && !SORTABLE_TYPES.has(field.type)) {
      invalid(
        'FIELD_CAPABILITY_NOT_SUPPORTED',
        `Field "${field.name}" of type "${field.type}" cannot be grouped.`,
        {
          collection: collection.name,
          field: field.name,
          path: ['by', index],
        },
      );
    }
    if (seen.has(name)) {
      invalid('INVALID_GROUP_BY', 'GroupBy Fields must be unique.', {
        collection: collection.name,
        field: name,
        path: ['by', index],
      });
    }
    seen.add(name);
  }
  return [...input];
}

function groupByResultCollection(
  collection: CollectionDefinition,
  by: readonly string[],
  aggregate: AggregateAst,
): CollectionDefinition {
  const fields: FieldDefinition[] = by.map((name) => ({
    ...scalarField(collection, name, ['by']),
  }));
  const names = new Set(by);
  for (const [index, item] of aggregate.items.entries()) {
    if (names.has(item.alias)) {
      invalid(
        'INVALID_GROUP_BY',
        'Aggregate aliases must not conflict with GroupBy Fields.',
        {
          collection: collection.name,
          field: item.alias,
          path: ['aggregate', 'items', index, 'alias'],
        },
      );
    }
    names.add(item.alias);
    if (item.kind === 'min' || item.kind === 'max') {
      fields.push({
        ...scalarField(collection, item.field, [
          'aggregate',
          'items',
          index,
          'field',
        ]),
        name: item.alias,
        nullable: true,
      });
    } else {
      fields.push({
        name: item.alias,
        type: item.kind === 'count' ? 'integer' : 'decimal',
        nullable: item.kind !== 'count',
      });
    }
  }
  return {
    name: collection.name,
    naming: { underscored: false },
    fields,
    constraints: [{ type: 'primary', fields: [...by] }],
  };
}

function validateSortAst(
  collection: CollectionDefinition,
  sort: SortAst,
): void {
  if (
    !sort ||
    typeof sort !== 'object' ||
    Array.isArray(sort) ||
    sort.kind !== 'sort' ||
    sort.version !== 1 ||
    !Array.isArray(sort.items)
  ) {
    invalid('INVALID_SORT', 'Expected a Repository Sort AST version 1.', {
      collection: collection.name,
    });
  }
  if (sort.collection !== undefined && sort.collection !== collection.name) {
    invalid('INVALID_SORT', 'Sort Collection does not match Repository.', {
      collection: collection.name,
      path: ['collection'],
    });
  }
}

/**
 * Narrow a normalized caller filter by the read policy.
 *
 * Two things happen in one pass, because both need the collection each node
 * actually belongs to. Every condition is checked against the allowlist of its
 * own collection — a condition under `tasks.some(...)` is judged by the tasks
 * node, never by the root's — and every relation branch is intersected with
 * that relation's scope, so a quantifier only ever reasons about rows the
 * caller may see.
 *
 * Only caller nodes reach here. A Policy scope is a separate value combined
 * afterwards, so a scope condition is never judged against the allowlist that
 * governs the caller; there is no need to tag nodes with their origin, and no
 * ordering assumption to get wrong.
 */
async function scopeCallerFilterGroup(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  group: FilterGroupNode,
  policy: PolicyReadContext,
  path: readonly (string | number)[],
): Promise<FilterGroupNode> {
  return {
    ...group,
    items: await Promise.all(
      group.items.map((node, index) =>
        scopeCallerFilterNode(collections, collection, node, policy, [
          ...path,
          'items',
          index,
        ]),
      ),
    ),
  };
}

async function scopeCallerFilterNode(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  node: FilterNode,
  policy: PolicyReadContext,
  path: readonly (string | number)[],
): Promise<FilterNode> {
  if (node.kind === 'group') {
    return scopeCallerFilterGroup(collections, collection, node, policy, path);
  }
  if (node.kind === 'condition') {
    assertReadableField(policy, collection, node.path[0], [...path, 'path', 0]);
    return node;
  }
  const name = node.path[0];
  const relationPath = [...path, 'path', 0] as const;
  const relation = relationField(collection, name, relationPath);
  const target = await targetCollection(collections, relation, path);
  const relationPolicy = relationReadContext(
    policy,
    collection,
    name,
    relationPath,
    target,
  );
  const inner = node.filter
    ? await scopeCallerFilterGroup(
        collections,
        target,
        node.filter,
        relationPolicy,
        [...path, 'filter'],
      )
    : undefined;
  const scope =
    relationPolicy.kind === 'restricted' && relationPolicy.scope !== true
      ? await normalizeFilterWithRelations(
          collections,
          target,
          relationPolicy.scope,
          undefined,
        )
      : undefined;
  if (!scope) return inner ? { ...node, filter: inner } : node;
  return {
    ...node,
    filter: {
      kind: 'group',
      logic: 'and',
      items: inner ? [inner, scope.root] : [scope.root],
    },
  };
}

/**
 * Collect the relation nodes nested under every shape of a relation write.
 *
 * `create`, `update` and both halves of `upsert` each carry their own map, and
 * a name in more than one of them is the same relation reached by different
 * routes. Their scopes are ANDed so the result is no wider than any single
 * route allowed.
 */
function mergeNestedRelationNodes(
  node: NormalizedRelationWriteNode,
): Readonly<Record<string, NormalizedRelationWriteNode>> {
  const shapes = [
    node.create,
    node.update,
    node.upsert?.create,
    node.upsert?.update,
  ].filter((shape) => shape !== undefined);
  const merged: Record<string, NormalizedRelationWriteNode> = {};
  for (const shape of shapes) {
    for (const [name, child] of Object.entries(shape.relations)) {
      const existing = merged[name];
      merged[name] = existing
        ? intersectRelationScopes(existing, child)
        : child;
    }
  }
  return merged;
}

function intersectRelationScopes(
  left: NormalizedRelationWriteNode,
  right: NormalizedRelationWriteNode,
): NormalizedRelationWriteNode {
  if (left.scope === undefined || left.scope === true) return right;
  if (right.scope === undefined || right.scope === true) return left;
  return {
    ...left,
    scope: {
      kind: 'filter',
      version: 1,
      root: {
        kind: 'group',
        logic: 'and',
        items: [left.scope.root, right.scope.root],
      },
    },
  };
}

async function normalizeFilterWithRelations<TRecord extends object>(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  input: RepositoryFilter<TRecord> | undefined,
  context: Readonly<Record<string, unknown>> | undefined,
): Promise<FilterAst | undefined> {
  const normalized = normalizeScalarFilter(collection, input, context);
  if (!normalized) return undefined;
  return {
    ...normalized,
    root: await normalizeRelationFilterGroup(
      collections,
      collection,
      normalized.root,
      context,
      ['root'],
    ),
  };
}

async function normalizeRelationFilterGroup(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  group: FilterGroupNode,
  context: Readonly<Record<string, unknown>> | undefined,
  path: readonly (string | number)[],
  inheritedBuilderGroup?: string,
): Promise<FilterGroupNode> {
  return {
    ...group,
    items: await Promise.all(
      group.items.map((node, index) =>
        normalizeRelationFilterNode(
          collections,
          collection,
          node,
          context,
          [...path, 'items', index],
          inheritedBuilderGroup,
        ),
      ),
    ),
  };
}

async function normalizeRelationFilterNode(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  node: FilterNode,
  context: Readonly<Record<string, unknown>> | undefined,
  path: readonly (string | number)[],
  inheritedBuilderGroup?: string,
): Promise<FilterNode> {
  if (node.kind === 'group') {
    return normalizeRelationFilterGroup(
      collections,
      collection,
      node,
      context,
      path,
      inheritedBuilderGroup,
    );
  }
  if (node.kind === 'condition') {
    const builderGroup = inheritedBuilderGroup ?? getFilterFieldGroup(node);
    if (node.path.length === 1) {
      const field = scalarField(collection, node.path[0], [...path, 'path', 0]);
      if (
        builderGroup !== undefined &&
        builderGroup !== FILTER_GROUP_BY_TYPE[field.type]
      ) {
        invalid(
          'FIELD_CAPABILITY_NOT_SUPPORTED',
          `Filter group "${builderGroup}" does not match Field "${field.name}" of type "${field.type}".`,
          { collection: collection.name, field: field.name, path },
        );
      }
      return validateFilterNode(collection, node, context, path);
    }
    const [relationName, ...rest] = node.path;
    const relation = relationField(collection, relationName, [
      ...path,
      'path',
      0,
    ]);
    if (relation.type !== 'belongsTo' && relation.type !== 'hasOne') {
      invalid(
        'INVALID_FILTER',
        'Direct relation paths may traverse to-one relations only.',
        {
          collection: collection.name,
          relation: relation.name,
          path: [...path, 'path'],
        },
      );
    }
    const target = await targetCollection(collections, relation, path);
    const nestedInput: FilterConditionNode = { ...node, path: rest };
    const nested = await normalizeRelationFilterNode(
      collections,
      target,
      nestedInput,
      context,
      path,
      builderGroup,
    );
    return {
      kind: 'relation',
      path: [relation.name],
      quantifier: 'exists',
      filter: asGroup(nested),
    };
  }
  if (node.path.length !== 1) {
    invalid(
      'INVALID_FILTER',
      'Relation quantifier path must name one relation.',
      {
        collection: collection.name,
        path: [...path, 'path'],
      },
    );
  }
  const relation = relationField(collection, node.path[0], [
    ...path,
    'path',
    0,
  ]);
  const target = await targetCollection(collections, relation, path);
  if (
    (node.quantifier === 'some' || node.quantifier === 'none') &&
    !node.filter
  ) {
    invalid('INVALID_FILTER', `${node.quantifier} requires a nested filter.`, {
      collection: collection.name,
      relation: relation.name,
      path: [...path, 'filter'],
    });
  }
  if (node.quantifier !== 'some' && node.quantifier !== 'none' && node.filter) {
    invalid('INVALID_FILTER', `${node.quantifier} does not accept a filter.`, {
      collection: collection.name,
      relation: relation.name,
      path: [...path, 'filter'],
    });
  }
  return {
    ...node,
    filter: node.filter
      ? await normalizeRelationFilterGroup(
          collections,
          target,
          validateFilterGroup(target, node.filter, context, [
            ...path,
            'filter',
          ]),
          context,
          [...path, 'filter'],
        )
      : undefined,
  };
}

async function validateSelectWithRelations<TRecord extends object>(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  input: RepositorySelect<TRecord> | undefined,
  context: Readonly<Record<string, unknown>> | undefined,
  policy: PolicyReadContext,
): Promise<ValidatedSelect> {
  return validateSelectInputWithRelations(
    collections,
    collection,
    normalizeSelectInput(collection, input),
    context,
    policy,
  );
}

async function validateSelectInputWithRelations(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  select: SelectInputAst | undefined,
  context: Readonly<Record<string, unknown>> | undefined,
  policy: PolicyReadContext,
  budget: { nodes: number } = { nodes: 0 },
  depth: number = 0,
): Promise<ValidatedSelect> {
  if (++budget.nodes > 200 || depth > 20)
    invalid('INVALID_SELECT', 'Selection exceeds the node or depth limit.', {});
  const fields = validateScalarSelect(collection, select, policy);
  const seen = new Set<string>();
  const includes: SelectIncludeNode[] = [];
  for (const [index, node] of (select?.root.includes ?? []).entries()) {
    const path = ['root', 'includes', index] as const;
    if (
      !isPlainRecord(node) ||
      node.kind !== 'include' ||
      typeof node.relation !== 'string'
    ) {
      invalid('INVALID_SELECT', 'Expected an include selection node.', {
        collection: collection.name,
        path,
      });
    }
    if (seen.has(node.relation)) {
      invalid(
        'INVALID_SELECT',
        `Relation "${node.relation}" is included more than once.`,
        {
          collection: collection.name,
          relation: node.relation,
          path,
        },
      );
    }
    seen.add(node.relation);
    const relation = relationField(collection, node.relation, [
      ...path,
      'relation',
    ]);
    const target = await targetCollection(collections, relation, path);
    const relationPolicy = relationReadContext(
      policy,
      collection,
      node.relation,
      [...path, 'relation'],
      target,
    );
    if (node.result !== undefined) {
      if (!isToManyRelation(relation))
        invalid(
          'INVALID_SELECT',
          'Relation aggregates require a to-many relation.',
          { path },
        );
      const branch = await validateRelationResult(
        collections,
        collection,
        node.relation,
        node,
        context,
        policy,
        budget,
        depth + 1,
      );
      includes.push({ kind: 'include', relation: node.relation, ...branch });
      continue;
    }
    const nested = await validateSelectInputWithRelations(
      collections,
      target,
      {
        kind: 'select',
        version: 1,
        root: node.select,
      },
      context,
      relationPolicy,
      budget,
      depth + 1,
    );
    if (!nested.select) {
      invalid('INVALID_SELECT', 'Included selections must be defined.', {
        collection: target.name,
        path: [...path, 'select'],
      });
    }
    const filter = await normalizeFilterWithRelations(
      collections,
      target,
      node.filter,
      context,
    );
    const callerFilter =
      filter && relationPolicy.kind === 'restricted'
        ? {
            ...filter,
            root: await scopeCallerFilterGroup(
              collections,
              target,
              filter.root,
              relationPolicy,
              [...path, 'filter', 'root'],
            ),
          }
        : filter;
    const policyScope =
      relationPolicy.kind === 'restricted' && relationPolicy.scope !== true
        ? await normalizeFilterWithRelations(
            collections,
            target,
            relationPolicy.scope,
            undefined,
          )
        : undefined;
    const scopedFilter = combinePolicyFilter(
      callerFilter,
      policyScope,
      target.name!,
    );
    const sortInput = normalizeSortInput(target, node.sort);
    if (
      sortInput?.items.length &&
      (relation.type === 'belongsTo' || relation.type === 'hasOne')
    ) {
      invalid(
        'INVALID_SORT',
        'Relation-local sort is only available for to-many relations.',
        {
          collection: collection.name,
          relation: relation.name,
          path: [...path, 'sort'],
        },
      );
    }
    if (
      (node.limit !== undefined || node.cursor !== undefined) &&
      (relation.type === 'belongsTo' || relation.type === 'hasOne')
    ) {
      invalid(
        'INVALID_PAGINATION',
        'Relation-local pagination is only available for to-many relations.',
        {
          collection: collection.name,
          relation: relation.name,
          path,
        },
      );
    }
    const sort = isToManyRelation(relation)
      ? await validateSortWithRelations(
          collections,
          target,
          sortInput,
          false,
          relationPolicy,
        )
      : undefined;
    validatePagination(node.limit, undefined, sort, node.cursor);
    validateCursorDirection(node.direction, node.cursor);
    const distinct = validateDistinct(
      target,
      node.distinct,
      sort,
      relationPolicy,
    );
    const cursorAxes = isToManyRelation(relation)
      ? validateCursor(target, node.cursor, sort, node.sort !== undefined)
      : undefined;
    includes.push({
      kind: 'include',
      relation: node.relation,
      select: nested.select.root,
      filter: scopedFilter,
      sort,
      limit: node.limit,
      cursor: cursorAxes
        ? Object.fromEntries(
            cursorAxes.map((axis) => [
              axis.field,
              axis.value as RepositoryRecord[string],
            ]),
          )
        : node.cursor,
      direction: node.direction,
      distinct,
    });
  }
  return {
    fields,
    select: select
      ? {
          ...select,
          collection: collection.name,
          root: { ...select.root, fields, includes },
        }
      : undefined,
  };
}

async function validateRelationResult(
  collections: Pick<ConnectionCollections, 'get'>,
  source: CollectionDefinition,
  relation: string,
  input: RelationSelectBranchInput,
  context: Readonly<Record<string, unknown>> | undefined,
  policy: PolicyReadContext,
  budget: { nodes: number },
  depth: number,
): Promise<RelationSelectBranchNode> {
  const result = input.result;
  if (
    result !== undefined &&
    (!isPlainRecord(result) || typeof result.kind !== 'string')
  ) {
    invalid('INVALID_SELECT', 'Expected a relation selection result node.', {
      collection: source.name,
      relation,
      path: ['result'],
    });
  }
  const validated = await validateSelectInputWithRelations(
    collections,
    source,
    {
      kind: 'select',
      version: 1,
      root: {
        kind: 'selection',
        fields: [],
        includes: [{ ...input, result: undefined, kind: 'include', relation }],
      },
    },
    context,
    policy,
    budget,
    depth,
  );
  const scope = validated.select!.root.includes![0];
  if (!result) return scope;
  if (result.kind === 'combine') {
    if (!isPlainRecord(result.branches)) {
      invalid('INVALID_SELECT', 'combine branches must be an object.', {
        collection: source.name,
        relation,
        path: ['result', 'branches'],
      });
    }
    const entries: [string, RelationSelectBranchInput][] = Object.entries(
      result.branches,
    );
    if (entries.length === 0 || entries.length > 32)
      invalid(
        'INVALID_SELECT',
        'combine requires between 1 and 32 branches.',
        {},
      );
    const branches: Record<string, RelationSelectBranchNode> = {};
    for (const [name, branch] of entries) {
      if (!name || ['__proto__', 'constructor', 'prototype'].includes(name))
        invalid('INVALID_SELECT', 'Invalid combine branch name.', {});
      if (!isPlainRecord(branch) || !isPlainRecord(branch.select)) {
        invalid('INVALID_SELECT', 'Expected a combine branch selection.', {
          collection: source.name,
          relation,
          path: ['result', 'branches', name],
        });
      }
      const target = await targetCollection(
        collections,
        relationField(source, relation, []),
        [],
      );
      // The caller's own filter, not `scope.filter`, which already carries the
      // relation scope. Feeding that back in would put Policy conditions
      // through the caller-filter validation below, where a scope field the
      // read allowlist omits — `tenantId`, typically — is rejected as though
      // the caller had named it. Every recursion re-applies the scope anyway.
      const commonFilter = await normalizeFilterWithRelations(
        collections,
        target,
        input.filter,
        context,
      );
      const ownFilter = await normalizeFilterWithRelations(
        collections,
        target,
        branch.filter,
        context,
      );
      const mergedFilter: FilterAst | undefined =
        commonFilter && ownFilter
          ? {
              kind: 'filter',
              version: 1,
              root: {
                kind: 'group',
                logic: 'and',
                items: [commonFilter.root, ownFilter.root],
              },
            }
          : (ownFilter ?? commonFilter);
      const child = {
        ...input,
        ...branch,
        filter: mergedFilter,
        sort: branch.sort ?? input.sort,
        limit: branch.limit ?? input.limit,
        cursor: branch.cursor ?? input.cursor,
        direction: branch.direction ?? input.direction,
        distinct: branch.distinct ?? input.distinct,
        result: branch.result,
      };
      branches[name] = await validateRelationResult(
        collections,
        source,
        relation,
        child,
        context,
        policy,
        budget,
        depth + 1,
      );
    }
    return { ...scope, result: { kind: 'combine', branches } };
  }
  if (input.select.fields !== undefined || input.select.includes?.length)
    invalid(
      'INVALID_SELECT',
      'Aggregate branches cannot select records or include relations.',
      {},
    );
  const target = await targetCollection(
    collections,
    relationField(source, relation, []),
    [],
  );
  validateAggregate(
    target,
    {
      kind: 'aggregate',
      version: 1,
      items: [{ ...result, alias: 'value' }],
    },
    relationReadContext(policy, source, relation, [], target),
  );
  if (
    scope.limit !== undefined &&
    scope.sort?.items.some(
      (item) => item.kind !== 'field' || item.path.length !== 1,
    )
  )
    invalid(
      'INVALID_SELECT',
      'Paginated relation aggregates require direct scalar Field sort.',
      {},
    );
  return { ...scope, result };
}

interface ValidatedSelect {
  readonly fields: string[];
  readonly select?: SelectAst;
}

function pickManySelections(
  records: readonly RepositoryRecord[] | undefined,
  selection: ValidatedSelect,
): RepositoryRecord[] {
  if (!records) {
    throw new Error('Bulk mutation returning did not provide records.');
  }
  return records.map((record) =>
    pickSelection(record, selection.fields, selection.select),
  );
}

async function validateSortWithRelations<TRecord extends object>(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  input: RepositorySort<TRecord> | undefined,
  requireNonEmpty: boolean,
  policy: PolicyReadContext,
): Promise<SortAst | undefined> {
  const sort = normalizeSortInput(collection, input);
  if (sort !== undefined) validateSortAst(collection, sort);
  if (requireNonEmpty && (!sort || sort.items.length === 0)) {
    invalid('INVALID_FILTER', 'findOne() requires filter or non-empty sort.', {
      collection: collection.name,
      path: ['sort'],
    });
  }
  if (!sort) {
    const fields = primaryFields(collection);
    return fields.length
      ? {
          kind: 'sort',
          version: 1,
          collection: collection.name,
          items: fields.map((field) => ({
            kind: 'field',
            path: [field],
            direction: 'asc',
          })),
        }
      : undefined;
  }
  const seen = new Set<string>();
  for (const [index, item] of sort.items.entries()) {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      (item.kind !== 'field' && item.kind !== 'aggregate')
    ) {
      invalid('INVALID_SORT', 'Unknown Sort node kind.', {
        collection: collection.name,
        path: ['items', index, 'kind'],
      });
    }
    if (
      item.kind === 'field' &&
      (!Array.isArray(item.path) ||
        item.path.some((part) => typeof part !== 'string' || part.length === 0))
    ) {
      invalid(
        'INVALID_SORT',
        'Field sort path must contain non-empty strings.',
        {
          collection: collection.name,
          path: ['items', index, 'path'],
        },
      );
    }
    if (item.kind === 'aggregate') {
      if (
        !Array.isArray(item.relation) ||
        item.relation.some(
          (part) => typeof part !== 'string' || part.length === 0,
        )
      ) {
        invalid(
          'INVALID_SORT',
          'Aggregate relation path must contain non-empty strings.',
          {
            collection: collection.name,
            path: ['items', index, 'relation'],
          },
        );
      }
      if (
        item.aggregate !== 'count' &&
        item.aggregate !== 'sum' &&
        item.aggregate !== 'avg' &&
        item.aggregate !== 'min' &&
        item.aggregate !== 'max'
      ) {
        invalid('INVALID_SORT', 'Unknown sort aggregate.', {
          collection: collection.name,
          path: ['items', index, 'aggregate'],
        });
      }
      if (item.aggregate === 'count' && item.field !== undefined) {
        invalid('INVALID_SORT', 'Count sort does not accept a Field.', {
          collection: collection.name,
          path: ['items', index, 'field'],
        });
      }
      if (item.aggregate !== 'count' && typeof item.field !== 'string') {
        invalid('INVALID_SORT', 'Value aggregate sorts require a Field.', {
          collection: collection.name,
          path: ['items', index, 'field'],
        });
      }
    }
    if (item.direction !== 'asc' && item.direction !== 'desc') {
      invalid('INVALID_SORT', 'Sort direction must be asc or desc.', {
        collection: collection.name,
        path: ['items', index, 'direction'],
      });
    }
    if (
      item.nulls !== undefined &&
      item.nulls !== 'first' &&
      item.nulls !== 'last'
    ) {
      invalid('INVALID_SORT', 'Sort nulls must be first or last.', {
        collection: collection.name,
        path: ['items', index, 'nulls'],
      });
    }
    const identity =
      item.kind === 'field'
        ? JSON.stringify({ kind: item.kind, path: item.path })
        : JSON.stringify({
            kind: item.kind,
            relation: item.relation,
            aggregate: item.aggregate,
            field: item.field,
          });
    if (seen.has(identity)) {
      invalid('INVALID_SORT', 'Sort targets must not be repeated.', {
        collection: collection.name,
        path: ['items', index],
      });
    }
    seen.add(identity);
    if (item.kind === 'field') {
      await validateFieldSortNode(collections, collection, item, index, policy);
      continue;
    }
    let current = collection;
    let currentPolicy = policy;
    let terminal: RelationFieldDefinition | undefined;
    for (const [relationIndex, name] of item.relation.entries()) {
      const relationPath = ['items', index, 'relation', relationIndex] as const;
      terminal = relationField(current, name, [
        'items',
        index,
        'relation',
        relationIndex,
      ]);
      const relationTarget = await targetCollection(collections, terminal, [
        'items',
        index,
      ]);
      currentPolicy = relationReadContext(
        currentPolicy,
        current,
        name,
        relationPath,
        relationTarget,
      );
      if (
        relationIndex < item.relation.length - 1 &&
        terminal.type !== 'belongsTo' &&
        terminal.type !== 'hasOne'
      ) {
        invalid(
          'INVALID_SORT',
          'relationAggregate may traverse to-one relations before one terminal to-many relation.',
          {
            collection: current.name,
            relation: terminal.name,
            path: ['items', index, 'relation', relationIndex],
          },
        );
      }
      current = await targetCollection(collections, terminal, ['items', index]);
    }
    if (!terminal) {
      invalid('INVALID_SORT', 'Relation sort path must not be empty.', {
        collection: collection.name,
        path: ['items', index, 'relation'],
      });
    }
    if (terminal.type === 'belongsTo' || terminal.type === 'hasOne') {
      invalid(
        'INVALID_SORT',
        'Aggregate sort requires a to-many terminal relation.',
        {
          collection: collection.name,
          relation: terminal.name,
          path: ['items', index],
        },
      );
    }
    if (item.aggregate !== 'count') {
      const field = scalarField(current, item.field, ['items', index, 'field']);
      assertReadableField(currentPolicy, current, field.name, [
        'items',
        index,
        'field',
      ]);
      const allowed =
        item.aggregate === 'sum' || item.aggregate === 'avg'
          ? FILTER_GROUP_BY_TYPE[field.type] === 'number'
          : field.type !== 'boolean' && SORTABLE_TYPES.has(field.type);
      if (!allowed) {
        invalid(
          'FIELD_CAPABILITY_NOT_SUPPORTED',
          `Aggregate "${item.aggregate}" is not supported for Field "${field.name}" of type "${field.type}".`,
          {
            collection: current.name,
            field: field.name,
            path: ['items', index, 'field'],
          },
        );
      }
    }
  }
  const items = [...sort.items];
  const direct = new Set(
    items.flatMap((item) =>
      item.kind === 'field' && item.path.length === 1 ? [item.path[0]] : [],
    ),
  );
  const alreadyUnique = uniqueConstraints(collection).some((constraint) =>
    constraint.fields.every((field) => direct.has(field)),
  );
  if (!alreadyUnique) {
    for (const field of primaryFields(collection)) {
      if (!direct.has(field)) {
        items.push({ kind: 'field', path: [field], direction: 'asc' });
      }
    }
  }
  return { ...sort, collection: collection.name, items };
}

async function validateFieldSortNode(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  item: Extract<SortNode, { readonly kind: 'field' }>,
  index: number,
  policy: PolicyReadContext,
): Promise<void> {
  if (item.path.length === 0) {
    invalid('INVALID_SORT', 'Field sort path must not be empty.', {
      collection: collection.name,
      path: ['items', index, 'path'],
    });
  }
  let current = collection;
  let currentPolicy = policy;
  for (const [relationIndex, name] of item.path.slice(0, -1).entries()) {
    const relation = relationField(current, name, [
      'items',
      index,
      'path',
      relationIndex,
    ]);
    if (relation.type !== 'belongsTo' && relation.type !== 'hasOne') {
      invalid(
        'INVALID_SORT',
        'Field sort paths may traverse to-one relations only.',
        {
          collection: current.name,
          relation: relation.name,
          path: ['items', index, 'path', relationIndex],
        },
      );
    }
    const target = await targetCollection(collections, relation, [
      'items',
      index,
      'path',
      relationIndex,
    ]);
    currentPolicy = relationReadContext(
      currentPolicy,
      current,
      name,
      ['items', index, 'path', relationIndex],
      target,
    );
    current = target;
  }
  const fieldIndex = item.path.length - 1;
  const field = scalarField(current, item.path[fieldIndex], [
    'items',
    index,
    'path',
    fieldIndex,
  ]);
  assertReadableField(currentPolicy, current, field.name, [
    'items',
    index,
    'path',
    fieldIndex,
  ]);
  if (!SORTABLE_TYPES.has(field.type)) {
    invalid(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `Field "${field.name}" of type "${field.type}" is not sortable.`,
      {
        collection: current.name,
        field: field.name,
        path: ['items', index],
      },
    );
  }
}

function primaryFields(collection: CollectionDefinition): string[] {
  return (
    uniqueConstraints(collection).find(
      (constraint) => constraint.type === 'primary',
    )?.fields ?? []
  );
}

const MUTATION_LIMITS = { maxDepth: 3, maxNodes: 100 } as const;

interface MutationValidationState {
  nodes: number;
  readonly clientKeys: Set<string>;
  readonly context?: RepositoryContext;
}

interface NormalizedModelMutation {
  readonly values: RepositoryRecord;
  readonly relations?: RelationMutationAst;
}

async function normalizeModelMutation(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  input: unknown,
  operation: 'createOne' | 'updateOne',
  depth = 1,
  state: MutationValidationState = { nodes: 0, clientKeys: new Set() },
  path: readonly (string | number)[] = ['values'],
): Promise<NormalizedModelMutation> {
  if (!isPlainRecord(input)) {
    invalid('INVALID_MUTATION', 'values must be a plain object.', {
      collection: collection.name,
      path: ['values'],
    });
  }
  const scalarValues: RepositoryRecord = {};
  const relationItems: RelationMutationNode[] = [];
  for (const [fieldName, value] of Object.entries(input)) {
    const field = directField(collection, fieldName, ['values', fieldName]);
    if (isScalarField(field)) {
      scalarValues[fieldName] = value;
      continue;
    }
    relationItems.push(
      await relationFieldInputToNode(
        collections,
        collection,
        field,
        value as
          CreateRelationFieldMutationInput | UpdateRelationFieldMutationInput,
        operation,
        state.context,
        [...path, fieldName],
      ),
    );
  }
  const values = validateValues(
    collection,
    scalarValues,
    operation,
    relationItems.length > 0,
    state.context,
    path,
  );
  if (relationItems.length === 0) return { values };
  const relations = await normalizeRelationMutation(
    collections,
    collection,
    {
      kind: 'relationMutation',
      version: 1,
      collection: collection.name,
      items: relationItems,
    },
    operation,
    depth,
    state,
  );
  return { values, relations };
}

function validateRelationMutationAstHeader(
  collection: CollectionDefinition,
  ast: RelationMutationAst,
): void {
  if (
    !isPlainRecord(ast) ||
    ast.kind !== 'relationMutation' ||
    ast.version !== 1 ||
    !Array.isArray(ast.items)
  ) {
    invalid('INVALID_MUTATION', 'Expected a Relation Mutation AST version 1.', {
      collection: collection.name,
      path: ['relations'],
    });
  }
}

async function relationFieldInputToNode(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  relation: RelationFieldDefinition,
  input: CreateRelationFieldMutationInput | UpdateRelationFieldMutationInput,
  operation: 'createOne' | 'updateOne',
  context: RepositoryContext | undefined,
  path: readonly (string | number)[],
): Promise<RelationMutationNode> {
  const state = relationFieldInputState(collection, relation, input, path);
  const hasSet = state.set !== undefined;
  const hasIncremental =
    state.create.length > 0 ||
    state.connect.length > 0 ||
    state.disconnect !== undefined ||
    state.update.length > 0 ||
    state.upsert.length > 0 ||
    state.delete.length > 0;
  if (hasSet && hasIncremental) {
    invalid(
      'INVALID_MUTATION',
      'set cannot be combined with incremental relation operations.',
      { collection: collection.name, relation: relation.name, path },
    );
  }
  if (
    operation === 'createOne' &&
    (hasSet ||
      state.disconnect !== undefined ||
      state.update.length > 0 ||
      state.upsert.length > 0 ||
      state.delete.length > 0)
  ) {
    invalid(
      'RELATION_ACTION_NOT_ALLOWED',
      'Only create and connect are allowed in relation values while creating a record.',
      {
        collection: collection.name,
        relation: relation.name,
        path,
        details: { allowed: ['create', 'connect'] },
      },
    );
  }
  const targetCollectionDefinition = await targetCollection(
    collections,
    relation,
    path,
  );
  if (
    state.delete.length > 0 &&
    relation.type === 'belongsTo' &&
    !(await relationCanDisconnect(collections, collection, relation))
  ) {
    invalid(
      'RELATION_ACTION_NOT_ALLOWED',
      'delete is not allowed through a required belongsTo relation.',
      {
        collection: collection.name,
        relation: relation.name,
        path: [...path, 'delete'],
      },
    );
  }
  const update = await Promise.all(
    state.update.map((target, index) =>
      relationUpdateInputToTarget(
        collections,
        targetCollectionDefinition,
        target,
        [...path, 'update', index],
        context,
      ),
    ),
  );
  const upsert = await Promise.all(
    state.upsert.map((target, index) =>
      relationUpsertInputToTarget(
        collections,
        targetCollectionDefinition,
        target,
        [...path, 'upsert', index],
        context,
      ),
    ),
  );
  const deleteTargets = await Promise.all(
    state.delete.map((target, index) =>
      relationDeleteInputToTarget(
        collections,
        targetCollectionDefinition,
        target,
        [...path, 'delete', index],
        context,
      ),
    ),
  );
  if (isToManyRelation(relation)) {
    if (state.disconnect === true) {
      invalid(
        'INVALID_MUTATION',
        'To-many disconnect requires one or more target selectors.',
        { collection: collection.name, relation: relation.name, path },
      );
    }
    if (state.set) {
      return {
        kind: 'relation',
        field: relation.name,
        action: 'replace',
        targets: state.set.map(connectTarget),
      };
    }
    if (!hasIncremental) {
      invalid('INVALID_MUTATION', 'Relation mutation must not be empty.', {
        collection: collection.name,
        relation: relation.name,
        path,
      });
    }
    return {
      kind: 'relation',
      field: relation.name,
      action: 'patch',
      create: state.create,
      connect: state.connect.map(connectTarget),
      disconnect: (state.disconnect ?? []).map(selectorFromValues),
      update,
      upsert,
      delete: deleteTargets,
    };
  }
  if (hasSet) {
    invalid(
      'RELATION_ACTION_NOT_ALLOWED',
      'set is only available for to-many relations.',
      {
        collection: collection.name,
        relation: relation.name,
        path: [...path, 'set'],
      },
    );
  }
  if (state.disconnect === true) {
    if (
      state.create.length > 0 ||
      state.connect.length > 0 ||
      update.length > 0 ||
      upsert.length > 0 ||
      deleteTargets.length > 0
    ) {
      invalid(
        'INVALID_MUTATION',
        'disconnect cannot be combined with create or connect for a to-one relation.',
        { collection: collection.name, relation: relation.name, path },
      );
    }
    return { kind: 'relation', field: relation.name, action: 'clear' };
  }
  if (state.disconnect !== undefined) {
    invalid(
      'INVALID_MUTATION',
      'To-one disconnect does not accept a target selector.',
      { collection: collection.name, relation: relation.name, path },
    );
  }
  const modifications = [
    ...update.map((target) => ({ update: target })),
    ...upsert.map((target) => ({ upsert: target })),
    ...deleteTargets.map((target) => ({ delete: target })),
  ];
  if (modifications.length > 0) {
    if (
      modifications.length !== 1 ||
      state.create.length > 0 ||
      state.connect.length > 0
    ) {
      invalid(
        'INVALID_MUTATION',
        'To-one relation mutation requires exactly one operation.',
        { collection: collection.name, relation: relation.name, path },
      );
    }
    return {
      kind: 'relation',
      field: relation.name,
      action: 'modify',
      ...modifications[0],
    };
  }
  const targets: Array<ConnectTarget | CreateTarget> = [
    ...state.create,
    ...state.connect.map(connectTarget),
  ];
  if (targets.length !== 1) {
    invalid(
      'INVALID_MUTATION',
      'To-one relation mutation requires exactly one create or connect target.',
      { collection: collection.name, relation: relation.name, path },
    );
  }
  return {
    kind: 'relation',
    field: relation.name,
    action: 'set',
    target: targets[0],
  };
}

function relationFieldInputState(
  collection: CollectionDefinition,
  relation: RelationFieldDefinition,
  input: CreateRelationFieldMutationInput | UpdateRelationFieldMutationInput,
  path: readonly (string | number)[],
): RelationFieldMutationBuilderState {
  if (typeof input === 'function') {
    const builder = new DefaultRelationFieldMutationBuilder();
    input(builder);
    return builder.toState();
  }
  if (!isPlainRecord(input)) {
    invalid(
      'INVALID_MUTATION',
      `Relation Field "${relation.name}" requires a Builder callback or operation object.`,
      { collection: collection.name, relation: relation.name, path },
    );
  }
  const allowedKeys = new Set([
    'create',
    'connect',
    'disconnect',
    'set',
    'update',
    'upsert',
    'delete',
  ]);
  const unknown = Object.keys(input).find((key) => !allowedKeys.has(key));
  if (unknown) {
    invalid('INVALID_MUTATION', `Unknown relation operation "${unknown}".`, {
      collection: collection.name,
      relation: relation.name,
      path: [...path, unknown],
    });
  }
  const create = Object.hasOwn(input, 'create')
    ? recordsInput(input.create, [...path, 'create']).map(createTarget)
    : [];
  const connect = Object.hasOwn(input, 'connect')
    ? recordsInput(input.connect, [...path, 'connect'])
    : [];
  let disconnect:
    true | readonly Readonly<Record<string, unknown>>[] | undefined;
  if (Object.hasOwn(input, 'disconnect')) {
    disconnect =
      input.disconnect === true
        ? true
        : recordsInput(input.disconnect, [...path, 'disconnect']);
  }
  let set: readonly Readonly<Record<string, unknown>>[] | undefined;
  if (Object.hasOwn(input, 'set')) {
    if (!Array.isArray(input.set)) {
      invalid(
        'INVALID_MUTATION',
        'set requires an array of target selectors.',
        {
          collection: collection.name,
          relation: relation.name,
          path: [...path, 'set'],
        },
      );
    }
    set = recordsInput(input.set, [...path, 'set']);
  }
  const update = Object.hasOwn(input, 'update')
    ? typedRecordsInput<RelationUpdateInput>(input.update, [...path, 'update'])
    : [];
  const upsert = Object.hasOwn(input, 'upsert')
    ? typedRecordsInput<RelationUpsertInput>(input.upsert, [...path, 'upsert'])
    : [];
  const deleteTargets = Object.hasOwn(input, 'delete')
    ? input.delete === true
      ? [{}]
      : typedRecordsInput<RelationDeleteInput>(input.delete, [
          ...path,
          'delete',
        ])
    : [];
  return {
    create,
    connect,
    disconnect,
    set,
    update,
    upsert,
    delete: deleteTargets,
  };
}

function recordsInput(
  input: unknown,
  path: readonly (string | number)[],
): Readonly<Record<string, unknown>>[] {
  const records = Array.isArray(input) ? input : [input];
  return records.map((record, index) => {
    if (!isPlainRecord(record)) {
      invalid('INVALID_MUTATION', 'Expected a plain object.', {
        path: Array.isArray(input) ? [...path, index] : path,
      });
    }
    return record;
  });
}

function typedRecordsInput<T extends object>(
  input: unknown,
  path: readonly (string | number)[],
): T[] {
  return recordsInput(input, path) as T[];
}

async function relationUpdateInputToTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  input: RelationUpdateInput,
  path: readonly (string | number)[],
  context?: RepositoryContext,
): Promise<RelationUpdateTarget> {
  if (!isPlainRecord(input) || !isPlainRecord(input.values)) {
    invalid('INVALID_MUTATION', 'Relation update requires values.', {
      collection: collection.name,
      path,
    });
  }
  const filter = input.filter
    ? await normalizeFilterWithRelations(
        collections,
        collection,
        input.filter,
        context,
      )
    : undefined;
  return { filter, values: input.values };
}

async function relationUpsertInputToTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  input: RelationUpsertInput,
  path: readonly (string | number)[],
  context?: RepositoryContext,
): Promise<RelationUpsertTarget> {
  if (
    !isPlainRecord(input) ||
    !isPlainRecord(input.create) ||
    !isPlainRecord(input.update)
  ) {
    invalid(
      'INVALID_MUTATION',
      'Relation upsert requires create and update values.',
      { collection: collection.name, path },
    );
  }
  const filter = input.filter
    ? await normalizeFilterWithRelations(
        collections,
        collection,
        input.filter,
        context,
      )
    : undefined;
  return {
    filter,
    by: filter
      ? uniqueSelectorFromFilter(collection, filter, [...path, 'filter'])
      : undefined,
    create: { kind: 'create', values: input.create },
    update: { values: input.update },
  };
}

async function relationDeleteInputToTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  input: RelationDeleteInput,
  path: readonly (string | number)[],
  context?: RepositoryContext,
): Promise<RelationDeleteTarget> {
  if (!isPlainRecord(input)) {
    invalid(
      'INVALID_MUTATION',
      'Relation delete requires an operation object.',
      {
        collection: collection.name,
        path,
      },
    );
  }
  const filterInput = input.filter as
    RepositoryFilter<RepositoryRecord> | undefined;
  const filter = filterInput
    ? await normalizeFilterWithRelations(
        collections,
        collection,
        filterInput,
        context,
      )
    : undefined;
  return { filter };
}

function selectorFromValues(
  values: Readonly<Record<string, unknown>>,
): UniqueSelector {
  return { kind: 'unique', fields: Object.keys(values), values };
}

function connectTarget(
  values: Readonly<Record<string, unknown>>,
): ConnectTarget {
  if (Object.hasOwn(values, 'through') && Object.hasOwn(values, 'where')) {
    if (
      !isPlainRecord(values.where) ||
      !isPlainRecord(values.through) ||
      Object.keys(values).some((key) => !['where', 'through'].includes(key))
    )
      invalid(
        'INVALID_MUTATION',
        'Through connect requires { where, through }.',
        {},
      );
    return {
      kind: 'connect',
      by: selectorFromValues(values.where),
      through: values.through,
    };
  }
  return { kind: 'connect', by: selectorFromValues(values) };
}

function createTarget(values: Readonly<Record<string, unknown>>): CreateTarget {
  if (values.kind === 'relationCreate' && values.version === 1) {
    if (
      !isPlainRecord(values.values) ||
      (values.clientKey !== undefined &&
        typeof values.clientKey !== 'string') ||
      (values.through !== undefined && !isPlainRecord(values.through)) ||
      Object.keys(values).some(
        (key) =>
          !['kind', 'version', 'values', 'clientKey', 'through'].includes(key),
      )
    ) {
      invalid(
        'INVALID_MUTATION',
        'Expected a relationCreate version 1 envelope.',
        {},
      );
    }
    return {
      kind: 'create',
      values: values.values,
      clientKey: values.clientKey,
      through: values.through,
    };
  }
  if (Object.hasOwn(values, 'through') && Object.hasOwn(values, 'values')) {
    if (
      !isPlainRecord(values.values) ||
      !isPlainRecord(values.through) ||
      Object.keys(values).some((key) => !['values', 'through'].includes(key))
    )
      invalid(
        'INVALID_MUTATION',
        'Through create requires { values, through }.',
        {},
      );
    return { kind: 'create', values: values.values, through: values.through };
  }
  return { kind: 'create', values };
}

async function normalizeRelationMutation(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  ast: RelationMutationAst,
  operation: 'createOne' | 'updateOne',
  depth = 1,
  state: MutationValidationState = { nodes: 0, clientKeys: new Set() },
): Promise<RelationMutationAst> {
  validateRelationMutationAstHeader(collection, ast);
  if (ast.collection !== undefined && ast.collection !== collection.name) {
    invalid(
      'INVALID_MUTATION',
      'Mutation Collection does not match Repository.',
      {
        collection: collection.name,
        path: ['relations', 'collection'],
      },
    );
  }
  if (ast.items.length === 0) {
    invalid('INVALID_MUTATION', 'Relation mutation items must not be empty.', {
      collection: collection.name,
      path: ['relations', 'items'],
    });
  }
  if (depth > MUTATION_LIMITS.maxDepth) {
    invalid('MUTATION_LIMIT_EXCEEDED', 'Relation mutation exceeds maxDepth.', {
      collection: collection.name,
      path: ['relations'],
      details: MUTATION_LIMITS,
    });
  }
  const seen = new Set<string>();
  const items: RelationMutationNode[] = [];
  for (const [index, node] of ast.items.entries()) {
    state.nodes += 1;
    const path = ['relations', 'items', index] as const;
    if (state.nodes > MUTATION_LIMITS.maxNodes) {
      invalid(
        'MUTATION_LIMIT_EXCEEDED',
        'Relation mutation exceeds maxNodes.',
        {
          collection: collection.name,
          path,
          details: MUTATION_LIMITS,
        },
      );
    }
    if (node.kind !== 'relation' || typeof node.field !== 'string') {
      invalid('INVALID_MUTATION', 'Expected a relation mutation node.', {
        collection: collection.name,
        path,
      });
    }
    if (seen.has(node.field)) {
      invalid(
        'INVALID_MUTATION',
        `Relation "${node.field}" is mutated more than once.`,
        {
          collection: collection.name,
          relation: node.field,
          path: [...path, 'field'],
        },
      );
    }
    seen.add(node.field);
    const relationName = node.field;
    const receivedAction: unknown = node.action;
    const relation = relationField(collection, node.field, [...path, 'field']);
    const allowed = await allowedRelationActions(
      collections,
      collection,
      relation,
      operation,
    );
    if (
      node.action !== 'set' &&
      node.action !== 'clear' &&
      node.action !== 'patch' &&
      node.action !== 'replace' &&
      node.action !== 'modify'
    ) {
      invalid('INVALID_MUTATION', 'Unknown relation mutation action.', {
        collection: collection.name,
        relation: relationName,
        path: [...path, 'action'],
        details: { received: receivedAction },
      });
    }
    if (!allowed.includes(node.action)) {
      invalid(
        'RELATION_ACTION_NOT_ALLOWED',
        `Action "${node.action}" is not allowed for Relation "${node.field}".`,
        {
          collection: collection.name,
          relation: node.field,
          path: [...path, 'action'],
          details: { received: node.action, allowed },
        },
      );
    }
    const target = await targetCollection(collections, relation, path);
    if (node.action === 'set') {
      const through = await validateThroughPayload(
        collections,
        relation,
        node.target,
        path,
        state.context,
      );
      items.push({
        ...node,
        target: await normalizeMutationTarget(
          collections,
          target,
          { ...node.target, through },
          depth,
          state,
          [...path, 'target'],
        ),
      });
    } else if (node.action === 'clear') {
      items.push(node);
    } else if (node.action === 'patch') {
      if (
        (node.connect !== undefined && !Array.isArray(node.connect)) ||
        (node.create !== undefined && !Array.isArray(node.create)) ||
        (node.disconnect !== undefined && !Array.isArray(node.disconnect)) ||
        (node.update !== undefined && !Array.isArray(node.update)) ||
        (node.upsert !== undefined && !Array.isArray(node.upsert)) ||
        (node.delete !== undefined && !Array.isArray(node.delete))
      ) {
        invalid(
          'INVALID_MUTATION',
          'Relation patch operations must be arrays.',
          {
            collection: collection.name,
            relation: relation.name,
            path,
          },
        );
      }
      const connect: ConnectTarget[] = await Promise.all(
        (node.connect ?? []).map(
          async (targetNode: ConnectTarget, targetIndex: number) =>
            normalizeConnectTarget(
              target,
              {
                ...targetNode,
                through: await validateThroughPayload(
                  collections,
                  relation,
                  targetNode,
                  [...path, 'connect', targetIndex],
                  state.context,
                ),
              },
              [...path, 'connect', targetIndex],
              state.context,
            ),
        ),
      );
      const create = await Promise.all(
        (node.create ?? []).map(
          async (targetNode: CreateTarget, targetIndex: number) =>
            normalizeCreateTarget(
              collections,
              target,
              {
                ...targetNode,
                through: await validateThroughPayload(
                  collections,
                  relation,
                  targetNode,
                  [...path, 'create', targetIndex],
                  state.context,
                ),
              },
              depth,
              state,
              [...path, 'create', targetIndex],
            ),
        ),
      );
      const disconnect = (node.disconnect ?? []).map(
        (selector: UniqueSelector, targetIndex: number) =>
          validateUnique(
            target,
            selector,
            [...path, 'disconnect', targetIndex],
            state.context,
          ),
      );
      const update = await Promise.all(
        (node.update ?? []).map((targetNode, targetIndex) =>
          normalizeRelationUpdateTarget(
            collections,
            target,
            targetNode,
            true,
            depth,
            state,
            [...path, 'update', targetIndex],
          ),
        ),
      );
      const upsert = await Promise.all(
        (node.upsert ?? []).map((targetNode, targetIndex) =>
          normalizeRelationUpsertTarget(
            collections,
            target,
            targetNode,
            true,
            depth,
            state,
            [...path, 'upsert', targetIndex],
          ),
        ),
      );
      const deleteTargets = await Promise.all(
        (node.delete ?? []).map((targetNode, targetIndex) =>
          normalizeRelationDeleteTarget(collections, target, targetNode, true, [
            ...path,
            'delete',
            targetIndex,
          ]),
        ),
      );
      if (
        operation === 'createOne' &&
        (update.length > 0 || upsert.length > 0 || deleteTargets.length > 0)
      ) {
        invalid(
          'RELATION_ACTION_NOT_ALLOWED',
          'Only connect and create are allowed while creating a source record.',
          {
            collection: collection.name,
            relation: relation.name,
            path,
            details: { allowed: ['connect', 'create'] },
          },
        );
      }
      if (operation === 'createOne' && disconnect.length > 0) {
        invalid(
          'RELATION_ACTION_NOT_ALLOWED',
          'disconnect is not allowed while creating a source record.',
          {
            collection: collection.name,
            relation: relation.name,
            path: [...path, 'disconnect'],
            details: {
              received: 'disconnect',
              allowed: ['connect', 'create'],
            },
          },
        );
      }
      if (
        disconnect.length > 0 &&
        !(await relationCanDisconnect(collections, collection, relation))
      ) {
        invalid(
          'RELATION_ACTION_NOT_ALLOWED',
          'disconnect requires a nullable relation edge.',
          {
            collection: collection.name,
            relation: relation.name,
            path: [...path, 'disconnect'],
            details: { received: 'disconnect' },
          },
        );
      }
      if (
        connect.length +
          create.length +
          disconnect.length +
          update.length +
          upsert.length +
          deleteTargets.length ===
        0
      ) {
        invalid('INVALID_MUTATION', 'Relation patch must not be empty.', {
          collection: collection.name,
          relation: relation.name,
          path,
        });
      }
      assertDistinctSelectors(
        connect.map((entry) => entry.by),
        path,
      );
      assertDistinctSelectors(disconnect, path);
      const connected = new Set(
        connect.map((entry) => selectorIdentity(entry.by)),
      );
      if (
        disconnect.some((entry: UniqueSelector) =>
          connected.has(selectorIdentity(entry)),
        )
      ) {
        invalid(
          'INVALID_MUTATION',
          'A target cannot be connected and disconnected together.',
          {
            collection: collection.name,
            relation: relation.name,
            path,
          },
        );
      }
      items.push({
        ...node,
        connect,
        create,
        disconnect,
        update,
        upsert,
        delete: deleteTargets,
      });
    } else if (node.action === 'replace') {
      if (!Array.isArray(node.targets)) {
        invalid(
          'INVALID_MUTATION',
          'Relation replace targets must be an array.',
          {
            collection: collection.name,
            relation: relation.name,
            path: [...path, 'targets'],
          },
        );
      }
      const targets = await Promise.all(
        node.targets.map(
          async (
            targetNode: ConnectTarget | CreateTarget,
            targetIndex: number,
          ) => {
            const through = await validateThroughPayload(
              collections,
              relation,
              targetNode,
              [...path, 'targets', targetIndex],
              state.context,
            );
            return normalizeMutationTarget(
              collections,
              target,
              { ...targetNode, through },
              depth,
              state,
              [...path, 'targets', targetIndex],
            );
          },
        ),
      );
      assertDistinctSelectors(
        targets.flatMap((entry) =>
          entry.kind === 'connect' ? [entry.by] : [],
        ),
        path,
      );
      items.push({ ...node, targets });
    } else {
      const operationCount =
        Number(node.update !== undefined) +
        Number(node.upsert !== undefined) +
        Number(node.delete !== undefined);
      if (operationCount !== 1) {
        invalid(
          'INVALID_MUTATION',
          'Relation modify requires exactly one update, upsert, or delete operation.',
          { collection: collection.name, relation: relation.name, path },
        );
      }
      if (
        node.delete &&
        relation.type === 'belongsTo' &&
        !(await relationCanDisconnect(collections, collection, relation))
      ) {
        invalid(
          'RELATION_ACTION_NOT_ALLOWED',
          'delete is not allowed through a required belongsTo relation.',
          {
            collection: collection.name,
            relation: relation.name,
            path: [...path, 'delete'],
          },
        );
      }
      items.push({
        ...node,
        update: node.update
          ? await normalizeRelationUpdateTarget(
              collections,
              target,
              node.update,
              false,
              depth,
              state,
              [...path, 'update'],
            )
          : undefined,
        upsert: node.upsert
          ? await normalizeRelationUpsertTarget(
              collections,
              target,
              node.upsert,
              false,
              depth,
              state,
              [...path, 'upsert'],
            )
          : undefined,
        delete: node.delete
          ? await normalizeRelationDeleteTarget(
              collections,
              target,
              node.delete,
              false,
              [...path, 'delete'],
            )
          : undefined,
      });
    }
  }
  return {
    kind: 'relationMutation',
    version: 1,
    collection: collection.name,
    items,
  };
}

async function normalizeMutationTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  target: ConnectTarget | CreateTarget,
  depth: number,
  state: MutationValidationState,
  path: readonly (string | number)[],
): Promise<ConnectTarget | CreateTarget> {
  if (!isPlainRecord(target)) {
    invalid('INVALID_MUTATION', 'Expected a relation mutation target.', {
      collection: collection.name,
      path,
    });
  }
  return target.kind === 'connect'
    ? normalizeConnectTarget(collection, target, path, state.context)
    : normalizeCreateTarget(
        collections,
        collection,
        target,
        depth,
        state,
        path,
      );
}

function normalizeConnectTarget(
  collection: CollectionDefinition,
  target: ConnectTarget,
  path: readonly (string | number)[],
  context?: RepositoryContext,
): ConnectTarget {
  if (!isPlainRecord(target) || target.kind !== 'connect') {
    invalid('INVALID_MUTATION', 'Expected a connect target.', {
      collection: collection.name,
      path,
    });
  }
  return {
    kind: 'connect',
    by: validateUnique(collection, target.by, [...path, 'by'], context),
    through: target.through,
  };
}

async function normalizeCreateTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  target: CreateTarget,
  depth: number,
  state: MutationValidationState,
  path: readonly (string | number)[],
): Promise<CreateTarget> {
  if (!isPlainRecord(target) || target.kind !== 'create') {
    invalid('INVALID_MUTATION', 'Expected a create target.', {
      collection: collection.name,
      path,
    });
  }
  if (target.clientKey !== undefined) {
    if (!target.clientKey || state.clientKeys.has(target.clientKey)) {
      invalid(
        'INVALID_MUTATION',
        'Create target clientKey must be non-empty and unique.',
        {
          collection: collection.name,
          path: [...path, 'clientKey'],
        },
      );
    }
    state.clientKeys.add(target.clientKey);
  }
  const mutation = await normalizeModelMutation(
    collections,
    collection,
    target.values,
    'createOne',
    depth + 1,
    state,
    [...path, 'values'],
  );
  return {
    ...target,
    values: mutation.values,
    relations: mutation.relations,
  };
}

async function normalizeRelationUpdateTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  target: RelationUpdateTarget,
  filterRequired: boolean,
  depth: number,
  state: MutationValidationState,
  path: readonly (string | number)[],
): Promise<RelationUpdateTarget> {
  if (!isPlainRecord(target) || !isPlainRecord(target.values)) {
    invalid('INVALID_MUTATION', 'Expected a relation update target.', {
      collection: collection.name,
      path,
    });
  }
  const filter = await normalizeRelationTargetFilter(
    collections,
    collection,
    target.filter,
    filterRequired,
    path,
  );
  const mutation = await normalizeModelMutation(
    collections,
    collection,
    target.values,
    'updateOne',
    depth + 1,
    state,
    [...path, 'values'],
  );
  return {
    filter,
    values: mutation.values,
    relations: mutation.relations,
  };
}

async function normalizeRelationUpsertTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  target: RelationUpsertTarget,
  filterRequired: boolean,
  depth: number,
  state: MutationValidationState,
  path: readonly (string | number)[],
): Promise<RelationUpsertTarget> {
  if (!isPlainRecord(target) || !target.create || !target.update) {
    invalid('INVALID_MUTATION', 'Expected a relation upsert target.', {
      collection: collection.name,
      path,
    });
  }
  if (target.create.through !== undefined)
    invalid(
      'INVALID_MUTATION',
      'Through payload is supported by connect, create, and set only.',
      { path },
    );
  const filter = await normalizeRelationTargetFilter(
    collections,
    collection,
    target.filter,
    filterRequired,
    path,
  );
  const by = filter
    ? uniqueSelectorFromFilter(collection, filter, [...path, 'filter'])
    : undefined;
  const create = await normalizeCreateTarget(
    collections,
    collection,
    target.create,
    depth,
    state,
    [...path, 'create'],
  );
  if (
    by &&
    by.fields.some(
      (field) =>
        !Object.hasOwn(create.values, field) ||
        create.values[field] !== by.values[field],
    )
  ) {
    invalid(
      'INVALID_MUTATION',
      'Relation upsert create values must contain the same unique selector values as filter.',
      { collection: collection.name, path: [...path, 'create'] },
    );
  }
  return {
    filter,
    by,
    create,
    update: await normalizeRelationUpdateTarget(
      collections,
      collection,
      target.update,
      false,
      depth,
      state,
      [...path, 'update'],
    ),
  };
}

async function normalizeRelationDeleteTarget(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  target: RelationDeleteTarget,
  filterRequired: boolean,
  path: readonly (string | number)[],
): Promise<RelationDeleteTarget> {
  if (!isPlainRecord(target)) {
    invalid('INVALID_MUTATION', 'Expected a relation delete target.', {
      collection: collection.name,
      path,
    });
  }
  const filter = target.filter as FilterAst | undefined;
  return {
    filter: await normalizeRelationTargetFilter(
      collections,
      collection,
      filter,
      filterRequired,
      path,
    ),
  };
}

async function normalizeRelationTargetFilter(
  collections: Pick<ConnectionCollections, 'get'>,
  collection: CollectionDefinition,
  filter: FilterAst | undefined,
  required: boolean,
  path: readonly (string | number)[],
): Promise<FilterAst | undefined> {
  if (!filter) {
    if (required) {
      invalid(
        'INVALID_FILTER',
        'To-many relation target operations require a filter.',
        { collection: collection.name, path: [...path, 'filter'] },
      );
    }
    return undefined;
  }
  const normalized = await normalizeFilterWithRelations(
    collections,
    collection,
    filter,
    undefined,
  );
  if (!normalized || normalized.root.items.length === 0) {
    invalid('INVALID_FILTER', 'Relation target filter must not be empty.', {
      collection: collection.name,
      path: [...path, 'filter'],
    });
  }
  return normalized;
}

function uniqueSelectorFromFilter(
  collection: CollectionDefinition,
  filter: FilterAst,
  path: readonly (string | number)[],
): UniqueSelector {
  const nodes = filter.root.items.map((node) => {
    if (
      node.kind === 'condition' &&
      node.path.length === 1 &&
      collection.fields?.some(
        (field) => field.name === node.path[0] && field.type === 'boolean',
      ) &&
      (node.operator === '$isTruly' || node.operator === '$isFalsy')
    )
      return {
        ...node,
        operator: '$eq' as const,
        value: node.operator === '$isTruly',
      };
    return node;
  });
  if (
    filter.root.logic !== 'and' ||
    nodes.length === 0 ||
    nodes.some(
      (node) =>
        node.kind !== 'condition' ||
        node.path.length !== 1 ||
        node.operator !== '$eq' ||
        node.value === undefined ||
        node.value === null ||
        Array.isArray(node.value) ||
        isPlainRecord(node.value),
    )
  ) {
    invalid(
      'INVALID_UNIQUE_SELECTOR',
      'Upsert filter must equal one primary or unique Field set.',
      { collection: collection.name, path },
    );
  }
  const conditions = nodes as readonly FilterConditionNode[];
  return validateUnique(
    collection,
    {
      kind: 'unique',
      fields: conditions.map((node) => node.path[0]),
      values: Object.fromEntries(
        conditions.map((node) => [node.path[0], node.value]),
      ),
    },
    path,
  );
}

async function allowedRelationActions(
  collections: Pick<ConnectionCollections, 'get'>,
  source: CollectionDefinition,
  relation: RelationFieldDefinition,
  operation: 'createOne' | 'updateOne',
): Promise<Array<'set' | 'clear' | 'patch' | 'replace' | 'modify'>> {
  if (relation.type === 'belongsTo' || relation.type === 'hasOne') {
    const actions: Array<'set' | 'clear' | 'modify'> = ['set'];
    if (operation === 'updateOne') actions.push('modify');
    if (
      operation === 'updateOne' &&
      (await relationCanDisconnect(collections, source, relation))
    ) {
      actions.push('clear');
    }
    return actions;
  }
  if (!(await relationCanConnect(collections, relation))) return [];
  if (operation === 'createOne') return ['patch'];
  return (await relationCanDisconnect(collections, source, relation))
    ? ['patch', 'replace']
    : ['patch'];
}

async function relationCanConnect(
  collections: Pick<ConnectionCollections, 'get'>,
  relation: RelationFieldDefinition,
): Promise<boolean> {
  if (relation.type !== 'belongsToMany') return Boolean(relation.foreignKey);
  if (!relation.through || !relation.foreignKey || !relation.otherKey)
    return false;
  const through = await collections.get(relation.through);
  return Boolean(through);
}

async function validateThroughPayload(
  collections: Pick<ConnectionCollections, 'get'>,
  relation: RelationFieldDefinition,
  target: ConnectTarget | CreateTarget,
  path: readonly (string | number)[],
  context?: RepositoryContext,
): Promise<RepositoryRecord | undefined> {
  if (target.through === undefined) return;
  if (relation.type !== 'belongsToMany' || !relation.through)
    invalid(
      'INVALID_MUTATION',
      'Through payload requires a belongsToMany relation.',
      { path },
    );
  const through = await collections.get(relation.through);
  if (!through)
    invalid('COLLECTION_NOT_FOUND', 'Through Collection was not found.', {
      path,
    });
  if (!isPlainRecord(target.through))
    invalid('INVALID_MUTATION', 'Through payload must be a plain object.', {
      path,
    });
  const managed = new Set([
    relation.foreignKey,
    relation.otherKey,
    ...primaryFields(through),
  ]);
  for (const name of Object.keys(target.through)) {
    if (managed.has(name))
      invalid(
        'INVALID_MUTATION',
        'Through relationship and primary keys are managed by Repository.',
        { field: name, path: [...path, 'through', name] },
      );
    const field = scalarField(through, name, [...path, 'through', name]);
    if (
      target.through[name] === undefined ||
      (target.through[name] === null && field.nullable === false)
    )
      invalid(
        'INVALID_MUTATION',
        'Through payload contains an undefined or non-nullable null value.',
        { field: name, path: [...path, 'through', name] },
      );
  }
  return validateValues(through, target.through, 'createOne', false, context, [
    ...path,
    'through',
  ]);
}

async function relationCanDisconnect(
  collections: Pick<ConnectionCollections, 'get'>,
  source: CollectionDefinition,
  relation: RelationFieldDefinition,
): Promise<boolean> {
  if (relation.type === 'belongsToMany') return true;
  if (relation.type === 'belongsTo') {
    const field = relation.foreignKey
      ? scalarFields(source).find((item) => item.name === relation.foreignKey)
      : relation;
    return field?.nullable !== false;
  }
  if (!relation.foreignKey) return false;
  const target = await collections.get(relation.target);
  const field = target?.fields?.find(
    (item) => item.name === relation.foreignKey,
  );
  return Boolean(field && isScalarField(field) && field.nullable !== false);
}

function assertDistinctSelectors(
  selectors: readonly UniqueSelector[],
  path: readonly (string | number)[],
): void {
  const seen = new Set<string>();
  for (const selector of selectors) {
    const identity = selectorIdentity(selector);
    if (seen.has(identity)) {
      invalid(
        'INVALID_MUTATION',
        'Relation target selectors must not be repeated.',
        { path },
      );
    }
    seen.add(identity);
  }
}

function selectorIdentity(selector: UniqueSelector): string {
  return JSON.stringify(
    selector.fields.map((field) => [field, selector.values[field]]),
  );
}

function asGroup(node: FilterNode): FilterGroupNode {
  return node.kind === 'group'
    ? node
    : { kind: 'group', logic: 'and', items: [node] };
}

function relationField(
  collection: CollectionDefinition,
  name: string,
  path: readonly (string | number)[],
): RelationFieldDefinition {
  const field = directField(collection, name, path);
  if (!isRelationField(field)) {
    invalid('RELATION_NOT_FOUND', `Field "${name}" is not a relation.`, {
      collection: collection.name,
      field: name,
      path,
    });
  }
  return field;
}

function isToManyRelation(relation: RelationFieldDefinition): boolean {
  return relation.type === 'hasMany' || relation.type === 'belongsToMany';
}

async function targetCollection(
  collections: Pick<ConnectionCollections, 'get'>,
  relation: RelationFieldDefinition,
  path: readonly (string | number)[],
): Promise<CollectionDefinition> {
  const target = await collections.get(relation.target);
  if (!target) {
    invalid(
      'COLLECTION_NOT_FOUND',
      `Relation target "${relation.target}" does not exist.`,
      {
        collection: relation.target,
        relation: relation.name,
        path,
      },
    );
  }
  return target;
}

function validateCursorDirection(
  direction: unknown,
  cursor: object | undefined,
): void {
  if (
    direction !== undefined &&
    direction !== 'forward' &&
    direction !== 'backward'
  ) {
    invalid('INVALID_PAGINATION', 'direction must be forward or backward.', {
      path: ['direction'],
    });
  }
  if (direction !== undefined && cursor === undefined) {
    invalid('INVALID_PAGINATION', 'direction requires a cursor.', {
      path: ['direction'],
    });
  }
}

function validatePagination(
  limit: number | undefined,
  offset: number | undefined,
  sort: SortAst | undefined,
  cursor: object | undefined,
): void {
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
    invalid(
      'INVALID_PAGINATION',
      'limit must be a non-negative safe integer.',
      {
        path: ['limit'],
      },
    );
  }
  if (offset !== undefined && (!Number.isSafeInteger(offset) || offset < 0)) {
    invalid(
      'INVALID_PAGINATION',
      'offset must be a non-negative safe integer.',
      {
        path: ['offset'],
      },
    );
  }
  if (offset !== undefined && (!sort || sort.items.length === 0)) {
    invalid('INVALID_PAGINATION', 'offset requires a non-empty Sort AST.', {
      path: ['offset'],
    });
  }
  if (cursor !== undefined && offset !== undefined) {
    invalid('INVALID_PAGINATION', 'cursor and offset are mutually exclusive.', {
      path: ['cursor'],
    });
  }
}

function validateCursor<TRecord extends object>(
  collection: CollectionDefinition,
  input: RepositoryCursor<TRecord> | undefined,
  sort: SortAst | undefined,
  explicitSort: boolean,
): RepositoryCursorAxis[] | undefined {
  if (input === undefined) return undefined;
  if (!isPlainRecord(input) || Object.keys(input).length === 0) {
    invalid('INVALID_PAGINATION', 'cursor must be a non-empty object.', {
      collection: collection.name,
      path: ['cursor'],
    });
  }
  if (!explicitSort || !sort || sort.items.length === 0) {
    invalid('INVALID_PAGINATION', 'cursor requires an explicit stable sort.', {
      collection: collection.name,
      path: ['sort'],
    });
  }
  const axes: RepositoryCursorAxis[] = [];
  for (const [index, item] of sort.items.entries()) {
    if (item.kind !== 'field' || item.path.length !== 1) {
      invalid(
        'INVALID_PAGINATION',
        'Cursor V1 supports direct scalar Field sort only.',
        { collection: collection.name, path: ['sort', index] },
      );
    }
    const name = item.path[0];
    const field = scalarField(collection, name, ['sort', index, 'path', 0]);
    if (field.nullable !== false) {
      invalid(
        'INVALID_PAGINATION',
        `Cursor Field "${field.name}" must be non-nullable.`,
        {
          collection: collection.name,
          field: field.name,
          path: ['sort', index],
        },
      );
    }
    if (!Object.hasOwn(input, name)) {
      invalid(
        'INVALID_PAGINATION',
        `cursor must include sort Field "${name}".`,
        { collection: collection.name, field: name, path: ['cursor', name] },
      );
    }
    const value = (input as Readonly<Record<string, unknown>>)[name];
    if (value === null || value === undefined) {
      invalid(
        'INVALID_PAGINATION',
        `Cursor value for Field "${name}" must not be null.`,
        { collection: collection.name, field: name, path: ['cursor', name] },
      );
    }
    if (!validCursorValue(field, value)) {
      invalid(
        'INVALID_PAGINATION',
        `Cursor value is invalid for Field "${name}" of type "${field.type}".`,
        { collection: collection.name, field: name, path: ['cursor', name] },
      );
    }
    axes.push({
      field: name,
      direction: item.direction,
      value: isTemporalType(field.type)
        ? normalizeTemporalValue(field, value, 'INVALID_PAGINATION', [
            'cursor',
            name,
          ])
        : field.type === 'char'
          ? normalizeCharValue(field, value, 'INVALID_PAGINATION', [
              'cursor',
              name,
            ])
          : value,
    });
  }
  const sortFields = new Set(axes.map((axis) => axis.field));
  for (const name of Object.keys(input)) {
    if (!sortFields.has(name)) {
      invalid(
        'INVALID_PAGINATION',
        `cursor Field "${name}" is not part of sort.`,
        { collection: collection.name, field: name, path: ['cursor', name] },
      );
    }
  }
  if (
    !uniqueConstraints(collection).some((constraint) =>
      constraint.fields.every((field) => sortFields.has(field)),
    )
  ) {
    invalid(
      'INVALID_PAGINATION',
      'cursor sort must include a primary or unique tie-breaker.',
      { collection: collection.name, path: ['sort'] },
    );
  }
  return axes;
}

function validCursorValue(field: FieldDefinition, value: unknown): boolean {
  if (
    field.type === 'increments' ||
    field.type === 'integer' ||
    field.type === 'bigInt'
  ) {
    return (
      (typeof value === 'number' && Number.isFinite(value)) ||
      typeof value === 'bigint' ||
      (field.type === 'bigInt' && typeof value === 'string')
    );
  }
  if (
    field.type === 'decimal' ||
    field.type === 'float' ||
    field.type === 'double'
  ) {
    return (
      (typeof value === 'number' && Number.isFinite(value)) ||
      typeof value === 'string'
    );
  }
  if (field.type === 'boolean') return typeof value === 'boolean';
  if (field.type === 'date' || field.type === 'datetime') {
    return typeof value === 'string' || value instanceof Date;
  }
  return typeof value === 'string';
}

function validateDistinct(
  collection: CollectionDefinition,
  input: readonly string[] | undefined,
  sort: SortAst | undefined,
  policy: PolicyReadContext,
): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input) || input.length === 0) {
    invalid('INVALID_DISTINCT', 'distinct must contain at least one Field.', {
      collection: collection.name,
      path: ['distinct'],
    });
  }
  const seen = new Set<string>();
  for (const [index, name] of input.entries()) {
    const field = scalarField(collection, name, ['distinct', index]);
    assertReadableField(policy, collection, field.name, ['distinct', index]);
    if (!SORTABLE_TYPES.has(field.type)) {
      invalid(
        'FIELD_CAPABILITY_NOT_SUPPORTED',
        `Field "${field.name}" of type "${field.type}" cannot be used for distinct.`,
        {
          collection: collection.name,
          field: field.name,
          path: ['distinct', index],
        },
      );
    }
    if (seen.has(name)) {
      invalid('INVALID_DISTINCT', 'distinct Fields must be unique.', {
        collection: collection.name,
        field: name,
        path: ['distinct', index],
      });
    }
    seen.add(name);
  }
  if (
    sort?.items.some((item) => item.kind !== 'field' || item.path.length !== 1)
  ) {
    invalid(
      'INVALID_DISTINCT',
      'Distinct V1 supports direct scalar Field sort only.',
      { collection: collection.name, path: ['sort'] },
    );
  }
  if (!sort || sort.items.length === 0) {
    invalid(
      'INVALID_DISTINCT',
      'distinct requires a stable direct scalar Field sort.',
      { collection: collection.name, path: ['sort'] },
    );
  }
  const sortedFields = new Set(
    sort.items.flatMap((item) =>
      item.kind === 'field' && item.path.length === 1 ? [item.path[0]] : [],
    ),
  );
  if (
    !uniqueConstraints(collection).some((constraint) =>
      constraint.fields.every((field) => sortedFields.has(field)),
    )
  ) {
    invalid(
      'INVALID_DISTINCT',
      'distinct sort must include a primary or unique tie-breaker.',
      { collection: collection.name, path: ['sort'] },
    );
  }
  return [...input];
}

function validateValues(
  collection: CollectionDefinition,
  input: unknown,
  operation: 'createOne' | 'createMany' | 'updateOne' | 'updateMany',
  allowEmpty = false,
  context?: RepositoryContext,
  path: readonly (string | number)[] = ['values'],
): RepositoryRecord {
  if (!isPlainRecord(input)) {
    invalid('INVALID_MUTATION', 'values must be a plain object.', {
      collection: collection.name,
      path: ['values'],
    });
  }
  if (
    (operation === 'updateOne' || operation === 'updateMany') &&
    !allowEmpty &&
    Object.keys(input).length === 0
  ) {
    invalid('INVALID_MUTATION', 'Update values must not be empty.', {
      collection: collection.name,
      path: ['values'],
    });
  }
  const normalized: RepositoryRecord = {};
  for (const key of Object.keys(input)) {
    const field = directField(collection, key, ['values', key]);
    if (!isScalarField(field)) {
      invalid(
        'FIELD_NOT_WRITABLE',
        `Relation Field "${key}" is not writable in bulk mutation values.`,
        {
          collection: collection.name,
          field: key,
          path: ['values', key],
        },
      );
    }
    if (isManagedField(collection, field)) {
      invalid(
        'FIELD_NOT_WRITABLE',
        `Field "${key}" is managed by the database or Repository.`,
        {
          collection: collection.name,
          field: key,
          path: ['values', key],
        },
      );
    }
    const resolved = resolveMutationValue(input[key], context, [...path, key]);
    normalized[key] = resolved.expression
      ? validateResolvedMutationValue(field, resolved, collection.name, [
          ...path,
          key,
        ])
      : normalizeNumericMutation(
          collection,
          field,
          input[key],
          operation === 'updateOne' || operation === 'updateMany',
          context,
          [...path, key],
        );
  }
  return normalized;
}

function validateUnique(
  collection: CollectionDefinition,
  selector: UniqueSelector,
  path: readonly (string | number)[] = ['unique'],
  context?: RepositoryContext,
): UniqueSelector {
  if (
    !selector ||
    selector.kind !== 'unique' ||
    !Array.isArray(selector.fields) ||
    selector.fields.length === 0 ||
    !isPlainRecord(selector.values)
  ) {
    invalid('INVALID_UNIQUE_SELECTOR', 'Expected a logical unique selector.', {
      collection: collection.name,
      path,
    });
  }
  const keys = Object.keys(selector.values);
  if (
    new Set(selector.fields).size !== selector.fields.length ||
    selector.fields.length !== keys.length ||
    selector.fields.some((field) => !Object.hasOwn(selector.values, field)) ||
    selector.fields.some(
      (field) =>
        selector.values[field] === undefined || selector.values[field] === null,
    )
  ) {
    invalid(
      'INVALID_UNIQUE_SELECTOR',
      'Unique selector fields and value keys must match exactly.',
      { collection: collection.name, path },
    );
  }
  selector.fields.forEach((field, index) =>
    scalarField(collection, field, [...path, 'fields', index]),
  );
  const constraint = uniqueConstraints(collection).find(
    (candidate) =>
      candidate.fields.length === selector.fields.length &&
      candidate.fields.every((field) => selector.fields.includes(field)),
  );
  if (!constraint) {
    invalid(
      'INVALID_UNIQUE_SELECTOR',
      'Selector Field set does not match a primary or unique constraint.',
      { collection: collection.name, path: [...path, 'fields'] },
    );
  }
  const values = Object.fromEntries(
    constraint.fields.map((name) => {
      const resolved = resolveMutationValue(selector.values[name], context, [
        ...path,
        'values',
        name,
      ]);
      const value = resolved.expression
        ? validateResolvedMutationValue(
            scalarField(collection, name, [...path, 'values', name]),
            resolved,
            collection.name,
            [...path, 'values', name],
          )
        : resolved.value;
      if (value === null || value === undefined)
        invalid(
          'INVALID_UNIQUE_SELECTOR',
          'Unique values must not be null or undefined.',
          { path: [...path, 'values', name] },
        );
      const field = scalarField(collection, name, [...path, 'values', name]);
      return [
        name,
        field.type === 'char'
          ? normalizeCharValue(field, value, 'INVALID_UNIQUE_SELECTOR', [
              ...path,
              'values',
              name,
            ])
          : field.type === 'boolean'
            ? normalizeBooleanValue(field, value, 'INVALID_UNIQUE_SELECTOR', [
                ...path,
                'values',
                name,
              ])
            : isTemporalType(field.type)
              ? normalizeTemporalValue(
                  field,
                  value,
                  'INVALID_UNIQUE_SELECTOR',
                  [...path, 'values', name],
                )
              : value,
      ];
    }),
  );
  return {
    kind: 'unique',
    fields: constraint.fields,
    values,
  };
}

function validateIfVersion(
  collection: CollectionDefinition,
  ifVersion: string | number | undefined,
): void {
  if (ifVersion !== undefined && !collection.optimisticLock) {
    invalid(
      'INVALID_MUTATION',
      'ifVersion requires Collection optimistic locking.',
      { collection: collection.name, path: ['ifVersion'] },
    );
  }
}

function assertWritableCollection(collection: CollectionDefinition): void {
  if ((collection.kind ?? 'table') !== 'table') {
    invalid(
      'READ_ONLY_COLLECTION',
      'Repository V1 treats views as read-only.',
      {
        collection: collection.name,
      },
    );
  }
}

function assertBulkReturningIdentity(collection: CollectionDefinition): void {
  if (primaryFields(collection).length === 0) {
    invalid(
      'INVALID_MUTATION',
      'Bulk mutation returning requires a primary key.',
      { collection: collection.name, path: ['select'] },
    );
  }
}

function scalarFields(collection: CollectionDefinition): FieldDefinition[] {
  return (collection.fields ?? []).filter(isScalarField);
}

function relationFields(
  collection: CollectionDefinition,
): RelationFieldDefinition[] {
  return (collection.fields ?? []).filter(isRelationField);
}

function directField(
  collection: CollectionDefinition,
  name: string,
  path: readonly (string | number)[],
): AnyFieldDefinition {
  const field = collection.fields?.find((candidate) => candidate.name === name);
  if (!field) {
    invalid('FIELD_NOT_FOUND', `Field "${name}" does not exist.`, {
      collection: collection.name,
      field: name,
      path,
    });
  }
  return field;
}

function scalarField(
  collection: CollectionDefinition,
  name: string,
  path: readonly (string | number)[],
): FieldDefinition {
  const field = directField(collection, name, path);
  if (!isScalarField(field)) {
    invalid(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `Field "${name}" is a relation.`,
      {
        collection: collection.name,
        field: name,
        path,
      },
    );
  }
  return field;
}

function isScalarField(field: AnyFieldDefinition): field is FieldDefinition {
  return !('target' in field);
}

function isRelationField(
  field: AnyFieldDefinition,
): field is RelationFieldDefinition {
  return 'target' in field;
}

function uniqueConstraints(
  collection: CollectionDefinition,
): Array<Extract<ConstraintDefinition, { type: 'primary' | 'unique' }>> {
  return identityConstraints(collection);
}

function includeExecutionFields(
  collection: CollectionDefinition,
  fields: readonly string[],
): string[] {
  const result = [...fields];
  const identity = uniqueConstraints(collection).flatMap(
    (constraint) => constraint.fields,
  );
  for (const field of identity) {
    if (!result.includes(field)) result.push(field);
  }
  const version = collection.optimisticLock?.field;
  if (version && !result.includes(version)) result.push(version);
  return result;
}

function pick(
  record: RepositoryRecord,
  fields: readonly string[],
): RepositoryRecord {
  return Object.fromEntries(fields.map((field) => [field, record[field]]));
}

function pickSelection(
  record: RepositoryRecord,
  fields: readonly string[],
  select: SelectAst | undefined,
): RepositoryRecord {
  const result = pick(record, fields);
  for (const relation of select?.root.includes ?? []) {
    result[relation.relation] = record[relation.relation];
  }
  return result;
}

function recordNotFound(collection: CollectionDefinition): never {
  return invalid('RECORD_NOT_FOUND', 'Repository record was not found.', {
    collection: collection.name,
  });
}

function multipleRecordsMatched(collection: CollectionDefinition): never {
  return invalid(
    'MULTIPLE_RECORDS_MATCHED',
    'Single mutation filter matched more than one Repository record.',
    { collection: collection.name, path: ['filter'] },
  );
}

function versionConflict(collection: CollectionDefinition): never {
  return invalid(
    'VERSION_CONFLICT',
    'Repository record version does not match.',
    {
      collection: collection.name,
      retryable: true,
    },
  );
}

function toValidationError(error: RepositoryError): MutationValidationError {
  return {
    code: error.code,
    message: error.message,
    path: error.path,
    collection: error.collection,
    field: error.field,
    relation: error.relation,
    retryable: error.retryable,
    details: error.details,
  };
}
