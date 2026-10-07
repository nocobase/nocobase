/**
 * Issue reads for the browser: a page of the list, the board, one issue in detail, and older activities. Everything is
 * limited to what the viewer may see (`issue.access.ts`).
 */
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
  type BoardColumn,
  type IssueBoard,
  type IssueDetail,
  type IssueListItem,
  type IssueListQuery,
  type IssuePage,
  type IssueStarts,
  type StatusDefinition,
} from '../../../shared/issues.js';
import type { Viewer } from '../../access/viewer.js';
import {
  AGENT_VIA_KIND,
  readActivities,
  splitVia,
  tracedAgents,
} from '../../kernel/activity.js';
import { notFound } from '../../kernel/errors.js';
import { projectRelation } from '../projects/index.js';
import { decodeCursor, pageLimit, pageOf } from '../../kernel/pagination.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { UserDirectory } from '../../kernel/users.js';
import {
  deletedIssues,
  requireVisible,
  visibleIssues,
} from './issue.access.js';
import {
  findIssue,
  findIssueRow,
  findIssueRows,
  priorityRank,
  statusesOf,
  type IssueRecord,
  type IssueRow,
} from './issue.store.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import {
  isTerminal,
  type IssueExtras,
  type StatusCatalog,
  type StatusCatalogs,
} from './ports.js';
import { BUILTIN_STATUSES } from '../../../shared/workflows.js';

export interface IssueQueries {
  /** The statuses of a project's workflow, in order; `null` for issues without a project. */
  statuses(
    viewer: Viewer,
    projectId: string | null,
  ): Promise<StatusDefinition[]>;
  /** The ways a new issue may start in a project's workflow (`IssueStarts`); `null` for issues without a project. */
  starts(viewer: Viewer, projectId: string | null): Promise<IssueStarts>;
  page(viewer: Viewer, query: IssueListQuery): Promise<IssuePage>;
  /** A page per status column; with `statusKey`, that column only, continuing from `cursor`. */
  board(viewer: Viewer, query: IssueListQuery): Promise<IssueBoard>;
  detail(viewer: Viewer, idOrKey: string): Promise<IssueDetail>;
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

/** The most issues `IssueQueries.matching` answers. */
export const MATCHING_LIMIT = 500;

/** The built-in finished statuses, which every workflow has: left out in the query, the rest checked per workflow. */
const FINISHED_KEYS = BUILTIN_STATUSES.filter(
  (status) => status.category === 'done' || status.category === 'closed',
).map((status) => status.key);

export interface QueryDeps {
  readonly tx: TxRunner;
  readonly users: UserDirectory;
  readonly kinds: KindRegistry;
  readonly statuses: StatusCatalogs;
  readonly extras: () => IssueExtras;
}

type Order = 'updatedAt' | 'createdAt' | 'number' | 'priorityRank';

/** The viewer's issues narrowed by the query's filters. */
function listFilter(viewer: Viewer, query: IssueListQuery) {
  return (f: FilterBuilder): FilterNode => {
    const nodes: FilterNode[] = [
      query.deleted ? deletedIssues(f, viewer) : visibleIssues(f, viewer),
    ];
    if (query.statusKey) nodes.push(f.string('statusKey').eq(query.statusKey));
    if (query.projectId) nodes.push(f.string('projectId').eq(query.projectId));
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
          f.string('title').includes(q),
          f.string('identifier').includes(q),
        ]),
      );
    return f.and(nodes);
  };
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
): Promise<IssueListItem[]> {
  const name = await deps.kinds.nameAll(
    conn,
    rows.flatMap((row) => (row.executor ? [row.executor] : [])),
  );
  const counts = await deps.extras().listCounts(conn, rows);
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

async function page(
  deps: QueryDeps,
  conn: DatabaseConnection,
  viewer: Viewer,
  query: IssueListQuery,
  limit: number,
): Promise<IssuePage> {
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
  const rows = await findIssueRows(conn, {
    filter: listFilter(viewer, query),
    order,
    direction: ascending ? 'asc' : 'desc',
    limit: limit + 1,
    ...(query.cursor ? { cursor: cursorOf(query.cursor, order) } : {}),
  });
  const result = pageOf(rows, limit, (row) => ({
    [order]: order === 'priorityRank' ? priorityRank(row.priority) : row[order],
    id: row.id,
  }));
  return {
    data: await listItems(deps, conn, result.rows),
    nextCursor: result.nextCursor,
  };
}

/** An unknown status some issue is still in gets a plain column of its own. */
function unknownStatus(key: string): StatusDefinition {
  return { key, name: key, category: 'unstarted', color: 'gray' };
}

export function createIssueQueries(deps: QueryDeps): IssueQueries {
  return {
    async statuses(viewer, projectId) {
      const conn = deps.tx.read();
      if (projectId) {
        const relation = await projectRelation(conn, viewer, projectId);
        if (!relation?.visible) throw notFound('Project');
      }
      return [...(await deps.statuses.forProject(conn, projectId)).statuses];
    },

    async starts(viewer, projectId) {
      const conn = deps.tx.read();
      if (projectId) {
        const relation = await projectRelation(conn, viewer, projectId);
        if (!relation?.visible) throw notFound('Project');
      }
      const catalog = await deps.statuses.forProject(conn, projectId);
      return { initialStatus: catalog.initialStatus, options: catalog.starts };
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
      const catalog = await deps.statuses.forProject(
        conn,
        query.projectId ?? null,
      );
      const statuses = [...catalog.statuses];
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
      const columns: BoardColumn[] = [];
      for (const status of statuses) {
        const column = await page(
          deps,
          conn,
          viewer,
          { ...query, statusKey: status.key, cursor: undefined },
          limit,
        );
        columns.push({
          status,
          issues: column.data,
          nextCursor: column.nextCursor,
        });
      }
      return { columns };
    },

    async detail(viewer, idOrKey) {
      const conn = deps.tx.read();
      const issue = await requireVisible(conn, viewer, idOrKey);
      const row = await findIssueRow(conn, issue.id);
      const [item] = await listItems(deps, conn, row ? [row] : []);
      const parent = issue.parentIssueId
        ? await findIssue(conn, issue.parentIssueId)
        : undefined;
      const catalog = await deps.statuses.forProject(conn, issue.projectId);
      const activities = await this.activities(viewer, issue.id, {});
      const threads = await deps.extras().threads(conn, issue);
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
        subscribers: await deps.extras().subscribers(conn, issue),
        attachments: await deps.extras().attachments(conn, viewer, issue),
        checklist: await deps.extras().checklist(conn, issue),
        pendingApproval: await deps.extras().pendingApproval(conn, issue),
        recentApprovals: await deps.extras().recentApprovals(conn, issue),
        ...(await deps.extras().relations(conn, viewer, issue)),
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
      // A workflow's own finished statuses: an executor's issue in one is left out unless it was asked for by id.
      const asked = new Set(ids);
      const catalogs = new Map<string | null, StatusCatalog>();
      const kept: IssueRow[] = [];
      for (const row of rows.slice(0, limit)) {
        if (!asked.has(row.id)) {
          let catalog = catalogs.get(row.projectId);
          if (!catalog) {
            catalog = await deps.statuses.forProject(conn, row.projectId);
            catalogs.set(row.projectId, catalog);
          }
          if (isTerminal(catalog, row.statusKey)) continue;
        }
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
      const limit = pageLimit(
        options.limit,
        ACTIVITY_PAGE_LIMIT.default,
        ACTIVITY_PAGE_LIMIT.max,
      );
      const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;
      const rows = await readActivities(
        conn,
        issue.id,
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
          ...splitVia(row.details, (agentId) => name(AGENT_VIA_KIND, agentId)),
          createdAt: row.createdAt,
        })),
        nextCursor: result.nextCursor,
      };
    },
  };
}
