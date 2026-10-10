import {
  useSubjectRuns,
  type SubjectRun,
} from '@nocobase/app-plugin-agents/client/runs';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useMemo } from 'react';

/** The agents' runs on an issue: newest first, kept current, refreshed when the issue changes. */
export function useIssueRuns(
  issue: IssueDetail,
  refreshSignal?: unknown,
): readonly SubjectRun[] {
  const signal = useMemo(
    () => [issue.revision, issue.lastActivityAt, refreshSignal],
    [issue.revision, issue.lastActivityAt, refreshSignal],
  );
  // The page coordinator owns refreshes; presentation observers only read the shared cache.
  // Invalidating from every run row restarts the same request once per observer.
  return useSubjectRuns(
    'issue',
    issue.id,
    refreshSignal === undefined ? undefined : signal,
  );
}
