/** Workspace parameters are independent of the personal task query and view. */
export function selectWorkspaceIssue(
  params: URLSearchParams,
  issueId: string | null,
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (issueId) next.set('issue', issueId);
  else next.delete('issue');
  return next;
}

/** Only an acknowledged removal changes an existing selection; temporary links remain temporary. */
export function selectionAfterRemoval(
  selected: string | null,
  before: readonly string[],
  after: readonly string[],
): string | null {
  return selected && before.includes(selected) && !after.includes(selected)
    ? (after[0] ?? null)
    : selected;
}

export function legacyFollowUpsLocation(
  search: string,
  hash: string,
): { pathname: string; search: string; hash: string } {
  const params = new URLSearchParams(search);
  if (params.get('tab') !== 'mine') params.set('tab', 'following');
  return {
    pathname: '/my-issues/owned',
    search: params.toString() ? `?${params}` : '',
    hash,
  };
}
