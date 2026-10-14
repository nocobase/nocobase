/** The largest issue scope accepted by the work summary endpoint. */
export const ISSUE_AGENT_WORK_BATCH = 100;

/** Whether an agent works on an issue its project manager executes, visible to whoever sees the issue; no run details. */
export interface IssueAgentWork {
  readonly issueId: string;
  readonly agentId: string;
  readonly working: boolean;
}
