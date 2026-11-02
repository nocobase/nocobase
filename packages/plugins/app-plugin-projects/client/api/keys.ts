import type { QueryKey } from '@tanstack/react-query';

import type { IssueListQuery } from '../../shared/issues.js';

/**
 * Query keys. Everything sits under `pm`; issue pages and board columns under `issues`, one issue's reads under
 * `issue(id)`, so invalidating a prefix refreshes every loaded view of it.
 */
export const pmKeys = {
  all: ['pm'] as const,
  me: ['pm', 'me'] as const,
  members: ['pm', 'members'] as const,
  executors: ['pm', 'executors'] as const,
  apiKeyActors: ['pm', 'api-key-actors'] as const,
  /** Under `members`, so refreshing members refreshes them too. */
  invitations: ['pm', 'members', 'invitations'] as const,
  settings: ['pm', 'settings'] as const,
  labels: ['pm', 'labels'] as const,
  projects: ['pm', 'projects'] as const,
  project: (id: string): QueryKey => ['pm', 'projects', id],
  issues: ['pm', 'issues'] as const,
  /** The fixed statuses. */
  statuses: ['pm', 'statuses'] as const,
  issuePages: (query: IssueListQuery): QueryKey => [
    'pm',
    'issues',
    'pages',
    query,
  ],
  board: (query: IssueListQuery): QueryKey => ['pm', 'issues', 'board', query],
  boardColumn: (query: IssueListQuery, statusKey: string): QueryKey => [
    'pm',
    'issues',
    'column',
    query,
    statusKey,
  ],
  issueSearch: (q: string): QueryKey => ['pm', 'issues', 'search', q],
  issue: (id: string): QueryKey => ['pm', 'issue', id],
  activities: (id: string): QueryKey => ['pm', 'issue', id, 'activities'],
  /** Older thread pages, under the issue like its activities. */
  threads: (id: string): QueryKey => ['pm', 'issue', id, 'threads'],
  mentions: (issueId: string | null): QueryKey => ['pm', 'mentions', issueId],
};
