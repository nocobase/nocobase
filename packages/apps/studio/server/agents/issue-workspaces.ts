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
 *
 * A directory a runner kept from before it recorded runs is named by the issue's key (`resolveKeys`): only a key that
 * names one issue Studio still has resolves, and the agents plugin then checks the runner worked on it. What a runner
 * may take as proof that a directory's commits were pushed (`commits`) is the head each merged pull request was merged
 * at, as the host confirmed it (`mergedHeadSha`), named by the URL the project's working directory checks the
 * repository out from. Never a squash commit, the head a person's mark recorded, or a closed pull request's head.
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import { isTerminalCategory } from '@nocobase/app-plugin-projects/shared/workflows';

import type { WorkspaceCommitEvidence } from '@nocobase/agent-protocol';
import type { SubjectWorkspaces } from '@nocobase/app-plugin-agents/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import { LINKS, REPOS, pullRequestsOfIssues } from '../git/store.js';
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
        const ids = resolved.get(key) ?? [];
        ids.push(String(row.id));
        resolved.set(key, ids.sort());
      }
      return resolved;
    },

    commits: mergedHeads,

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

interface ResourceRow {
  readonly projectId: string;
  readonly url: string;
  readonly provider: string;
  readonly connectionId: string;
  readonly fullName: string;
}

/**
 * By issue, the merged heads of its linked pull requests the host confirmed, each under the URL of every working
 * directory of the issue's project bound to the pull request's repository through the same connection, sorted and
 * without repeats. A repository no working directory of the project is bound to, or one Studio reaches through no
 * connection, gives none: its URL could not be told to be the one a runner checked out.
 */
async function mergedHeads(
  conn: DatabaseConnection,
  subjectIds: readonly string[],
): Promise<Map<string, WorkspaceCommitEvidence[]>> {
  const result = new Map<string, WorkspaceCommitEvidence[]>();
  const issues = (await findIssues(conn, subjectIds)).filter(
    (issue) => !issue.deleted && issue.projectId !== null,
  );
  if (issues.length === 0) return result;
  const pulls = await pullRequestsOfIssues(
    conn,
    issues.map((issue) => issue.id),
  );
  const confirmed = new Map<string, { repoId: string; sha: string }[]>();
  const repoIds = new Set<string>();
  for (const [issueId, items] of pulls)
    for (const { pr } of items) {
      if (pr.state !== 'merged' || pr.mergedHeadSha === null) continue;
      const list = confirmed.get(issueId) ?? [];
      list.push({ repoId: pr.repoId, sha: pr.mergedHeadSha });
      confirmed.set(issueId, list);
      repoIds.add(pr.repoId);
    }
  if (repoIds.size === 0) return result;
  const repos = new Map(
    (
      await conn.query
        .selectFrom(REPOS)
        .select(['id', 'provider', 'repo', 'connectionId'])
        .where('id', 'in', [...repoIds])
        .execute<Record<string, unknown>>()
    ).map((row) => [String(row.id), row]),
  );
  const projectIds = [
    ...new Set(issues.map((issue) => issue.projectId as string)),
  ];
  const resources: ResourceRow[] = (
    await conn.query
      .selectFrom('pmProjectResources')
      .select([
        'projectId',
        'url',
        'bindingProvider',
        'bindingConnectionId',
        'bindingFullName',
      ])
      .where('projectId', 'in', projectIds)
      .where('type', '=', 'gitRepo')
      .execute<Record<string, unknown>>()
  ).flatMap((row) =>
    typeof row.url === 'string' &&
    row.url !== '' &&
    typeof row.bindingConnectionId === 'string' &&
    typeof row.bindingFullName === 'string'
      ? [
          {
            projectId: String(row.projectId),
            url: row.url,
            provider:
              typeof row.bindingProvider === 'string'
                ? row.bindingProvider
                : 'github',
            connectionId: row.bindingConnectionId,
            fullName: row.bindingFullName,
          },
        ]
      : [],
  );
  for (const issue of issues) {
    const evidence = new Map<string, WorkspaceCommitEvidence>();
    for (const { repoId, sha } of confirmed.get(issue.id) ?? []) {
      const repo = repos.get(repoId);
      if (!repo || typeof repo.connectionId !== 'string') continue;
      for (const resource of resources)
        if (
          resource.projectId === issue.projectId &&
          resource.connectionId === repo.connectionId &&
          resource.provider === repo.provider &&
          resource.fullName.toLowerCase() === String(repo.repo).toLowerCase()
        )
          evidence.set(`${resource.url}\n${sha}`, {
            repository: resource.url,
            headSha: sha,
          });
    }
    if (evidence.size > 0)
      result.set(
        issue.id,
        [...evidence.entries()]
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([, item]) => item),
      );
  }
  return result;
}
