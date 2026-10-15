/**
 * Where an issue's own page is when its parts are shown somewhere else, such as the split view's detail
 * (`issues/groups/detail-pane.tsx`): the pages under the issue (a run, a new sub-issue) are declared under its page, so
 * a link that is relative on the issue page leads from this address instead. Null on the issue page itself, where the
 * relative links already resolve.
 */
import { createContext, useContext } from 'react';

export const IssueBaseContext = createContext<string | null>(null);

export function useIssueBase(): string | null {
  return useContext(IssueBaseContext);
}

/** `path` under the issue's page: relative on the page itself, absolute from elsewhere. */
export function underIssue(base: string | null, path: string): string {
  return base ? `${base.replace(/\/$/u, '')}/${path}` : path;
}
