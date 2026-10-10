import type { WorkflowRun } from './platform.js';

/**
 * What happened to pull requests, for the rest of Studio to follow by identity (previews, `../previews`): a pull
 * request was stored (opened, a new head, merged, closed: whatever a read of the host changed), linked to an issue, or
 * unlinked from one.
 * Listeners run after the change committed; a listener's failure is reported and never undoes it.
 */
export type PullRequestEvent =
  | { readonly type: 'stored'; readonly pullRequestId: string }
  | {
      readonly type: 'linked' | 'unlinked';
      readonly pullRequestId: string;
      readonly issueId: string;
    };

export type PullRequestListener = (event: PullRequestEvent) => Promise<void>;

export interface PullRequestEvents {
  /** Returns what stops listening. */
  on(listener: PullRequestListener): () => void;
  emit(event: PullRequestEvent): Promise<void>;
}

export function createPullRequestEvents(
  onError: (message: string, error: unknown) => void,
): PullRequestEvents {
  const listeners = new Set<PullRequestListener>();
  return {
    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async emit(event) {
      for (const listener of [...listeners])
        await listener(event).catch((error: unknown) =>
          onError('A pull request listener failed.', error),
        );
    },
  };
}

/**
 * What a repository's webhook said beyond pull requests, for the rest of Studio to follow (a project's initialization,
 * `../projects-init`): a push to a branch, and a workflow run. Listeners run after the delivery was recorded; a
 * listener's failure is reported and never fails the delivery.
 */
export type RepoEvent =
  | {
      readonly type: 'push';
      readonly repoId: string;
      /** `owner/name`. */
      readonly repo: string;
      readonly branch: string;
      readonly created: boolean;
      readonly before: string | null;
      readonly after: string | null;
    }
  | {
      readonly type: 'workflowRun';
      readonly repoId: string;
      readonly repo: string;
      readonly action: 'requested' | 'in_progress' | 'completed';
      readonly run: WorkflowRun;
    };

export type RepoListener = (event: RepoEvent) => Promise<void>;

export interface RepoEvents {
  /** Returns what stops listening. */
  on(listener: RepoListener): () => void;
  emit(event: RepoEvent): Promise<void>;
}

export function createRepoEvents(
  onError: (message: string, error: unknown) => void,
): RepoEvents {
  const listeners = new Set<RepoListener>();
  return {
    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async emit(event) {
      for (const listener of [...listeners])
        await listener(event).catch((error: unknown) =>
          onError('A repository listener failed.', error),
        );
    },
  };
}
