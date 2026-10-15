/**
 * `GET /api/taskGroups` and its children and summary reads (`shared/task-groups.ts`): the issue lists' groups, gathered
 * in one projects transaction from the projects plugin's authorized hierarchy, the inbox's open decisions, owner
 * handoffs, open plans and what the viewer follows, then grouped by `task-group-model.ts`. The projects plugin stays
 * responsible for which issues the viewer may see and which the filters match; nothing here is stored.
 */
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  Issue,
  IssueListQuery,
} from '@nocobase/app-plugin-projects/shared/issues';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import {
  isTerminalCategory,
  statusCategory,
} from '@nocobase/app-plugin-projects/shared/statuses';

import type {
  TaskChildrenPage,
  TaskGroupItem,
  TaskGroupQuery,
  TaskGroups,
  TaskGroupSummary,
  TaskRoleCount,
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

/** The most open plans read for the wait reasons. */
const PLANS_MAX = 500;

export interface TaskGroupDeps {
  readonly projects: Pick<Projects, 'issueQueries' | 'plans' | 'tx'>;
  readonly inbox?: Pick<StudioInbox, 'taskDecisions'> | undefined;
  readonly follows?:
    { followState(viewer: Viewer): Promise<FollowState> } | undefined;
  readonly now?: () => number;
}

export interface TaskGroupService {
  read(viewer: Viewer, query: TaskGroupQuery): Promise<TaskGroups>;
  children(
    viewer: Viewer,
    query: TaskGroupQuery & { readonly parentId: string },
  ): Promise<TaskChildrenPage>;
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

export function createTaskGroups(deps: TaskGroupDeps): TaskGroupService {
  const { projects } = deps;
  const now = deps.now ?? (() => Date.now());

  async function readHandoffs(
    ids: readonly string[],
  ): Promise<Map<string, OwnerHandoff>> {
    const handoffs = new Map<string, OwnerHandoff>();
    for (let at = 0; at < ids.length; at += 100) {
      const chunk = ids.slice(at, at + 100);
      const rows = await projects.tx
        .read()
        .repository<OwnerHandoff>(OWNER_HANDOFFS)
        .findMany({
          filter: (f) => f.or(chunk.map((id) => f.string('issueId').eq(id))),
        });
      for (const row of rows) handoffs.set(row.issueId, row);
    }
    return handoffs;
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
    const handoffs = await readHandoffs(ids);
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
      labelId: query.labelId,
    };
  }

  /**
   * What the viewer follows. Read before the projects transaction: the preferences live on their own connection,
   * which a single-connection database (SQLite) could not hand out while the transaction holds it.
   */
  async function followOf(viewer: Viewer): Promise<FollowState> {
    return (
      (await deps.follows?.followState(viewer)) ?? {
        ids: [],
        unread: new Map(),
      }
    );
  }

  async function assemble(
    viewer: Viewer,
    query: TaskGroupQuery,
    follow: FollowState,
  ): Promise<{
    readonly model: TaskGroupModel;
    readonly issues: ReadonlyMap<string, Issue>;
    readonly matchingIds: ReadonlySet<string>;
    readonly waits: ReadonlyMap<string, TaskWait>;
    readonly follow: FollowState;
  }> {
    const filters = filtersOf(query);
    const scope = await projects.issueQueries.hierarchy(viewer, filters);
    const issues = new Map(scope.issues.map((issue) => [issue.id, issue]));
    const matchingIds = new Set(scope.matchingIds);
    const followIds = follow.ids.filter((id) => {
      const issue = issues.get(id);
      if (!issue) return false;
      return query.follow === 'all'
        ? searchMatches(issue, query.q ?? '')
        : matchingIds.has(id);
    });
    const waits = await readWaits(viewer, scope.issues, scope.blockedIds);
    const model = createTaskGroupModel({
      issues: scope.issues,
      matchingIds,
      waits,
      followIds,
      mode: query.mode ?? 'split',
      statusFilter: query.statusKey,
      flat: Boolean(query.executorId),
      sort: query.sort,
      direction: query.direction,
      queryIdentity: JSON.stringify([
        viewer.userId,
        viewer.permissions,
        viewer.projectIds,
        filters,
        query.follow ?? 'scope',
      ]),
      now: now(),
    });
    if (query.generation && query.generation !== model.generation)
      throw new TaskGroupsChangedError();
    return { model, issues, matchingIds, waits, follow };
  }

  async function hydrate(
    viewer: Viewer,
    nodes: readonly TaskGroupNode[],
    issues: ReadonlyMap<string, Issue>,
    follow: FollowState,
  ): Promise<TaskGroupItem[]> {
    const rows = await projects.issueQueries.hierarchyItems(
      viewer,
      nodes.map((node) => node.id),
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    return nodes.map((node) => {
      const issue = byId.get(node.id);
      // Changed or gone since the hierarchy was read: the caller reads the query again.
      if (!issue || issue.revision !== issues.get(node.id)?.revision)
        throw new TaskGroupsChangedError();
      const parent = node.parentId ? issues.get(node.parentId) : undefined;
      return {
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
        unread: node.followed ? (follow.unread.get(node.id) ?? 0) : 0,
        progress: node.progress,
        hasChildren: node.hasChildren,
        context: node.context,
        expand: node.expand,
      };
    });
  }

  async function roleCount(
    viewer: Viewer,
    query: TaskGroupQuery,
    follow: FollowState,
  ): Promise<TaskRoleCount> {
    const { model, issues, matchingIds } = await assemble(
      viewer,
      { ...query, mode: 'split', follow: 'all' },
      follow,
    );
    const open = [...matchingIds].filter((id) => {
      const issue = issues.get(id);
      return issue && !isTerminalCategory(statusCategory(issue.statusKey));
    }).length;
    return { open, waiting: model.waiting };
  }

  return {
    async read(viewer, query) {
      const followed = await followOf(viewer);
      return projects.tx.unit(async () => {
        const { model, issues, follow } = await assemble(
          viewer,
          query,
          followed,
        );
        const groups = [];
        for (const { group, count } of model.groups) {
          const wanted = !query.group || query.group === group;
          const result = model.group(
            group,
            query.limit,
            query.group === group ? query.cursor : undefined,
          );
          groups.push({
            group,
            count,
            data: wanted
              ? await hydrate(viewer, result.data, issues, follow)
              : [],
            nextCursor: result.nextCursor,
          });
        }
        return {
          generation: model.generation,
          mode: query.mode ?? 'split',
          groups,
          following: follow.ids,
          waiting: model.waiting,
        };
      });
    },
    async children(viewer, query) {
      const followed = await followOf(viewer);
      return projects.tx.unit(async () => {
        const { model, issues, follow } = await assemble(
          viewer,
          { ...query, mode: 'table' },
          followed,
        );
        const result = model.children(
          query.parentId,
          query.limit,
          query.cursor,
        );
        return {
          generation: result.generation,
          data: await hydrate(viewer, result.data, issues, follow),
          nextCursor: result.nextCursor,
        };
      });
    },
    async summary(viewer) {
      const followed = await followOf(viewer);
      return projects.tx.unit(async () => ({
        owned: await roleCount(
          viewer,
          { ownerUserId: viewer.userId },
          followed,
        ),
        executing: await roleCount(
          viewer,
          { executorId: viewer.userId },
          followed,
        ),
        waiting: (await assemble(viewer, { mode: 'split' }, followed)).waits
          .size,
      }));
    },
  };
}
