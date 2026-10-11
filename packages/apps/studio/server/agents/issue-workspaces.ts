/**
 * Whether the work on an issue is over, so runners remove the working directories they keep for it
 * (`SubjectBinding.workspaces`).
 *
 * It is over when the issue's status is in the done or closed category (Done, Cancelled, or a project's own statuses
 * of those categories), whatever its pull requests are: a runner then removes the issue's directories, with anything
 * in them that was never pushed. Reopening the issue checks its branch out again. An issue that is gone or deleted
 * keeps its directories. While a run on the issue has not finished, the agents plugin keeps them too.
 *
 * A directory a runner kept from before it recorded runs, or whose run is gone, is named by the issue's key
 * (`resolveKeys`): only a key naming an issue Studio still has resolves.
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import { isTerminalCategory } from '@nocobase/app-plugin-projects/shared/workflows';

import type { SubjectWorkspaces } from '@nocobase/app-plugin-agents/server/tokens';

import { categoriesOf, findIssues } from '../previews/sources.js';

export function issueWorkspaces(
  projects: () => Pick<Projects, 'issueQueries'>,
): SubjectWorkspaces {
  return {
    async resolveKeys(conn, keys) {
      const resolved = new Map<string, string[]>();
      const wanted = [...new Set(keys.filter((key) => key !== ''))];
      if (wanted.length === 0) return resolved;
      const rows = await conn.query
        .selectFrom('pmIssues')
        .select(['id', 'identifier'])
        .where('identifier', 'in', wanted)
        .where('deletedAt', 'is', null)
        .execute<{ id: unknown; identifier: unknown }>();
      for (const row of rows) {
        const key = String(row.identifier);
        resolved.set(
          key,
          [...(resolved.get(key) ?? []), String(row.id)].sort(),
        );
      }
      return resolved;
    },

    async settled(conn, subjectIds) {
      const settled = new Set<string>();
      const issues = (await findIssues(conn, subjectIds)).filter(
        (issue) => !issue.deleted,
      );
      // A project's workflow may name its own statuses: the category decides, read once per project.
      const categories = new Map<
        string | null,
        Awaited<ReturnType<typeof categoriesOf>>
      >();
      for (const issue of issues) {
        if (!categories.has(issue.projectId))
          categories.set(
            issue.projectId,
            await categoriesOf(projects(), issue.projectId),
          );
        const category =
          categories.get(issue.projectId)?.get(issue.statusKey) ?? null;
        if (isTerminalCategory(category)) settled.add(issue.id);
      }
      return settled;
    },
  };
}
