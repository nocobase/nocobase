/** The largest issue scope accepted by the work summary endpoint. */
export const ISSUE_AGENT_WORK_BATCH = 100;

/** Work by the current executor, visible to whoever sees the issue; no run or approval details. */
export interface IssueAgentWork {
  readonly issueId: string;
  readonly agentId: string;
  readonly working: boolean;
}
