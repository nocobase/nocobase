import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { IssueListQuery } from '@nocobase/app-plugin-projects/shared/issues';
import {
  isTerminalCategory,
  statusCategory,
} from '@nocobase/app-plugin-projects/shared/statuses';
import type { StudioInbox } from '../inbox/service.js';
import type {
  TaskTreeQuery,
  TaskTreeRow,
  TaskTrees,
  TaskTreePage,
} from '../../shared/task-trees.js';
import { TASK_GROUPS } from '../../shared/task-trees.js';
import { OWNER_HANDOFFS, type OwnerHandoff } from './owner-handoff.js';
import { NO_ATTENTION, REASON_GROUP, taskAttention } from './task-attention.js';
import {
  createTaskTreeModel,
  TreeCursorError,
  type TreeNode,
  type TreeRoot,
  type TreeAttention,
} from './tree-model.js';

/** Application-owned composition; Projects remains responsible for every issue visibility/filter read. */
export async function readTaskTrees(
  projects: Projects,
  inbox: Pick<StudioInbox, 'taskDecisions'> | undefined,
  viewer: Viewer,
  query: TaskTreeQuery,
): Promise<TaskTrees | TaskTreePage> {
  return projects.tx.unit(async () => {
    const filters: IssueListQuery = {
      q: query.q,
      statusKey: query.statusKey,
      projectId: query.projectId,
      ownerUserId: query.ownerUserId,
      executorId: query.executorId,
      labelId: query.labelId,
      parentIssueId: query.parentIssueId,
    };
    const scope = await projects.issueQueries.hierarchy(viewer, filters);
    const issues = new Map(scope.issues.map((issue) => [issue.id, issue]));
    const decisions =
      (await inbox?.taskDecisions([...issues.keys()], viewer.userId)) ?? [];
    const byIssue = new Map<string, typeof decisions>();
    for (const decision of decisions) {
      const values = byIssue.get(decision.issueId) ?? [];
      values.push(decision);
      byIssue.set(decision.issueId, values);
    }
    const handoffs = new Map<string, OwnerHandoff>();
    const ids = [...issues.keys()];
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
    const attention = new Map(
      scope.issues.map((issue) => [
        issue.id,
        taskAttention(
          issue,
          viewer,
          scope.blockedIds.has(issue.id),
          byIssue.get(issue.id) ?? [],
          handoffs.get(issue.id),
        ),
      ]),
    );
    const ranked = new Map<string, TreeAttention>();
    for (const [id, value] of attention) {
      const group = TASK_GROUPS.find((group) =>
        value.reasons.some((reason) => REASON_GROUP[reason] === group),
      );
      if (group && group !== 'routine')
        ranked.set(id, { group, waitingForViewer: value.waitingForViewer });
    }
    const model = createTaskTreeModel({
      issues: scope.issues,
      matchingIds: new Set(scope.matchingIds),
      attention: ranked,
      finishedIds: new Set(
        scope.issues
          .filter((issue) =>
            isTerminalCategory(statusCategory(issue.statusKey)),
          )
          .map((issue) => issue.id),
      ),
      sort: query.sort,
      direction: query.direction,
      queryIdentity: JSON.stringify([
        viewer.userId,
        viewer.permissions,
        viewer.projectIds,
        filters,
        [...attention].sort(([a], [b]) => a.localeCompare(b)),
      ]),
    });
    if (query.generation && query.generation !== model.generation)
      throw new TreeCursorError();

    async function hydrate(
      nodes: readonly (TreeNode | TreeRoot)[],
    ): Promise<TaskTreeRow[]> {
      const rows = await projects.issueQueries.hierarchyItems(
        viewer,
        nodes.map((node) => node.id),
      );
      const displayed = new Map(rows.map((row) => [row.id, row]));
      return nodes.map((node) => {
        const issue = displayed.get(node.id);
        if (!issue || issue.revision !== issues.get(node.id)?.revision)
          throw new TreeCursorError();
        const explanationId =
          'attentionTaskId' in node ? node.attentionTaskId : null;
        const explained = explanationId ? issues.get(explanationId) : undefined;
        const reason = explanationId
          ? attention
              .get(explanationId)
              ?.reasons.find(
                (reason) => REASON_GROUP[reason] === (node as TreeRoot).group,
              )
          : undefined;
        return {
          issue: {
            ...issue,
            parentIssueId: node.parentId,
            subtaskCount: node.progress.total,
          },
          parentId: node.parentId,
          rootId: node.rootId,
          matchesFilter: node.matchesFilter,
          hasChildren: node.hasChildren,
          progress: node.progress,
          attention: attention.get(node.id) ?? NO_ATTENTION,
          explanation:
            explained && reason
              ? { identifier: explained.identifier, reason }
              : null,
        };
      });
    }
    if (query.parentId) {
      const result = model.children(query.parentId, query.limit, query.cursor);
      return { ...result, data: await hydrate(result.data) };
    }
    const groups = [];
    for (const { group, totals } of model.groups) {
      const result = model.roots(
        group,
        query.limit,
        query.group === group ? query.cursor : undefined,
      );
      groups.push({
        group,
        totals,
        ...result,
        data:
          query.group && query.group !== group
            ? []
            : await hydrate(result.data),
      });
    }
    return { generation: model.generation, groups };
  });
}
