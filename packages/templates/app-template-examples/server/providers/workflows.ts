import {
  workflowNamesEnUS,
  workflowNamesZhCN,
} from '../../shared/workflow-names.js';
import { WorkflowCatalogService } from '@nocobase/app-plugin-lifecycle-example/server';
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

  private summaries(): Omit<
    WorkflowSummary,
    'executionCount' | 'lastExecutedAt'
  >[] {
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

  private matchesKeyword(
    workflow: Pick<WorkflowSummary, 'id' | 'name'>,
    q = '',
  ): boolean {
    const keyword = q.trim().toLocaleLowerCase();
    return [
      workflow.id,
      workflow.name,
      workflowNamesEnUS[workflow.name as keyof typeof workflowNamesEnUS],
      workflowNamesZhCN[workflow.name as keyof typeof workflowNamesZhCN],
    ].some((value) => value?.toLocaleLowerCase().includes(keyword));
  }

  public async definitions(
    q = '',
    category = 'all',
  ): Promise<WorkflowSummary[]> {
    const categories = await new WorkflowCatalogService(
      this.database,
    ).assignments();
    return Promise.all(
      this.summaries()
        .filter(
          (workflow) =>
            this.matchesKeyword(workflow, q) &&
            (category === 'all' ||
              (category === 'uncategorized'
                ? !categories.has(workflow.id)
                : categories.get(workflow.id) === category)),
        )
        .map(async (workflow) => ({
          ...workflow,
          categoryId: categories.get(workflow.id) ?? null,
          ...(await this.executionStats(workflow.id)),
        })),
    );
  }

  public assertWorkflow(id: string): void {
    this.resolve(id);
  }

  private async executionStats(
    id: string,
  ): Promise<Pick<WorkflowSummary, 'executionCount' | 'lastExecutedAt'>> {
    const { collection } = this.resolve(id);
    const repository = this.database.repository(collection);
    // Match the execution list: one lifecycle-managed business record is one execution.
    const [executionCount, latest] = await Promise.all([
      repository.count({}),
      repository.findMany({
        select: (select) => select.fields('createdAt'),
        sort: (sort) => [sort.field('createdAt').desc()],
        limit: 1,
      }),
    ]);
    const createdAt = latest[0]?.createdAt;
    return {
      executionCount,
      lastExecutedAt:
        createdAt instanceof Date
          ? createdAt.toISOString()
          : scalarText(createdAt) || null,
    };
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
    const categories = await new WorkflowCatalogService(
      this.database,
    ).assignments();
    return {
      workflow: {
        ...this.summaries().find((item) => item.id === id)!,
        categoryId: categories.get(id) ?? null,
        ...(await this.executionStats(id)),
      },
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
    q = '',
  ): Promise<WorkflowExecutionPage> {
    const candidates = workflowId
      ? [this.summaries().find((item) => item.id === workflowId)!]
      : this.summaries();
    if (workflowId) this.resolve(workflowId);
    const workflows = candidates.filter((item) => this.matchesKeyword(item, q));
    const singleWorkflow = workflows.length === 1;
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
            limit: singleWorkflow ? pageSize : offset + pageSize,
            offset: singleWorkflow ? offset : 0,
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
        singleWorkflow ? 0 : offset,
        singleWorkflow ? pageSize : offset + pageSize,
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
