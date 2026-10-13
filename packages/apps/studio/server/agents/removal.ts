/**
 * When an agent is archived or deleted, the agents plugin announces `agent.removed` after its transaction commits
 * (having withdrawn the agent's queued runs). Studio then lets go of the issues the agent was executing: every
 * unfinished one is left with no executor, recorded on its timeline as "Executor X was removed" in the name of the
 * person who archived or deleted the agent (`projects.issues.releaseExecutor`). Finished issues keep the agent as the
 * executor they had. Neither plugin knows the other; this listener is the join.
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

import { AGENT_KIND } from './tx.js';

/** Listens until the returned function is called. */
export function releaseRemovedAgents(
  agents: Pick<Agents, 'events'>,
  projects: () => Pick<Projects, 'issues'>,
  onError: (error: unknown) => void,
): () => void {
  return agents.events.on('agent.removed', (event) => {
    projects()
      .issues.releaseExecutor(
        { type: AGENT_KIND, id: event.agentId },
        {
          actor: event.byUserId
            ? { type: 'user', id: event.byUserId }
            : { type: 'system', id: null },
          name: event.name,
        },
      )
      .catch(onError);
  });
}
