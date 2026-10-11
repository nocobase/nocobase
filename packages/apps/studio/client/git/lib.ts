/**
 * What Studio's pull request pages share besides components: reading Studio's error reasons, new webhook secrets,
 * posting a form to a host, and the wording keys of the pull request activities.
 */
import { ApiClientError } from '@nocobase/app-client';

import {
  MERGE_BLOCKERS,
  PR_ACTIVITIES,
  type PullRequestMergeBlocker,
} from '../../shared/git.js';

/** The reason of a failed request and the merge blocker it names (`metadata.blocker`), if any. */
export function gitErrorOf(error: unknown): {
  readonly code: string | null;
  readonly blocker: PullRequestMergeBlocker | null;
} {
  if (!(error instanceof ApiClientError)) return { code: null, blocker: null };
  const metadata = (
    error.payload as { error?: { metadata?: { blocker?: unknown } } } | null
  )?.error?.metadata;
  const blocker = MERGE_BLOCKERS.find((item) => item === metadata?.blocker);
  return { code: error.reason ?? null, blocker: blocker ?? null };
}

/** 32 random bytes as hex: a new webhook secret. */
export function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Posts a form from the browser, leaving the page: how an app's manifest reaches the host. */
export function postForm(
  action: string,
  fields: Readonly<Record<string, string>>,
): void {
  const form = document.createElement('form');
  form.method = 'post';
  form.action = action;
  form.style.display = 'none';
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
}

/** The wording of Studio's pull request activities on an issue (`PR_ACTIVITIES`), in Studio's namespace. */
export const PR_ACTIVITY_LABELS: Readonly<Record<string, string>> = {
  [PR_ACTIVITIES.edited]: 'studioGit.activity.pr_edited',
  [PR_ACTIVITIES.closed]: 'studioGit.activity.pr_closed',
  [PR_ACTIVITIES.reopened]: 'studioGit.activity.pr_reopened',
};
