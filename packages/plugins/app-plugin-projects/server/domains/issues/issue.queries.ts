/**
 * Issue reads for the browser: a page of the list, the board, one issue in detail, and older activities. Everything is
 * limited to what the viewer may see (`issue.access.ts`).
 */
import {
  hierarchySource,
  type IssueHierarchySource,
} from './issue.hierarchy-source.js';
import type {
  DatabaseConnection,
  FilterBuilder,
  FilterNode,
  RepositoryCursor,
} from '@nocobase/db';

import {
  ACTIVITY_PAGE_LIMIT,
  ISSUE_PAGE_LIMIT,
  type ActivityPage,
  type Issue,
  type IssueSummary,
  type IssueBoard,
  type IssueDetail,
  type IssueListItem,
  type IssueListQuery,
  type IssuePage,
  type StatusDefinition,
} from '../../../shared/issues.js';
import { requireAction, type Viewer } from '../../access/viewer.js';
import {
  AGENT_VIA_KIND,
  readActivities,
  splitVia,
  tracedAgents,
} from '../../kernel/activity.js';
import { decodeCursor, pageLimit, pageOf } from '../../kernel/pagination.js';
import type { TxRunner } from '../../kernel/tx.js';
import { notFound } from '../../kernel/errors.js';
import type { UserDirectory } from '../../kernel/users.js';
import {
  canSee,
  deletedIssues,
  requireVisible,
  visibleIssues,
  visibleIssueIds,
} from './issue.access.js';
import {
  findIssueSummaries,
  findIssue,
  findIssueRefs,
  findIssueRows,
  hierarchyRecords,
  priorityRank,
  statusesOf,
  type IssueRecord,
  type IssueRow,
} from './issue.store.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import { isTerminal, type IssueExtras, type StatusService } from './ports.js';
import { FIXED_STATUSES } from '../../../shared/statuses.js';
import { oneOf } from '../../kernel/db.js';

export interface IssueQueries {
  /** At most 100 IDs or identifiers, filtered by current visibility in one read. */
  summaries(viewer: Viewer, refs: readonly string[]): Promise<IssueSummary[]>;
  /** Reauthorize explicit ids without hydrating issue rows, children or dependency counts. */
  visibleIds(
    viewer: Viewer,
    ids: readonly string[],
  ): Promise<ReadonlySet<string>>;
  /** Authorized relations for database-side tree grouping and exact statistics. */
  hierarchySource(
    viewer: Viewer,
    query: IssueListQuery,
  ): Promise<IssueHierarchySource>;
  /** The fixed statuses, in order. */
  statuses(): StatusDefinition[];
  page(viewer: Viewer, query: IssueListQuery): Promise<IssuePage>;
  /** Complete authorized hierarchy by default; optionally unfinished records, explicit inclusions and visible ancestors. */
  hierarchy(
    viewer: Viewer,
    query: IssueListQuery,
    options?: {
      readonly unfinishedOnly?: boolean;
      readonly includeIds?: readonly string[];
    },
  ): Promise<IssueHierarchy>;
  /**
   * Hydrates a bounded set of IDs (at most `HIERARCHY_ITEMS_MAX`) after independently rechecking visibility, in a fixed
   * number of queries. `readableIds`, the ids `hierarchy` answered for the same viewer, saves reading them again for the
   * sub-task counts.
   */
  hierarchyItems(
    viewer: Viewer,
    ids: readonly string[],
    readableIds?: ReadonlySet<string>,
  ): Promise<IssueListItem[]>;
  /** A page per status column; with `statusKey`, that column only, continuing from `cursor`. */
  board(viewer: Viewer, query: IssueListQuery): Promise<IssueBoard>;
  detail(viewer: Viewer, idOrKey: string): Promise<IssueDetail>;
  /**
   * The issue itself, 404 unless it exists and the viewer may see it: the visibility `detail` checks, without reading
   * what the issue page shows around it (activities, threads, files, relations).
   */
  visible(viewer: Viewer, idOrKey: string): Promise<Issue>;
  /**
   * The viewer's issues narrowed by the list's filters (`query`; its order and cursor are ignored) that an executor of
   * `scope.executorType` works on, unless finished (done or closed), or that are among `scope.issueIds`, whatever their
   * status: the most recently updated first, at most `scope.limit` (`MATCHING_LIMIT` by default and at most), in a
   * fixed number of reads. For a board that gathers issues from other plugins' records (their runs, their decisions).
   */
  matching(
    viewer: Viewer,
    query: IssueListQuery,
    scope: IssueMatchScope,
  ): Promise<IssueMatches>;
  activities(
    viewer: Viewer,
    idOrKey: string,
    options: { readonly cursor?: string; readonly limit?: number },
  ): Promise<ActivityPage>;
}

export interface IssueHierarchy {
  readonly issues: readonly Issue[];
  readonly matchingIds: readonly string[];
  /** Internal workflow dependency facts, including unreadable blockers; never expose their identities. */
  readonly blockedIds: ReadonlySet<string>;
}

/** Which issues `IssueQueries.matching` gathers besides the list's filters. */
export interface IssueMatchScope {
  /** Issues an executor of this kind works on, unless finished. */
  readonly executorType?: string;
  /** Issues among these ids, whatever their status. */
  readonly issueIds?: readonly string[];
  readonly limit?: number;
}

export interface IssueMatches {
  readonly issues: IssueListItem[];
  /** More issues matched than the limit allowed. */
  readonly truncated: boolean;
}

/** The most issues `IssueQueries.hierarchyItems` hydrates at once. */
export const HIERARCHY_ITEMS_MAX = 500;

/** The most issues `IssueQueries.matching` answers. */
export const MATCHING_LIMIT = 500;

/** The finished statuses: left out in the query. */
const FINISHED_KEYS = FIXED_STATUSES.filter(
  (status) => status.category === 'done' || status.category === 'closed',
).map((status) => status.key);

export interface QueryDeps {
  readonly tx: TxRunner;
  readonly users: UserDirectory;
  readonly kinds: KindRegistry;
  readonly statuses: Pick<StatusService, 'catalog'>;
  readonly extras: () => IssueExtras;
}

type Order = 'updatedAt' | 'createdAt' | 'number' | 'priorityRank';

/** The viewer's issues narrowed by the query's filters. */
function listFilter(viewer: Viewer, query: IssueListQuery) {
  return (f: FilterBuilder): FilterNode => {
    const nodes: FilterNode[] = [
      query.deleted ? deletedIssues(f, viewer) : visibleIssues(f, viewer),
    ];
    if (query.issueIds) nodes.push(oneOf(f, 'id', query.issueIds));
    if (query.statusKey) nodes.push(f.string('statusKey').eq(query.statusKey));
    if (query.projectId) nodes.push(f.string('projectId').eq(query.projectId));
    if (query.involvesUserId)
      nodes.push(
        f.or([
          f.string('ownerUserId').eq(query.involvesUserId),
          f.and([
            f.string('executorType').eq('user'),
            f.string('executorId').eq(query.involvesUserId),
          ]),
        ]),
      );
    if (query.ownerUserId)
      nodes.push(f.string('ownerUserId').eq(query.ownerUserId));
    if (query.executorId)
      nodes.push(f.string('executorId').eq(query.executorId));
    if (query.parentIssueId === 'none')
      nodes.push(f.string('parentIssueId').eq(null));
    else if (query.parentIssueId)
      nodes.push(f.string('parentIssueId').eq(query.parentIssueId));
    if (query.labelId) {
      const labelId = query.labelId;
      nodes.push(
        f.relation('labels').some((label) => label.string('id').eq(labelId)),
      );
    }
    const q = query.q?.trim();
    if (q)
      nodes.push(
        f.or([
          f.string('title').includes(q, { mode: 'insensitive' }),
          f.string('identifier').includes(q, { mode: 'insensitive' }),
        ]),
      );
    return f.and(nodes);
  };
}

/**
 * The list's filters as a test of an issue already read, when they are all exact matches on its own fields (no search
 * text, no label); null otherwise, and the filters are read from the database.
 */
function exactMatcher(
  query: IssueListQuery,
): ((issue: Issue) => boolean) | null {
  if (query.q?.trim() || query.labelId || query.parentIssueId || query.issueIds)
    return null;
  return (issue) =>
    (!query.statusKey || issue.statusKey === query.statusKey) &&
    (!query.projectId || issue.projectId === query.projectId) &&
    (!query.involvesUserId ||
      issue.ownerUserId === query.involvesUserId ||
      (issue.executor?.type === 'user' &&
        issue.executor.id === query.involvesUserId)) &&
    (!query.ownerUserId || issue.ownerUserId === query.ownerUserId) &&
    (!query.executorId || issue.executor?.id === query.executorId);
}

function cursorOf(
  cursor: string | undefined,
  order: Order,
): RepositoryCursor<IssueRecord> | undefined {
  if (!cursor) return undefined;
  const fields = decodeCursor(cursor);
  return {
    [order]: fields[order],
    id: fields.id,
  } as RepositoryCursor<IssueRecord>;
}

async function listItems(
  deps: QueryDeps,
  conn: DatabaseConnection,
  rows: readonly IssueRow[],
  readableIds?: ReadonlySet<string>,
): Promise<IssueListItem[]> {
  const name = await deps.kinds.nameAll(
    conn,
    rows.flatMap((row) => (row.executor ? [row.executor] : [])),
  );
  const counts = await deps.extras().listCounts(conn, rows, readableIds);
  return rows.map(({ ownerName, ...row }) => ({
    ...row,
    owner: { id: row.ownerUserId, name: ownerName },
    executorName: row.executor
      ? name(row.executor.type, row.executor.id)
      : null,
    subtaskCount: counts.get(row.id)?.subtaskCount ?? 0,
    blockedCount: counts.get(row.id)?.blockedCount ?? 0,
  }));
}

/** The sort field and direction a list query orders by. */
function orderOf(query: IssueListQuery): {
  readonly order: Order;
  readonly direction: 'asc' | 'desc';
} {
  const order: Order =
    query.sort === 'created'
      ? 'createdAt'
      : query.sort === 'number'
        ? 'number'
        : query.sort === 'priority'
          ? 'priorityRank'
          : 'updatedAt';
  // Descending priority is the most urgent first, which is the lowest rank.
  const ascending =
    order === 'priorityRank'
      ? query.direction !== 'asc'
      : query.direction === 'asc';
  return { order, direction: ascending ? 'asc' : 'desc' };
}

const cursorFieldsOf =
  (order: Order) =>
  (
    row: Pick<Issue, 'id' | 'priority' | 'createdAt' | 'updatedAt' | 'number'>,
  ) => ({
    [order]: order === 'priorityRank' ? priorityRank(row.priority) : row[order],
    id: row.id,
  });

async function page(
  deps: QueryDeps,
  conn: DatabaseConnection,
  viewer: Viewer,
  query: IssueListQuery,
  limit: number,
): Promise<IssuePage> {
  const { order, direction } = orderOf(query);
  const rows = await findIssueRows(conn, {
    filter: listFilter(viewer, query),
    order,
    direction,
    limit: limit + 1,
    ...(query.cursor ? { cursor: cursorOf(query.cursor, order) } : {}),
  });
  const result = pageOf(rows, limit, cursorFieldsOf(order));
  return {
    data: await listItems(deps, conn, result.rows),
    nextCursor: result.nextCursor,
  };
}

/**
 * The first page of each of `statusKeys`, in a fixed number of reads whatever the number of issues: the ids of each
 * column in its order, then the rows of every column at once, and what the rows show beside them at once.
 */
async function columnPages(
  deps: QueryDeps,
  conn: DatabaseConnection,
  viewer: Viewer,
  query: IssueListQuery,
  statusKeys: readonly string[],
  limit: number,
): Promise<Map<string, IssuePage>> {
  const { order, direction } = orderOf(query);
  const refs = new Map<
    string,
    { readonly ids: string[]; readonly nextCursor: string | null }
  >();
  for (const statusKey of statusKeys) {
    const found = await findIssueRefs(conn, {
      filter: listFilter(viewer, { ...query, statusKey, cursor: undefined }),
      order,
      direction,
      limit: limit + 1,
    });
    const result = pageOf(found, limit, cursorFieldsOf(order));
    refs.set(statusKey, {
      ids: result.rows.map((row) => row.id),
      nextCursor: result.nextCursor,
    });
  }
  const ids = [...refs.values()].flatMap((column) => column.ids);
  const rows =
    ids.length > 0
      ? await findIssueRows(conn, {
          filter: (f) => f.or(ids.map((id) => f.string('id').eq(id))),
          order: 'number',
          limit: ids.length,
        })
      : [];
  const items = new Map(
    (await listItems(deps, conn, rows)).map((item) => [item.id, item]),
  );
  return new Map(
    [...refs].map(([statusKey, column]) => [
      statusKey,
      {
        data: column.ids.flatMap((id) => {
          const item = items.get(id);
          return item ? [item] : [];
        }),
        nextCursor: column.nextCursor,
      },
    ]),
  );
}

/** An unknown status some issue is still in gets a plain column of its own. */
function unknownStatus(key: string): StatusDefinition {
  return { key, name: key, category: 'unstarted', color: 'gray' };
}

export function createIssueQueries(deps: QueryDeps): IssueQueries {
  /** The caller has already checked visibility for this issue in the same read. */
  async function activityPage(
    conn: DatabaseConnection,
    issueId: string,
    viewer: Viewer,
    options: Parameters<IssueQueries['activities']>[2],
  ): Promise<ActivityPage> {
    const limit = pageLimit(
      options.limit,
      ACTIVITY_PAGE_LIMIT.default,
      ACTIVITY_PAGE_LIMIT.max,
    );
    const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;
    const rows = await readActivities(
      conn,
      issueId,
      limit,
      cursor
        ? { createdAt: String(cursor.createdAt), id: String(cursor.id) }
        : undefined,
    );
    const result = pageOf(rows, limit, (row) => ({
      createdAt: row.createdAt,
      id: row.id,
    }));
    const name = await deps.kinds.nameAll(conn, [
      ...result.rows.map((row) => ({ type: row.actorType, id: row.actorId })),
      ...tracedAgents(result.rows),
    ]);
    return {
      // Oldest first, as the timeline reads.
      data: result.rows.reverse().map((row) => ({
        id: row.id,
        actorType: row.actorType,
        actorId: row.actorId,
        actorName: name(row.actorType, row.actorId),
        action: row.action,
        ...splitVia(
          row.details,
          (agentId) => name(AGENT_VIA_KIND, agentId),
          viewer,
        ),
        createdAt: row.createdAt,
      })),
      nextCursor: result.nextCursor,
    };
  }

  return {
    summaries: (viewer, refs) => {
      requireAction(viewer, 'pm.issues', 'view', 'You may not view issues.');
      return findIssueSummaries(deps.tx.read(), (f) =>
        f.and([
          visibleIssues(f, viewer),
          f.or([oneOf(f, 'id', refs), oneOf(f, 'identifier', refs)]),
        ]),
      );
    },
    visibleIds: (viewer, ids) => visibleIssueIds(deps.tx.read(), viewer, ids),
    hierarchySource: (viewer, query) =>
      hierarchySource(deps.tx.read(), viewer, query),
    async hierarchy(viewer, query, options) {
      const conn = deps.tx.read();
      const issues = await hierarchyRecords(conn, (f) =>
        f.and([
          visibleIssues(f, viewer),
          ...(options?.unfinishedOnly
            ? [
                options.includeIds?.length
                  ? f.or([
                      f.and(
                        FINISHED_KEYS.map((key) =>
                          f.string('statusKey').ne(key),
                        ),
                      ),
                      oneOf(f, 'id', options.includeIds),
                    ])
                  : f.and(
                      FINISHED_KEYS.map((key) => f.string('statusKey').ne(key)),
                    ),
              ]
            : []),
        ]),
      );
      if (options?.unfinishedOnly) {
        const known = new Set(issues.map((issue) => issue.id));
        let layer = issues;
        while (layer.length) {
          const parents = [
            ...new Set(
              layer.flatMap((issue) =>
                issue.parentIssueId && !known.has(issue.parentIssueId)
                  ? [issue.parentIssueId]
                  : [],
              ),
            ),
          ];
          if (!parents.length) break;
          // Cut a path at an invisible parent, as the complete authorized hierarchy does.
          layer = await hierarchyRecords(conn, (f) =>
            f.and([visibleIssues(f, viewer), oneOf(f, 'id', parents)]),
          );
          for (const issue of layer) known.add(issue.id);
          issues.push(...layer);
        }
      }
      const exact = exactMatcher(query);
      const matches = exact
        ? issues.filter(exact)
        : await hierarchyRecords(conn, (f) =>
            f.and([
              listFilter(viewer, { ...query, deleted: false })(f),
              ...(options?.unfinishedOnly
                ? [
                    oneOf(
                      f,
                      'id',
                      issues.map((issue) => issue.id),
                    ),
                  ]
                : []),
            ]),
          );
      return {
        issues,
        matchingIds: matches.map((issue) => issue.id),
        blockedIds: await deps.extras().blockedIds(conn, issues),
      };
    },
    async hierarchyItems(viewer, ids, readableIds) {
      if (ids.length === 0) return [];
      if (ids.length > HIERARCHY_ITEMS_MAX)
        throw new Error(
          `Hierarchy hydration accepts at most ${HIERARCHY_ITEMS_MAX} tasks.`,
        );
      const conn = deps.tx.read();
      const rows = await findIssueRows(conn, {
        filter: (f) =>
          f.and([
            visibleIssues(f, viewer),
            f.or(ids.map((id) => f.string('id').eq(id))),
          ]),
        order: 'number',
        direction: 'asc',
        limit: ids.length,
      });
      const readable =
        readableIds ??
        new Set(
          (await hierarchyRecords(conn, (f) => visibleIssues(f, viewer))).map(
            (issue) => issue.id,
          ),
        );
      return listItems(deps, conn, rows, readable);
    },
    statuses() {
      return [...deps.statuses.catalog().statuses];
    },

    async page(viewer, query) {
      const limit = pageLimit(
        query.limit,
        ISSUE_PAGE_LIMIT.default,
        ISSUE_PAGE_LIMIT.max,
      );
      const conn = deps.tx.read();
      // The parent may be named by its identifier (`PM-12`), as everywhere an issue is named.
      const parent =
        query.parentIssueId && query.parentIssueId !== 'none'
          ? await findIssue(conn, query.parentIssueId)
          : undefined;
      return page(
        deps,
        conn,
        viewer,
        parent ? { ...query, parentIssueId: parent.id } : query,
        limit,
      );
    },

    async board(viewer, query) {
      const conn = deps.tx.read();
      const limit = pageLimit(
        query.limit,
        ISSUE_PAGE_LIMIT.default,
        ISSUE_PAGE_LIMIT.max,
      );
      const statuses = [...deps.statuses.catalog().statuses];
      if (query.statusKey) {
        const only =
          statuses.find((status) => status.key === query.statusKey) ??
          unknownStatus(query.statusKey);
        const column = await page(deps, conn, viewer, query, limit);
        return {
          columns: [
            {
              status: only,
              issues: column.data,
              nextCursor: column.nextCursor,
            },
          ],
        };
      }
      for (const key of await statusesOf(conn, listFilter(viewer, query)))
        if (!statuses.some((status) => status.key === key))
          statuses.push(unknownStatus(key));
      const pages = await columnPages(
        deps,
        conn,
        viewer,
        query,
        statuses.map((status) => status.key),
        limit,
      );
      return {
        columns: statuses.map((status) => ({
          status,
          issues: pages.get(status.key)?.data ?? [],
          nextCursor: pages.get(status.key)?.nextCursor ?? null,
        })),
      };
    },

    visible(viewer, idOrKey) {
      return requireVisible(deps.tx.read(), viewer, idOrKey);
    },

    async detail(viewer, idOrKey) {
      const conn = deps.tx.read();
      const lookup = (filter: { id: string } | { identifier: string }) =>
        findIssueRows(conn, { filter, order: 'updatedAt', limit: 1 });
      let [issue] = await lookup({ id: idOrKey });
      if (!issue && /^[A-Za-z][A-Za-z0-9]*-\d+$/u.test(idOrKey))
        [issue] = await lookup({ identifier: idOrKey.toUpperCase() });
      if (!issue || !(await canSee(conn, viewer, issue)))
        throw notFound('Issue');
      const extras = deps.extras();
      const [
        [item],
        parent,
        activities,
        threads,
        subscribers,
        attachments,
        relations,
      ] = await Promise.all([
        listItems(deps, conn, [issue]),
        issue.parentIssueId ? findIssue(conn, issue.parentIssueId) : undefined,
        activityPage(conn, issue.id, viewer, {}),
        extras.threads(conn, issue, viewer),
        extras.subscribers(conn, issue),
        extras.attachments(conn, viewer, issue),
        extras.relations(conn, viewer, issue),
      ]);
      const catalog = deps.statuses.catalog();
      return {
        ...item,
        parent:
          parent && !parent.deletedAt
            ? {
                id: parent.id,
                identifier: parent.identifier,
                title: parent.title,
              }
            : null,
        statuses: catalog.statuses,
        activities: activities.data,
        activitiesNextCursor: activities.nextCursor,
        threads: threads.data,
        threadsNextCursor: threads.nextCursor,
        subscribers,
        attachments,
        ...relations,
      };
    },

    async matching(viewer, query, scope) {
      const ids = [...new Set(scope.issueIds ?? [])];
      const { executorType } = scope;
      if (!executorType && ids.length === 0)
        return { issues: [], truncated: false };
      const limit = Math.min(
        Math.max(scope.limit ?? MATCHING_LIMIT, 1),
        MATCHING_LIMIT,
      );
      const conn = deps.tx.read();
      const base = listFilter(viewer, {
        ...query,
        deleted: false,
        cursor: undefined,
      });
      const rows = await findIssueRows(conn, {
        filter: (f) =>
          f.and([
            base(f),
            f.or([
              ...(executorType
                ? [
                    f.and([
                      f.string('executorType').eq(executorType),
                      ...FINISHED_KEYS.map((key) =>
                        f.string('statusKey').ne(key),
                      ),
                    ]),
                  ]
                : []),
              ...(ids.length > 0
                ? [f.or(ids.map((id) => f.string('id').eq(id)))]
                : []),
            ]),
          ]),
        order: 'updatedAt',
        direction: 'desc',
        limit: limit + 1,
      });
      // A finished issue of the executor is left out unless it was asked for by id.
      const asked = new Set(ids);
      const catalog = deps.statuses.catalog();
      const kept: IssueRow[] = [];
      for (const row of rows.slice(0, limit)) {
        if (!asked.has(row.id) && isTerminal(catalog, row.statusKey)) continue;
        kept.push(row);
      }
      return {
        issues: await listItems(deps, conn, kept),
        truncated: rows.length > limit,
      };
    },

    async activities(viewer, idOrKey, options) {
      const conn = deps.tx.read();
      const issue = await requireVisible(conn, viewer, idOrKey);
      return activityPage(conn, issue.id, viewer, options);
    },
  };
}
