/**
 * Tells open pages what Studio stored about pull requests (`STUDIO_GIT_TOPIC`), once for the stores of a moment (a poll
 * or a burst of webhook deliveries stores several in a row), naming the issues the pull requests are linked to so a page
 * reads again only what it shows of them. A change it cannot tie to pull requests is announced without issues.
 */
import type { StudioGitEvent } from '../../shared/git.js';

/** How long stores are gathered before they are announced. */
export const GIT_ANNOUNCE_DELAY_MS = 250;

/** More issues than this in one announcement are announced without naming them. */
export const GIT_ANNOUNCED_ISSUES_MAX = 100;

export interface GitAnnouncer {
  /** Something about the pull request was stored; without one, about something else. */
  changed(pullRequestId?: string): void;
  flush(): Promise<void>;
  close(): void;
}

export function createGitAnnouncer(deps: {
  /** The issues linked to the pull requests. */
  readonly issuesOf: (pullRequestIds: readonly string[]) => Promise<string[]>;
  readonly publish: (event: StudioGitEvent) => void;
  readonly onError?: (error: unknown) => void;
  readonly delayMs?: number;
}): GitAnnouncer {
  let pullRequestIds = new Set<string>();
  let unnamed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = async (): Promise<void> => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const ids = [...pullRequestIds];
    const anything = unnamed;
    pullRequestIds = new Set();
    unnamed = false;
    if (anything) {
      deps.publish({ kind: 'studio.git.changed' });
      return;
    }
    if (ids.length === 0) return;
    const issueIds = await deps.issuesOf(ids);
    // Pull requests linked to no issue show on no issue's page.
    if (issueIds.length === 0) return;
    deps.publish(
      issueIds.length > GIT_ANNOUNCED_ISSUES_MAX
        ? { kind: 'studio.git.changed' }
        : { kind: 'studio.git.changed', issueIds },
    );
  };

  return {
    changed(pullRequestId) {
      if (pullRequestId) pullRequestIds.add(pullRequestId);
      else unnamed = true;
      if (!timer) {
        timer = setTimeout(() => {
          flush().catch((error: unknown) => deps.onError?.(error));
        }, deps.delayMs ?? GIT_ANNOUNCE_DELAY_MS);
        timer.unref?.();
      }
    },
    flush,
    close() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      pullRequestIds = new Set();
      unnamed = false;
    },
  };
}
