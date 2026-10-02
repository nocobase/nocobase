import { isUniqueConstraintViolation } from '../../database/internal/unique-constraint.js';
import { decimalString } from '../../numeric/decimal.js';
import {
  decodeJsonValue,
  encodeJsonValue,
  type JsonResultForm,
  type JsonValue,
} from '../../json.js';
import {
  aggregateSql,
  aggregateProjection,
  decodeAggregate,
  decodeCount,
} from '../../numeric/aggregate.js';
import type { Knex } from 'knex';
import {
  attachDatabaseDriverRuntime,
  getDatabaseDriverRuntime,
  type DatabaseDriverRuntime,
} from '../../database/runtime.js';
import { Readable } from 'node:stream';
import type {
  AnyFieldDefinition,
  CollectionDefinition,
  FieldDefinition,
  RelationFieldDefinition,
} from '../../collection/types.js';
import { DefaultNamingStrategy } from '../../naming/default-strategy.js';
import {
  requireRelationOption,
  validateRelationOptions,
} from '../../collection/relation-contract.js';
import { RepositoryError } from '../errors.js';
import { decodeBooleanValue, normalizeBooleanValue } from '../boolean.js';
import { normalizeEnumValue } from '../enum.js';
import { spoolRows } from './row-spool.js';
import { decodeIntegerValue } from '../integer.js';
import { prepareScalarRowDecoder } from './row-decoder.js';
import { isTemporalType, normalizeTemporalValue } from '../temporal.js';
import { temporalBinding, temporalProjection } from './temporal-sql.js';
import {
  createdRecordSelector as deriveCreatedSelector,
  recordSelector as selectorFromRecord,
} from './identity.js';
import { isNumericMutation } from '../numeric-mutation.js';
import { compileJsonCondition, jsonOperators } from '../json-filter.js';
import type {
  ConnectTarget,
  CreatedTargetReference,
  CreateTarget,
  FilterAst,
  FilterConditionNode,
  FilterGroupNode,
  FilterNode,
  FilterRelationNode,
  FilterValue,
  RepositoryRecord,
  RelationMutationAst,
  RelationMutationNode,
  RelationDeleteTarget,
  RelationUpdateTarget,
  RelationUpsertTarget,
  SelectNode,
  SelectIncludeNode,
  SelectAst,
  SortNode,
  UniqueSelector,
} from '../types.js';
import type {
  RepositoryCreateManyPlan,
  RepositoryCreateOnePlan,
  RepositoryDeleteManyPlan,
  RepositoryDeleteOnePlan,
  RepositoryDeletedMutation,
  RepositoryExecutedMutation,
  RepositoryExecutedManyMutation,
  RepositoryExecutionAdapter,
  RepositoryAggregatePlan,
  RepositoryCursorAxis,
  RepositoryGroupByPlan,
  RepositoryFilterPlan,
  RepositoryReadPlan,
  RepositorySingleMutationMiss,
  RelationScopeNode,
  RepositoryScopeCheck,
  RepositoryUpdateManyPlan,
  RepositoryUpdateOnePlan,
  RepositoryUpsertOnePlan,
} from './execution-adapter.js';

interface LockedMutationRecord {
  readonly record: RepositoryRecord;
  readonly unique: UniqueSelector;
}

type PhysicalWriteRecord = Record<string, RepositoryRecord[string] | Knex.Raw>;

interface GroupByOutput {
  readonly name: string;
  readonly internal: string;
  readonly aggregate?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export class KnexRepositoryExecutionAdapter implements RepositoryExecutionAdapter {
  constructor(
    private readonly getClient: () => Knex,
    private readonly getCollection: (
      name: string,
    ) => Promise<CollectionDefinition | undefined>,
    readonly runtime: DatabaseDriverRuntime | undefined = undefined,
  ) {}

  async findMany(plan: RepositoryReadPlan): Promise<RepositoryRecord[]> {
    this.assertReadable();
    const decodeRow = prepareScalarRowDecoder(
      plan.collection,
      plan.fields,
      this.runtime?.repository?.trimCharResults,
      this.runtime?.repository?.jsonResults,
    );
    const { query } = await this.buildRead(plan);
    const rows = (await query) as RepositoryRecord[];
    if (plan.direction === 'backward') rows.reverse();
    if (plan.select?.root.includes?.length) {
      await this.loadRelations(plan.collection, rows, plan.select.root);
    }
    return rows.map((row) =>
      projectRow(decodeRow(row), plan.fields, plan.select?.root),
    );
  }

  async *stream(plan: RepositoryReadPlan): AsyncIterable<RepositoryRecord> {
    this.assertReadable();
    const decodeRow = prepareScalarRowDecoder(
      plan.collection,
      plan.fields,
      this.runtime?.repository?.trimCharResults,
      this.runtime?.repository?.jsonResults,
    );
    const includes = plan.select?.root.includes?.length;
    const source = this.streamRoots(plan);
    const roots =
      includes || plan.direction === 'backward'
        ? spoolRows(source, plan.direction === 'backward')
        : source;
    let batch: RepositoryRecord[] = [];
    for await (const row of roots) {
      this.assertReadable();
      if (!includes) {
        yield projectRow(decodeRow(row), plan.fields, plan.select?.root);
        continue;
      }
      batch.push(row);
      if (batch.length === 100) {
        await this.loadRelations(plan.collection, batch, plan.select.root);
        for (const record of batch) {
          this.assertReadable();
          yield projectRow(decodeRow(record), plan.fields, plan.select?.root);
        }
        batch = [];
      }
    }
    if (batch.length) {
      this.assertReadable();
      await this.loadRelations(plan.collection, batch, plan.select!.root);
      for (const record of batch) {
        this.assertReadable();
        yield projectRow(decodeRow(record), plan.fields, plan.select?.root);
      }
    }
  }

  assertReadable(): void {
    const client = this.getClient();
    if (isTransaction(client) && client.isCompleted()) {
      throw new RepositoryError(
        'QUERY_TRANSACTION_COMPLETED',
        'Consume Repository queries before their transaction completes.',
      );
    }
  }

  private async *streamRoots(
    plan: RepositoryReadPlan,
  ): AsyncIterable<RepositoryRecord> {
    const { query } = await this.buildRead(plan);
    let source!: Readable & AsyncIterable<RepositoryRecord>;
    // The callback form exposes errors thrown after connection acquisition;
    // Knex's stream-only form can otherwise leave the consumer waiting forever.
    const client = this.getClient();
    const runtime = getDatabaseDriverRuntime(client);
    const options = runtime?.repository?.streamOptions?.(client) ?? {};
    // QueryBuilder.stream currently drops its second argument in Knex 3.
    const runner = client.client.runner(query) as {
      client: Knex['client'];
      stream(
        options: object,
        handler: (stream: Readable) => void,
      ): Promise<void>;
    };
    // Knex assumes dialects emit every rejected setup error on the stream,
    // and swallows the rejection after acquiring a connection. Guard this
    // single runner without patching the shared connection or client.
    const streamClient: Knex['client'] = Object.create(client.client);
    streamClient.stream = async (
      ...args: Parameters<Knex['client']['stream']>
    ) => {
      try {
        return await client.client.stream(...args);
      } catch (error: unknown) {
        source.destroy(
          error instanceof Error ? error : new Error(String(error)),
        );
        throw error;
      }
    };
    runner.client = streamClient;
    const execution = runner.stream(options, (stream) => {
      source = stream as Readable & AsyncIterable<RepositoryRecord>;
    });
    void execution.catch((error: unknown) => {
      source.destroy(error instanceof Error ? error : new Error(String(error)));
    });
    // Knex releases the acquired connection from its close listener. Do not
    // finish iterator cleanup while that listener can still run after pool teardown.
    const closed = new Promise<void>((resolve) => {
      if (source.closed) resolve();
      else source.once('close', resolve);
    });
    try {
      for await (const row of source) {
        yield runtime?.repository?.decodeStreamRow
          ? await runtime.repository.decodeStreamRow(row)
          : row;
      }
    } finally {
      source.destroy();
      await closed;
    }
  }

  async findOne(
    plan: RepositoryReadPlan,
  ): Promise<RepositoryRecord | undefined> {
    return (await this.findMany({ ...plan, limit: 1 }))[0];
  }

  async count(plan: RepositoryFilterPlan): Promise<number> {
    const client = this.getClient();
    const alias = 'repository_root';
    const query = tableQuery(client, plan.collection, alias).select(
      client.raw('? as ??', [
        aggregateProjection(client, aggregateSql(client, 'count', '*')),
        'count',
      ]),
    );
    const graph = await this.prepareFilterGraph(
      plan.collection,
      plan.filter?.root,
    );
    applyFilter(
      query,
      plan.collection,
      plan.filter?.root,
      graph,
      alias,
      client,
    );
    const row = (await query.first()) as
      { count?: string | number } | undefined;
    return decodeCount(row?.count);
  }

  async exists(plan: RepositoryFilterPlan): Promise<boolean> {
    const client = this.getClient();
    const alias = 'repository_root';
    const query = tableQuery(client, plan.collection, alias).select(
      client.raw('1 as value'),
    );
    const graph = await this.prepareFilterGraph(
      plan.collection,
      plan.filter?.root,
    );
    applyFilter(
      query,
      plan.collection,
      plan.filter?.root,
      graph,
      alias,
      client,
    );
    return (await query.first()) !== undefined;
  }

  async aggregate(plan: RepositoryAggregatePlan): Promise<RepositoryRecord> {
    const client = this.getClient();
    const alias = 'repository_root';
    const query = tableQuery(client, plan.collection, alias);
    const selections = plan.aggregate.items.map((item, index) => {
      const resultAlias = `aggregate_${index}`;
      const field =
        item.field !== undefined
          ? qualified(alias, column(plan.collection, item.field))
          : '*';
      const source = scalarFields(plan.collection).find(
        (source) => source.name === item.field,
      );
      const expression = aggregateSql(client, item.kind, field, false, source);
      const numeric =
        ['count', 'sum', 'avg'].includes(item.kind) ||
        (source &&
          [
            'bigInt',
            'integer',
            'increments',
            'decimal',
            'float',
            'double',
          ].includes(source.type));
      query.select(
        client.raw('? as ??', [
          numeric
            ? aggregateProjection(client, expression, source)
            : temporalProjection(client, source, expression),
          resultAlias,
        ]),
      );
      return { item, resultAlias };
    });
    const graph = await this.prepareFilterGraph(
      plan.collection,
      plan.filter?.root,
    );
    applyFilter(
      query,
      plan.collection,
      plan.filter?.root,
      graph,
      alias,
      client,
    );
    const row = (await query.first()) as RepositoryRecord | undefined;
    return Object.fromEntries(
      selections.map(({ item, resultAlias }) => {
        let value = row?.[resultAlias];
        const source = scalarFields(plan.collection).find(
          (source) => source.name === item.field,
        );
        if (
          source &&
          isTemporalType(source.type) &&
          value != null &&
          (item.kind === 'min' || item.kind === 'max')
        )
          value = normalizeTemporalValue(
            source,
            value,
            'FIELD_CAPABILITY_NOT_SUPPORTED',
            ['aggregate', item.alias],
          );
        return [item.alias, decodeAggregate(item.kind, value, source)];
      }),
    );
  }

  async groupBy(plan: RepositoryGroupByPlan): Promise<RepositoryRecord[]> {
    const client = this.getClient();
    const rootAlias = 'repository_root';
    const resultAlias = 'repository_group';
    const inner = tableQuery(client, plan.collection, rootAlias);
    const outputs: GroupByOutput[] = plan.by.map((field, index) => ({
      name: field,
      internal: `group_${index}`,
      aggregate: undefined,
    }));
    for (const output of outputs) {
      const field = qualified(rootAlias, column(plan.collection, output.name));
      const definition = scalarFields(plan.collection).find(
        (entry) => entry.name === output.name,
      );
      if (definition?.type === 'enum') {
        // Group by exact identity, independent of database collation. Select a
        // representative string so binary group keys never leak into results.
        inner
          .min({ [output.internal]: field })
          .groupBy(enumGroupKey(client, field));
      } else {
        inner.select(client.ref(field).as(output.internal)).groupBy(field);
      }
    }
    for (const [index, item] of plan.aggregate.items.entries()) {
      const internal = `aggregate_${index}`;
      const field =
        item.field !== undefined
          ? qualified(rootAlias, column(plan.collection, item.field))
          : '*';
      inner.select(
        client.raw('? as ??', [
          aggregateSql(
            client,
            item.kind,
            field,
            false,
            scalarFields(plan.collection).find(
              (source) => source.name === item.field,
            ),
          ),
          internal,
        ]),
      );
      outputs.push({ name: item.alias, internal, aggregate: item.kind });
    }
    const graph = await this.prepareFilterGraph(
      plan.collection,
      plan.filter?.root,
    );
    applyFilter(
      inner,
      plan.collection,
      plan.filter?.root,
      graph,
      rootAlias,
      client,
    );

    const outputCollection = internalGroupResultCollection(plan, outputs);
    const query = client
      .queryBuilder()
      .from(inner.as(resultAlias))
      .select(
        outputs.map((output) => {
          const field = scalarFields(outputCollection).find(
            (field) => field.name === output.internal,
          );
          const expression = client.ref(
            qualified(resultAlias, output.internal),
          );
          if (
            output.aggregate &&
            field &&
            [
              'bigInt',
              'integer',
              'increments',
              'decimal',
              'float',
              'double',
            ].includes(field.type)
          )
            return client.raw('? as ??', [
              aggregateProjection(client, expression, field),
              output.internal,
            ]);
          return selectColumn(
            client,
            outputCollection,
            { column: output.internal, alias: output.internal },
            resultAlias,
          );
        }),
      );
    const internalByName = new Map(
      outputs.map((output) => [output.name, output.internal]),
    );
    if (plan.having) {
      applyFilter(
        query,
        internalGroupResultCollection(plan, outputs),
        mapFilterFields(plan.having.root, internalByName),
        new WeakMap(),
        resultAlias,
        client,
      );
    }
    for (const item of plan.sort?.items ?? []) {
      if (item.kind !== 'field' || item.path.length !== 1) {
        throw new Error('GroupBy sort must target a direct result Field.');
      }
      const internal = internalByName.get(item.path[0]);
      if (!internal) throw new Error('GroupBy sort Field was not mapped.');
      const output = outputs.find((entry) => entry.internal === internal);
      const rawOrderValue = qualified(resultAlias, internal);
      const orderValue =
        getDatabaseDriverRuntime(client)?.repository?.groupAggregateOrder?.({
          client,
          value: rawOrderValue,
          aggregate: output?.aggregate,
        }) ?? rawOrderValue;
      applyOrderBy(
        query,
        client,
        orderValue,
        item.direction,
        item.nulls ?? 'last',
      );
    }
    const rows = (await query) as RepositoryRecord[];
    const decodeRow = prepareScalarRowDecoder(
      outputCollection,
      undefined,
      this.runtime?.repository?.trimCharResults,
      this.runtime?.repository?.jsonResults,
    );
    const fieldsByName = new Map(
      scalarFields(outputCollection).map((field) => [field.name, field]),
    );
    const resultDecoders = outputs.map((output) => {
      const source = fieldsByName.get(output.internal);
      const kind = output.aggregate;
      return {
        ...output,
        decode: kind
          ? (value: unknown) => decodeAggregate(kind, value, source)
          : (value: RepositoryRecord[string]) => value,
      };
    });
    return rows.map((row) => {
      const decoded = decodeRow(row);
      return Object.fromEntries(
        resultDecoders.map((output) => [
          output.name,
          output.decode(decoded[output.internal]),
        ]),
      );
    });
  }

  async createOne(
    plan: RepositoryCreateOnePlan,
  ): Promise<RepositoryExecutedMutation> {
    return this.inTransaction((adapter) => adapter.executeCreateOne(plan));
  }

  private async executeCreateOne(
    plan: RepositoryCreateOnePlan,
  ): Promise<RepositoryExecutedMutation> {
    const createdTargets: CreatedTargetReference[] = [];
    const { record, unique } = await this.createRecord(
      plan.collection,
      plan.values,
      plan.relations,
      createdTargets,
      undefined,
      {},
      plan.relationScopes,
    );
    if (plan.scopeCheck) {
      await this.assertWithinScope(
        plan.collection,
        [unique],
        plan.scopeCheck,
        'create',
      );
    }
    if (!plan.select?.root.includes?.length) {
      return {
        record,
        createdTargets,
        version: versionOf(plan.collection, record),
      };
    }
    const selected = await this.findOne({
      collection: plan.collection,
      fields: plan.fields,
      select: plan.select,
      filter: uniqueFilter(unique),
    });
    if (!selected)
      throw new Error('Created Repository record could not be reloaded.');
    return {
      record: selected,
      createdTargets,
      version: versionOf(plan.collection, record),
    };
  }

  async createMany(
    plan: RepositoryCreateManyPlan,
  ): Promise<RepositoryExecutedManyMutation> {
    if (plan.scopeCheck && !plan.fields) {
      // The bulk insert paths below never learn which rows they wrote, so a
      // scope that has to be judged forces the row-at-a-time path.
      return this.inTransaction(async (adapter) => {
        for (const values of plan.records) {
          await adapter.executeCreateOne({
            collection: plan.collection,
            fields: [],
            values,
            scopeCheck: plan.scopeCheck,
          });
        }
        return { count: plan.records.length };
      });
    }
    if (plan.fields) {
      return this.inTransaction((adapter) =>
        adapter.executeCreateManyReturning(plan),
      );
    }
    if (
      getDatabaseDriverRuntime(
        this.getClient(),
      )?.repository?.createManyFallback?.(plan.collection)
    ) {
      return this.inTransaction(async (adapter) => {
        const client = adapter.getClient();
        const encodeRow = prepareWrite(client, plan.collection);
        for (const record of plan.records)
          await tableQuery(client, plan.collection).insert(
            encodeRow(withInitialVersion(plan.collection, record)),
          );
        return { count: plan.records.length };
      });
    }
    const encodeRow = prepareWrite(this.getClient(), plan.collection);
    const records = plan.records.map((record) =>
      encodeRow(withInitialVersion(plan.collection, record)),
    );
    const result = (await tableQuery(this.getClient(), plan.collection).insert(
      records,
    )) as unknown;
    return { count: insertedCount(result, records.length) };
  }

  private async executeCreateManyReturning(
    plan: RepositoryCreateManyPlan,
  ): Promise<RepositoryExecutedManyMutation> {
    const fields = plan.fields;
    if (!fields) throw new Error('Returning createMany requires fields.');
    const records: RepositoryRecord[] = [];
    for (const values of plan.records) {
      const result = await this.executeCreateOne({
        collection: plan.collection,
        fields,
        values,
        select: plan.select,
        scopeCheck: plan.scopeCheck,
      });
      records.push(result.record);
    }
    return { count: records.length, records };
  }

  async updateOne(
    plan: RepositoryUpdateOnePlan,
  ): Promise<RepositoryExecutedMutation | RepositorySingleMutationMiss> {
    return this.inTransaction((adapter) => adapter.executeUpdateOne(plan));
  }

  private async executeUpdateOne(
    plan: RepositoryUpdateOnePlan,
  ): Promise<RepositoryExecutedMutation | RepositorySingleMutationMiss> {
    const selected = await this.lockByFilter(plan.collection, plan.filter);
    if (selected === 'missing' || selected === 'multiple') return selected;
    const { record: current, unique } = selected;
    if (
      plan.ifVersion !== undefined &&
      versionOf(plan.collection, current) !== plan.ifVersion
    ) {
      return 'conflict';
    }
    if (Object.keys(plan.values).length > 0) {
      const query = tableQuery(this.getClient(), plan.collection).update(
        mapUpdate(this.getClient(), plan.collection, plan.values),
      );
      applyUnique(query, plan.collection, unique);
      applyVersion(query, plan.collection, plan.ifVersion);
      if (affectedCount(await query) === 0) return 'conflict';
      Object.assign(
        current,
        await this.refreshAtomicValues(plan.collection, unique, plan.values),
      );
    }
    const createdTargets: CreatedTargetReference[] = [];
    if (plan.relations) {
      await this.applyRelationMutations(
        plan.collection,
        current,
        unique,
        plan.relations,
        createdTargets,
        plan.relationScopes,
      );
    }
    if (plan.collection.optimisticLock) {
      const versionQuery = tableQuery(this.getClient(), plan.collection);
      applyUnique(versionQuery, plan.collection, unique);
      applyVersion(versionQuery, plan.collection, plan.ifVersion);
      incrementVersion(versionQuery, plan.collection);
      if (affectedCount(await versionQuery) === 0) return 'conflict';
    }
    if (
      plan.scopeCheck &&
      (await this.scopeCheckApplies(
        plan.collection,
        plan.scopeCheck,
        plan.values,
        plan.relations,
      ))
    ) {
      await this.assertWithinScope(
        plan.collection,
        [unique],
        plan.scopeCheck,
        'update',
      );
    }
    const record = await this.findOne({
      collection: plan.collection,
      fields: plan.fields,
      select: plan.select,
      filter: uniqueFilter(unique),
    });
    return record
      ? {
          record,
          createdTargets,
          version: versionOf(plan.collection, record),
        }
      : 'missing';
  }

  async upsertOne(
    plan: RepositoryUpsertOnePlan,
  ): Promise<RepositoryExecutedMutation | 'conflict'> {
    return this.inTransaction((adapter) => adapter.executeUpsertOne(plan));
  }

  private async executeUpsertOne(
    plan: RepositoryUpsertOnePlan,
  ): Promise<RepositoryExecutedMutation | 'conflict'> {
    const selected = await this.lockByUnique(plan.collection, plan.by);
    if (selected === 'missing') {
      try {
        return await this.inSavepoint((adapter) =>
          adapter.executeCreateOne({
            collection: plan.collection,
            fields: plan.fields,
            values: plan.createValues,
            relations: plan.createRelations,
            select: plan.select,
            scopeCheck: plan.createScopeCheck,
            relationScopes: plan.createRelationScopes,
          }),
        );
      } catch (error) {
        if (!isUniqueConstraintViolation(error)) throw error;
        const concurrent = await this.lockByUnique(plan.collection, plan.by);
        if (concurrent === 'missing') throw error;
      }
    }
    // The target exists. Whether this caller may update it is a question about
    // the record as it stands, before their values are applied.
    if (plan.updateScopeCheck) {
      await this.assertUpsertTargetInScope(
        plan.collection,
        plan.by,
        plan.updateScopeCheck,
      );
    }
    const updated = await this.executeUpdateOne({
      collection: plan.collection,
      fields: plan.fields,
      filter: uniqueFilter(plan.by),
      values: plan.updateValues,
      ifVersion: plan.ifVersion,
      relations: plan.updateRelations,
      select: plan.select,
      scopeCheck: plan.updateScopeCheck,
      relationScopes: plan.updateRelationScopes,
    });
    if (updated === 'conflict') return updated;
    if (updated === 'missing' || updated === 'multiple') {
      throw new Error('Upsert target disappeared while updating.');
    }
    return updated;
  }

  async updateMany(
    plan: RepositoryUpdateManyPlan,
  ): Promise<RepositoryExecutedManyMutation> {
    if (
      plan.fields ||
      (await this.scopeCheckApplies(
        plan.collection,
        plan.scopeCheck,
        plan.values,
        undefined,
      ))
    ) {
      // A single UPDATE never learns which rows it touched, so judging them
      // afterwards means locking them first. Only a write that touches a
      // field the scope reads pays for that.
      return this.inTransaction((adapter) =>
        adapter.executeUpdateManyReturning(plan),
      );
    }
    const query = tableQuery(this.getClient(), plan.collection).update(
      mapUpdate(this.getClient(), plan.collection, plan.values),
    );
    if (plan.filter) {
      const graph = await this.prepareFilterGraph(
        plan.collection,
        plan.filter.root,
      );
      applyFilter(
        query,
        plan.collection,
        plan.filter.root,
        graph,
        tableName(plan.collection),
        this.getClient(),
      );
    }
    incrementVersion(query, plan.collection);
    return { count: affectedCount(await query) };
  }

  private async executeUpdateManyReturning(
    plan: RepositoryUpdateManyPlan,
  ): Promise<RepositoryExecutedManyMutation> {
    const fields = plan.fields;
    const selected = await this.lockManyByFilter(plan.collection, plan.filter);
    if (selected.length === 0)
      return fields ? { count: 0, records: [] } : { count: 0 };
    let count = 0;
    for (const batch of selectorBatches(selected.map((item) => item.unique))) {
      const query = tableQuery(this.getClient(), plan.collection).update(
        mapUpdate(this.getClient(), plan.collection, plan.values),
      );
      applySelectors(query, plan.collection, batch);
      incrementVersion(query, plan.collection);
      count += affectedCount(await query);
    }
    assertBulkMutationCount('updateMany', count, selected.length);
    if (
      plan.scopeCheck &&
      (await this.scopeCheckApplies(
        plan.collection,
        plan.scopeCheck,
        plan.values,
        undefined,
      ))
    ) {
      await this.assertWithinScope(
        plan.collection,
        selected.map((item) => item.unique),
        plan.scopeCheck,
        'update',
      );
    }
    if (!fields) return { count };
    const resultSelectors = selected.map((item) =>
      selectorFromFields(
        plan.collection,
        { ...item.record, ...plan.values },
        item.unique.fields,
      ),
    );
    const records = await this.findManyBySelectors(
      plan.collection,
      resultSelectors,
      fields,
      plan.select,
    );
    return { count, records };
  }

  async deleteOne(
    plan: RepositoryDeleteOnePlan,
  ): Promise<
    'deleted' | RepositoryDeletedMutation | RepositorySingleMutationMiss
  > {
    return this.inTransaction((adapter) => adapter.executeDeleteOne(plan));
  }

  private async executeDeleteOne(
    plan: RepositoryDeleteOnePlan,
  ): Promise<
    'deleted' | RepositoryDeletedMutation | RepositorySingleMutationMiss
  > {
    const selected = await this.lockByFilter(plan.collection, plan.filter);
    if (selected === 'missing' || selected === 'multiple') return selected;
    if (
      plan.ifVersion !== undefined &&
      versionOf(plan.collection, selected.record) !== plan.ifVersion
    ) {
      return 'conflict';
    }
    const snapshot = plan.fields
      ? await this.findOne({
          collection: plan.collection,
          fields: plan.fields,
          select: plan.select,
          filter: uniqueFilter(selected.unique),
        })
      : undefined;
    if (plan.fields && !snapshot) return 'missing';
    const query = tableQuery(this.getClient(), plan.collection).delete();
    applyUnique(query, plan.collection, selected.unique);
    applyVersion(query, plan.collection, plan.ifVersion);
    if (affectedCount(await query) > 0) {
      return snapshot ? { record: snapshot } : 'deleted';
    }
    return plan.ifVersion === undefined ? 'missing' : 'conflict';
  }

  async deleteMany(
    plan: RepositoryDeleteManyPlan,
  ): Promise<RepositoryExecutedManyMutation> {
    if (plan.fields) {
      return this.inTransaction((adapter) =>
        adapter.executeDeleteManyReturning(plan),
      );
    }
    const query = tableQuery(this.getClient(), plan.collection).delete();
    if (plan.filter) {
      const graph = await this.prepareFilterGraph(
        plan.collection,
        plan.filter.root,
      );
      applyFilter(
        query,
        plan.collection,
        plan.filter.root,
        graph,
        tableName(plan.collection),
        this.getClient(),
      );
    }
    return { count: affectedCount(await query) };
  }

  private async executeDeleteManyReturning(
    plan: RepositoryDeleteManyPlan,
  ): Promise<RepositoryExecutedManyMutation> {
    const fields = plan.fields;
    if (!fields) throw new Error('Returning deleteMany requires fields.');
    const selected = await this.lockManyByFilter(plan.collection, plan.filter);
    if (selected.length === 0) return { count: 0, records: [] };
    const selectors = selected.map((item) => item.unique);
    const records = await this.findManyBySelectors(
      plan.collection,
      selectors,
      fields,
      plan.select,
    );
    let count = 0;
    for (const batch of selectorBatches(selectors)) {
      const query = tableQuery(this.getClient(), plan.collection).delete();
      applySelectors(query, plan.collection, batch);
      count += affectedCount(await query);
    }
    if (
      count < selected.length &&
      !(await this.anySelectedRowRemains(plan.collection, selectors))
    ) {
      // A database cascade from an earlier batch removed rows a later batch
      // addressed; drivers do not count cascaded rows, but they are gone.
      count = selected.length;
    }
    assertBulkMutationCount('deleteMany', count, selected.length);
    return { count, records };
  }

  private async buildRead(
    plan: RepositoryReadPlan,
  ): Promise<{ readonly query: Knex.QueryBuilder }> {
    const client = this.getClient();
    const fields = await this.selectionFields(
      plan.collection,
      plan.fields,
      plan.select?.root,
    );
    const alias = 'repository_root';
    if (plan.distinct) {
      return this.buildDistinctRead(plan, fields, alias);
    }
    const query = tableQuery(client, plan.collection, alias).select(
      fields.map((field) =>
        selectColumn(client, plan.collection, field, alias),
      ),
    );
    const graph = await this.prepareFilterGraph(
      plan.collection,
      plan.filter?.root,
    );
    applyFilter(
      query,
      plan.collection,
      plan.filter?.root,
      graph,
      alias,
      client,
    );
    applyCursor(
      query,
      cursorForDirection(plan.cursor, plan.direction),
      (field) => qualified(alias, column(plan.collection, field)),
      (field, value) => bindQueryValue(query, plan.collection, field, value),
    );
    for (const item of plan.sort?.items ?? []) {
      await this.applySort(
        query,
        plan.collection,
        sortForDirection(item, plan.direction),
        alias,
      );
    }
    if (plan.limit !== undefined) query.limit(plan.limit);
    if (plan.offset !== undefined) query.offset(plan.offset);
    return { query };
  }

  private async buildDistinctRead(
    plan: RepositoryReadPlan,
    fields: readonly SelectionColumn[],
    rootAlias: string,
  ): Promise<{ readonly query: Knex.QueryBuilder }> {
    const distinct = plan.distinct;
    if (!distinct) throw new Error('Distinct read requires distinct Fields.');
    const sort = plan.sort?.items ?? [];
    if (sort.length === 0) throw new Error('Distinct read requires sort.');
    const client = this.getClient();
    const usedAliases = new Set(fields.map((field) => field.alias));
    const sortFields = sort.map((item, index) => {
      if (item.kind !== 'field' || item.path.length !== 1) {
        throw new Error('Distinct read requires direct Field sort.');
      }
      const alias = unusedInternalAlias(usedAliases, `_distinct_sort_${index}`);
      return {
        field: item.path[0],
        alias,
        column: qualified(rootAlias, column(plan.collection, item.path[0])),
        direction: item.direction,
        nulls: item.nulls ?? 'last',
      };
    });
    const rankAlias = unusedInternalAlias(usedAliases, '_distinct_rank');
    const partitionSql = distinct.map(() => '??').join(', ');
    const orderSql = sortFields
      .map(
        (field) =>
          `case when ?? is null then ${field.nulls === 'last' ? 1 : 0} else ${
            field.nulls === 'last' ? 0 : 1
          } end asc, ?? ${field.direction}`,
      )
      .join(', ');
    const rankBindings = [
      ...distinct.map((field) =>
        qualified(rootAlias, column(plan.collection, field)),
      ),
      ...sortFields.flatMap((field) => [field.column, field.column]),
      rankAlias,
    ];
    const inner = tableQuery(client, plan.collection, rootAlias).select([
      ...fields.map((field) =>
        selectColumn(client, plan.collection, field, rootAlias),
      ),
      ...sortFields.map((field) => client.ref(field.column).as(field.alias)),
      client.raw(
        `row_number() over (partition by ${partitionSql} order by ${orderSql}) as ??`,
        rankBindings,
      ),
    ]);
    const graph = await this.prepareFilterGraph(
      plan.collection,
      plan.filter?.root,
    );
    applyFilter(
      inner,
      plan.collection,
      plan.filter?.root,
      graph,
      rootAlias,
      client,
    );

    const resultAlias = 'repository_distinct';
    const query = client
      .queryBuilder()
      .from(inner.as(resultAlias))
      .select(
        fields.map((field) =>
          client.ref(field.alias).withSchema(resultAlias).as(field.alias),
        ),
      )
      .where(qualified(resultAlias, rankAlias), 1);
    const sortAliasByField = new Map(
      sortFields.map((field) => [field.field, field.alias]),
    );
    applyCursor(
      query,
      cursorForDirection(plan.cursor, plan.direction),
      (field) => {
        const internal = sortAliasByField.get(field);
        if (!internal) throw new Error('Distinct cursor Field was not mapped.');
        return qualified(resultAlias, internal);
      },
      (field, value) => bindQueryValue(query, plan.collection, field, value),
    );
    for (const field of sortFields) {
      applyOrderBy(
        query,
        client,
        qualified(resultAlias, field.alias),
        plan.direction === 'backward'
          ? reverseDirection(field.direction)
          : field.direction,
        plan.direction === 'backward'
          ? field.nulls === 'first'
            ? 'last'
            : 'first'
          : field.nulls,
      );
    }
    if (plan.limit !== undefined) query.limit(plan.limit);
    if (plan.offset !== undefined) query.offset(plan.offset);
    return { query };
  }

  private async findByUnique(
    collection: CollectionDefinition,
    unique: UniqueSelector,
    scope?: FilterAst,
  ): Promise<RepositoryRecord | undefined> {
    return this.findOne({
      collection,
      fields: scalarFields(collection).map((field) => field.name),
      filter: withRelationScope(uniqueFilter(unique), scope),
    });
  }

  /**
   * Assert that the records named by `selectors` satisfy the scope, and roll
   * the transaction back with SCOPE_VIOLATION if any of them does not.
   *
   * The check is a statement rather than an in-memory comparison so that it
   * agrees with the WHERE clause that selected the row by construction —
   * same collation, same NULL semantics, same numeric and temporal handling.
   */
  private async assertWithinScope(
    collection: CollectionDefinition,
    selectors: readonly UniqueSelector[],
    check: RepositoryScopeCheck,
    operation: 'create' | 'update',
  ): Promise<void> {
    if (selectors.length === 0) return;
    const client = this.getClient();
    const alias = 'repository_scope';
    const graph = await this.prepareFilterGraph(collection, check.scope.root);
    let within = 0;
    for (const batch of selectorBatches(selectors)) {
      const query = tableQuery(client, collection, alias).select(
        selectColumn(
          client,
          collection,
          {
            column: column(collection, batch[0].fields[0]),
            alias: 'id',
          },
          alias,
        ),
      );
      applySelectors(query, collection, batch);
      applyFilter(query, collection, check.scope.root, graph, alias, client);
      within += ((await query) as RepositoryRecord[]).length;
    }
    if (within === selectors.length) return;
    throw new RepositoryError(
      'SCOPE_VIOLATION',
      `The written record does not satisfy ${operation}.scope.`,
      {
        collection: collection.name,
        path: [operation === 'create' ? 'values' : 'values'],
        details: {
          scopeFields: [...check.fields],
          hint: 'The submitted values put the record outside the scope this operation allows. If the change is legitimate, widen the policy scope rather than editing the values.',
        },
      },
    );
  }

  /**
   * Whether this write could move a record out of the scope.
   *
   * The submitted values are not the only way a root column changes: a to-one
   * relation stores its foreign key on the root table, so `owner.connect`
   * writes `ownerId` without ever naming it. Missing that was how a relation
   * operation could carry a record out of its own tenant and commit.
   */
  private async scopeCheckApplies(
    collection: CollectionDefinition,
    check: RepositoryScopeCheck | undefined,
    values: RepositoryRecord,
    relations: RelationMutationAst | undefined,
  ): Promise<boolean> {
    if (!check) return false;
    if (check.fields.some((field) => Object.hasOwn(values, field))) return true;
    for (const node of relations?.items ?? []) {
      const resolved = await this.resolveRelation(collection, node.field);
      if (resolved.type !== 'belongsTo') continue;
      const foreignKey = resolved.relation.foreignKey;
      if (foreignKey && check.fields.includes(foreignKey)) return true;
    }
    return false;
  }

  /**
   * An upsert whose target exists but lies outside the update scope raises
   * RECORD_OUTSIDE_SCOPE rather than falling back to an insert.
   *
   * This is the one place a policy deliberately tells forbidden and absent
   * apart, and it costs nothing: an insert would collide with the very unique
   * constraint that located the row, so "this key is taken" leaks either way —
   * the fallback would only report it as a confusing duplicate key error. A
   * caller who must not learn that a key is taken should not be using upsert.
   */
  private async assertUpsertTargetInScope(
    collection: CollectionDefinition,
    by: UniqueSelector,
    check: RepositoryScopeCheck,
  ): Promise<void> {
    const client = this.getClient();
    const alias = 'repository_scope';
    const query = tableQuery(client, collection, alias).select(
      selectColumn(
        client,
        collection,
        { column: column(collection, by.fields[0]), alias: 'id' },
        alias,
      ),
    );
    applySelectors(query, collection, [by]);
    const graph = await this.prepareFilterGraph(collection, check.scope.root);
    applyFilter(query, collection, check.scope.root, graph, alias, client);
    const rows = (await query) as RepositoryRecord[];
    if (rows.length > 0) return;
    throw new RepositoryError(
      'RECORD_OUTSIDE_SCOPE',
      'The upsert target exists but lies outside update.scope.',
      { collection: collection.name, path: ['filter'] },
    );
  }

  private async lockByUnique(
    collection: CollectionDefinition,
    unique: UniqueSelector,
  ): Promise<LockedMutationRecord | 'missing'> {
    const fields = scalarFields(collection).map((field) => field.name);
    const query = tableQuery(this.getClient(), collection).select(
      fields.map((field) =>
        selectColumn(this.getClient(), collection, {
          column: column(collection, field),
          alias: field,
        }),
      ),
    );
    applyUnique(query, collection, unique);
    query.forUpdate();
    const rows = (await query) as RepositoryRecord[];
    return rows[0]
      ? {
          record: decodeBooleanRow(
            collection,
            rows[0],
            this.runtime?.repository?.jsonResults,
          ),
          unique,
        }
      : 'missing';
  }

  private async lockByFilter(
    collection: CollectionDefinition,
    filter: FilterAst,
  ): Promise<LockedMutationRecord | 'missing' | 'multiple'> {
    const client = this.getClient();
    const alias = 'repository_root';
    const fields = scalarFields(collection).map((field) => field.name);
    const query = tableQuery(client, collection, alias).select(
      fields.map((field) =>
        selectColumn(
          client,
          collection,
          { column: column(collection, field), alias: field },
          alias,
        ),
      ),
    );
    const graph = await this.prepareFilterGraph(collection, filter.root);
    applyFilter(query, collection, filter.root, graph, alias, client);
    limitLockedQuery(query, client);
    const rows = (await query) as RepositoryRecord[];
    if (rows.length === 0) return 'missing';
    if (rows.length > 1) return 'multiple';
    const record = decodeBooleanRow(
      collection,
      rows[0],
      this.runtime?.repository?.jsonResults,
    );
    return { record, unique: selectorFromRecord(collection, record) };
  }

  private async lockManyByFilter(
    collection: CollectionDefinition,
    filter: FilterAst | undefined,
  ): Promise<LockedMutationRecord[]> {
    const client = this.getClient();
    const alias = 'repository_root';
    const fields = scalarFields(collection).map((field) => field.name);
    const query = tableQuery(client, collection, alias).select(
      fields.map((field) =>
        selectColumn(
          client,
          collection,
          { column: column(collection, field), alias: field },
          alias,
        ),
      ),
    );
    if (filter) {
      const graph = await this.prepareFilterGraph(collection, filter.root);
      applyFilter(query, collection, filter.root, graph, alias, client);
    }
    for (const field of stableIdentityFields(collection)) {
      query.orderBy(column(collection, field), 'asc');
    }
    query.forUpdate();
    const rows = (await query) as RepositoryRecord[];
    return rows
      .map((row) =>
        decodeBooleanRow(
          collection,
          row,
          this.runtime?.repository?.jsonResults,
        ),
      )
      .map((record) => ({
        record,
        unique: selectorFromFields(
          collection,
          record,
          stableIdentityFields(collection),
        ),
      }));
  }

  private async anySelectedRowRemains(
    collection: CollectionDefinition,
    selectors: readonly UniqueSelector[],
  ): Promise<boolean> {
    for (const batch of selectorBatches(selectors)) {
      const query = tableQuery(this.getClient(), collection).select(
        column(collection, batch[0].fields[0]),
      );
      applySelectors(query, collection, batch);
      if (await query.first()) return true;
    }
    return false;
  }

  private async findManyBySelectors(
    collection: CollectionDefinition,
    selectors: readonly UniqueSelector[],
    fields: readonly string[],
    select: SelectAst | undefined,
  ): Promise<RepositoryRecord[]> {
    if (selectors.length === 0) return [];
    const records: RepositoryRecord[] = [];
    for (const batch of selectorBatches(selectors)) {
      records.push(
        ...(await this.findMany({
          collection,
          fields,
          select,
          filter: selectorsFilter(batch),
          sort: {
            kind: 'sort',
            version: 1,
            items: stableIdentityFields(collection).map((field) => ({
              kind: 'field',
              path: [field],
              direction: 'asc',
            })),
          },
        })),
      );
    }
    const identityFields = selectors[0]?.fields;
    if (!identityFields) return [];
    const recordsBySelector = new Map(
      records.map((record) => [
        selectorKey(selectorFromFields(collection, record, identityFields)),
        record,
      ]),
    );
    const ordered = selectors.map((selector) =>
      recordsBySelector.get(selectorKey(selector)),
    );
    if (ordered.some((record) => record === undefined)) {
      throw new Error('Bulk mutation record could not be reloaded.');
    }
    return ordered as RepositoryRecord[];
  }

  private async createRecord(
    collection: CollectionDefinition,
    input: RepositoryRecord,
    relations: RelationMutationAst | undefined,
    createdTargets: CreatedTargetReference[],
    clientKey?: string,
    additionalPhysicalValues: PhysicalWriteRecord = {},
    scopes?: Readonly<Record<string, RelationScopeNode>>,
  ): Promise<{ record: RepositoryRecord; unique: UniqueSelector }> {
    const values = withInitialVersion(collection, input);
    const physicalValues = {
      ...mapWrite(this.getClient(), collection, values),
      ...additionalPhysicalValues,
    };
    const deferred: RelationMutationNode[] = [];
    for (const node of relations?.items ?? []) {
      const resolved = await this.resolveRelation(collection, node.field);
      if (resolved.type === 'belongsTo' && node.action === 'set') {
        const target = await this.resolveMutationTarget(
          resolved.target,
          node.target,
          createdTargets,
          undefined,
          undefined,
          scopes?.[node.field],
        );
        physicalValues[resolved.sourceColumn] = relationKeyValue(
          this.getClient(),
          resolved.target,
          resolved.targetKey,
          target.record[resolved.targetKey],
        );
      } else {
        deferred.push(node);
      }
    }
    const record = await this.insertRecord(collection, values, physicalValues);
    const unique = selectorFromRecord(collection, record);
    if (clientKey) {
      createdTargets.push({ clientKey, collection: collection.name!, unique });
    }
    if (deferred.length > 0) {
      await this.applyRelationMutations(
        collection,
        record,
        unique,
        {
          kind: 'relationMutation',
          version: 1,
          collection: collection.name,
          items: deferred,
        },
        createdTargets,
        scopes,
      );
    }
    return { record, unique };
  }

  private async insertRecord(
    collection: CollectionDefinition,
    values: RepositoryRecord,
    physicalValues: PhysicalWriteRecord = mapWrite(
      this.getClient(),
      collection,
      withInitialVersion(collection, values),
    ),
  ): Promise<RepositoryRecord> {
    const fields = scalarFields(collection).map((field) => field.name);
    const client = this.getClient();
    if (Object.keys(physicalValues).length === 0) {
      physicalValues =
        getDatabaseDriverRuntime(client)?.repository?.emptyInsertValue?.({
          client,
          collection,
          column: (field) => column(collection, field),
        }) ?? physicalValues;
    }
    const query = tableQuery(client, collection).insert(physicalValues);
    const returned = (await query.returning(
      fields.map((field) => column(collection, field)),
    )) as unknown;
    const returnedRow = firstReturnedRow(returned);
    if (returnedRow) {
      const repositoryRuntime = getDatabaseDriverRuntime(client)?.repository;
      const decodedReturnedRow = repositoryRuntime?.decodeReturnedRow
        ? await repositoryRuntime.decodeReturnedRow(returnedRow)
        : returnedRow;
      if (
        (repositoryRuntime?.reloadReturnedDecimal ||
          repositoryRuntime?.reloadReturnedExactNumeric) &&
        scalarFields(collection).some((field) =>
          repositoryRuntime?.reloadReturnedExactNumeric
            ? ['bigInt', 'decimal'].includes(field.type)
            : field.type === 'decimal',
        )
      ) {
        const returnedValues = Object.fromEntries(
          fields.map((field) => [
            field,
            decodedReturnedRow[column(collection, field)] ??
              decodedReturnedRow[field],
          ]),
        );
        const selector = deriveCreatedSelector(
          collection,
          { ...returnedValues, ...values },
          returned,
        );
        const record = await this.findByUnique(collection, selector);
        if (!record) throw new Error('Created record could not be reloaded.');
        return record;
      }
      const mapped = mapRow(
        collection,
        fields,
        decodedReturnedRow,
        this.runtime?.repository?.jsonResults,
      );
      // Supplied temporal identities are already canonical; raw RETURNING values
      // may have been converted to a host-zone Date by the driver.
      for (const field of scalarFields(collection)) {
        if (isTemporalType(field.type) && Object.hasOwn(values, field.name))
          mapped[field.name] = values[field.name];
      }
      return mapped;
    }
    const selector = deriveCreatedSelector(collection, values, returned);
    const record = await this.findOne({
      collection,
      fields,
      filter: uniqueFilter(selector),
    });
    if (!record)
      throw new Error('Created Repository record could not be reloaded.');
    return record;
  }

  private async applyRelationMutations(
    collection: CollectionDefinition,
    source: RepositoryRecord,
    sourceUnique: UniqueSelector,
    mutations: RelationMutationAst,
    createdTargets: CreatedTargetReference[],
    scopes?: Readonly<Record<string, RelationScopeNode>>,
  ): Promise<void> {
    for (const node of mutations.items) {
      const resolved = await this.resolveRelation(collection, node.field);
      await this.applyRelationMutation(
        resolved,
        source,
        sourceUnique,
        node,
        createdTargets,
        scopes?.[node.field],
      );
    }
  }

  private async applyRelationMutation(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    sourceUnique: UniqueSelector,
    node: RelationMutationNode,
    createdTargets: CreatedTargetReference[],
    scopeNode?: RelationScopeNode,
  ): Promise<void> {
    if (node.action === 'set') {
      if (resolved.type === 'hasOne' && node.target.kind === 'create') {
        // The new target is inserted already pointing at the source, so the
        // current one has to let go first; a unique foreign key would
        // otherwise reject the insert.
        await this.detachCurrentHasOneTarget(
          resolved,
          source[resolved.sourceKey],
          scopeNode?.scope,
        );
      }
      const target = await this.resolveMutationTarget(
        resolved.target,
        node.target,
        createdTargets,
        resolved,
        source,
        scopeNode,
      );
      await this.connectRelation(
        resolved,
        source,
        sourceUnique,
        target.record,
        undefined,
        scopeNode?.scope,
      );
      return;
    }
    if (node.action === 'clear') {
      await this.clearRelation(
        resolved,
        source,
        sourceUnique,
        scopeNode?.scope,
      );
      return;
    }
    if (node.action === 'modify') {
      if (node.update) {
        await this.updateRelatedTarget(
          resolved,
          source,
          node.update,
          createdTargets,
          scopeNode,
        );
      } else if (node.upsert) {
        await this.upsertRelatedTarget(
          resolved,
          source,
          sourceUnique,
          node.upsert,
          createdTargets,
          scopeNode,
        );
      } else if (node.delete) {
        await this.deleteRelatedTarget(
          resolved,
          source,
          sourceUnique,
          node.delete,
          scopeNode,
        );
      }
      return;
    }
    const connect =
      node.action === 'patch' ? (node.connect ?? []) : node.targets;
    const create = node.action === 'patch' ? (node.create ?? []) : [];
    const desired: Array<{
      record: RepositoryRecord;
      unique: UniqueSelector;
      through?: RepositoryRecord;
    }> = [];
    for (const target of [...connect, ...create]) {
      desired.push({
        ...(await this.resolveMutationTarget(
          resolved.target,
          target,
          createdTargets,
          resolved,
          source,
          scopeNode,
        )),
        through: target.through,
      });
    }
    if (node.action === 'replace') {
      await this.replaceRelation(
        resolved,
        source,
        sourceUnique,
        desired,
        scopeNode?.scope,
      );
      return;
    }
    for (const target of desired) {
      await this.connectRelation(
        resolved,
        source,
        sourceUnique,
        target.record,
        target.through,
      );
    }
    for (const selector of node.disconnect ?? []) {
      const target = await this.findTarget(
        resolved.target,
        selector,
        scopeNode?.scope,
      );
      await this.disconnectRelation(resolved, source, sourceUnique, target);
    }
    for (const target of node.update ?? []) {
      await this.updateRelatedTarget(
        resolved,
        source,
        target,
        createdTargets,
        scopeNode,
      );
    }
    for (const target of node.upsert ?? []) {
      await this.upsertRelatedTarget(
        resolved,
        source,
        sourceUnique,
        target,
        createdTargets,
        scopeNode,
      );
    }
    for (const target of node.delete ?? []) {
      await this.deleteRelatedTarget(
        resolved,
        source,
        sourceUnique,
        target,
        scopeNode,
      );
    }
  }

  private async updateRelatedTarget(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    target: RelationUpdateTarget,
    createdTargets: CreatedTargetReference[],
    scopeNode?: RelationScopeNode,
  ): Promise<void> {
    const selected = await this.lockRelatedTarget(
      resolved,
      source,
      target.filter,
      scopeNode?.scope,
    );
    if (selected === 'missing') relationTargetNotFound(resolved);
    if (selected === 'multiple') multipleRelationTargetsMatched(resolved);
    await this.updateTargetRecord(
      resolved.target,
      selected,
      target,
      createdTargets,
      scopeNode?.relations,
      scopeNode?.scope,
    );
  }

  private async upsertRelatedTarget(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    sourceUnique: UniqueSelector,
    target: RelationUpsertTarget,
    createdTargets: CreatedTargetReference[],
    scopeNode?: RelationScopeNode,
  ): Promise<void> {
    const selected = await this.lockRelatedTarget(
      resolved,
      source,
      target.filter,
      scopeNode?.scope,
    );
    if (selected === 'multiple') multipleRelationTargetsMatched(resolved);
    if (selected !== 'missing') {
      await this.updateTargetRecord(
        resolved.target,
        selected,
        target.update,
        createdTargets,
        scopeNode?.relations,
        scopeNode?.scope,
      );
      return;
    }
    if (
      target.by &&
      (await this.lockByUnique(resolved.target, target.by)) !== 'missing'
    ) {
      throw new RepositoryError(
        'RELATION_UPSERT_TARGET_OUTSIDE_SCOPE',
        'Relation upsert target exists outside the current relation scope.',
        {
          collection: resolved.source.name,
          relation: resolved.relation.name,
        },
      );
    }
    const created = await this.resolveMutationTarget(
      resolved.target,
      target.create,
      createdTargets,
      resolved,
      source,
      scopeNode,
    );
    await this.connectRelation(
      resolved,
      source,
      sourceUnique,
      created.record,
      undefined,
      scopeNode?.scope,
    );
  }

  private async deleteRelatedTarget(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    sourceUnique: UniqueSelector,
    target: RelationDeleteTarget,
    scopeNode?: RelationScopeNode,
  ): Promise<void> {
    const selected = await this.lockRelatedTarget(
      resolved,
      source,
      target.filter,
      scopeNode?.scope,
    );
    if (selected === 'missing') relationTargetNotFound(resolved);
    if (selected === 'multiple') multipleRelationTargetsMatched(resolved);
    await this.removeTargetEdgesForDelete(
      resolved,
      sourceUnique,
      selected.record,
    );
    const query = tableQuery(this.getClient(), resolved.target).delete();
    applyUnique(query, resolved.target, selected.unique);
    if (affectedCount(await query) === 0) relationTargetNotFound(resolved);
  }

  private async removeTargetEdgesForDelete(
    resolved: ResolvedRepositoryRelation,
    sourceUnique: UniqueSelector,
    target: RepositoryRecord,
  ): Promise<void> {
    if (resolved.type === 'belongsTo') {
      if (resolved.relation.nullable === false) {
        relationActionNotAllowed(resolved, 'delete');
      }
      const query = tableQuery(this.getClient(), resolved.source).update({
        [resolved.sourceColumn]: null,
      });
      applyUnique(query, resolved.source, sourceUnique);
      await query;
      return;
    }
    if (resolved.type === 'belongsToMany') {
      await tableQuery(this.getClient(), resolved.through)
        .where(
          column(resolved.through, resolved.throughTargetForeignKey),
          relationKeyValue(
            this.getClient(),
            resolved.target,
            resolved.targetKey,
            target[resolved.targetKey],
          ),
        )
        .delete();
    }
  }

  private async updateTargetRecord(
    collection: CollectionDefinition,
    selected: LockedMutationRecord,
    target: RelationUpdateTarget,
    createdTargets: CreatedTargetReference[],
    scopes?: Readonly<Record<string, RelationScopeNode>>,
    scope?: FilterAst,
  ): Promise<void> {
    if (Object.keys(target.values).length > 0) {
      const query = tableQuery(this.getClient(), collection).update(
        mapUpdate(
          this.getClient(),
          collection,
          target.values as RepositoryRecord,
        ),
      );
      applyUnique(query, collection, selected.unique);
      if (affectedCount(await query) === 0) {
        throw new RepositoryError(
          'RELATION_TARGET_NOT_FOUND',
          'Relation target was not found while updating.',
          { collection: collection.name },
        );
      }
      Object.assign(
        selected.record,
        await this.refreshAtomicValues(
          collection,
          selected.unique,
          target.values as RepositoryRecord,
        ),
      );
    }
    if (target.relations) {
      await this.applyRelationMutations(
        collection,
        selected.record,
        selected.unique,
        target.relations,
        createdTargets,
        scopes,
      );
    }
    if (collection.optimisticLock) {
      const versionQuery = tableQuery(this.getClient(), collection);
      applyUnique(versionQuery, collection, selected.unique);
      incrementVersion(versionQuery, collection);
      await versionQuery;
    }
    // Invariant 2 applies to a relation target too: locating it inside the
    // scope says nothing about where the submitted values leave it.
    if (scope) {
      await this.assertWithinScope(
        collection,
        [selected.unique],
        { scope, fields: [] },
        'update',
      );
    }
  }

  private async refreshAtomicValues(
    collection: CollectionDefinition,
    unique: UniqueSelector,
    values: RepositoryRecord,
  ): Promise<RepositoryRecord> {
    if (!Object.values(values).some(isNumericMutation)) return values;
    const record = await this.findOne({
      collection,
      fields: scalarFields(collection).map((field) => field.name),
      filter: uniqueFilter(unique),
    });
    if (!record) throw new Error('Atomic update target disappeared.');
    return record;
  }

  private async lockRelatedTarget(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    callerFilter: FilterAst | undefined,
    scope?: FilterAst,
  ): Promise<LockedMutationRecord | 'missing' | 'multiple'> {
    const filter = withRelationScope(callerFilter, scope);
    const client = this.getClient();
    const targetAlias = 'repository_relation_target';
    const fields = scalarFields(resolved.target).map((field) => field.name);
    const query = tableQuery(client, resolved.target, targetAlias).select(
      fields.map((field) =>
        client
          .ref(column(resolved.target, field))
          .withSchema(targetAlias)
          .as(field),
      ),
    );
    if (resolved.type === 'belongsTo') {
      const sourceQuery = tableQuery(client, resolved.source).select(
        resolved.sourceColumn,
      );
      applyUnique(
        sourceQuery,
        resolved.source,
        selectorFromRecord(resolved.source, source),
      );
      query.whereIn(
        qualified(targetAlias, column(resolved.target, resolved.targetKey)),
        sourceQuery,
      );
    } else if (resolved.type === 'hasOne' || resolved.type === 'hasMany') {
      query.where(
        qualified(
          targetAlias,
          column(resolved.target, resolved.targetForeignKey),
        ),
        relationKeyValue(
          this.getClient(),
          resolved.source,
          resolved.sourceKey,
          source[resolved.sourceKey],
        ),
      );
    } else {
      const throughAlias = 'repository_relation_through';
      const linkedTargets = tableQuery(client, resolved.through, throughAlias)
        .select(column(resolved.through, resolved.throughTargetForeignKey))
        .where(
          qualified(
            throughAlias,
            column(resolved.through, resolved.throughSourceForeignKey),
          ),
          relationKeyValue(
            this.getClient(),
            resolved.source,
            resolved.sourceKey,
            source[resolved.sourceKey],
          ),
        );
      query.whereIn(
        qualified(targetAlias, column(resolved.target, resolved.targetKey)),
        linkedTargets,
      );
    }
    const graph = await this.prepareFilterGraph(resolved.target, filter?.root);
    applyFilter(
      query,
      resolved.target,
      filter?.root,
      graph,
      targetAlias,
      client,
    );
    limitLockedQuery(query, client);
    const rows = (await query) as RepositoryRecord[];
    if (rows.length === 0) return 'missing';
    if (rows.length > 1) return 'multiple';
    const record = decodeBooleanRow(
      resolved.target,
      rows[0],
      this.runtime?.repository?.jsonResults,
    );
    return { record, unique: selectorFromRecord(resolved.target, record) };
  }

  private async resolveMutationTarget(
    collection: CollectionDefinition,
    target: ConnectTarget | CreateTarget,
    createdTargets: CreatedTargetReference[],
    resolved?: ResolvedRepositoryRelation,
    source?: RepositoryRecord,
    scopeNode?: RelationScopeNode,
  ): Promise<{ record: RepositoryRecord; unique: UniqueSelector }> {
    if (target.kind === 'create') {
      const additionalPhysicalValues: PhysicalWriteRecord = {};
      if (
        source &&
        resolved &&
        (resolved.type === 'hasOne' || resolved.type === 'hasMany')
      ) {
        additionalPhysicalValues[
          column(collection, resolved.targetForeignKey)
        ] = relationKeyValue(
          this.getClient(),
          resolved.source,
          resolved.sourceKey,
          source[resolved.sourceKey],
        );
      }
      // A created target belongs to whoever it is being attached to, so the
      // scope does not constrain it; its own relations still do.
      return this.createRecord(
        collection,
        target.values as RepositoryRecord,
        target.relations,
        createdTargets,
        target.clientKey,
        additionalPhysicalValues,
        scopeNode?.relations,
      );
    }
    return {
      record: await this.findTarget(collection, target.by, scopeNode?.scope),
      unique: target.by,
    };
  }

  private async findTarget(
    collection: CollectionDefinition,
    unique: UniqueSelector,
    scope?: FilterAst,
  ): Promise<RepositoryRecord> {
    // A target outside the scope raises the same error as one that does not
    // exist. Telling them apart would let a caller probe another tenant's
    // keys through a relation, which is the leak the root scope closes.
    const target = await this.findByUnique(collection, unique, scope);
    if (!target) {
      throw new RepositoryError(
        'RECORD_NOT_FOUND',
        'Relation target was not found.',
        {
          collection: collection.name,
        },
      );
    }
    return target;
  }

  /**
   * A hasOne source holds one target. Attaching another first lets go of the
   * current one, which needs a nullable foreign key; `keep` is the target
   * being attached, when it already exists.
   *
   * Letting go is still reaching for a row, so the relation scope has to
   * locate the current target as it does for every other relation write. A
   * current target the scope cannot see is not detached, and since the new
   * one cannot be attached while it stays, the write is refused.
   */
  private async detachCurrentHasOneTarget(
    resolved: Extract<ResolvedRepositoryRelation, { readonly type: 'hasOne' }>,
    sourceValue: unknown,
    scope: FilterAst | undefined,
    keep?: UniqueSelector,
  ): Promise<void> {
    const existing = tableQuery(this.getClient(), resolved.target).where(
      column(resolved.target, resolved.targetForeignKey),
      relationKeyValue(
        this.getClient(),
        resolved.source,
        resolved.sourceKey,
        sourceValue,
      ),
    );
    if (keep) {
      existing.whereNot((query) => applyUnique(query, resolved.target, keep));
    }
    if (!(await existing.clone().first())) return;
    if (!relationForeignKeyNullable(resolved)) {
      relationActionNotAllowed(resolved, 'set');
    }
    await this.applyRelationScope(existing, resolved.target, scope);
    const detached = affectedCount(
      await existing.update({
        [column(resolved.target, resolved.targetForeignKey)]: null,
      }),
    );
    if (detached === 0) relationTargetNotFound(resolved);
  }

  private async connectRelation(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    sourceUnique: UniqueSelector,
    target: RepositoryRecord,
    through?: RepositoryRecord,
    scope?: FilterAst,
  ): Promise<void> {
    if (resolved.type === 'belongsTo') {
      const query = tableQuery(this.getClient(), resolved.source).update({
        [resolved.sourceColumn]: relationKeyValue(
          this.getClient(),
          resolved.target,
          resolved.targetKey,
          target[resolved.targetKey],
        ),
      });
      applyUnique(query, resolved.source, sourceUnique);
      await query;
      return;
    }
    if (resolved.type === 'hasOne' || resolved.type === 'hasMany') {
      const sourceValue = source[resolved.sourceKey];
      const targetUnique = selectorFromRecord(resolved.target, target);
      const current = target[resolved.targetForeignKey];
      if (
        current !== null &&
        current !== undefined &&
        associationKey(current) !== associationKey(sourceValue)
      ) {
        throw new RepositoryError(
          'RELATION_REASSIGNMENT_REQUIRED',
          'Relation target already belongs to another source record.',
          {
            collection: resolved.source.name,
            relation: resolved.relation.name,
          },
        );
      }
      if (resolved.type === 'hasOne') {
        await this.detachCurrentHasOneTarget(
          resolved,
          sourceValue,
          scope,
          targetUnique,
        );
      }
      const query = tableQuery(this.getClient(), resolved.target);
      applyUnique(query, resolved.target, targetUnique);
      await query.update({
        [column(resolved.target, resolved.targetForeignKey)]: relationKeyValue(
          this.getClient(),
          resolved.source,
          resolved.sourceKey,
          sourceValue,
        ),
      });
      return;
    }
    const edge = {
      [column(resolved.through, resolved.throughSourceForeignKey)]:
        relationKeyValue(
          this.getClient(),
          resolved.source,
          resolved.sourceKey,
          source[resolved.sourceKey],
        ),
      [column(resolved.through, resolved.throughTargetForeignKey)]:
        relationKeyValue(
          this.getClient(),
          resolved.target,
          resolved.targetKey,
          target[resolved.targetKey],
        ),
    };
    const exists = await tableQuery(this.getClient(), resolved.through)
      .where(edge)
      .first();
    if (!exists) {
      const values = withInitialVersion(resolved.through, through ?? {});
      for (const field of scalarFields(resolved.through)) {
        if (
          field.name === resolved.throughSourceForeignKey ||
          field.name === resolved.throughTargetForeignKey ||
          field.nullable !== false ||
          field.defaultValue !== undefined ||
          field.type === 'increments' ||
          field.autoIncrement ||
          field.db?.generated !== undefined
        )
          continue;
        if (values[field.name] === undefined || values[field.name] === null)
          throw new RepositoryError(
            'INVALID_MUTATION',
            `Through Field "${field.name}" is required for a new relationship.`,
            {
              field: field.name,
              collection: resolved.through.name,
              relation: resolved.relation.name,
            },
          );
      }
      await tableQuery(this.getClient(), resolved.through).insert({
        ...mapWrite(this.getClient(), resolved.through, values),
        ...edge,
      });
    } else if (through && Object.keys(through).length > 0) {
      const changes: Record<string, RepositoryRecord[string] | Knex.Raw> =
        mapWrite(this.getClient(), resolved.through, through);
      const version = resolved.through.optimisticLock?.field;
      if (version)
        changes[column(resolved.through, version)] = this.getClient().raw(
          '?? + 1',
          [column(resolved.through, version)],
        );
      await tableQuery(this.getClient(), resolved.through)
        .where(edge)
        .update(changes);
    }
  }

  private async clearRelation(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    sourceUnique: UniqueSelector,
    scope?: FilterAst,
  ): Promise<void> {
    if (resolved.type === 'belongsTo') {
      if (resolved.relation.nullable === false)
        relationActionNotAllowed(resolved, 'clear');
      // Detaching is still reaching for a row. A target the relation scope
      // cannot locate raises the same error as one that is not there, so a
      // caller cannot learn what they are attached to by trying to let go.
      const foreignKey = resolved.relation.foreignKey;
      const attached = foreignKey ? source[foreignKey] : undefined;
      if (scope && attached !== null && attached !== undefined) {
        await this.findTarget(
          resolved.target,
          {
            kind: 'unique',
            fields: [resolved.targetKey],
            values: { [resolved.targetKey]: attached },
          },
          scope,
        );
      }
      const query = tableQuery(this.getClient(), resolved.source).update({
        [resolved.sourceColumn]: null,
      });
      applyUnique(query, resolved.source, sourceUnique);
      await query;
      return;
    }
    if (resolved.type !== 'hasOne') relationActionNotAllowed(resolved, 'clear');
    if (!relationForeignKeyNullable(resolved))
      relationActionNotAllowed(resolved, 'clear');
    const clearQuery = tableQuery(this.getClient(), resolved.target).where(
      column(resolved.target, resolved.targetForeignKey),
      relationKeyValue(
        this.getClient(),
        resolved.source,
        resolved.sourceKey,
        source[resolved.sourceKey],
      ),
    );
    // Only the rows the relation scope can locate are detached; one it cannot
    // see stays attached rather than being silently let go.
    await this.applyRelationScope(clearQuery, resolved.target, scope);
    await clearQuery.update({
      [column(resolved.target, resolved.targetForeignKey)]: null,
    });
  }

  /** Narrow a relation query by the Policy scope that governs its target. */
  private async applyRelationScope(
    query: Knex.QueryBuilder,
    target: CollectionDefinition,
    scope: FilterAst | undefined,
  ): Promise<void> {
    if (!scope) return;
    const graph = await this.prepareFilterGraph(target, scope.root);
    applyFilter(
      query,
      target,
      scope.root,
      graph,
      tableName(target),
      this.getClient(),
    );
  }

  private async disconnectRelation(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    _sourceUnique: UniqueSelector,
    target: RepositoryRecord,
  ): Promise<void> {
    if (resolved.type === 'belongsToMany') {
      await tableQuery(this.getClient(), resolved.through)
        .where(
          column(resolved.through, resolved.throughSourceForeignKey),
          relationKeyValue(
            this.getClient(),
            resolved.source,
            resolved.sourceKey,
            source[resolved.sourceKey],
          ),
        )
        .where(
          column(resolved.through, resolved.throughTargetForeignKey),
          relationKeyValue(
            this.getClient(),
            resolved.target,
            resolved.targetKey,
            target[resolved.targetKey],
          ),
        )
        .delete();
      return;
    }
    if (resolved.type !== 'hasMany' || !relationForeignKeyNullable(resolved)) {
      relationActionNotAllowed(resolved, 'patch');
    }
    const query = tableQuery(this.getClient(), resolved.target);
    applyUnique(
      query,
      resolved.target,
      selectorFromRecord(resolved.target, target),
    );
    await query
      .where(
        column(resolved.target, resolved.targetForeignKey),
        relationKeyValue(
          this.getClient(),
          resolved.source,
          resolved.sourceKey,
          source[resolved.sourceKey],
        ),
      )
      .update({ [column(resolved.target, resolved.targetForeignKey)]: null });
  }

  private async replaceRelation(
    resolved: ResolvedRepositoryRelation,
    source: RepositoryRecord,
    sourceUnique: UniqueSelector,
    desired: readonly {
      record: RepositoryRecord;
      through?: RepositoryRecord;
    }[],
    scope?: FilterAst,
  ): Promise<void> {
    if (resolved.type === 'belongsTo')
      relationActionNotAllowed(resolved, 'replace');
    if (resolved.type === 'belongsToMany') {
      const desiredValues = new Map(
        desired.map(({ record: target }) => [
          associationKey(target[resolved.targetKey]),
          target[resolved.targetKey],
        ]),
      );
      const edges = tableQuery(this.getClient(), resolved.through)
        .select(
          this.getClient()
            .ref(column(resolved.through, resolved.throughTargetForeignKey))
            .as('target'),
        )
        .where(
          column(resolved.through, resolved.throughSourceForeignKey),
          relationKeyValue(
            this.getClient(),
            resolved.source,
            resolved.sourceKey,
            source[resolved.sourceKey],
          ),
        );
      // An edge to a target the scope cannot locate is left alone: replacing a
      // set may only let go of what the caller could have named.
      if (scope) {
        const visible = tableQuery(this.getClient(), resolved.target).select(
          column(resolved.target, resolved.targetKey),
        );
        await this.applyRelationScope(visible, resolved.target, scope);
        edges.whereIn(
          column(resolved.through, resolved.throughTargetForeignKey),
          visible,
        );
      }
      const current = (await edges) as Array<{ target: unknown }>;
      for (const edge of current) {
        const keyField = scalarFields(resolved.target).find(
          (field) => field.name === resolved.targetKey,
        );
        const targetKey =
          keyField?.type === 'boolean'
            ? decodeBooleanValue(keyField, edge.target)
            : edge.target;
        if (!desiredValues.has(associationKey(targetKey))) {
          await tableQuery(this.getClient(), resolved.through)
            .where(
              column(resolved.through, resolved.throughSourceForeignKey),
              relationKeyValue(
                this.getClient(),
                resolved.source,
                resolved.sourceKey,
                source[resolved.sourceKey],
              ),
            )
            .where(
              column(resolved.through, resolved.throughTargetForeignKey),
              edge.target as Knex.Value,
            )
            .delete();
        }
      }
    } else {
      const selectors = desired.map(({ record }) =>
        selectorFromRecord(resolved.target, record),
      );
      const remaining = tableQuery(this.getClient(), resolved.target).where(
        column(resolved.target, resolved.targetForeignKey),
        relationKeyValue(
          this.getClient(),
          resolved.source,
          resolved.sourceKey,
          source[resolved.sourceKey],
        ),
      );
      await this.applyRelationScope(remaining, resolved.target, scope);
      if (selectors.length) {
        remaining.whereNot((query) =>
          applySelectors(query, resolved.target, selectors),
        );
      }
      if (!relationForeignKeyNullable(resolved)) {
        const current = await remaining.first();
        if (current) relationActionNotAllowed(resolved, 'replace');
      } else {
        await remaining.update({
          [column(resolved.target, resolved.targetForeignKey)]: null,
        });
      }
    }
    for (const target of desired) {
      await this.connectRelation(
        resolved,
        source,
        sourceUnique,
        target.record,
        target.through,
      );
    }
  }

  private async inTransaction<TResult>(
    execute: (adapter: KnexRepositoryExecutionAdapter) => Promise<TResult>,
  ): Promise<TResult> {
    const client = this.getClient();
    if (isTransaction(client)) return execute(this);
    return client.transaction((transaction) => {
      if (this.runtime) attachDatabaseDriverRuntime(transaction, this.runtime);
      return execute(
        new KnexRepositoryExecutionAdapter(
          () => transaction,
          this.getCollection,
          this.runtime,
        ),
      );
    });
  }

  private async inSavepoint<TResult>(
    execute: (adapter: KnexRepositoryExecutionAdapter) => Promise<TResult>,
  ): Promise<TResult> {
    return this.getClient().transaction((transaction) => {
      if (this.runtime) attachDatabaseDriverRuntime(transaction, this.runtime);
      return execute(
        new KnexRepositoryExecutionAdapter(
          () => transaction,
          this.getCollection,
          this.runtime,
        ),
      );
    });
  }

  private async selectionFields(
    collection: CollectionDefinition,
    fields: readonly string[],
    select: SelectNode | undefined,
  ): Promise<SelectionColumn[]> {
    const selected = fields.map((field) => ({
      column: column(collection, field),
      alias: field,
    }));
    for (const node of select?.includes ?? []) {
      const resolved = await this.resolveRelation(collection, node.relation);
      selected.push({
        column: resolved.sourceColumn,
        alias: relationHelper(node.relation),
      });
    }
    return uniqueSelectionColumns(selected);
  }

  private async loadRelations(
    collection: CollectionDefinition,
    rows: RepositoryRecord[],
    select: SelectNode,
  ): Promise<void> {
    if (rows.length === 0) return;
    for (const node of select.includes ?? []) {
      await this.loadRelation(collection, rows, node);
    }
  }

  private async loadRelation(
    collection: CollectionDefinition,
    parents: RepositoryRecord[],
    node: SelectIncludeNode,
  ): Promise<void> {
    if (node.result?.kind === 'combine') {
      const results = parents.map((): RepositoryRecord => ({}));
      for (const [name, branch] of Object.entries(node.result.branches)) {
        const copies = parents.map((parent) => ({ ...parent }));
        await this.loadRelation(collection, copies, {
          ...branch,
          kind: 'include',
          relation: node.relation,
        });
        copies.forEach((copy, index) => {
          results[index][name] = copy[node.relation];
        });
      }
      parents.forEach((parent, index) => {
        parent[node.relation] = results[index];
      });
      return;
    }
    const resolved = await this.resolveRelation(collection, node.relation);
    const parentValues = uniqueValues(
      parents.map((parent) => parent[relationHelper(node.relation)]),
    );
    if (parentValues.length === 0) {
      for (const parent of parents)
        parent[node.relation] = node.result
          ? node.result.kind === 'count'
            ? 0
            : null
          : emptyRelation(resolved);
      return;
    }

    const targetAlias = 'repository_target';
    const requested =
      node.select.fields ??
      scalarFields(resolved.target).map((field) => field.name);
    const selected = requested.map((field) => ({
      column: column(resolved.target, field),
      alias: field,
    }));
    const sortFields = (node.sort?.items ?? []).flatMap((item) =>
      item.kind === 'field' && item.path.length === 1 ? [item.path[0]] : [],
    );
    for (const field of [
      ...sortFields,
      ...(node.distinct ?? []),
      ...(node.result?.field ? [node.result.field] : []),
    ]) {
      selected.push({ column: column(resolved.target, field), alias: field });
    }
    const associationField =
      resolved.type === 'belongsTo'
        ? resolved.targetKey
        : resolved.type === 'hasOne' || resolved.type === 'hasMany'
          ? resolved.targetForeignKey
          : undefined;
    if (associationField) {
      selected.push({
        column: column(resolved.target, associationField),
        alias: relationParentHelper(node.relation),
      });
    }
    for (const child of node.select.includes ?? []) {
      const childRelation = await this.resolveRelation(
        resolved.target,
        child.relation,
      );
      selected.push({
        column: childRelation.sourceColumn,
        alias: relationHelper(child.relation),
      });
    }

    const client = this.getClient();
    const query = tableQuery(client, resolved.target, targetAlias).select(
      uniqueSelectionColumns(selected).map((field) =>
        selectColumn(client, resolved.target, field, targetAlias, false),
      ),
    );
    if (resolved.type === 'belongsTo') {
      query.whereIn(
        qualified(targetAlias, column(resolved.target, resolved.targetKey)),
        parentValues as Knex.Value[],
      );
    } else if (resolved.type === 'hasOne' || resolved.type === 'hasMany') {
      query.whereIn(
        qualified(
          targetAlias,
          column(resolved.target, resolved.targetForeignKey),
        ),
        parentValues as Knex.Value[],
      );
    } else {
      const throughAlias = 'repository_through';
      query
        .join(
          collectionReference(client, resolved.through, throughAlias),
          qualified(targetAlias, column(resolved.target, resolved.targetKey)),
          qualified(
            throughAlias,
            column(resolved.through, resolved.throughTargetForeignKey),
          ),
        )
        .whereIn(
          qualified(
            throughAlias,
            column(resolved.through, resolved.throughSourceForeignKey),
          ),
          parentValues as Knex.Value[],
        )
        .select(
          client
            .ref(column(resolved.through, resolved.throughSourceForeignKey))
            .withSchema(throughAlias)
            .as(relationParentHelper(node.relation)),
        );
    }

    const graph = await this.prepareFilterGraph(
      resolved.target,
      node.filter?.root,
    );
    applyFilter(
      query,
      resolved.target,
      node.filter?.root,
      graph,
      targetAlias,
      client,
    );
    if (!node.distinct)
      applyCursor(
        query,
        cursorForDirection(relationCursorAxes(node), node.direction),
        (field) => qualified(targetAlias, column(resolved.target, field)),
        (field, value) => bindQueryValue(query, resolved.target, field, value),
      );
    for (const item of node.sort?.items ?? []) {
      await this.applySort(
        query,
        resolved.target,
        sortForDirection(item, node.direction),
        targetAlias,
      );
    }
    let scoped = query;
    const parentKey = relationParentHelper(node.relation);
    const used = new Set([...selected.map((field) => field.alias), parentKey]);
    const rankKey = unusedInternalAlias(used, '_relation_rank');
    const ordering = (alias: string, reverse: boolean): Knex.Raw => {
      const bindings: Knex.RawBinding[] = [];
      const sql = (node.sort?.items ?? [])
        .map((original) => {
          const item = reverse
            ? sortForDirection(original, node.direction)
            : original;
          if (item.kind !== 'field' || item.path.length !== 1)
            throw new Error(
              'Relation ranking requires direct scalar Field sort.',
            );
          const name = qualified(alias, item.path[0]);
          bindings.push(name, name);
          const last = (item.nulls ?? 'last') === 'last';
          return `case when ?? is null then ${last ? 1 : 0} else ${last ? 0 : 1} end asc, ?? ${item.direction}`;
        })
        .join(', ');
      return client.raw(
        sql || '??',
        sql ? bindings : [qualified(alias, parentKey)],
      );
    };
    if (node.distinct) {
      const baseAlias = 'relation_distinct_source';
      const partition = [parentKey, ...node.distinct].map((field) =>
        qualified(baseAlias, field),
      );
      const ranked = client
        .from(query.clear('order').as(baseAlias))
        .select(
          `${baseAlias}.*`,
          client.raw(
            `row_number() over (partition by ${partition.map(() => '??').join(', ')} order by ?) as ??`,
            [...partition, ordering(baseAlias, false), rankKey],
          ),
        );
      const alias = 'relation_distinct';
      scoped = client
        .from(ranked.as(alias))
        .select(`${alias}.*`)
        .where(qualified(alias, rankKey), 1);
      applyCursor(
        scoped,
        cursorForDirection(relationCursorAxes(node), node.direction),
        (field) => qualified(alias, field),
      );
      scoped.orderByRaw('?', [ordering(alias, true)]);
    }
    if (node.result) {
      let aggregateSource = scoped.clear('order');
      if (node.limit !== undefined) {
        const alias = 'relation_page_source';
        const ranked = client
          .from(aggregateSource.as(alias))
          .select(
            `${alias}.*`,
            client.raw('row_number() over (partition by ?? order by ?) as ??', [
              qualified(alias, parentKey),
              ordering(alias, true),
              rankKey + '_page',
            ]),
          );
        aggregateSource = client
          .from(ranked.as('relation_page'))
          .select('*')
          .where(rankKey + '_page', '<=', node.limit);
      }
      const alias = 'relation_aggregate';
      const resultKey = unusedInternalAlias(used, '_relation_value');
      const aggregateQuery = client
        .from(aggregateSource.as(alias))
        .select(parentKey)
        .groupBy(parentKey);
      const field = node.result.field
        ? qualified(alias, node.result.field)
        : '*';
      const aggregateField = node.result.field;
      const source = scalarFields(resolved.target).find(
        (source) => source.name === aggregateField,
      );
      const expression = aggregateSql(
        client,
        node.result.kind,
        field,
        false,
        source,
      );
      const numeric =
        ['count', 'sum', 'avg'].includes(node.result.kind) ||
        (source &&
          [
            'bigInt',
            'integer',
            'increments',
            'decimal',
            'float',
            'double',
          ].includes(source.type));
      aggregateQuery.select(
        client.raw('? as ??', [
          numeric
            ? aggregateProjection(client, expression, source)
            : expression,
          resultKey,
        ]),
      );
      const aggregates = (await aggregateQuery) as RepositoryRecord[];
      const values = new Map(
        aggregates.map((row) => [
          associationKey(row[parentKey]),
          row[resultKey],
        ]),
      );
      for (const parent of parents) {
        let value = values.get(
          associationKey(parent[relationHelper(node.relation)]),
        );
        const resultField = node.result.field;
        const source = scalarFields(resolved.target).find(
          (field) => field.name === resultField,
        );
        if (
          source &&
          isTemporalType(source.type) &&
          value != null &&
          (node.result.kind === 'min' || node.result.kind === 'max')
        )
          value = normalizeTemporalValue(
            source,
            value,
            'FIELD_CAPABILITY_NOT_SUPPORTED',
            ['select', node.relation],
          );
        parent[node.relation] = decodeAggregate(
          node.result.kind,
          value,
          source,
        );
      }
      return;
    }
    // Preserve native numeric values through relation ranking and aggregation.
    // Project decimal text only when returning the final record branch.
    const readAlias = 'relation_decimal_result';
    if (
      selected.some((selection) =>
        scalarFields(resolved.target).some(
          (field) =>
            field.type === 'decimal' &&
            column(resolved.target, field.name) === selection.column,
        ),
      )
    ) {
      scoped = client.from(scoped.clear('order').as(readAlias)).select(
        uniqueSelectionColumns([
          ...selected,
          { column: parentKey, alias: parentKey },
        ]).map((selection) => {
          const field = scalarFields(resolved.target).find(
            (field) => column(resolved.target, field.name) === selection.column,
          );
          const value = client.ref(qualified(readAlias, selection.alias));
          return client.raw('? as ??', [
            field?.type === 'decimal'
              ? aggregateProjection(client, value)
              : value,
            selection.alias,
          ]);
        }),
      );
      // The outer query must explicitly retain each relation's numeric order.
      scoped.orderByRaw('?', [ordering(readAlias, true)]);
    }
    const targets = (await scoped) as RepositoryRecord[];
    const grouped = new Map<string, RepositoryRecord[]>();
    for (const target of targets) {
      const key = associationKey(target[relationParentHelper(node.relation)]);
      const group = grouped.get(key) ?? [];
      group.push(target);
      grouped.set(key, group);
    }
    const selectedTargets = [...grouped.values()].flatMap((group) =>
      node.limit === undefined ? group : group.slice(0, node.limit),
    );
    if (node.select.includes?.length) {
      await this.loadRelations(resolved.target, selectedTargets, node.select);
    }
    const decodeRow = prepareScalarRowDecoder(
      resolved.target,
      requested,
      this.runtime?.repository?.trimCharResults,
      this.runtime?.repository?.jsonResults,
    );
    for (const parent of parents) {
      const group =
        grouped.get(associationKey(parent[relationHelper(node.relation)])) ??
        [];
      const page =
        node.limit === undefined ? group : group.slice(0, node.limit);
      const matches = (
        node.direction === 'backward' ? [...page].reverse() : page
      ).map((target) => projectRow(decodeRow(target), requested, node.select));
      parent[node.relation] = isToOne(resolved.relation)
        ? (matches[0] ?? null)
        : matches;
    }
  }

  private async prepareFilterGraph(
    collection: CollectionDefinition,
    root: FilterGroupNode | undefined,
  ): Promise<RelationGraph> {
    const graph: RelationGraph = new WeakMap();
    const visit = async (
      current: CollectionDefinition,
      node: FilterNode,
    ): Promise<void> => {
      if (node.kind === 'group') {
        await Promise.all(node.items.map((item) => visit(current, item)));
      } else if (node.kind === 'relation') {
        const resolved = await this.resolveRelation(current, node.path[0]);
        graph.set(node, resolved);
        if (node.filter) await visit(resolved.target, node.filter);
      }
    };
    if (root) await visit(collection, root);
    return graph;
  }

  private async applySort(
    query: Knex.QueryBuilder,
    collection: CollectionDefinition,
    item: SortNode,
    sourceAlias: string,
  ): Promise<void> {
    const client = this.getClient();
    if (item.kind === 'field' && item.path.length === 1) {
      applyOrderBy(
        query,
        client,
        qualified(sourceAlias, column(collection, item.path[0])),
        item.direction,
        item.nulls ?? 'last',
      );
      return;
    }
    const relationPath =
      item.kind === 'field' ? item.path.slice(0, -1) : item.relation;
    const path = await this.resolveRelationPath(collection, relationPath);
    const value = relationSortSubquery(
      client,
      path,
      sourceAlias,
      item.kind === 'field'
        ? { kind: 'field', field: item.path[item.path.length - 1] }
        : {
            kind: 'aggregate',
            aggregate: item.aggregate,
            field: item.field,
          },
    );
    applyOrderBy(query, client, value, item.direction, item.nulls ?? 'last');
  }

  private async resolveRelationPath(
    collection: CollectionDefinition,
    path: readonly string[],
  ): Promise<ResolvedRepositoryRelation[]> {
    const result: ResolvedRepositoryRelation[] = [];
    let current = collection;
    for (const field of path) {
      const relation = await this.resolveRelation(current, field);
      result.push(relation);
      current = relation.target;
    }
    return result;
  }

  private async resolveRelation(
    source: CollectionDefinition,
    field: string,
  ): Promise<ResolvedRepositoryRelation> {
    const relation = relationFields(source).find((item) => item.name === field);
    if (!relation) {
      throw new RepositoryError(
        'RELATION_NOT_FOUND',
        `Relation "${source.name}.${field}" does not exist.`,
        { collection: source.name, relation: field },
      );
    }
    const target = await this.getCollection(relation.target);
    if (!target) {
      throw new RepositoryError(
        'COLLECTION_NOT_FOUND',
        `Relation target "${relation.target}" does not exist.`,
        { collection: relation.target, relation: relation.name },
      );
    }
    const keys = [
      ...scalarFields(source).filter(
        (item) =>
          item.name === relation.sourceKey ||
          (relation.type === 'belongsTo' && item.name === relation.foreignKey),
      ),
      ...scalarFields(target).filter(
        (item) =>
          item.name === relation.targetKey ||
          (relation.type !== 'belongsTo' &&
            relation.type !== 'belongsToMany' &&
            item.name === relation.foreignKey),
      ),
    ];
    if (keys.some((item) => isTemporalType(item.type)))
      throw new RepositoryError(
        'FIELD_CAPABILITY_NOT_SUPPORTED',
        'V1 temporal fields cannot be used as Repository relation join keys.',
        { collection: source.name, relation: relation.name },
      );
    validateRelationOptions(relation);
    if (relation.type === 'belongsTo') {
      return {
        type: 'belongsTo',
        source,
        relation,
        target,
        targetKey: requireRelationOption(relation, 'targetKey'),
        sourceColumn: column(
          source,
          requireRelationOption(relation, 'foreignKey'),
        ),
      };
    }
    if (relation.type === 'hasOne' || relation.type === 'hasMany') {
      if (!relation.foreignKey)
        missingRelationOption(source, relation, 'foreignKey');
      return {
        type: relation.type,
        source,
        relation,
        target,
        sourceKey: requireRelationOption(relation, 'sourceKey'),
        sourceColumn: column(
          source,
          requireRelationOption(relation, 'sourceKey'),
        ),
        targetForeignKey: relation.foreignKey,
      };
    }
    if (!relation.through) missingRelationOption(source, relation, 'through');
    if (!relation.foreignKey)
      missingRelationOption(source, relation, 'foreignKey');
    if (!relation.otherKey) missingRelationOption(source, relation, 'otherKey');
    const through = await this.getCollection(relation.through);
    if (!through) {
      throw new RepositoryError(
        'COLLECTION_NOT_FOUND',
        `Relation through Collection "${relation.through}" does not exist.`,
        { collection: relation.through, relation: relation.name },
      );
    }
    return {
      type: 'belongsToMany',
      source,
      relation,
      target,
      through,
      sourceKey: requireRelationOption(relation, 'sourceKey'),
      targetKey: requireRelationOption(relation, 'targetKey'),
      sourceColumn: column(
        source,
        requireRelationOption(relation, 'sourceKey'),
      ),
      throughSourceForeignKey: relation.foreignKey,
      throughTargetForeignKey: relation.otherKey,
    };
  }
}

interface SelectionColumn {
  readonly column: string;
  readonly alias: string;
}

function selectColumn(
  client: Knex,
  collection: CollectionDefinition,
  selection: SelectionColumn,
  alias?: string,
  resultBoundary = true,
): Knex.Raw {
  const field = scalarFields(collection).find(
    (item) => column(collection, item.name) === selection.column,
  );
  const expression = temporalProjection(
    client,
    field,
    alias ? qualified(alias, selection.column) : selection.column,
  );
  return client.raw('? as ??', [
    field &&
    (field.type === 'bigInt' || (field.type === 'decimal' && resultBoundary))
      ? aggregateProjection(client, expression)
      : expression,
    selection.alias,
  ]);
}

function decodeBooleanRow(
  collection: CollectionDefinition,
  row: RepositoryRecord,
  jsonResults?: JsonResultForm,
): RepositoryRecord {
  const result = { ...row };
  for (const field of scalarFields(collection)) {
    if (
      ['integer', 'increments', 'bigInt'].includes(field.type) &&
      Object.hasOwn(result, field.name)
    )
      result[field.name] = decodeIntegerValue(field, result[field.name]);
    if (field.type === 'decimal' && Object.hasOwn(result, field.name))
      result[field.name] = decimalString(result[field.name]);
    if (field.type === 'boolean' && Object.hasOwn(result, field.name))
      result[field.name] = decodeBooleanValue(field, result[field.name]);
    if (field.type === 'enum' && Object.hasOwn(result, field.name))
      result[field.name] = normalizeEnumValue(
        field,
        result[field.name],
        'INVALID_STORED_VALUE',
        ['select', field.name],
      );
    if (field.type === 'json' && Object.hasOwn(result, field.name))
      result[field.name] = decodeJsonValue(
        result[field.name],
        jsonResults,
        field,
      );
  }
  return result;
}

interface ResolvedRepositoryRelationBase {
  readonly source: CollectionDefinition;
  readonly relation: RelationFieldDefinition;
  readonly target: CollectionDefinition;
  readonly through?: CollectionDefinition;
  readonly sourceColumn: string;
  readonly targetForeignKey?: string;
  readonly throughSourceForeignKey?: string;
  readonly throughTargetForeignKey?: string;
}

type ResolvedRepositoryRelation = ResolvedRepositoryRelationBase &
  (
    | { readonly type: 'belongsTo'; readonly targetKey: string }
    | {
        readonly type: 'hasOne';
        readonly sourceKey: string;
        readonly targetForeignKey: string;
      }
    | {
        readonly type: 'hasMany';
        readonly sourceKey: string;
        readonly targetForeignKey: string;
      }
    | {
        readonly type: 'belongsToMany';
        readonly sourceKey: string;
        readonly targetKey: string;
        readonly through: CollectionDefinition;
        readonly throughSourceForeignKey: string;
        readonly throughTargetForeignKey: string;
      }
  );

type RelationGraph = WeakMap<FilterRelationNode, ResolvedRepositoryRelation>;

function tableQuery(
  client: Knex,
  collection: CollectionDefinition,
  alias?: string,
): Knex.QueryBuilder {
  if (!alias) {
    const query = client(tableName(collection));
    return collection.db?.schema
      ? query.withSchema(collection.db.schema)
      : query;
  }
  return client
    .queryBuilder()
    .from(collectionReference(client, collection, alias));
}

function tableName(collection: CollectionDefinition): string {
  return naming(collection).collectionToTableName(collection.name!);
}

function collectionReference(
  client: Knex,
  collection: CollectionDefinition,
  alias: string,
): Knex.Raw {
  const aliasKeyword =
    getDatabaseDriverRuntime(client)?.repository?.collectionAliasKeyword ??
    ' as ';
  return collection.db?.schema
    ? client.raw(`??.??${aliasKeyword}??`, [
        collection.db.schema,
        tableName(collection),
        alias,
      ])
    : client.raw(`??${aliasKeyword}??`, [tableName(collection), alias]);
}

function limitLockedQuery(query: Knex.QueryBuilder, client: Knex): void {
  const customLimit =
    getDatabaseDriverRuntime(client)?.repository?.limitLockedQuery;
  if (customLimit) customLimit(query, client);
  else query.limit(2);
  query.forUpdate();
}

function naming(collection: CollectionDefinition): DefaultNamingStrategy {
  return new DefaultNamingStrategy(collection.naming);
}

function column(collection: CollectionDefinition, field: string): string {
  return naming(collection).fieldToColumnName(field);
}

function scalarFields(collection: CollectionDefinition): FieldDefinition[] {
  return (collection.fields ?? []).filter(isScalarField);
}

function isScalarField(field: AnyFieldDefinition): field is FieldDefinition {
  return !('target' in field);
}

function relationFields(
  collection: CollectionDefinition,
): RelationFieldDefinition[] {
  return (collection.fields ?? []).filter(
    (field): field is RelationFieldDefinition => 'target' in field,
  );
}

function relationHelper(field: string): string {
  return `__repository_relation_${field}`;
}

function relationParentHelper(field: string): string {
  return `__repository_parent_${field}`;
}

function uniqueSelectionColumns(
  columns: readonly SelectionColumn[],
): SelectionColumn[] {
  const result = new Map<string, SelectionColumn>();
  for (const item of columns) result.set(item.alias, item);
  return [...result.values()];
}

function unusedInternalAlias(used: Set<string>, base: string): string {
  let alias = base;
  let suffix = 1;
  while (used.has(alias)) {
    alias = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(alias);
  return alias;
}

function uniqueValues(values: readonly unknown[]): unknown[] {
  return [
    ...new Set(values.filter((value) => value !== null && value !== undefined)),
  ];
}

function associationKey(value: unknown): string {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number' || typeof value === 'string')
    return String(value);
  return JSON.stringify(value);
}

function isToOne(relation: RelationFieldDefinition): boolean {
  return relation.type === 'belongsTo' || relation.type === 'hasOne';
}

function emptyRelation(resolved: ResolvedRepositoryRelation): null | [] {
  return isToOne(resolved.relation) ? null : [];
}

function projectRow(
  row: RepositoryRecord,
  fields: readonly string[],
  select: SelectNode | undefined,
): RepositoryRecord {
  const result = Object.fromEntries(fields.map((field) => [field, row[field]]));
  for (const relation of select?.includes ?? []) {
    result[relation.relation] = row[relation.relation];
  }
  return result;
}

function internalGroupResultCollection(
  plan: RepositoryGroupByPlan,
  outputs: readonly GroupByOutput[],
): CollectionDefinition {
  const fields = outputs.map((output, index): FieldDefinition => {
    if (index < plan.by.length) {
      const source = plan.collection.fields?.find(
        (field): field is FieldDefinition =>
          field.name === output.name && isScalarField(field),
      );
      if (!source) throw new Error('GroupBy source Field was not found.');
      return { ...source, name: output.internal };
    }
    const aggregate = plan.aggregate.items[index - plan.by.length];
    if (!aggregate) throw new Error('GroupBy aggregate was not found.');
    if (aggregate.kind === 'min' || aggregate.kind === 'max') {
      const source = plan.collection.fields?.find(
        (field): field is FieldDefinition =>
          field.name === aggregate.field && isScalarField(field),
      );
      if (!source) throw new Error('GroupBy aggregate Field was not found.');
      return { ...source, name: output.internal, nullable: true };
    }
    const source = scalarFields(plan.collection).find(
      (field) => field.name === aggregate.field,
    );
    return {
      name: output.internal,
      type:
        aggregate.kind === 'count'
          ? 'bigInt'
          : source && ['float', 'double'].includes(source.type)
            ? source.type
            : 'decimal',
      nullable: aggregate.kind !== 'count',
      db: { preciseAggregate: true },
    };
  });
  return {
    name: plan.collection.name,
    naming: { underscored: false },
    fields,
  };
}

function mapFilterFields(
  node: FilterGroupNode,
  fields: ReadonlyMap<string, string>,
): FilterGroupNode {
  return {
    ...node,
    items: node.items.map((item) => {
      if (item.kind === 'group') return mapFilterFields(item, fields);
      if (item.kind === 'relation') {
        throw new Error('GroupBy having does not support Relation filters.');
      }
      const field = fields.get(item.path[0]);
      if (!field) throw new Error('GroupBy having Field was not mapped.');
      return { ...item, path: [field] };
    }),
  };
}

function missingRelationOption(
  collection: CollectionDefinition,
  relation: RelationFieldDefinition,
  option: 'foreignKey' | 'through' | 'otherKey',
): never {
  throw new RepositoryError(
    'INVALID_AST',
    `Relation "${collection.name}.${relation.name}" requires ${option}.`,
    {
      collection: collection.name,
      relation: relation.name,
      details: { option },
    },
  );
}

function qualified(alias: string, columnName: string): string {
  return `${alias}.${columnName}`;
}

function applyOrderBy(
  query: Knex.QueryBuilder,
  client: Knex,
  value: string | Knex.QueryBuilder | Knex.Raw,
  direction: 'asc' | 'desc',
  nulls: 'first' | 'last',
): void {
  const nullValue = typeof value === 'string' ? client.ref(value) : value;
  query.orderBy(
    client.raw(
      nulls === 'last'
        ? 'case when (?) is null then 1 else 0 end'
        : 'case when (?) is null then 0 else 1 end',
      [nullValue],
    ),
    'asc',
  );
  query.orderBy(value, direction);
}

function mapWrite(
  client: Knex,
  collection: CollectionDefinition,
  values: RepositoryRecord,
): PhysicalWriteRecord {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([field, value]) => [
        column(collection, field),
        writeValue(client, collection, field, value),
      ]),
  );
}

/** Bind boolean storage once for a write batch; other types retain their adapters. */
function prepareWrite(
  client: Knex,
  collection: CollectionDefinition,
): (values: RepositoryRecord) => PhysicalWriteRecord {
  const booleans = new Map<
    string,
    (value: unknown) => boolean | number | null
  >();
  for (const field of scalarFields(collection)) {
    if (field.type !== 'boolean') continue;
    booleans.set(field.name, (value) =>
      getDatabaseDriverRuntime(client)?.repository?.encodeBoolean
        ? getDatabaseDriverRuntime(client)!.repository!.encodeBoolean!(
            field,
            value,
          )
        : normalizeBooleanValue(field, value),
    );
  }
  return (values) =>
    Object.fromEntries(
      Object.entries(values).map(([field, value]) => {
        const encode = booleans.get(field);
        return [
          column(collection, field),
          encode ? encode(value) : writeValue(client, collection, field, value),
        ];
      }),
    );
}

function writeValue(
  client: Knex,
  collection: CollectionDefinition,
  name: string | Knex.Raw,
  value: RepositoryRecord[string],
): RepositoryRecord[string] | Knex.Raw {
  const field = collection.fields?.find((item) => item.name === name);
  if (field?.type === 'bigInt' && typeof value === 'bigint')
    return String(value);
  if (field && isScalarField(field) && field.type === 'boolean')
    return getDatabaseDriverRuntime(client)?.repository?.encodeBoolean
      ? getDatabaseDriverRuntime(client)!.repository!.encodeBoolean!(
          field,
          value,
        )
      : normalizeBooleanValue(field, value);
  if (field && isScalarField(field) && isTemporalType(field.type))
    return temporalBinding(client, field, value);
  if (field?.type === 'json') return encodeJsonValue(value as JsonValue);
  if (field?.type === 'blob') {
    if (value instanceof Uint8Array) return Buffer.from(value);
    // Tedious binds untyped NULL as NVARCHAR, which SQL Server cannot insert
    // into VARBINARY without an explicit cast.
    if (value === null) {
      const custom =
        getDatabaseDriverRuntime(client)?.repository?.encodeBlobNull?.(client);
      if (custom) return custom;
    }
  }
  return value;
}

function mapUpdate(
  client: Knex,
  collection: CollectionDefinition,
  values: RepositoryRecord,
): Record<string, RepositoryRecord[string] | Knex.Raw> {
  return Object.fromEntries(
    Object.entries(values).map(([field, value]) => {
      const name = column(collection, field);
      if (
        !isNumericMutation(value) ||
        collection.fields?.find((item) => item.name === field)?.type === 'json'
      )
        return [name, writeValue(client, collection, field, value)];
      const operator = {
        increment: '+',
        decrement: '-',
        multiply: '*',
        divide: '/',
      }[value.operation];
      const definition = collection.fields?.find((item) => item.name === field);
      const operand =
        typeof value.value === 'bigint' ? String(value.value) : value.value;
      const custom = getDatabaseDriverRuntime(
        client,
      )?.repository?.numericMutation?.({
        client,
        field: definition,
        name,
        operation: value.operation,
        operand,
      });
      if (custom) return [name, custom];
      return [name, client.raw(`?? ${operator} ?`, [name, operand])];
    }),
  );
}

function mapRow(
  collection: CollectionDefinition,
  fields: readonly string[],
  row: RepositoryRecord,
  jsonResults?: JsonResultForm,
): RepositoryRecord {
  return decodeBooleanRow(
    collection,
    Object.fromEntries(
      fields.map((field) => [
        field,
        Object.hasOwn(row, field) ? row[field] : row[column(collection, field)],
      ]),
    ),
    jsonResults,
  );
}

function applyFilter(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  root: FilterGroupNode | undefined,
  graph: RelationGraph,
  sourceAlias?: string,
  client?: Knex,
  depth = 0,
): void {
  if (!root || root.items.length === 0) return;
  query.where(function applyRoot(): void {
    applyGroupItems(this, collection, root, graph, sourceAlias, client, depth);
  });
}

function reverseDirection(direction: 'asc' | 'desc'): 'asc' | 'desc' {
  return direction === 'asc' ? 'desc' : 'asc';
}

function sortForDirection(
  item: SortNode,
  direction: 'forward' | 'backward' | undefined,
): SortNode {
  return direction === 'backward'
    ? {
        ...item,
        direction: reverseDirection(item.direction),
        nulls: item.nulls === 'first' ? 'last' : 'first',
      }
    : item;
}

function cursorForDirection(
  axes: readonly RepositoryCursorAxis[] | undefined,
  direction: 'forward' | 'backward' | undefined,
): readonly RepositoryCursorAxis[] | undefined {
  return direction === 'backward'
    ? axes?.map((axis) => ({
        ...axis,
        direction: reverseDirection(axis.direction),
      }))
    : axes;
}

function applyCursor(
  query: Knex.QueryBuilder,
  cursor: readonly RepositoryCursorAxis[] | undefined,
  resolveField: (field: string) => string,
  bind: (field: string, value: unknown) => unknown = (_field, value) => value,
): void {
  if (!cursor || cursor.length === 0) return;
  query.andWhere(function cursorBoundary(this: Knex.QueryBuilder): void {
    for (const [index, axis] of cursor.entries()) {
      this.orWhere(function cursorBranch(this: Knex.QueryBuilder): void {
        for (const previous of cursor.slice(0, index)) {
          this.andWhere(
            resolveField(previous.field),
            '=',
            bind(previous.field, previous.value) as Knex.Value,
          );
        }
        this.andWhere(
          resolveField(axis.field),
          axis.direction === 'asc' ? '>' : '<',
          bind(axis.field, axis.value) as Knex.Value,
        );
      });
    }
  });
}

function relationCursorAxes(
  node: SelectIncludeNode,
): RepositoryCursorAxis[] | undefined {
  if (!node.cursor) return undefined;
  return node.sort?.items.map((item) => {
    if (item.kind !== 'field' || item.path.length !== 1) {
      throw new Error('Relation cursor requires direct Field sort.');
    }
    return {
      field: item.path[0],
      direction: item.direction,
      value: node.cursor?.[item.path[0]],
    };
  });
}

function applyGroupItems(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  group: FilterGroupNode,
  graph: RelationGraph,
  sourceAlias: string | undefined,
  client: Knex | undefined,
  depth: number,
): void {
  group.items.forEach((node, index) => {
    applyNode(
      query,
      collection,
      node,
      index === 0 ? 'and' : group.logic,
      graph,
      sourceAlias,
      client,
      depth,
    );
  });
}

function applyNode(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  node: FilterNode,
  boolean: 'and' | 'or',
  graph: RelationGraph,
  sourceAlias: string | undefined,
  client: Knex | undefined,
  depth: number,
): void {
  const method = boolean === 'or' ? 'orWhere' : 'where';
  if (node.kind === 'group') {
    query[method](function applyNested(): void {
      applyGroupItems(
        this,
        collection,
        node,
        graph,
        sourceAlias,
        client,
        depth,
      );
    });
    return;
  }
  if (node.kind === 'relation') {
    if (!client || !sourceAlias) {
      throw new Error('Relation filters require an aliased Repository query.');
    }
    const resolved = graph.get(node);
    if (!resolved) {
      throw new Error('Relation filter metadata was not prepared.');
    }
    applyRelationFilter(
      query,
      node,
      resolved,
      graph,
      sourceAlias,
      client,
      boolean,
      depth,
    );
    return;
  }
  applyCondition(query, collection, node, boolean, sourceAlias, client);
}

function enumGroupKey(client: Knex, field: string): Knex.Raw {
  const strategy = getDatabaseDriverRuntime(client)?.repository?.enumGroupKey;
  if (!strategy)
    throw new RepositoryError(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      'Enum grouping requires a supported database dialect.',
    );
  return strategy({ client, field });
}

function applyCondition(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  node: FilterConditionNode,
  boolean: 'and' | 'or',
  sourceAlias?: string,
  client?: Knex,
): void {
  const directColumn = column(collection, node.path[0]);
  const name = sourceAlias
    ? qualified(sourceAlias, directColumn)
    : directColumn;
  const foundField = collection.fields?.find(
    (item) => item.name === node.path[0],
  );
  const field =
    foundField && isScalarField(foundField) ? foundField : undefined;
  const compiled = client
    ? getDatabaseDriverRuntime(client)?.repository?.compileFilterCondition?.({
        query,
        collection,
        node,
        field,
        name,
        client,
        boolean,
      })
    : undefined;
  if (compiled?.node) node = compiled.node;
  if (compiled?.handled) return;
  if (
    field?.type === 'boolean' &&
    (node.operator === '$eq' || node.operator === '$ne') &&
    node.value !== null &&
    node.value !== undefined
  ) {
    whereValue(
      query,
      boolean,
      name,
      node.operator === '$eq' ? '=' : '!=',
      bindQueryValue(query, collection, node.path[0], node.value),
    );
    return;
  }
  if (
    client &&
    field &&
    isScalarField(field) &&
    isTemporalType(field.type) &&
    node.value !== null &&
    node.value !== undefined
  ) {
    const operators: Partial<Record<FilterConditionNode['operator'], string>> =
      {
        $eq: '=',
        $ne: '<>',
        $dateOn: '=',
        $dateNotOn: '<>',
        $dateBefore: '<',
        $dateAfter: '>',
        $dateNotBefore: '>=',
        $dateNotAfter: '<=',
      };
    const reference = name;
    const operand = (value: FilterValue): Knex.Raw | string | null =>
      temporalBinding(client, field, value);
    if (node.operator === '$dateBetween') {
      const [start, end] = node.value as readonly FilterValue[];
      whereCallback(query, boolean, function datetimeRange(): void {
        (this.where as (...args: unknown[]) => unknown)(
          reference,
          '>=',
          operand(start),
        );
        (this.andWhere as (...args: unknown[]) => unknown)(
          reference,
          '<',
          operand(end),
        );
      });
      return;
    }
    const operator = operators[node.operator];
    if (operator) {
      whereValue(query, boolean, reference, operator, operand(node.value));
      return;
    }
  }
  if (jsonOperators.includes(node.operator)) {
    if (!client)
      throw new Error('JSON filters require a Repository query client.');
    query[boolean === 'or' ? 'orWhere' : 'where'](
      compileJsonCondition(client, name, node),
    );
    return;
  }
  const pattern = [
    '$includes',
    '$notIncludes',
    '$startsWith',
    '$endsWith',
  ].includes(node.operator);
  if (pattern || (node.mode === 'insensitive' && node.value !== null)) {
    const text = stringFilterValue(node.value);
    const escaped =
      (client
        ? getDatabaseDriverRuntime(client)?.repository?.escapeLikePattern?.(
            text,
          )
        : undefined) ?? text.replace(/[!%_]/g, '!$&');
    const likeEscapeCharacter = client
      ? (getDatabaseDriverRuntime(client)?.repository?.likeEscapeCharacter ??
        '!')
      : '!';
    const operand = pattern
      ? `${node.operator === '$startsWith' ? '' : '%'}${escaped}${node.operator === '$endsWith' ? '' : '%'}`
      : text;
    const operator = pattern
      ? node.operator === '$notIncludes'
        ? 'not like'
        : 'like'
      : node.operator === '$ne'
        ? '<>'
        : '=';
    const expression =
      node.mode === 'insensitive'
        ? `lower(??) ${operator} lower(?)`
        : `?? ${operator} ?`;
    query[boolean === 'or' ? 'orWhereRaw' : 'whereRaw'](
      `${expression}${pattern ? ` escape '${likeEscapeCharacter}'` : ''}`,
      [name, operand],
    );
    return;
  }
  switch (node.operator) {
    case '$eq':
      if (node.value === null) {
        query[boolean === 'or' ? 'orWhereNull' : 'whereNull'](name);
      } else {
        whereValue(query, boolean, name, '=', node.value);
      }
      return;
    case '$ne':
      if (node.value === null) {
        query[boolean === 'or' ? 'orWhereNotNull' : 'whereNotNull'](name);
      } else {
        whereValue(query, boolean, name, '!=', node.value);
      }
      return;
    case '$gt':
    case '$dateAfter':
      whereValue(query, boolean, name, '>', node.value);
      return;
    case '$gte':
    case '$dateNotBefore':
      whereValue(query, boolean, name, '>=', node.value);
      return;
    case '$lt':
    case '$dateBefore':
      whereValue(query, boolean, name, '<', node.value);
      return;
    case '$lte':
    case '$dateNotAfter':
      whereValue(query, boolean, name, '<=', node.value);
      return;
    case '$includes':
      whereValue(
        query,
        boolean,
        name,
        'like',
        `%${stringFilterValue(node.value)}%`,
      );
      return;
    case '$notIncludes':
      whereValue(
        query,
        boolean,
        name,
        'not like',
        `%${stringFilterValue(node.value)}%`,
      );
      return;
    case '$empty':
      if (isTextualField(collection, node.path[0])) {
        whereCallback(query, boolean, function emptyValue(): void {
          this.whereNull(name).orWhere(name, '');
        });
      } else {
        query[boolean === 'or' ? 'orWhereNull' : 'whereNull'](name);
      }
      return;
    case '$notEmpty':
      if (isTextualField(collection, node.path[0])) {
        whereCallback(query, boolean, function nonEmptyValue(): void {
          this.whereNotNull(name).andWhere(name, '!=', '');
        });
      } else {
        query[boolean === 'or' ? 'orWhereNotNull' : 'whereNotNull'](name);
      }
      return;
    case '$dateOn':
      whereValue(query, boolean, name, '=', node.value);
      return;
    case '$dateNotOn':
      whereValue(query, boolean, name, '!=', node.value);
      return;
    case '$dateBetween': {
      const [start, end] = node.value as readonly FilterValue[];
      whereCallback(query, boolean, function dateRange(): void {
        this.where(name, '>=', start as Knex.Value).andWhere(
          name,
          '<',
          end as Knex.Value,
        );
      });
      return;
    }
    case '$isTruly':
      whereValue(
        query,
        boolean,
        name,
        '=',
        bindQueryValue(query, collection, node.path[0], true),
      );
      return;
    case '$isFalsy':
      whereValue(
        query,
        boolean,
        name,
        '=',
        bindQueryValue(query, collection, node.path[0], false),
      );
      return;
  }
}

function applyRelationFilter(
  query: Knex.QueryBuilder,
  node: FilterRelationNode,
  resolved: ResolvedRepositoryRelation,
  graph: RelationGraph,
  sourceAlias: string,
  client: Knex,
  boolean: 'and' | 'or',
  depth: number,
): void {
  const targetAlias = `repository_filter_${depth}`;
  const throughAlias = `repository_filter_through_${depth}`;
  const subquery = tableQuery(client, resolved.target, targetAlias).select(
    client.raw('1'),
  );
  correlateRelation(
    subquery,
    resolved,
    sourceAlias,
    targetAlias,
    throughAlias,
    client,
  );
  if (node.filter) {
    applyFilter(
      subquery,
      resolved.target,
      node.filter,
      graph,
      targetAlias,
      client,
      depth + 1,
    );
  }
  const negate =
    node.quantifier === 'none' ||
    node.quantifier === 'notExists' ||
    node.quantifier === 'empty';
  const method = negate
    ? boolean === 'or'
      ? 'orWhereNotExists'
      : 'whereNotExists'
    : boolean === 'or'
      ? 'orWhereExists'
      : 'whereExists';
  query[method](subquery);
}

type RelationSortValue =
  | { readonly kind: 'field'; readonly field: string }
  | {
      readonly kind: 'aggregate';
      readonly aggregate: 'count' | 'sum' | 'avg' | 'min' | 'max';
      readonly field?: string;
    };

function relationSortSubquery(
  client: Knex,
  path: readonly ResolvedRepositoryRelation[],
  sourceAlias: string,
  value: RelationSortValue,
): Knex.QueryBuilder {
  const [first, ...rest] = path;
  if (!first) throw new Error('Relation sort path must not be empty.');
  const firstAlias = 'repository_sort_0';
  const query = tableQuery(client, first.target, firstAlias);
  correlateRelation(
    query,
    first,
    sourceAlias,
    firstAlias,
    'repository_sort_through_0',
    client,
  );
  let currentAlias = firstAlias;
  let currentCollection = first.target;
  for (const [index, resolved] of rest.entries()) {
    const targetAlias = `repository_sort_${index + 1}`;
    joinRelation(
      query,
      resolved,
      currentAlias,
      targetAlias,
      `repository_sort_through_${index + 1}`,
      client,
    );
    currentAlias = targetAlias;
    currentCollection = resolved.target;
  }
  if (value.kind === 'field') {
    return query.select(
      qualified(currentAlias, column(currentCollection, value.field)),
    );
  }
  const aggregateColumn = value.field
    ? qualified(currentAlias, column(currentCollection, value.field))
    : '*';
  const expression = aggregateSql(
    client,
    value.aggregate,
    aggregateColumn,
    false,
    scalarFields(currentCollection).find((field) => field.name === value.field),
  );
  const result =
    value.aggregate === 'sum'
      ? client.raw('coalesce(?, 0)', [expression])
      : expression;
  const projected =
    getDatabaseDriverRuntime(client)?.repository?.relationAggregateProjection?.(
      {
        client,
        value: result,
        aggregate: value.aggregate,
      },
    ) ?? result;
  return query.select(projected);
}

function joinRelation(
  query: Knex.QueryBuilder,
  resolved: ResolvedRepositoryRelation,
  sourceAlias: string,
  targetAlias: string,
  throughAlias: string,
  client: Knex,
): void {
  if (resolved.type === 'belongsTo') {
    query.join(
      collectionReference(client, resolved.target, targetAlias),
      qualified(targetAlias, column(resolved.target, resolved.targetKey)),
      qualified(sourceAlias, resolved.sourceColumn),
    );
    return;
  }
  if (resolved.type === 'hasOne' || resolved.type === 'hasMany') {
    query.join(
      collectionReference(client, resolved.target, targetAlias),
      qualified(
        targetAlias,
        column(resolved.target, resolved.targetForeignKey),
      ),
      qualified(sourceAlias, column(resolved.source, resolved.sourceKey)),
    );
    return;
  }
  query
    .join(
      collectionReference(client, resolved.through, throughAlias),
      qualified(
        throughAlias,
        column(resolved.through, resolved.throughSourceForeignKey),
      ),
      qualified(sourceAlias, column(resolved.source, resolved.sourceKey)),
    )
    .join(
      collectionReference(client, resolved.target, targetAlias),
      qualified(targetAlias, column(resolved.target, resolved.targetKey)),
      qualified(
        throughAlias,
        column(resolved.through, resolved.throughTargetForeignKey),
      ),
    );
}

function correlateRelation(
  query: Knex.QueryBuilder,
  resolved: ResolvedRepositoryRelation,
  sourceAlias: string,
  targetAlias: string,
  throughAlias: string,
  client: Knex,
): void {
  switch (resolved.type) {
    case 'belongsTo':
      query.whereRaw('?? = ??', [
        qualified(targetAlias, column(resolved.target, resolved.targetKey)),
        qualified(sourceAlias, resolved.sourceColumn),
      ]);
      return;
    case 'hasOne':
    case 'hasMany':
      query.whereRaw('?? = ??', [
        qualified(
          targetAlias,
          column(resolved.target, resolved.targetForeignKey),
        ),
        qualified(sourceAlias, column(resolved.source, resolved.sourceKey)),
      ]);
      return;
    case 'belongsToMany':
      query
        .join(
          collectionReference(client, resolved.through, throughAlias),
          qualified(
            throughAlias,
            column(resolved.through, resolved.throughTargetForeignKey),
          ),
          qualified(targetAlias, column(resolved.target, resolved.targetKey)),
        )
        .whereRaw('?? = ??', [
          qualified(
            throughAlias,
            column(resolved.through, resolved.throughSourceForeignKey),
          ),
          qualified(sourceAlias, column(resolved.source, resolved.sourceKey)),
        ]);
  }
}

function applyUnique(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  unique: UniqueSelector,
): void {
  for (const field of unique.fields) {
    query.where(
      column(collection, field),
      '=',
      bindQueryValue(
        query,
        collection,
        field,
        unique.values[field],
      ) as Knex.Value,
    );
  }
}

function relationKeyValue(
  client: Knex,
  collection: CollectionDefinition,
  name: string,
  value: unknown,
): Knex.Value {
  const field = scalarFields(collection).find((item) => item.name === name);
  return (
    field?.type === 'boolean'
      ? (getDatabaseDriverRuntime(client)?.repository?.encodeBoolean?.(
          field,
          value,
        ) ?? normalizeBooleanValue(field, value))
      : value
  ) as Knex.Value;
}

function bindQueryValue(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  name: string | Knex.Raw,
  value: unknown,
): unknown {
  const field = scalarFields(collection).find((item) => item.name === name);
  const runtimeClient = query.client as unknown as Knex;
  const custom = field
    ? getDatabaseDriverRuntime(runtimeClient)?.repository?.bindValue?.({
        client: runtimeClient,
        collection,
        field,
        value: value as FilterValue,
      })
    : undefined;
  if (custom !== undefined) return custom;
  if (field?.type === 'char' && typeof value === 'string') {
    // Dialect-specific character bindings are applied by the runtime
    // strategy when the owning Knex client is available to the caller.
  }
  if (field?.type === 'boolean') return normalizeBooleanValue(field, value);
  if (field && isTemporalType(field.type)) {
    const temporal = temporalBinding(
      { client: query.client, raw: query.client.raw.bind(query.client) },
      field,
      value,
    );
    return temporal;
  }
  return value;
}

/**
 * Most row selectors one statement carries. Each selector is one OR branch,
 * and SQLite refuses an expression nested deeper than 1000 levels, so a write
 * or reload addressed to every locked row of a bulk call is split.
 */
const SELECTOR_BATCH_SIZE = 200;

/**
 * Most selector values one statement binds. MSSQL allows 2100 parameters in
 * a statement; the rest is left for the values a write sets and the scope it
 * is checked against.
 */
const SELECTOR_PARAMETER_BUDGET = 1000;

export function selectorBatches(
  selectors: readonly UniqueSelector[],
): UniqueSelector[][] {
  const width = Math.max(1, selectors[0]?.fields.length ?? 1);
  const size = Math.max(
    1,
    Math.min(
      SELECTOR_BATCH_SIZE,
      Math.floor(SELECTOR_PARAMETER_BUDGET / width),
    ),
  );
  const batches: UniqueSelector[][] = [];
  for (let start = 0; start < selectors.length; start += size) {
    batches.push(selectors.slice(start, start + size));
  }
  return batches;
}

function applySelectors(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  selectors: readonly UniqueSelector[],
): void {
  query.where(function applySelectorSet(this: Knex.QueryBuilder): void {
    for (const selector of selectors) {
      this.orWhere(function applySelector(this: Knex.QueryBuilder): void {
        applyUnique(this, collection, selector);
      });
    }
  });
}

function whereValue(
  query: Knex.QueryBuilder,
  boolean: 'and' | 'or',
  name: string,
  operator: string,
  value: unknown,
): void {
  if (boolean === 'or') {
    (query.orWhere as (...args: unknown[]) => unknown)(name, operator, value);
  } else {
    (query.where as (...args: unknown[]) => unknown)(name, operator, value);
  }
}

function whereCallback(
  query: Knex.QueryBuilder,
  boolean: 'and' | 'or',
  callback: (this: Knex.QueryBuilder) => void,
): void {
  if (boolean === 'or') query.orWhere(callback);
  else query.where(callback);
}

function applyVersion(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
  ifVersion: string | number | undefined,
): void {
  if (ifVersion !== undefined && collection.optimisticLock) {
    query.where(
      column(collection, collection.optimisticLock.field),
      '=',
      ifVersion,
    );
  }
}

function incrementVersion(
  query: Knex.QueryBuilder,
  collection: CollectionDefinition,
): void {
  if (collection.optimisticLock) {
    query.increment(column(collection, collection.optimisticLock.field), 1);
  }
}

function withInitialVersion(
  collection: CollectionDefinition,
  values: RepositoryRecord,
): RepositoryRecord {
  return collection.optimisticLock
    ? { ...values, [collection.optimisticLock.field]: 1 }
    : values;
}

/**
 * Intersect a caller filter with a Policy scope without flattening either, so
 * an `or` group on one side cannot escape the other.
 */
function withRelationScope(
  filter: FilterAst | undefined,
  scope: FilterAst | undefined,
): FilterAst | undefined {
  if (!scope) return filter;
  if (!filter) return scope;
  return {
    kind: 'filter',
    version: 1,
    root: { kind: 'group', logic: 'and', items: [filter.root, scope.root] },
  };
}

function versionOf(
  collection: CollectionDefinition,
  record: RepositoryRecord,
): string | number | undefined {
  if (!collection.optimisticLock) return undefined;
  const version = record[collection.optimisticLock.field];
  if (
    typeof version === 'string' &&
    /^-?\d+$/u.test(version) &&
    Number.isSafeInteger(Number(version))
  ) {
    return Number(version);
  }
  return version as string | number | undefined;
}

function firstReturnedRow(value: unknown): RepositoryRecord | undefined {
  return Array.isArray(value) && isRecord(value[0]) ? value[0] : undefined;
}

function selectorFromFields(
  collection: CollectionDefinition,
  record: RepositoryRecord,
  fields: readonly string[],
): UniqueSelector {
  const values = Object.fromEntries(
    fields.map((field) => [field, record[field]]),
  );
  if (fields.some((field) => values[field] === undefined)) {
    throw new Error(
      `Repository record for Collection "${collection.name}" has no value for its stable identity.`,
    );
  }
  return { kind: 'unique', fields, values };
}

function relationForeignKeyNullable(
  resolved: ResolvedRepositoryRelation,
): boolean {
  const field = resolved.target.fields?.find(
    (candidate) => candidate.name === resolved.targetForeignKey,
  );
  return Boolean(field && isScalarField(field) && field.nullable !== false);
}

function relationActionNotAllowed(
  resolved: ResolvedRepositoryRelation,
  action: string,
): never {
  throw new RepositoryError(
    'RELATION_ACTION_NOT_ALLOWED',
    `Action "${action}" is not allowed for Relation "${resolved.relation.name}".`,
    {
      collection: resolved.source.name,
      relation: resolved.relation.name,
      details: { received: action },
    },
  );
}

function relationTargetNotFound(resolved: ResolvedRepositoryRelation): never {
  throw new RepositoryError(
    'RELATION_TARGET_NOT_FOUND',
    'Relation target was not found in the current relation scope.',
    {
      collection: resolved.source.name,
      relation: resolved.relation.name,
    },
  );
}

function multipleRelationTargetsMatched(
  resolved: ResolvedRepositoryRelation,
): never {
  throw new RepositoryError(
    'MULTIPLE_RELATION_TARGETS_MATCHED',
    'Relation target filter matched more than one record in the current relation scope.',
    {
      collection: resolved.source.name,
      relation: resolved.relation.name,
    },
  );
}

function uniqueFilter(unique: UniqueSelector): FilterAst {
  return {
    kind: 'filter',
    version: 1,
    root: {
      kind: 'group',
      logic: 'and',
      items: unique.fields.map((field) => ({
        kind: 'condition',
        path: [field],
        operator: '$eq',
        value: unique.values[field] as FilterValue,
      })),
    },
  };
}

function selectorsFilter(selectors: readonly UniqueSelector[]): FilterAst {
  return {
    kind: 'filter',
    version: 1,
    root: {
      kind: 'group',
      logic: 'or',
      items: selectors.map((selector) => uniqueFilter(selector).root),
    },
  };
}

function stableIdentityFields(collection: CollectionDefinition): string[] {
  const constraint = (collection.constraints ?? []).find(
    (candidate) => candidate.type === 'primary',
  );
  if (constraint?.type === 'primary') return [...constraint.fields];
  const unique = (collection.constraints ?? []).find(
    (candidate) => candidate.type === 'unique',
  );
  if (unique?.type === 'unique') return [...unique.fields];
  throw new Error('Repository Collection has no stable identity fields.');
}

function selectorKey(selector: UniqueSelector): string {
  return selector.fields
    .map(
      (field) =>
        `${JSON.stringify(field)}:${associationKey(selector.values[field])}`,
    )
    .join('|');
}

function assertBulkMutationCount(
  operation: 'updateMany' | 'deleteMany',
  affected: number,
  expected: number,
): void {
  if (affected !== expected) {
    throw new Error(
      `${operation} affected ${affected} records after locking ${expected} records.`,
    );
  }
}

function affectedCount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.length;
  return 0;
}

function insertedCount(value: unknown, fallback: number): number {
  void value;
  return fallback;
}

function isRecord(value: unknown): value is RepositoryRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTransaction(client: Knex): client is Knex.Transaction {
  return Boolean((client as Knex.Transaction).isTransaction);
}

function stringFilterValue(value: FilterValue | undefined): string {
  if (typeof value !== 'string') {
    throw new Error('String filter operator requires a string value.');
  }
  return value;
}

function isTextualField(
  collection: CollectionDefinition,
  field: string,
): boolean {
  const type = collection.fields?.find((item) => item.name === field)?.type;
  return (
    type === 'string' || type === 'char' || type === 'uuid' || type === 'text'
  );
}
