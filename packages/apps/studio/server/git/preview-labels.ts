/** Reconcile just no-preview, preserving pre-existing manual labels and every unrelated label. */
import type { DatabaseConnection } from '@nocobase/db';
import {
  previewLabelState,
  previewNotRequired,
  savePreviewLabelState,
} from '../previews/preferences.js';
import { findIssue } from '../previews/sources.js';
import type { GitAuth, GitPlatform } from './platform.js';
import {
  findPullRequestById,
  findRepoById,
  linksOfPullRequest,
  pullRequestsOfIssue,
  type RepoRow,
} from './store.js';

const LABEL = 'no-preview';

export function createPreviewLabelSync(deps: {
  conn(): DatabaseConnection;
  platformOf(repo: RepoRow): GitPlatform;
  readAuth(repo: RepoRow): Promise<GitAuth>;
}) {
  const running = new Map<string, Promise<void>>();
  async function reconcile(
    pullRequestId: string,
    knownPresent?: boolean,
  ): Promise<void> {
    const conn = deps.conn();
    const pr = await findPullRequestById(conn, pullRequestId);
    if (!pr || pr.state !== 'open') return;
    let state = await previewLabelState(conn, pullRequestId);
    try {
      const repo = await findRepoById(conn, pr.repoId);
      if (!repo) return;
      const platform = deps.platformOf(repo);
      const auth = await deps.readAuth(repo);
      const present =
        knownPresent ??
        (await platform.hasPullRequestLabel(auth, pr.repo, pr.number, LABEL));
      const links = await linksOfPullRequest(conn, pr.id);
      const preferences: boolean[] = [];
      for (const link of links) {
        const issue = await findIssue(conn, link.issueId);
        if (issue && !issue.deleted)
          preferences.push(await previewNotRequired(conn, issue.id));
      }
      const wanted = preferences.length > 0 && preferences.every(Boolean);
      state = { ...state, present, failed: false };
      if (wanted && !present) {
        // Persist ownership before the external write: a timeout may mean GitHub accepted it.
        state = { ...state, managed: true };
        await savePreviewLabelState(conn, state);
        await platform.addPullRequestLabel(auth, pr.repo, pr.number, LABEL);
        state = { ...state, present: true };
      } else if (!wanted && state.managed) {
        if (present)
          await platform.removePullRequestLabel(
            auth,
            pr.repo,
            pr.number,
            LABEL,
          );
        state = { ...state, managed: false, present: false };
      }
      await savePreviewLabelState(conn, state);
    } catch {
      // Saving the preference / creating the PR succeeded. The poller retries from current preferences.
      await savePreviewLabelState(conn, { ...state, failed: true });
    }
  }
  async function sync(id: string, knownPresent?: boolean): Promise<void> {
    // Queue, rather than coalesce, so a toggle during a host request is reconciled again with the latest values.
    const pending = running.get(id);
    const previous = pending ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => reconcile(id, pending ? undefined : knownPresent));
    running.set(id, next);
    try {
      await next;
    } finally {
      if (running.get(id) === next) running.delete(id);
    }
  }
  return {
    sync,
    async syncIssue(issueId: string): Promise<void> {
      for (const { pr } of await pullRequestsOfIssue(deps.conn(), issueId))
        await sync(pr.id);
    },
    async syncManaged(
      repoId: string,
      seen: ReadonlySet<string>,
    ): Promise<void> {
      const rows = await deps
        .conn()
        .query.selectFrom('studioPreviewLabels as label')
        .innerJoin('studioPullRequests as pr', 'pr.id', 'label.pullRequestId')
        .select('pr.id')
        .where('pr.repoId', '=', repoId)
        .where('pr.state', '=', 'open')
        .where('label.managed', '=', true)
        .execute();
      for (const row of rows)
        if (!seen.has(String(row.id))) await sync(String(row.id));
    },
  };
}
