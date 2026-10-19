/** A viewer-visible runtime whose quota blocks an otherwise eligible agent. */
import type { AgentTool } from '@nocobase/agent-protocol';

export interface QuotaLocation {
  readonly runnerId: string;
  readonly runnerName: string;
  readonly resetsAt: string | null;
}

/** A quota mark identity; unrelated usage snapshots do not invalidate a clear. */
export interface QuotaMarkTarget {
  readonly tool: AgentTool;
  readonly scope: 'tool' | 'provider' | 'model';
  readonly target: string;
  readonly window: string;
}
