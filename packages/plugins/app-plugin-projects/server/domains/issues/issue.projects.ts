/** The issues side of projects (`ProjectIssues`): issue counts, and detaching the issues of a deleted project. */
import type { IssueCounts } from '../../../shared/projects.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { ProjectIssues } from '../projects/index.js';
import {
  countByProjectAndStatus,
  issuesOfProject,
  updateIssue,
} from './issue.store.js';
import type { StatusCatalogs } from './ports.js';

export function createProjectIssues(deps: {
  readonly activity: ActivityRecorder;
  readonly statuses: StatusCatalogs;
}): ProjectIssues {
  return {
    async counts(conn, projectIds) {
      const byProject = new Map<string, Record<string, number>>();
      for (const {
        projectId,
        statusKey,
        count,
      } of await countByProjectAndStatus(conn, projectIds)) {
        const byStatus = byProject.get(projectId) ?? {};
        byStatus[statusKey] = count;
        byProject.set(projectId, byStatus);
      }
      const result = new Map<string, IssueCounts>();
      for (const [projectId, byStatus] of byProject) {
        const catalog = await deps.statuses.forProject(conn, projectId);
        const entries = Object.entries(byStatus);
        result.set(projectId, {
          total: entries.reduce((sum, [, count]) => sum + count, 0),
          done: entries
            .filter(([key]) => catalog.category(key) === 'done')
            .reduce((sum, [, count]) => sum + count, 0),
          byStatus,
        });
      }
      return result;
    },

    async detach(tx, projectId, actor) {
      for (const issue of await issuesOfProject(tx.conn, projectId)) {
        await updateIssue(tx.conn, issue.id, {
          projectId: null,
          updatedAt: new Date().toISOString(),
        });
        await deps.activity.record(tx.conn, {
          issueId: issue.id,
          actor,
          action: 'project_changed',
          details: { from: projectId, to: null, reason: 'projectDeleted' },
        });
        tx.emit({ type: 'issue.changed', issueId: issue.id });
      }
    },
  };
}
