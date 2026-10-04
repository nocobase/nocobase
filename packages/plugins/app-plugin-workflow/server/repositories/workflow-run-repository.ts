import { randomUUID } from 'node:crypto';
import type { DatabaseManager, FilterBuilder, FilterNode } from '@nocobase/db';
import {
  anyOfIds,
  anyOfStrings,
  workflowStore,
  type WorkflowStore,
} from '../collections/index.js';
import {
  asIdFilter,
  type JsonObject,
  type WorkflowEventOptions,
  type WorkflowId,
  type WorkflowTriggerReceipt,
} from '../engine/index.js';
import type { WorkflowServiceApi } from '../service.js';
import { ApiError } from '@nocobase/app-server/router';
import { workflowError } from '../errors.js';
import {
  normalizePage,
  parsePayload,
  requireJsonObject,
  toRunItem,
} from './mappers.js';
import {
  asWorkflowId,
  redactLog,
  redactPayload,
  toNodeRunSummary,
} from './mappers.js';
import { WorkflowRepository } from './workflow-repository.js';
import type {
  WorkflowPage,
  WorkflowNodeRunPayload,
  WorkflowNodeRunSummary,
  WorkflowRunDetail,
  WorkflowRunListItem,
  WorkflowRunListOptions,
} from './types.js';

export class WorkflowRunRepository {
  private readonly repository: WorkflowRepository;

  constructor(
    private readonly database: DatabaseManager,
    private readonly service: WorkflowServiceApi,
  ) {
    this.repository = new WorkflowRepository(database, service);
  }

  private get store(): WorkflowStore {
    return workflowStore(this.database);
  }

  async list(
    options: WorkflowRunListOptions = {},
  ): Promise<WorkflowPage<WorkflowRunListItem>> {
    const { page, pageSize, offset } = normalizePage(options);
    const store = this.store;
    if (options.workflowId !== undefined) {
      const workflowKey = await this.workflowKeyOf(options.workflowId);
      if (
        options.workflowKey !== undefined &&
        options.workflowKey !== workflowKey
      )
        return { data: [], page, pageSize, total: 0 };
      options = { ...options, workflowKey };
    }
    let titleKeys: string[] | undefined;
    if (options.workflowTitle) {
      const title = options.workflowTitle;
      const matches = await store.workflows.findMany({
        filter: (filter) =>
          filter.and([
            filter.boolean('current').isTrue(),
            filter.string('title').includes(title),
          ]),
        select: (select) => select.fields('key'),
      });
      titleKeys = [...new Set(matches.map((row) => String(row.key)))];
      if (titleKeys.length === 0) return { data: [], page, pageSize, total: 0 };
    }
    const keys = titleKeys;
    const runFilter = (filter: FilterBuilder): FilterNode => {
      const conditions: FilterNode[] = [];
      if (options.workflowKey)
        conditions.push(filter.string('workflowKey').eq(options.workflowKey));
      if (keys) conditions.push(anyOfStrings(filter, 'workflowKey', keys));
      if (options.status !== undefined)
        conditions.push(
          options.status === null
            ? filter.number('status').empty()
            : filter.number('status').eq(options.status),
        );
      return filter.and(conditions);
    };
    const [rows, total, workflows] = await Promise.all([
      store.runs.findMany({
        filter: runFilter,
        sort: (sort) => sort.field('id').desc(),
        limit: pageSize,
        offset,
      }),
      store.runs.count({ filter: runFilter }),
      store.workflows.findMany({
        select: (select) => select.fields('id', 'key', 'title', 'version'),
      }),
    ]);
    const currentTitles = new Map(
      workflows.map((row) => [
        String(row.key),
        row.title == null ? null : String(row.title),
      ]),
    );
    const versions = new Map(
      workflows.map((row) => [
        String(row.id),
        row.version == null ? null : String(row.version),
      ]),
    );
    return {
      data: rows.map((row) =>
        toRunItem(
          row,
          currentTitles.get(String(row.workflowKey)) ?? null,
          versions.get(String(row.workflowId)) ?? null,
        ),
      ),
      page,
      pageSize,
      total,
    };
  }

  /**
   * The key of the workflow a list filter names. The workflow is referenced from the query rather than the path, so a
   * missing one is an invalid argument, not a missing resource.
   */
  private async workflowKeyOf(workflowId: WorkflowId): Promise<string> {
    try {
      return (await this.repository.get(workflowId)).key;
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.reason === 'WORKFLOW_NOT_FOUND' ||
          error.reason === 'INVALID_WORKFLOW_ID')
      )
        throw workflowError({
          status: 'INVALID_ARGUMENT',
          reason: error.reason,
          message: error.message,
          fieldViolations: [
            { field: 'workflowId', description: error.message },
          ],
          cause: error,
        });
      throw error;
    }
  }

  async get(id: WorkflowId): Promise<WorkflowRunDetail> {
    // `include` keeps every scalar of the run and adds the two columns the
    // detail borrows from its workflow, which is the join this used to spell.
    const row = await this.store.runs.findOne({
      filter: { id: asIdFilter(id) },
      select: (select) =>
        select.include('workflow', (workflow) =>
          workflow.fields('title', 'version'),
        ),
    });
    if (!row)
      throw workflowError({
        status: 'NOT_FOUND',
        reason: 'WORKFLOW_RUN_NOT_FOUND',
        message: `Workflow run ${String(id)} was not found.`,
      });
    const workflow = (row.workflow ?? {}) as {
      title?: unknown;
      version?: unknown;
    };
    const nodeRuns = await this.latestNodeRuns(id);
    return {
      // `toRunItem` already carries `startedAt` and `finishedAt`, so the detail
      // only adds what a list item does not.
      ...toRunItem(
        row,
        String(workflow.title ?? '') || null,
        workflow.version == null ? null : String(workflow.version),
      ),
      hash: row.hash == null ? null : String(row.hash),
      input: parsePayload(row.input),
      manually:
        row.manually === true || row.manually === 1 || row.manually === '1',
      reason: row.reason == null ? null : String(row.reason),
      nodeRuns,
    };
  }

  async trigger(
    workflowKey: string,
    input: JsonObject,
    options: WorkflowEventOptions = {},
  ): Promise<WorkflowTriggerReceipt> {
    return this.service.trigger(workflowKey, input, options);
  }

  async nodeRuns(
    runId: WorkflowId,
    nodeKey?: string,
  ): Promise<WorkflowNodeRunSummary[]> {
    const rows = await this.store.nodeRuns.findMany({
      filter: (filter) =>
        filter.and([
          filter.number('workflowRunId').eq(asIdFilter(runId)),
          ...(nodeKey === undefined
            ? []
            : [filter.string('nodeKey').eq(nodeKey)]),
        ]),
      select: (select) =>
        select.fields(
          'id',
          'workflowRunId',
          'nodeId',
          'nodeKey',
          'status',
          'startedAt',
          'finishedAt',
        ),
      sort: (sort) => sort.field('id').asc(),
    });
    return rows.map((row) => toNodeRunSummary(row));
  }

  async nodeRunPayload(
    runId: WorkflowId,
    nodeRunId: WorkflowId,
  ): Promise<WorkflowNodeRunPayload> {
    const row = await this.store.nodeRuns.findOne({
      filter: {
        id: asIdFilter(nodeRunId),
        workflowRunId: asIdFilter(runId),
      },
    });
    if (!row)
      throw workflowError({
        status: 'NOT_FOUND',
        reason: 'NODE_RUN_NOT_FOUND',
        message: `Node run ${String(nodeRunId)} was not found.`,
      });
    const limit = 64 * 1024;
    const result = truncate(redactPayload(parsePayload(row.result)), limit);
    const error =
      row.error == null ? null : redactLog(String(row.error)).slice(0, limit);
    const log =
      row.log == null ? null : redactLog(String(row.log)).slice(0, limit);
    return {
      id: String(row.id),
      result: result.value,
      error,
      log,
      truncated:
        result.truncated ||
        (row.error != null && String(row.error).length > limit) ||
        (row.log != null && String(row.log).length > limit),
    };
  }

  async run(
    id: WorkflowId,
    input: unknown,
    options: WorkflowEventOptions = {},
  ): Promise<WorkflowRunListItem> {
    const workflow = await this.repository.resolveRevision(id);
    const eventKey = options.eventKey ?? randomUUID();
    const existing = await this.store.runs.findOne({
      filter: { eventKey },
    });
    if (existing) return toRunItem(existing);
    await this.service.triggerRevision(workflow.id, requireJsonObject(input), {
      ...options,
      eventKey,
      manually: true,
      deferred: false,
      waitForCompletion: false,
    });
    return this.findRun(
      eventKey,
      workflow.key,
      workflow.title,
      workflow.version,
    );
  }

  private async findRun(
    eventKey: string,
    workflowKey: string,
    workflowTitle: string | null = null,
    workflowVersion: string | null = null,
  ): Promise<WorkflowRunListItem> {
    const row = await this.store.runs.findOne({ filter: { eventKey } });
    if (!row)
      throw new Error(`Workflow run for ${workflowKey} was not persisted.`);
    return toRunItem(row, workflowTitle, workflowVersion);
  }

  private async latestNodeRuns(
    runId: WorkflowId,
  ): Promise<WorkflowNodeRunSummary[]> {
    const latest = await this.store.nodeRuns.groupBy({
      by: ['nodeKey'],
      aggregate: (aggregate) => ({ id: aggregate.max('id') }),
      filter: { workflowRunId: asIdFilter(runId) },
    });
    const ids = latest
      .map((row) => row.id)
      .filter((id): id is number | string => id != null)
      .map((id) => asWorkflowId(id));
    if (ids.length === 0) return [];
    const rows = await this.store.nodeRuns.findMany({
      filter: (filter) => anyOfIds(filter, 'id', ids),
      select: (select) =>
        select.fields(
          'id',
          'workflowRunId',
          'nodeId',
          'nodeKey',
          'status',
          'startedAt',
          'finishedAt',
        ),
      sort: (sort) => sort.field('id').asc(),
    });
    return rows.map((row) => toNodeRunSummary(row));
  }
}

function truncate(
  value: unknown,
  limit: number,
): { value: unknown; truncated: boolean } {
  const text = JSON.stringify(value);
  return text.length > limit
    ? { value: `${text.slice(0, limit)}…`, truncated: true }
    : { value, truncated: false };
}
