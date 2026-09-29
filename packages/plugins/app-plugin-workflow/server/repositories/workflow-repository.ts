import type {
  DatabaseManager,
  FilterBuilder,
  FilterNode,
  Row,
} from '@nocobase/db';
import {
  anyOfIds,
  anyOfStrings,
  workflowStore,
  workflowStoreOf,
  type WorkflowStore,
} from '../collections/index.js';
import {
  asIdFilter,
  loadWorkflow,
  serializeJson,
  normalizeWorkflowParameterValues,
  type WorkflowId,
  type WorkflowParameterValues,
} from '../engine/index.js';
import {
  activateWorkflowSource,
  type WorkflowDistArtifact,
} from '../loader/index.js';
import type { WorkflowServiceApi } from '../service.js';
import { BadRequestError } from '../errors.js';
import {
  asWorkflowId,
  normalizePage,
  parseWorkflowId,
  parseWorkflowIdentifier,
  toDiscoveredWorkflowDefinition,
  toWorkflowDefinitionView,
  toWorkflowListItem,
} from './mappers.js';
import type {
  WorkflowDefinitionView,
  WorkflowParameterSettings,
  WorkflowListItem,
  WorkflowListOptions,
  WorkflowPage,
} from './types.js';

export class WorkflowRepository {
  constructor(
    private readonly database: DatabaseManager,
    private readonly service: WorkflowServiceApi,
  ) {}

  private get store(): WorkflowStore {
    return workflowStore(this.database);
  }

  async list(
    options: WorkflowListOptions = {},
  ): Promise<WorkflowPage<WorkflowListItem>> {
    const { page, pageSize, offset } = normalizePage(options);
    const deployed = await this.service.discoverArtifacts();
    const deployedByKey = new Map(
      deployed.map((artifact) => [artifact.key, artifact]),
    );
    const deployedRows =
      deployed.length === 0
        ? []
        : await this.store.workflows.findMany({
            filter: (filter) =>
              filter.and([
                filter.boolean('current').isTrue(),
                anyOfStrings(
                  filter,
                  'key',
                  deployed.map((artifact) => artifact.key),
                ),
              ]),
            select: (select) => select.fields('id', 'key', 'hash'),
          });
    const deployedRowByKey = new Map(
      deployedRows.map((row) => [String(row.key), row]),
    );
    const listFilter = (filter: FilterBuilder): FilterNode =>
      filter.and([
        filter.boolean('current').isTrue(),
        ...this.workflowFilterConditions(filter, options),
      ]);
    const novelArtifacts = deployed.filter(
      (artifact) =>
        !deployedRowByKey.has(artifact.key) &&
        this.artifactMatchesListOptions(artifact, options),
    );
    const databaseTotal = await this.store.workflows.count({
      filter: listFilter,
    });
    const databasePageSize = Math.max(
      0,
      Math.min(pageSize, databaseTotal - offset),
    );
    const rows =
      databasePageSize === 0
        ? []
        : await this.store.workflows.findMany({
            filter: listFilter,
            select: (select) =>
              select.fields(
                'id',
                'key',
                'title',
                'enabled',
                'current',
                'parametersSchema',
                'version',
                'hash',
              ),
            sort: (sort) => sort.field('id').desc(),
            limit: databasePageSize,
            offset,
          });
    const rowKeys = rows.map((row) => String(row.key));
    const [statRows, activeRows, latestIdRows] =
      rowKeys.length === 0
        ? [[], [], []]
        : await Promise.all([
            this.store.stats.findMany({
              filter: (filter) => anyOfStrings(filter, 'key', rowKeys),
              select: (select) => select.fields('key', 'executed'),
            }),
            this.store.runs.groupBy({
              by: ['workflowKey'],
              aggregate: (aggregate) => ({
                activeRunCount: aggregate.count(),
              }),
              filter: (filter) =>
                filter.and([
                  anyOfStrings(filter, 'workflowKey', rowKeys),
                  filter.or([
                    filter.number('status').empty(),
                    filter.number('status').eq(0),
                  ]),
                ]),
            }),
            this.store.runs.groupBy({
              by: ['workflowKey'],
              aggregate: (aggregate) => ({ latestId: aggregate.max('id') }),
              filter: (filter) => anyOfStrings(filter, 'workflowKey', rowKeys),
            }),
          ]);
    const latestIds = latestIdRows
      .map((row) => row.latestId)
      .filter((id): id is number | string => id != null);
    const latestRows =
      latestIds.length === 0
        ? []
        : await this.store.runs.findMany({
            filter: (filter) => anyOfIds(filter, 'id', latestIds),
            select: (select) =>
              select.fields('id', 'workflowKey', 'status', 'createdAt'),
          });
    const executedByKey = new Map(
      statRows.map((row) => [String(row.key), Number(row.executed ?? 0)]),
    );
    const activeByKey = new Map(
      activeRows.map((row) => [
        String(row.workflowKey),
        Number(row.activeRunCount ?? 0),
      ]),
    );
    const latestByKey = new Map(
      latestRows.map((row) => [String(row.workflowKey), row]),
    );
    const items = rows.map((row) => {
      const key = String(row.key);
      const item = toWorkflowListItem(
        row,
        executedByKey.get(key) ?? 0,
        activeByKey.get(key) ?? 0,
        latestByKey.get(key),
      );
      const artifact = deployedByKey.get(key);
      deployedByKey.delete(key);
      if (artifact && artifact.digest !== item.hash) {
        return {
          ...item,
          pendingArtifact: {
            hash: artifact.digest,
            title: artifact.workflow.title ?? null,
          },
        };
      }
      return item;
    });
    const novelOffset = Math.max(0, offset - databaseTotal);
    const remaining = pageSize - items.length;
    for (const artifact of novelArtifacts.slice(
      novelOffset,
      novelOffset + remaining,
    )) {
      items.push({
        id: null,
        key: artifact.key,
        title: artifact.workflow.title ?? null,
        enabled: false,
        current: null,
        hasParameters:
          Object.keys(artifact.workflow.parameters ?? {}).length > 0,
        executed: 0,
        version: null,
        hash: artifact.digest,
        activeRunCount: 0,
        latestRun: null,
        pendingArtifact: null,
      });
    }
    return {
      data: items,
      page,
      pageSize,
      total: databaseTotal + novelArtifacts.length,
    };
  }

  private workflowFilterConditions(
    filter: FilterBuilder,
    options: WorkflowListOptions,
  ): FilterNode[] {
    const conditions: FilterNode[] = [];
    if (options.key) conditions.push(filter.string('key').eq(options.key));
    if (options.query) {
      const query = options.query;
      conditions.push(
        filter.or([
          filter.string('key').includes(query),
          filter.string('title').includes(query),
        ]),
      );
    }
    if (options.enabled !== undefined)
      conditions.push(
        options.enabled
          ? filter.boolean('enabled').isTrue()
          : filter.boolean('enabled').isFalse(),
      );
    return conditions;
  }

  private artifactMatchesListOptions(
    artifact: WorkflowDistArtifact,
    options: WorkflowListOptions,
  ): boolean {
    const query = options.query?.toLowerCase();
    return (
      (!options.key || artifact.key === options.key) &&
      (!query ||
        artifact.key.toLowerCase().includes(query) ||
        artifact.workflow.title?.toLowerCase().includes(query)) &&
      (options.enabled === undefined || options.enabled === false)
    );
  }

  async enable(idOrHash: WorkflowId): Promise<WorkflowListItem> {
    const resolved = await this.resolveRevision(idOrHash);
    const id = resolved.id;
    const workflow = await this.database.transaction(
      async (connection): Promise<WorkflowListItem> => {
        const store = workflowStoreOf(connection);
        const selected = await store.workflows.findOne({
          filter: { id: asIdFilter(id) },
          select: (select) =>
            select.fields(
              'id',
              'key',
              'title',
              'enabled',
              'current',
              'parametersSchema',
              'version',
              'hash',
            ),
        });
        if (!selected)
          throw new BadRequestError(`Workflow ${String(id)} was not found.`);
        await activateWorkflowSource(store, id);
        await store.workflows.updateMany({
          filter: { id: asIdFilter(id) },
          values: { enabled: true },
        });
        return toWorkflowListItem(
          { ...selected, enabled: true, current: true },
          await this.getExecutedCount(String(selected.key), store),
        );
      },
    );
    return workflow;
  }

  async disable(id: WorkflowId): Promise<WorkflowListItem> {
    return this.setCurrentEnabled(id, false);
  }

  async setStatus(id: WorkflowId, enabled: boolean): Promise<WorkflowListItem> {
    const result = await this.setCurrentEnabled(id, enabled);
    return result;
  }

  async getParameters(id: WorkflowId): Promise<WorkflowParameterSettings> {
    const workflow = await this.resolveRevision(id);
    return {
      id: workflow.id,
      schema: workflow.parametersSchema,
      values: workflow.parameterValues,
    };
  }

  async updateParameters(
    id: WorkflowId,
    values: unknown,
  ): Promise<WorkflowParameterSettings> {
    const workflow = await this.resolveRevision(id);
    let normalized: WorkflowParameterValues;
    try {
      normalized = normalizeWorkflowParameterValues(
        workflow.parametersSchema,
        values,
      );
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error ? error.message : String(error),
      );
    }
    await this.database.transaction(async (connection) => {
      const store = workflowStoreOf(connection);
      await store.workflows.updateMany({
        filter: { id: asIdFilter(workflow.id) },
        values: { parameterValues: serializeJson(normalized) },
      });
      // The first successful parameter save selects a disabled current revision.
      // Resolving a revision alone must not make this business decision.
      const current = await store.workflows.findOne({
        filter: { key: workflow.key, current: true },
        select: (select) => select.fields('id'),
      });
      if (!current) await activateWorkflowSource(store, workflow.id);
    });
    return {
      id: workflow.id,
      schema: workflow.parametersSchema,
      values: normalized,
    };
  }

  /** The latest discovered definition for a stable key, without materializing it. */
  async getSource(key: string): Promise<WorkflowDefinitionView> {
    const artifact = (await this.service.discoverArtifacts()).find(
      (candidate) => candidate.key === key,
    );
    if (!artifact)
      throw new BadRequestError(`Workflow source ${key} was not found.`);
    const row = await this.store.workflows.findOne({
      filter: { key, hash: artifact.digest },
      select: (select) => select.fields('id'),
    });
    if (row) return this.get(asWorkflowId(row.id));
    return {
      ...toDiscoveredWorkflowDefinition(artifact),
      executed: await this.getExecutedCount(key),
    };
  }

  async sourceRevisions(key: string): Promise<WorkflowDefinitionView[]> {
    return this.revisionsFor(await this.getSource(key));
  }

  async get(id: WorkflowId): Promise<WorkflowDefinitionView> {
    const identifier = parseWorkflowIdentifier(id);
    let workflow =
      identifier.kind === 'id'
        ? await loadWorkflow(this.store, identifier.value)
        : null;
    if (!workflow && identifier.kind === 'hash') {
      const materialized = await this.store.workflows.findOne({
        filter: { hash: identifier.value },
        select: (select) => select.fields('id'),
      });
      if (materialized)
        workflow = await loadWorkflow(
          this.store,
          asWorkflowId(materialized.id),
        );
    }
    if (!workflow) {
      if (identifier.kind === 'id')
        throw new BadRequestError(`Workflow ${String(id)} was not found.`);
      const artifact = (await this.service.discoverArtifacts()).find(
        (candidate) => candidate.digest === identifier.value,
      );
      if (!artifact)
        throw new BadRequestError(`Workflow ${String(id)} was not found.`);
      return {
        ...toDiscoveredWorkflowDefinition(artifact),
        executed: await this.getExecutedCount(artifact.key),
      };
    }
    const view: WorkflowDefinitionView = {
      ...toWorkflowDefinitionView(workflow),
      executed: await this.getExecutedCount(workflow.key),
      latestRun: null,
    };
    if (workflow.current) {
      // A broken current source must not prevent viewing a stored version.
      const artifact = (
        await this.service.discoverArtifacts().catch(() => [])
      ).find(
        (candidate) =>
          candidate.key === workflow.key && candidate.digest !== workflow.hash,
      );
      if (artifact)
        view.pendingArtifact = {
          hash: artifact.digest,
          title: artifact.workflow.title ?? null,
        };
    }
    return view;
  }

  /**
   * Every revision of the selected definition's key, newest first, including a
   * deployed Artifact that has no row yet.
   *
   * A deployed Artifact is only materialized into a revision row when something
   * enables or runs it, so listing rows alone leaves the candidate revision
   * unreachable until it has been activated -- and activating it is exactly
   * what someone who wants to read it first is trying to avoid. It is returned
   * with a null id and a null version, addressed by its Artifact hash, which
   * `get` already resolves without writing anything.
   */
  async revisions(id: WorkflowId): Promise<WorkflowDefinitionView[]> {
    return this.revisionsFor(await this.get(id));
  }

  private async revisionsFor(
    workflow: WorkflowDefinitionView,
  ): Promise<WorkflowDefinitionView[]> {
    const rows = await this.store.workflows.findMany({
      filter: { key: workflow.key },
      sort: (sort) => sort.field('id').desc(),
      select: (select) => select.fields('id', 'hash'),
    });
    const materialized = new Set(
      rows.map((row) => (row.hash == null ? '' : String(row.hash))),
    );
    const result: WorkflowDefinitionView[] = (
      await this.service.discoverArtifacts().catch((error: unknown) => {
        if (!workflow.id) throw error;
        return [];
      })
    )
      .filter(
        (artifact) =>
          artifact.key === workflow.key && !materialized.has(artifact.digest),
      )
      .map((artifact) => ({
        ...toDiscoveredWorkflowDefinition(artifact),
        executed: workflow.executed,
        latestRun: workflow.latestRun,
      }));
    for (const row of rows) {
      const revision = await loadWorkflow(this.store, asWorkflowId(row.id));
      if (revision)
        result.push({
          ...toWorkflowDefinitionView(revision),
          executed: workflow.executed,
          latestRun: workflow.latestRun,
        });
    }
    return result;
  }

  private async setCurrentEnabled(
    id: WorkflowId,
    enabled: boolean,
  ): Promise<WorkflowListItem> {
    const workflowId = asIdFilter(parseWorkflowId(id));
    const current = await this.store.workflows.findOne({
      filter: { id: workflowId, current: true },
      select: (select) => select.fields('id', 'key'),
    });
    if (!current)
      throw new BadRequestError(
        `Current workflow ${String(id)} was not found.`,
      );
    await this.database.transaction(async (connection) => {
      const store = workflowStoreOf(connection);
      await store.workflows.updateMany({
        filter: { key: String(current.key) },
        values: { enabled: false },
      });
      if (enabled)
        await store.workflows.updateMany({
          filter: { id: workflowId, current: true },
          values: { enabled: true, current: true },
        });
    });
    const row = await this.store.workflows.findOne({
      filter: { id: workflowId, current: true },
      select: (select) =>
        select.fields(
          'id',
          'key',
          'title',
          'enabled',
          'current',
          'parametersSchema',
        ),
    });
    if (!row)
      throw new BadRequestError(
        `Current workflow ${String(id)} was not found.`,
      );
    return toWorkflowListItem(
      row,
      await this.getExecutedCount(String(row.key)),
    );
  }

  async getExecutedCount(
    key: string,
    store: WorkflowStore = this.store,
  ): Promise<number> {
    const row = await store.stats.findOne({
      filter: { key },
      select: (select) => select.fields('executed'),
    });
    return Number(row?.executed ?? 0);
  }

  async findCurrentRowById(id: WorkflowId): Promise<Row | undefined> {
    return this.store.workflows.findOne({
      filter: { id: asIdFilter(parseWorkflowId(id)), current: true },
    });
  }

  async findCurrentRowByKey(key: string): Promise<Row | undefined> {
    return this.store.workflows.findOne({
      filter: { key, current: true },
    });
  }

  async resolveRevision(
    idOrHash: WorkflowId,
  ): Promise<NonNullable<Awaited<ReturnType<typeof loadWorkflow>>>> {
    const identifier = parseWorkflowIdentifier(idOrHash);
    let existing =
      identifier.kind === 'id'
        ? await loadWorkflow(this.store, identifier.value)
        : null;
    if (!existing && identifier.kind === 'hash') {
      const row = await this.store.workflows.findOne({
        filter: { hash: identifier.value },
        select: (select) => select.fields('id'),
      });
      if (row) existing = await loadWorkflow(this.store, asWorkflowId(row.id));
    }
    if (existing) {
      if (existing.hash)
        await this.service.ensureArtifactMaterialized(existing.hash);
      return existing;
    }
    if (identifier.kind === 'id')
      throw new BadRequestError(
        `Workflow id or hash ${String(idOrHash)} was not found.`,
      );
    const workflowId = await this.service.ensureArtifactMaterialized(
      identifier.value,
    );
    if (workflowId == null)
      throw new BadRequestError(
        `Workflow id or hash ${String(idOrHash)} was not found.`,
      );
    const materialized = await loadWorkflow(this.store, workflowId);
    if (!materialized)
      throw new BadRequestError(
        `Materialized workflow ${String(workflowId)} was not found.`,
      );
    return materialized;
  }

  async loadCurrentWorkflow(
    id: WorkflowId,
  ): Promise<NonNullable<Awaited<ReturnType<typeof loadWorkflow>>>> {
    const workflowId = parseWorkflowId(id);
    const isCurrent = await this.store.workflows.exists({
      filter: { id: asIdFilter(workflowId), current: true },
    });
    if (!isCurrent)
      throw new BadRequestError(
        `Current workflow ${String(id)} was not found.`,
      );
    const workflow = await loadWorkflow(this.store, workflowId);
    if (!workflow)
      throw new BadRequestError(`Workflow ${String(id)} was not found.`);
    return workflow;
  }
}
