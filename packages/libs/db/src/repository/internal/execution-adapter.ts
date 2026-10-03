import type { CollectionDefinition } from '../../collection/types.js';
import type { RepositoryEventMetaBag } from '../events/types.js';
import type {
  AggregateAst,
  FilterAst,
  CreatedTargetReference,
  RelationMutationAst,
  RepositoryRecord,
  SelectAst,
  SortAst,
  UniqueSelector,
} from '../types.js';

export interface RepositoryAggregatePlan {
  readonly collection: CollectionDefinition;
  readonly aggregate: AggregateAst;
  readonly filter?: FilterAst;
}

export interface RepositoryGroupByPlan extends RepositoryAggregatePlan {
  readonly by: readonly string[];
  readonly having?: FilterAst;
  readonly sort?: SortAst;
}

export interface RepositoryReadPlan {
  readonly collection: CollectionDefinition;
  readonly fields: readonly string[];
  readonly select?: SelectAst;
  readonly filter?: FilterAst;
  readonly sort?: SortAst;
  readonly distinct?: readonly string[];
  readonly cursor?: readonly RepositoryCursorAxis[];
  readonly direction?: 'forward' | 'backward';
  readonly limit?: number;
  readonly offset?: number;
}

export interface RepositoryCursorAxis {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
  readonly value: unknown;
}

export interface RepositoryFilterPlan {
  readonly collection: CollectionDefinition;
  readonly filter?: FilterAst;
}

/**
 * The scope a written record must still satisfy once the write lands.
 *
 * It is checked with a statement rather than in memory. An in-memory check
 * would have to reproduce the database's own comparison semantics — NULL's
 * three-valued logic, the column's collation, date precision, the numeric
 * carrier, how the dialect stores booleans — and one of those cannot be
 * reproduced at all: the same string equality that matches under MySQL's
 * default collation does not match under PostgreSQL's, and the evaluator
 * cannot see which applies. Asking the database keeps the check and the WHERE
 * clause that selected the row in exact agreement by construction.
 */
export interface RepositoryScopeCheck {
  readonly scope: FilterAst;
  /**
   * Fields the scope references. A write that touches none of them cannot
   * move the record out of scope, so the check is skipped and the ordinary
   * update path issues no extra statement.
   */
  readonly fields: readonly string[];
}

/**
 * Which existing records a relation mutation may locate.
 *
 * The root scope constrains the root record and nothing else. A relation
 * operation reaches its target straight from the target table by selector, so
 * without this a caller inside their own tenant could `connect` somebody
 * else's row into their data — the root scope stops them touching the wrong
 * project, not the wrong task.
 *
 * `create` is absent on purpose: a target being created takes its ownership
 * from the relation key, so it necessarily lands under the originator.
 */
export interface RelationScopeNode {
  readonly scope?: FilterAst;
  readonly relations?: Readonly<Record<string, RelationScopeNode>>;
}

export interface RepositoryCreateOnePlan {
  readonly collection: CollectionDefinition;
  /** Caller metadata carried into this call's mutation event. */
  readonly meta?: RepositoryEventMetaBag;
  readonly fields: readonly string[];
  readonly values: RepositoryRecord;
  readonly relations?: RelationMutationAst;
  readonly select?: SelectAst;
  readonly scopeCheck?: RepositoryScopeCheck;
  readonly relationScopes?: Readonly<Record<string, RelationScopeNode>>;
}

export interface RepositoryCreateManyPlan {
  readonly collection: CollectionDefinition;
  /** Caller metadata carried into this call's mutation event. */
  readonly meta?: RepositoryEventMetaBag;
  readonly records: readonly RepositoryRecord[];
  readonly fields?: readonly string[];
  readonly select?: SelectAst;
  readonly scopeCheck?: RepositoryScopeCheck;
}

export interface RepositoryUpdateOnePlan {
  readonly collection: CollectionDefinition;
  /** Caller metadata carried into this call's mutation event. */
  readonly meta?: RepositoryEventMetaBag;
  readonly fields: readonly string[];
  readonly filter: FilterAst;
  readonly values: RepositoryRecord;
  readonly ifVersion?: string | number;
  readonly relations?: RelationMutationAst;
  readonly select?: SelectAst;
  readonly scopeCheck?: RepositoryScopeCheck;
  readonly relationScopes?: Readonly<Record<string, RelationScopeNode>>;
}

export interface RepositoryUpsertOnePlan {
  readonly collection: CollectionDefinition;
  /** Caller metadata carried into this call's mutation event. */
  readonly meta?: RepositoryEventMetaBag;
  readonly fields: readonly string[];
  readonly by: UniqueSelector;
  readonly createValues: RepositoryRecord;
  readonly createRelations?: RelationMutationAst;
  readonly updateValues: RepositoryRecord;
  readonly updateRelations?: RelationMutationAst;
  readonly ifVersion?: string | number;
  readonly select?: SelectAst;
  readonly createRelationScopes?: Readonly<Record<string, RelationScopeNode>>;
  readonly updateRelationScopes?: Readonly<Record<string, RelationScopeNode>>;
  readonly createScopeCheck?: RepositoryScopeCheck;
  /**
   * Judged against the record that already exists, before it is updated, and
   * again after. A target outside it raises RECORD_OUTSIDE_SCOPE rather than
   * degrading to an insert, which would only hit the unique constraint and
   * report a misleading duplicate key.
   */
  readonly updateScopeCheck?: RepositoryScopeCheck;
}

export interface RepositoryUpdateManyPlan {
  readonly collection: CollectionDefinition;
  /** Caller metadata carried into this call's mutation event. */
  readonly meta?: RepositoryEventMetaBag;
  readonly filter?: FilterAst;
  readonly all: boolean;
  readonly values: RepositoryRecord;
  readonly fields?: readonly string[];
  readonly select?: SelectAst;
  readonly scopeCheck?: RepositoryScopeCheck;
}

export interface RepositoryDeleteOnePlan {
  readonly collection: CollectionDefinition;
  /** Caller metadata carried into this call's mutation event. */
  readonly meta?: RepositoryEventMetaBag;
  readonly filter: FilterAst;
  readonly ifVersion?: string | number;
  readonly fields?: readonly string[];
  readonly select?: SelectAst;
}

export interface RepositoryDeleteManyPlan {
  readonly collection: CollectionDefinition;
  /** Caller metadata carried into this call's mutation event. */
  readonly meta?: RepositoryEventMetaBag;
  readonly filter?: FilterAst;
  readonly all: boolean;
  readonly fields?: readonly string[];
  readonly select?: SelectAst;
}

export interface RepositoryExecutedMutation {
  readonly record: RepositoryRecord;
  readonly createdTargets: readonly CreatedTargetReference[];
  readonly version?: string | number;
}

export interface RepositoryDeletedMutation {
  readonly record: RepositoryRecord;
}

export interface RepositoryExecutedManyMutation {
  readonly count: number;
  readonly records?: readonly RepositoryRecord[];
}

export type RepositorySingleMutationMiss = 'missing' | 'multiple' | 'conflict';

/** Internal adapter boundary. Plans contain logical Collection and Field names only. */
export interface RepositoryExecutionAdapter {
  assertReadable(): void;
  findMany(plan: RepositoryReadPlan): Promise<RepositoryRecord[]>;
  stream(plan: RepositoryReadPlan): AsyncIterable<RepositoryRecord>;
  findOne(plan: RepositoryReadPlan): Promise<RepositoryRecord | undefined>;
  count(plan: RepositoryFilterPlan): Promise<number>;
  exists(plan: RepositoryFilterPlan): Promise<boolean>;
  aggregate(plan: RepositoryAggregatePlan): Promise<RepositoryRecord>;
  groupBy(plan: RepositoryGroupByPlan): Promise<RepositoryRecord[]>;
  createOne(plan: RepositoryCreateOnePlan): Promise<RepositoryExecutedMutation>;
  createMany(
    plan: RepositoryCreateManyPlan,
  ): Promise<RepositoryExecutedManyMutation>;
  updateOne(
    plan: RepositoryUpdateOnePlan,
  ): Promise<RepositoryExecutedMutation | RepositorySingleMutationMiss>;
  upsertOne(
    plan: RepositoryUpsertOnePlan,
  ): Promise<RepositoryExecutedMutation | 'conflict'>;
  updateMany(
    plan: RepositoryUpdateManyPlan,
  ): Promise<RepositoryExecutedManyMutation>;
  deleteOne(
    plan: RepositoryDeleteOnePlan,
  ): Promise<
    'deleted' | RepositoryDeletedMutation | RepositorySingleMutationMiss
  >;
  deleteMany(
    plan: RepositoryDeleteManyPlan,
  ): Promise<RepositoryExecutedManyMutation>;
}
