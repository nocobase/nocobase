/** Opaque execution facts supplied by the application; projects does not depend on the agents plugin. */
export interface ActivityExecution {
  readonly attempt: number;
  readonly runnerId: string;
  readonly runnerName?: string | null;
  readonly runnerOwnerUserId?: string | null;
  readonly runnerOwnerName?: string | null;
  readonly runnerTrust?: 'team' | 'ownerOnly' | null;
  readonly machineHidden?: boolean;
  readonly tool?: string | null;
  readonly toolVersion?: string | null;
  readonly model?: string | null;
  readonly actualModels?: readonly string[];
  readonly effort?: string | null;
  readonly actualEffort?: string | null;
  readonly actualEffortSource?: string | null;
  readonly actualEffortAt?: string | null;
}

/**
 * Who a person acted through, recorded with each activity (`Activity.via`) and comment (`IssueComment.source`).
 * `agent`: an agent acted for the person or proposed the plan they executed. `plan`: a plan nobody's agent proposed.
 * `cli` and `api_key`: the API without the browser.
 */
export interface ActivityVia {
  readonly type: 'cli' | 'api_key' | 'agent' | 'plan';
  readonly agentId?: string;
  readonly agentName?: string | null;
  readonly runId?: string;
  readonly execution?: ActivityExecution;
  /** Only meaningful to the conversation's owner; the agents plugin checks access. */
  readonly conversationId?: string;
  readonly planId?: string;
}
