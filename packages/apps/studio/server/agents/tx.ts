/**
 * The projects plugin's transaction as the agents plugin's: the same connection, with its events carried on the
 * projects plugin's bus as `work.announced` and re-emitted on the agents plugin's bus once the change commits
 * (`relayAnnouncements`). That way a run queued by an issue change wakes runners only if the change commits.
 */
import type {
  Projects,
  ProjectsTx,
} from '@nocobase/app-plugin-projects/server/tokens';

import type {
  AgentsEvent,
  AgentsEventBus,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Tx } from '@nocobase/app-plugin-agents/server/tokens';

/** The kind Studio registers for agents, and the key of its announcements. */
export const AGENT_KIND = 'agent';

export function agentsTx(tx: ProjectsTx): Tx {
  return {
    conn: tx.conn,
    emit: (event) =>
      tx.emit({ type: 'work.announced', kind: AGENT_KIND, payload: event }),
  };
}

/** Re-emits the agents plugin's events announced in the projects plugin's transactions; returns what stops it. */
export function relayAnnouncements(
  projects: Pick<Projects, 'events'>,
  bus: Pick<AgentsEventBus, 'emit'>,
): () => void {
  return projects.events.on('work.announced', (event) => {
    if (event.kind === AGENT_KIND) bus.emit(event.payload as AgentsEvent);
  });
}
