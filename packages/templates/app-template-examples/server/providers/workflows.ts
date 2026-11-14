import {
  workflowNamesEnUS,
  workflowNamesZhCN,
} from '../../shared/workflow-names.js';
import { WorkflowCatalogService } from '@nocobase/app-plugin-lifecycle-example/server';
import type { DatabaseManager, FilterBuilder, Row } from '@nocobase/db';
import { ApiError } from '@nocobase/app-server/router';
import {
  lifecycleDescriptionViewAsync,
  LifecycleError,
  type LifecycleRuntime,
  type LifecycleRecord,
} from '@nocobase/lifecycle';
import type {
  WorkflowSummary,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionDetail,
  WorkflowExecutionPage,
  WorkflowVersion,
} from '../../shared/workflows.js';

export interface WorkflowSource {
  readonly source: WorkflowSummary['source'];
  readonly runtime: LifecycleRuntime;
  /** Every version to show, each by its definition name. */
  readonly definitions: readonly {
    readonly name: string;
    readonly collection: string;
    readonly stateField: string;
  }[];
}

/**
 * One process of one source: its versions share the key, the table and the
 * field naming each record's version, as the runtime's registration
 * checks.
 */
interface WorkflowGroup {
  readonly id: string;
  readonly key: string;
  readonly source: WorkflowSummary['source'];
  readonly runtime: LifecycleRuntime;
  readonly collection: string;
  readonly stateField: string;
  /** Unset only for a legacy process with a single version. */
  readonly definitionField?: string;
  /** Oldest first; the last is the latest. */
  readonly versions: readonly WorkflowVersion[];
}

function scalarText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function notFound(): ApiError {
  return new ApiError({
    status: 'NOT_FOUND',
    reason: 'WORKFLOW_NOT_FOUND',
    domain: 'examples',
    message: 'The workflow does not exist.',
  });
}

/**
 * Groups the sources' definitions into processes by key. Each runtime
 * refuses a duplicate name or version when it registers a definition; the
 * sources are separate runtimes, so a key two of them register, or a
 * version listed twice, is refused here, at startup, instead of merging two
 * processes into one.
 */
export function workflowGroups(
  sources: readonly WorkflowSource[],
): WorkflowGroup[] {
  const groups = new Map<
    string,
    Omit<WorkflowGroup, 'versions'> & { versions: WorkflowVersion[] }
  >();
  const owners = new Map<string, WorkflowSummary['source']>();
  for (const { source, runtime, definitions } of sources)
    for (const { name, collection, stateField } of definitions) {
      const { key, version, definitionField } = runtime.definition(name);
      const owner = owners.get(key);
      if (owner !== undefined && owner !== source)
        throw new Error(
          `Workflow key "${key}" is registered by both the "${owner}" and the "${source}" sources; a process belongs to one source.`,
        );
      owners.set(key, source);
      const id = `${source}.${key}`;
      const group = groups.get(id) ?? {
        id,
        key,
        source,
        runtime,
        collection,
        stateField,
        ...(definitionField === undefined ? {} : { definitionField }),
        versions: [],
      };
      if (group.versions.some((other) => other.version === version))
        throw new Error(
          `Workflow "${id}" lists version ${version} twice; each version of a process is one definition.`,
        );
      group.versions.push({ name, version });
      groups.set(id, group);
    }
  return [...groups.values()].map((group) => ({
    ...group,
    versions: group.versions.sort((a, b) => a.version - b.version),
  }));
}

/** Reads the existing example runtimes; management never creates or operates an execution. */
export class WorkflowsService {
  private readonly groups: readonly WorkflowGroup[];

  public constructor(
    private readonly database: DatabaseManager,
    sources: readonly WorkflowSource[],
  ) {
    this.groups = workflowGroups(sources);
  }

  private summary(
    group: WorkflowGroup,
  ): Omit<WorkflowSummary, 'executionCount' | 'lastExecutedAt'> {
    const latest = group.versions.at(-1)!;
    const description = group.runtime.describe(latest.name);
    // The list shows the latest version's shape; statistics count them all.
    return {
      id: group.id,
      name: group.key,
      version: latest.version,
      versions: group.versions,
      source: group.source,
      states: description.states.length,
      transitions: description.transitions.length,
    };
  }

  private matchesKeyword(group: WorkflowGroup, q = ''): boolean {
    const keyword = q.trim().toLocaleLowerCase();
    // A version's own name finds its process, so an old name still leads
    // somewhere after its process gained versions.
    return [
      group.id,
      group.key,
      ...group.versions.map((version) => version.name),
      workflowNamesEnUS[group.key as keyof typeof workflowNamesEnUS],
      workflowNamesZhCN[group.key as keyof typeof workflowNamesZhCN],
    ].some((value) => value?.toLocaleLowerCase().includes(keyword));
  }

  /**
   * The records of these versions. A legacy process without a definition
   * field has one version and the table to itself.
   */
  private bound(group: WorkflowGroup, names: readonly string[]) {
    const field = group.definitionField;
    return field === undefined
      ? {}
      : {
          filter: (filter: FilterBuilder) =>
            filter.or(names.map((name) => filter.string(field).eq(name))),
        };
  }

  public async definitions(
    q = '',
    category = 'all',
  ): Promise<WorkflowSummary[]> {
    const categories = await new WorkflowCatalogService(
      this.database,
    ).assignments();
    return Promise.all(
      this.groups
        .filter(
          (group) =>
            this.matchesKeyword(group, q) &&
            (category === 'all' ||
              (category === 'uncategorized'
                ? !categories.has(group.id)
                : categories.get(group.id) === category)),
        )
        .map(async (group) => ({
          ...this.summary(group),
          categoryId: categories.get(group.id) ?? null,
          ...(await this.executionStats(group)),
        })),
    );
  }

  /** The process `id` names, by its own id or a version's legacy one. */
  public workflowId(id: string): string {
    return this.resolve(id).group.id;
  }

  private async executionStats(
    group: WorkflowGroup,
    names: readonly string[] = group.versions.map(({ name }) => name),
  ): Promise<Pick<WorkflowSummary, 'executionCount' | 'lastExecutedAt'>> {
    const repository = this.database.repository(group.collection);
    // Match the execution list: one lifecycle-managed business record is
    // one execution, counted for the version it is bound to.
    const bound = this.bound(group, names);
    const [executionCount, latest] = await Promise.all([
      repository.count(bound),
      repository.findMany({
        ...bound,
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

  /**
   * `<source>.<key>` names a process. A link from before its process had
   * versions may name a version, `<source>.<name>`: it opens that version
   * of the process. A version whose name is the key has the process's own
   * id, so its old links open the process at its latest version.
   */
  private resolve(id: string): {
    group: WorkflowGroup;
    version?: WorkflowVersion;
  } {
    const group = this.groups.find((item) => item.id === id);
    if (group) return { group };
    for (const candidate of this.groups) {
      const version = candidate.versions.find(
        (item) => `${candidate.source}.${item.name}` === id,
      );
      if (version) return { group: candidate, version };
    }
    throw notFound();
  }

  private versionOf(
    group: WorkflowGroup,
    number: number | undefined,
    fallback?: WorkflowVersion,
  ): WorkflowVersion {
    if (number === undefined) return fallback ?? group.versions.at(-1)!;
    const version = group.versions.find((item) => item.version === number);
    if (!version) throw notFound();
    return version;
  }

  public async definition(
    id: string,
    number?: number,
    record?: LifecycleRecord,
  ): Promise<WorkflowDefinition> {
    const resolved = this.resolve(id);
    const { group } = resolved;
    const selected = this.versionOf(group, number, resolved.version);
    const categories = await new WorkflowCatalogService(
      this.database,
    ).assignments();
    const [stats, versionStats, view] = await Promise.all([
      this.executionStats(group),
      group.versions.length > 1
        ? this.executionStats(group, [selected.name])
        : undefined,
      lifecycleDescriptionViewAsync(group.runtime, selected.name, {
        record: record ?? null,
        transactionHandle: undefined,
      }),
    ]);
    return {
      workflow: {
        ...this.summary(group),
        categoryId: categories.get(group.id) ?? null,
        ...stats,
      },
      definition: {
        ...selected,
        executionCount: (versionStats ?? stats).executionCount,
      },
      ...view,
    };
  }

  public async executions(
    page: number,
    pageSize: number,
    workflowId?: string,
    order: 'newest' | 'oldest' = 'newest',
    q = '',
    version?: number,
  ): Promise<WorkflowExecutionPage> {
    const selected = workflowId ? this.resolve(workflowId).group : undefined;
    const only = selected && this.versionOf(selected, version);
    const groups = (selected ? [selected] : this.groups).filter((group) =>
      this.matchesKeyword(group, q),
    );
    const single = groups.length === 1;
    const offset = (page - 1) * pageSize;
    // Each collection contributes only its newest candidates. Merge using the same date/id ordering as the queries;
    // a single-flow filter can page directly without fetching earlier pages.
    const pages = await Promise.all(
      groups.map(async (group) => {
        const repository = this.database.repository(group.collection);
        const bound = this.bound(
          group,
          only && version !== undefined
            ? [only.name]
            : group.versions.map(({ name }) => name),
        );
        const [rows, total] = await Promise.all([
          repository.findMany({
            ...bound,
            sort: (sort) => [
              order === 'newest'
                ? sort.field('createdAt').desc()
                : sort.field('createdAt').asc(),
              order === 'newest'
                ? sort.field('id').desc()
                : sort.field('id').asc(),
            ],
            limit: single ? pageSize : offset + pageSize,
            offset: single ? offset : 0,
          }),
          repository.count(bound),
        ]);
        return {
          total,
          records: rows.map((row): WorkflowExecution => {
            const definition = this.boundVersion(group, row);
            return {
              workflowId: group.id,
              recordId: scalarText(row.id),
              title: scalarText(
                row.title ??
                  row.subject ??
                  row.orderRef ??
                  row.sku ??
                  row.plan ??
                  `#${scalarText(row.id)}`,
              ),
              state: scalarText(row[group.stateField]),
              definition: definition.name,
              version: definition.version,
              createdAt:
                row.createdAt instanceof Date
                  ? row.createdAt.toISOString()
                  : scalarText(row.createdAt),
            };
          }),
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
        single ? 0 : offset,
        single ? pageSize : offset + pageSize,
      ),
      meta: {
        page,
        pageSize,
        total: pages.reduce((sum, item) => sum + item.total, 0),
      },
    };
  }

  /** A listed row is bound to one of the versions it was filtered by. */
  private boundVersion(group: WorkflowGroup, row: Row): WorkflowVersion {
    const name =
      group.definitionField === undefined
        ? undefined
        : row[group.definitionField];
    return (
      group.versions.find((item) => item.name === name) ??
      group.versions.at(-1)!
    );
  }

  public async execution(
    workflowId: string,
    recordId: string,
    actorId: string,
  ): Promise<WorkflowExecutionDetail> {
    const { group } = this.resolve(workflowId);
    const record = await this.database
      .repository(group.collection)
      .findOne({ filter: { id: Number(recordId) } });
    const missing = () =>
      new ApiError({
        status: 'NOT_FOUND',
        reason: 'EXECUTION_NOT_FOUND',
        domain: 'examples',
        message: 'The workflow execution does not exist.',
      });
    if (!record) throw missing();
    let name: string;
    try {
      // The definition the record is bound to, never the latest by default.
      name = group.runtime.recordLifecycle(group.key, {
        ...record,
        id: recordId,
      });
    } catch (error) {
      // Not a record this process started.
      if (error instanceof LifecycleError) throw missing();
      throw error;
    }
    const version = group.versions.find((item) => item.name === name);
    if (!version) throw missing();
    const view = await group.runtime.view(name, recordId, { id: actorId });
    return {
      ...(await this.definition(group.id, version.version, view.record)),
      view: { ...view, record: { ...view.record, id: String(view.record.id) } },
    };
  }
}
