import {
  useSubjectRuns,
  type SubjectRun,
} from '@nocobase/app-plugin-agents/client/runs';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';

/** The agents' runs on an issue: newest first, kept current, refreshed when the issue changes. */
export function useIssueRuns(
  issue: IssueDetail,
  refreshSignal = 0,
): readonly SubjectRun[] {
  return useSubjectRuns(
    'issue',
    issue.id,
    `${issue.revision}:${refreshSignal}`,
  );
}
