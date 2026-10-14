/** Reconcile just no-preview, preserving pre-existing manual labels and every unrelated label. */
import type { DatabaseConnection } from '@nocobase/db';
import {
  previewLabelSnapshot,
  previewNotRequired,
  savePreviewLabelSnapshot,
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
  /** The stored label state changed (`present`, `failed` or `managed`). */
  onChanged?(): void;
}) {
  const running = new Map<string, Promise<void>>();
  async function reconcile(pullRequestId: string): Promise<void> {
    const conn = deps.conn();
    const pr = await findPullRequestById(conn, pullRequestId);
    if (!pr || pr.state !== 'open') return;
    let state = await previewLabelSnapshot(conn, pullRequestId);
    const before = state;
    const save = async (next: typeof state) => {
      await savePreviewLabelSnapshot(conn, next);
      const stored = await previewLabelSnapshot(conn, pullRequestId);
      if (
        stored.present !== before.present ||
        stored.failed !== before.failed ||
        stored.managed !== before.managed
      )
        deps.onChanged?.();
    };
    try {
      const repo = await findRepoById(conn, pr.repoId);
      if (!repo) return;
      const platform = deps.platformOf(repo);
      const auth = await deps.readAuth(repo);
      // Other PR readers (merge checks, webhooks, etc.) have their own validator. Only this request's cached
      // observation can answer a 304, even if another instance updates the database while the read is in flight.
      const pull = await platform.getPullRequest(
        auth,
        pr.repo,
        pr.number,
        state.etag,
      );
      const present = pull.notModified
        ? state.present
        : (pull.body.snapshot.labels?.includes(LABEL) ?? false);
      if (present === null)
        throw new Error(
          'GitHub returned 304 without a cached preview label observation.',
        );
      state = {
        ...(await previewLabelSnapshot(conn, pullRequestId)),
        present,
        etag: pull.notModified ? state.etag : pull.etag,
        failed: false,
      };
      const links = await linksOfPullRequest(conn, pr.id);
      const preferences: boolean[] = [];
      for (const link of links) {
        const issue = await findIssue(conn, link.issueId);
        if (issue && !issue.deleted)
          preferences.push(await previewNotRequired(conn, issue.id));
      }
      const wanted = preferences.length > 0 && preferences.every(Boolean);
      if (wanted && !present) {
        // Persist ownership before the external write: a timeout may mean GitHub accepted it.
        state = { ...state, managed: true, etag: null };
        await savePreviewLabelSnapshot(conn, state);
        await platform.addPullRequestLabel(auth, pr.repo, pr.number, LABEL);
        state = { ...state, present: true };
      } else if (!wanted && state.managed) {
        if (present) {
          state = { ...state, etag: null };
          await platform.removePullRequestLabel(
            auth,
            pr.repo,
            pr.number,
            LABEL,
          );
        }
        state = { ...state, present: false };
      }
      await save(state);
    } catch {
      // Saving the preference / creating the PR succeeded. The poller retries from current preferences.
      await save({
        ...state,
        failed: true,
        etag: null,
      });
    }
  }
  async function sync(id: string): Promise<void> {
    // Queue, rather than coalesce, so a toggle during a host request is reconciled again with the latest values.
    const pending = running.get(id);
    const previous = pending ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(() => reconcile(id));
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
  };
}
