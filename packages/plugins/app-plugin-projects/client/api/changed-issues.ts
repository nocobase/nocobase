/**
 * Which cached issue reads an announcement (`PmChangeEvent.issueIds`) concerns: an issue's reads are keyed by
 * `pmKeys.issue(idOrKey)` and what sits under it, with the id or, on a page opened by its key, the identifier.
 */
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { PmChangeEvent } from '../../shared/realtime.js';

/** The issue ids an announcement names, or null when any issue may have changed. */
export function announcedIssueIds(
  payload: unknown,
): ReadonlySet<string> | null {
  const ids = (payload as Partial<PmChangeEvent> | null)?.issueIds;
  return Array.isArray(ids) && ids.every((id) => typeof id === 'string')
    ? new Set(ids)
    : null;
}

/** The key segments (`pmKeys.issue(segment)`) whose reads are of one of `issueIds`: the ids, and the keys loaded for them. */
export function changedIssueSegments(
  client: Pick<QueryClient, 'getQueryCache'>,
  issueIds: ReadonlySet<string>,
): Set<string> {
  const segments = new Set(issueIds);
  for (const query of client
    .getQueryCache()
    .findAll({ queryKey: ['pm', 'issue'] })) {
    const segment = query.queryKey[2];
    const id = (query.state.data as { id?: unknown } | undefined)?.id;
    if (
      typeof segment === 'string' &&
      typeof id === 'string' &&
      issueIds.has(id)
    )
      segments.add(segment);
  }
  return segments;
}

/** Whether a query key is one issue's read (`['pm', 'issue', segment, ...]`) of a segment among `segments`. */
export function isIssueRead(
  key: QueryKey,
  segments: ReadonlySet<string>,
): boolean {
  return (
    key[0] === 'pm' &&
    key[1] === 'issue' &&
    typeof key[2] === 'string' &&
    segments.has(key[2])
  );
}
