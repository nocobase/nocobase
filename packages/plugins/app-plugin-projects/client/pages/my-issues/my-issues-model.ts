import type { IssueFilterKey, IssueFilters } from '../issues/filters.js';

/** My tasks includes issues the viewer owns or executes, each once. */
export function myIssueFilters(userId: string): {
  readonly fixedFilters: IssueFilters;
  readonly hiddenFilters: readonly IssueFilterKey[];
} {
  return {
    fixedFilters: { involvesUserId: userId },
    hiddenFilters: ['involvesUserId'],
  };
}
