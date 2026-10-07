/**
 * Realtime topics. Payloads say only what changed, never content: a page that hears one fetches through the API,
 * which checks who may see it. A page also polls, because announcements reach only the browsers connected to the
 * instance that made the change.
 */
import type { RunStatus } from '@nocobase/agent-protocol';

/** One run's status and transcript: `agents:runs:<runId>`. */
export function runTopic(runId: string): string {
  return `agents:runs:${runId}`;
}

export type RunChanged =
  | {
      readonly kind: 'run.status';
      readonly runId: string;
      readonly status: RunStatus;
    }
  | {
      readonly kind: 'run.events';
      readonly runId: string;
      readonly lastSeq: number;
    }
  | { readonly kind: 'run.input'; readonly runId: string };

/** Runners came online, went offline or changed. */
export const RUNNERS_TOPIC = 'agents:runners';

export interface RunnersChanged {
  readonly kind: 'runners.changed';
  readonly runnerId: string;
}
