import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router';
import { underIssue, useIssueBase } from '../issues/detail/issue-base.js';

/** Embedded task panels supply an opener while full task pages keep their child routes. */
export const RunNavigationContext = createContext<
  ((runId: string) => void) | null
>(null);

export function useOpenIssueRun(): (runId: string) => void {
  const open = useContext(RunNavigationContext);
  const navigate = useNavigate();
  const base = useIssueBase();
  return (
    open ??
    ((runId) =>
      void navigate(underIssue(base, `runs/${encodeURIComponent(runId)}`)))
  );
}
