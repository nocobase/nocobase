/**
 * `GET /api/taskGroups` and its children, rows and summary reads (`shared/task-groups.ts`): the issue lists' groups,
 * gathered from the projects plugin's authorized hierarchy, the inbox's open decisions, owner handoffs, open plans and
 * what the viewer follows, then grouped by `task-group-model.ts`. The projects plugin stays responsible for which issues
 * the viewer may see and which the filters match; nothing here is stored.
 *
 * Each request reads every kind of data once, whatever the number of tasks or groups: the hierarchy, what holds the
 * tasks, the waits and the follows, then one hydration of every row it answers. It only reads, so it runs outside a
 * transaction; the generation and each row's revision tell a continuation that the data moved in between.
 */
import { createHash } from 'node:crypto';

import type { Cache } from '@nocobase/caching';
import type {
  IssueHierarchy,
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  Issue,
  IssueListItem,
  IssueListQuery,
} from '@nocobase/app-plugin-projects/shared/issues';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import {
  isTerminalCategory,
  statusCategory,
} from '@nocobase/app-plugin-projects/shared/statuses';

import type {
  TaskChildrenPages,
  TaskGroupItem,
  TaskGroupQuery,
  TaskGroupRows,
  TaskGroups,
  TaskGroupSummary,
  TaskCount,
} from '../../shared/task-groups.js';
import type { FollowState } from '../follow-ups/service.js';
import type { StudioInbox, TaskDecisionSummary } from '../inbox/service.js';
import { OWNER_HANDOFFS, type OwnerHandoff } from './owner-handoff.js';
import {
  createTaskGroupModel,
  TaskGroupsChangedError,
  type TaskGroupModel,
  type TaskGroupNode,
  type TaskWait,
} from './task-group-model.js';
import { taskWait } from './task-waits.js';

/** The most rows `IssueQueries.hierarchyItems` hydrates at once. */
const HIERARCHY_ITEMS_MAX = 500;

/** The most open plans read for the wait reasons. */
const PLANS_MAX = 500;

/** How long a viewer's summary is reused: the menu badge and the tabs' counts may lag this much behind. */
export const SUMMARY_TTL_MS = 5_000;

export interface TaskGroupDeps {
  readonly projects: Pick<Projects, 'issueQueries' | 'plans' | 'tx'>;
  readonly inbox?: Pick<StudioInbox, 'taskDecisions'> | undefined;
  readonly follows?:
    | {
        followState(
          viewer: Viewer,
          visibleIds?: ReadonlySet<string>,
        ): Promise<FollowState>;
      }
    | undefined;
  /** Where summaries are kept for `SUMMARY_TTL_MS`; without it every summary is computed. */
  readonly cache?: Pick<Cache, 'wrap'> | undefined;
  readonly now?: () => number;
}

export interface TaskGroupService {
  read(viewer: Viewer, query: TaskGroupQuery): Promise<TaskGroups>;
  children(
    viewer: Viewer,
    query: TaskGroupQuery & {
      readonly parentIds: readonly string[];
      readonly generation: string;
    },
  ): Promise<TaskChildrenPages>;
  rows(
    viewer: Viewer,
    query: TaskGroupQuery & { readonly ids: readonly string[] },
  ): Promise<TaskGroupRows>;
  summary(viewer: Viewer): Promise<TaskGroupSummary>;
}

/** Whether the search text names the issue, as the follow group narrows what it shows. */
function searchMatches(issue: Pick<Issue, 'identifier' | 'title'>, q: string) {
  const text = q.trim().toLowerCase();
  return (
    !text ||
    issue.title.toLowerCase().includes(text) ||
    issue.identifier.toLowerCase().includes(text)
  );
}

/** What a request reads once and every grouping of it shares. */
interface Scope {
  readonly hierarchy: IssueHierarchy;
  readonly issues: ReadonlyMap<string, Issue>;
  readonly waits: ReadonlyMap<string, TaskWait>;
  readonly follow: FollowState;
}

export function createTaskGroups(deps: TaskGroupDeps): TaskGroupService {
  const { projects } = deps;
  const now = deps.now ?? (() => Date.now());

  /** The viewer's current handoffs that wait for them to take over: the only ones a wait is made of. */
  async function readHandoffs(
    viewer: Viewer,
  ): Promise<Map<string, OwnerHandoff>> {
    const rows = await projects.tx
      .read()
      .repository<OwnerHandoff>(OWNER_HANDOFFS)
      .findMany({
        filter: (f) =>
          f.and([
            f.string('ownerUserId').eq(viewer.userId),
            f.boolean('waiting').isTrue(),
            f.date('rejectedAt').empty(),
          ]),
      });
    return new Map(rows.map((row) => [row.issueId, row]));
  }

  /** The open plans the viewer may see that are about an issue, by issue id. */
  async function readPlans(viewer: Viewer): Promise<Map<string, Plan[]>> {
    const byIssue = new Map<string, Plan[]>();
    let cursor: string | undefined;
    let read = 0;
    do {
      const page = await projects.plans.list(viewer, {
        status: 'open',
        limit: 100,
        ...(cursor ? { cursor } : {}),
      });
      for (const plan of page.data) {
        const issueId = plan.source.issueId;
        if (!issueId) continue;
        byIssue.set(issueId, [...(byIssue.get(issueId) ?? []), plan]);
      }
      read += page.data.length;
      cursor = page.nextCursor ?? undefined;
    } while (cursor && read < PLANS_MAX);
    return byIssue;
  }

  /** What waits on the viewer, for every issue among `issues`. */
  async function readWaits(
    viewer: Viewer,
    issues: readonly Issue[],
    blockedIds: ReadonlySet<string>,
  ): Promise<Map<string, TaskWait>> {
    const open = issues.filter(
      (issue) => !isTerminalCategory(statusCategory(issue.statusKey)),
    );
    const ids = open.map((issue) => issue.id);
    const decisions =
      ids.length > 0
        ? ((await deps.inbox?.taskDecisions(
            ids,
            viewer.userId,
            projects.tx.read(),
          )) ?? [])
        : [];
    const byIssue = new Map<string, TaskDecisionSummary[]>();
    for (const decision of decisions)
      byIssue.set(decision.issueId, [
        ...(byIssue.get(decision.issueId) ?? []),
        decision,
      ]);
    const handoffs = await readHandoffs(viewer);
    const plans = await readPlans(viewer);
    const at = now();
    const waits = new Map<string, TaskWait>();
    for (const issue of open) {
      const wait = taskWait(issue, viewer, {
        dependencyWait: blockedIds.has(issue.id),
        decisions: byIssue.get(issue.id) ?? [],
        handoff: handoffs.get(issue.id),
        plans: plans.get(issue.id) ?? [],
        now: at,
      });
      if (wait) waits.set(issue.id, wait);
    }
    return waits;
  }

  function filtersOf(query: TaskGroupQuery): IssueListQuery {
    return {
      q: query.q,
      statusKey: query.statusKey,
      projectId: query.projectId,
      ownerUserId: query.ownerUserId,
      executorId: query.executorId,
      involvesUserId: query.involvesUserId,
      labelId: query.labelId,
    };
  }

  async function readScope(
    viewer: Viewer,
    filters: IssueListQuery,
  ): Promise<Scope> {
    const hierarchy = await projects.issueQueries.hierarchy(viewer, filters);
    const issues = new Map(hierarchy.issues.map((issue) => [issue.id, issue]));
    const follow = (await deps.follows?.followState(
      viewer,
      new Set(issues.keys()),
    )) ?? { ids: [], unread: new Map() };
    const waits = await readWaits(
      viewer,
      hierarchy.issues,
      hierarchy.blockedIds,
    );
    return { hierarchy, issues, waits, follow };
  }

  function modelOf(
    viewer: Viewer,
    scope: Scope,
    query: TaskGroupQuery,
    matchingIds: ReadonlySet<string>,
  ): TaskGroupModel {
    const followIds = scope.follow.ids.filter((id) => {
      const issue = scope.issues.get(id);
      if (!issue) return false;
      return query.follow === 'all'
        ? searchMatches(issue, query.q ?? '')
        : matchingIds.has(id);
    });
    return createTaskGroupModel({
      issues: scope.hierarchy.issues,
      matchingIds,
      waits: scope.waits,
      followIds,
      mode: query.mode ?? 'split',
      statusFilter: query.statusKey,
      flat: Boolean(query.executorId || query.involvesUserId),
      sort: query.sort,
      direction: query.direction,
      queryIdentity: JSON.stringify([
        viewer.userId,
        viewer.permissions,
        viewer.projectIds,
        filtersOf(query),
        query.follow ?? 'scope',
      ]),
      now: now(),
    });
  }

  async function assemble(
    viewer: Viewer,
    query: TaskGroupQuery,
  ): Promise<{ readonly model: TaskGroupModel; readonly scope: Scope }> {
    const scope = await readScope(viewer, filtersOf(query));
    const model = modelOf(
      viewer,
      scope,
      query,
      new Set(scope.hierarchy.matchingIds),
    );
    if (query.generation && query.generation !== model.generation)
      throw new TaskGroupsChangedError();
    return { model, scope };
  }

  /** The rows of `nodes`, hydrated together in one read whatever group or parent each belongs to. */
  async function hydrate(
    viewer: Viewer,
    nodes: readonly TaskGroupNode[],
    scope: Scope,
  ): Promise<Map<string, TaskGroupItem>> {
    const ids = [...new Set(nodes.map((node) => node.id))];
    const readable = new Set(scope.issues.keys());
    const byId = new Map<string, IssueListItem>();
    // One read for what a request answers; only a request for many large pages at once takes more.
    for (let at = 0; at < ids.length; at += HIERARCHY_ITEMS_MAX)
      for (const row of await projects.issueQueries.hierarchyItems(
        viewer,
        ids.slice(at, at + HIERARCHY_ITEMS_MAX),
        readable,
      ))
        byId.set(row.id, row);
    const items = new Map<string, TaskGroupItem>();
    for (const node of nodes) {
      const issue = byId.get(node.id);
      // Changed or gone since the hierarchy was read: the caller reads the query again.
      if (!issue || issue.revision !== scope.issues.get(node.id)?.revision)
        throw new TaskGroupsChangedError();
      const parent = node.parentId
        ? scope.issues.get(node.parentId)
        : undefined;
      items.set(node.id, {
        // The parent the viewer cannot see stays hidden, and progress counts what they can see.
        issue: {
          ...issue,
          parentIssueId: node.parentId,
          subtaskCount: node.progress.total,
        },
        parent: parent
          ? { id: parent.id, identifier: parent.identifier }
          : null,
        waits: node.waits,
        waitingSince: node.waitingSince,
        followed: node.followed,
        unread: node.followed ? (scope.follow.unread.get(node.id) ?? 0) : 0,
        progress: node.progress,
        hasChildren: node.hasChildren,
        context: node.context,
        expand: node.expand,
      });
    }
    return items;
  }

  /** My tasks' count, over the scope read once for the whole summary. */
  function taskCount(
    viewer: Viewer,
    scope: Scope,
    query: TaskGroupQuery,
    matches: (issue: Issue) => boolean,
  ): TaskCount {
    const matchingIds = new Set(
      scope.hierarchy.issues.filter(matches).map((issue) => issue.id),
    );
    const model = modelOf(
      viewer,
      scope,
      { ...query, mode: 'split', follow: 'all' },
      matchingIds,
    );
    const open = [...matchingIds].filter((id) => {
      const issue = scope.issues.get(id);
      return issue && !isTerminalCategory(statusCategory(issue.statusKey));
    }).length;
    return { open, waiting: model.waiting };
  }

  async function computeSummary(viewer: Viewer): Promise<TaskGroupSummary> {
    const scope = await readScope(viewer, {});
    // As the list's `involvesUserId` filter: owned by the viewer, or executed by them as a person.
    const mine = taskCount(
      viewer,
      scope,
      { involvesUserId: viewer.userId },
      (issue) =>
        issue.ownerUserId === viewer.userId ||
        (issue.executor?.type === 'user' &&
          issue.executor.id === viewer.userId),
    );
    return { mine, waiting: mine.waiting };
  }

  return {
    async read(viewer, query) {
      const { model, scope } = await assemble(viewer, query);
      const pages = model.groups.map(({ group, count }) => {
        const wanted = !query.group || query.group === group;
        const result = model.group(
          group,
          query.limit,
          query.group === group ? query.cursor : undefined,
        );
        return { group, count, wanted, result };
      });
      const items = await hydrate(
        viewer,
        pages.flatMap((page) => (page.wanted ? page.result.data : [])),
        scope,
      );
      return {
        generation: model.generation,
        membership: model.membership,
        mode: query.mode ?? 'split',
        groups: pages.map(({ group, count, wanted, result }) => ({
          group,
          count,
          data: wanted ? result.data.map((node) => items.get(node.id)!) : [],
          nextCursor: result.nextCursor,
        })),
        following: scope.follow.ids,
        waiting: model.waiting,
      };
    },
    async children(viewer, query) {
      const { model, scope } = await assemble(viewer, {
        ...query,
        mode: 'table',
      });
      const pages = query.parentIds.map((parentId) => ({
        parentId,
        result: model.children(parentId, query.limit, query.cursor),
      }));
      const items = await hydrate(
        viewer,
        pages.flatMap((page) => page.result.data),
        scope,
      );
      return {
        generation: model.generation,
        parents: pages.map(({ parentId, result }) => ({
          parentId,
          data: result.data.map((node) => items.get(node.id)!),
          nextCursor: result.nextCursor,
        })),
      };
    },
    async rows(viewer, query) {
      const { model, scope } = await assemble(viewer, query);
      const nodes = [...new Set(query.ids)].flatMap((id) => {
        const node = model.nodeOf(id);
        return node ? [node] : [];
      });
      const items = await hydrate(viewer, nodes, scope);
      return { membership: model.membership, data: [...items.values()] };
    },
    async summary(viewer) {
      if (!deps.cache) return computeSummary(viewer);
      // What the viewer may see decides the counts, so their permissions and project restriction are part of the key.
      const key = createHash('sha256')
        .update(
          JSON.stringify([
            viewer.userId,
            viewer.permissions,
            viewer.projectIds ?? null,
          ]),
        )
        .digest('base64url');
      return deps.cache.wrap(key, () => computeSummary(viewer), SUMMARY_TTL_MS);
    },
  };
}
