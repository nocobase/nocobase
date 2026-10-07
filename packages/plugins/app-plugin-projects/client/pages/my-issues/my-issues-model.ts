import type { IssueFilterKey, IssueFilters } from '../issues/filters.js';

export type MyIssuesRole = 'owned' | 'executing';

/**
 * The filters a "my issues" tab fixes: I own is `ownerUserId = me`, I execute is `executorId = me`. The fixed key is hidden from the toolbar; every other filter still comes from the URL.
 */
export function myIssueFilters(
  role: MyIssuesRole,
  userId: string,
): {
  readonly fixedFilters: IssueFilters;
  readonly hiddenFilters: readonly IssueFilterKey[];
} {
  return role === 'owned'
    ? { fixedFilters: { ownerUserId: userId }, hiddenFilters: ['ownerUserId'] }
    : { fixedFilters: { executorId: userId }, hiddenFilters: ['executorId'] };
}
