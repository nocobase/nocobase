import type { DatabaseManager } from '@nocobase/db';
import { ApiError } from '@nocobase/app-server/router';
import {
  lifecycleDescriptionViewAsync,
  type LifecycleRuntime,
} from '@nocobase/lifecycle';
import type {
  WorkflowSummary,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionDetail,
  WorkflowExecutionPage,
} from '../../shared/workflows.js';

export interface WorkflowSource {
  readonly source: WorkflowSummary['source'];
  readonly runtime: LifecycleRuntime;
  readonly definitions: readonly {
    readonly name: string;
    readonly collection: string;
    readonly stateField: string;
  }[];
}

function scalarText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

/** Reads the existing example runtimes; management never creates or operates an execution. */
export class WorkflowsService {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly sources: readonly WorkflowSource[],
  ) {}

  public definitions(): WorkflowSummary[] {
    return this.sources.flatMap((source) =>
      source.definitions.map(({ name }) => {
        const description = source.runtime.describe(name);
        return {
          id: `${source.source}.${name}`,
          name,
          source: source.source,
          states: description.states.length,
          transitions: description.transitions.length,
        };
      }),
    );
  }

  private resolve(id: string) {
    for (const source of this.sources) {
      const definition = source.definitions.find(
        (item) => `${source.source}.${item.name}` === id,
      );
      if (definition) return { ...definition, runtime: source.runtime };
    }
    throw new ApiError({
      status: 'NOT_FOUND',
      reason: 'WORKFLOW_NOT_FOUND',
      domain: 'examples',
      message: 'The workflow does not exist.',
    });
  }

  public async definition(id: string): Promise<WorkflowDefinition> {
    const { runtime, name } = this.resolve(id);
    return {
      workflow: this.definitions().find((item) => item.id === id)!,
      ...(await lifecycleDescriptionViewAsync(runtime, name, {
        record: null,
        transactionHandle: undefined,
      })),
    };
  }

  public async executions(
    page: number,
    pageSize: number,
    workflowId?: string,
    order: 'newest' | 'oldest' = 'newest',
  ): Promise<WorkflowExecutionPage> {
    const workflows = workflowId
      ? [this.definitions().find((item) => item.id === workflowId)!]
      : this.definitions();
    if (workflowId) this.resolve(workflowId);
    const offset = (page - 1) * pageSize;
    // Each collection contributes only its newest candidates. Merge using the same date/id ordering as the queries;
    // a single-flow filter can page directly without fetching earlier pages.
    const pages = await Promise.all(
      workflows.map(async (workflow) => {
        const definition = this.resolve(workflow.id);
        const repository = this.database.repository(definition.collection);
        const [rows, total] = await Promise.all([
          repository.findMany({
            sort: (sort) => [
              order === 'newest'
                ? sort.field('createdAt').desc()
                : sort.field('createdAt').asc(),
              order === 'newest'
                ? sort.field('id').desc()
                : sort.field('id').asc(),
            ],
            limit: workflowId ? pageSize : offset + pageSize,
            offset: workflowId ? offset : 0,
          }),
          repository.count({}),
        ]);
        return {
          total,
          records: rows.map((row): WorkflowExecution => ({
            workflowId: workflow.id,
            recordId: scalarText(row.id),
            title: scalarText(
              row.title ??
                row.subject ??
                row.orderRef ??
                row.sku ??
                row.plan ??
                `#${scalarText(row.id)}`,
            ),
            state: scalarText(row[definition.stateField]),
            createdAt:
              row.createdAt instanceof Date
                ? row.createdAt.toISOString()
                : scalarText(row.createdAt),
          })),
        };
      }),
    );
    const ordered = pages
      .flatMap((item) => item.records)
      .sort(
        (a, b) =>
          (order === 'newest' ? -1 : 1) *
            a.createdAt.localeCompare(b.createdAt) ||
          (order === 'newest' ? -1 : 1) *
            (Number(a.recordId) - Number(b.recordId)) ||
          a.workflowId.localeCompare(b.workflowId),
      );
    return {
      data: ordered.slice(
        workflowId ? 0 : offset,
        workflowId ? pageSize : offset + pageSize,
      ),
      meta: {
        page,
        pageSize,
        total: pages.reduce((sum, item) => sum + item.total, 0),
      },
    };
  }

  public async execution(
    workflowId: string,
    recordId: string,
    actorId: string,
  ): Promise<WorkflowExecutionDetail> {
    const { runtime, name, collection } = this.resolve(workflowId);
    if (
      !(await this.database
        .repository(collection)
        .findOne({ filter: { id: Number(recordId) } }))
    )
      throw new ApiError({
        status: 'NOT_FOUND',
        reason: 'EXECUTION_NOT_FOUND',
        domain: 'examples',
        message: 'The workflow execution does not exist.',
      });
    const view = await runtime.view(name, recordId, { id: actorId });
    return {
      ...(await this.definition(workflowId)),
      view: { ...view, record: { ...view.record, id: String(view.record.id) } },
    };
  }
}
