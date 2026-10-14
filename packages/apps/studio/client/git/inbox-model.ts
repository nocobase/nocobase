/** What Studio's pull request items read (`inbox.tsx`, `inbox-parts.tsx`). */
import type { UseQueryResult } from '@tanstack/react-query';

import type { IssuePullRequests } from '../../shared/git.js';
import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import { useIssuePullRequests } from './api.js';

export interface GitModel {
  readonly pullRequests: UseQueryResult<IssuePullRequests>;
}

/** A value of the item's data; data is the sender's, so only its own types are trusted. */
export function field(entry: InboxEntry, key: string): string | null {
  const value = entry.notice?.data?.[key];
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value !== '' ? value : null;
}

export const labelOf = (entry: InboxEntry) =>
  `${field(entry, 'repo') ?? '?'}#${field(entry, 'number') ?? '?'}`;

export function useGitModel(entry: InboxEntry): GitModel {
  return {
    pullRequests: useIssuePullRequests(field(entry, 'issueId') ?? '', 0),
  };
}

export function pullRequestOf(entry: InboxEntry, model: GitModel) {
  const id = field(entry, 'pullRequestId');
  return model.pullRequests.data?.data.find((item) => item.id === id) ?? null;
}
