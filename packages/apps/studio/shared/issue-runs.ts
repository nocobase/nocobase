/**
 * What Studio announces when agent runs on issues change (`server/agents/issue-runs-announcer.ts`): which issues, never
 * what changed. An open page reads the issue's runs and progress again through the API, which checks access.
 */
export const STUDIO_ISSUE_RUNS_TOPIC = 'studio:issues:runs';

export interface StudioIssueRunsEvent {
  readonly kind: 'studio.issue.runs';
  readonly issueIds: readonly string[];
}
