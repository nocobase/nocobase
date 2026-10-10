/**
 * Whether the work on an issue is over, so runners may remove the working directories they keep for it
 * (`SubjectBinding.workspaces`).
 *
 * It is over when the issue's status is in the done or closed category (Done, Cancelled, or a project's own statuses
 * of those categories) and every pull request linked to it is merged or closed; an issue with no pull request is over
 * on its status alone. This is decided from what Studio records, not from the branch history on the runner: a branch
 * merged with a squash is not in the base branch's history, but its pull request is merged here. An issue that is
 * gone, deleted, still has an open pull request, or links a pull request Studio no longer has a record of (its state
 * cannot be told) keeps its directories. The runner separately keeps a directory that
 * holds changes not committed or commits not pushed, whatever the answer.
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import { isTerminalCategory } from '@nocobase/app-plugin-projects/shared/workflows';

import type { SubjectWorkspaces } from '@nocobase/app-plugin-agents/server/tokens';

import { LINKS, pullRequestsOfIssues } from '../git/store.js';
import { categoriesOf, findIssues } from '../previews/sources.js';

export function issueWorkspaces(
  projects: () => Pick<Projects, 'issueQueries'>,
): SubjectWorkspaces {
  return {
    async settled(conn, subjectIds) {
      const settled = new Set<string>();
      const issues = (await findIssues(conn, subjectIds)).filter(
        (issue) => !issue.deleted,
      );
      if (issues.length === 0) return settled;
      // A project's workflow may name its own statuses: the category decides, read once per project.
      const categories = new Map<
        string | null,
        Awaited<ReturnType<typeof categoriesOf>>
      >();
      const finished: string[] = [];
      for (const issue of issues) {
        if (!categories.has(issue.projectId))
          categories.set(
            issue.projectId,
            await categoriesOf(projects(), issue.projectId),
          );
        const category =
          categories.get(issue.projectId)?.get(issue.statusKey) ?? null;
        if (isTerminalCategory(category)) finished.push(issue.id);
      }
      if (finished.length === 0) return settled;
      const pulls = await pullRequestsOfIssues(conn, finished);
      // A link whose pull request is missing is left out of `pulls`: count the links themselves, so such an issue
      // is not taken for one without pull requests.
      const linked = new Map<string, number>();
      for (const row of await conn.query
        .selectFrom(LINKS)
        .select('issueId')
        .where('issueId', 'in', finished)
        .execute<{ issueId: unknown }>()) {
        const id = String(row.issueId);
        linked.set(id, (linked.get(id) ?? 0) + 1);
      }
      for (const id of finished) {
        const known = pulls.get(id) ?? [];
        if (
          known.length === (linked.get(id) ?? 0) &&
          known.every(({ pr }) => pr.state !== 'open')
        )
          settled.add(id);
      }
      return settled;
    },
  };
}
