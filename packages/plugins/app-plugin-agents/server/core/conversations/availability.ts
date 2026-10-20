/**
 * Whether an agent can answer a person now: it exists, is enabled, the person may wake it, and it has where to run: an
 * online runner that has its tool and model and may run that person's work (shared with the team, or the person's
 * own), with the features and variable restrictions claim requires.
 */
import type { Agent } from '../../../shared/agents.js';
import type { ChatAvailability } from '../../../shared/conversations.js';

export function availabilityOf(
  agent: Agent | null,
  userId: string,
  mayInvoke: (agent: Agent, userId: string) => boolean,
  /** The count returned by claim eligibility, computed outside the write transaction. */
  onlineRunners: number,
  /** Whether some online runner has the agent's tool and model, whoever's work it takes. */
  anyRunner = false,
): ChatAvailability {
  if (!agent)
    return { online: false, reason: 'agentMissing', onlineRunners: 0 };
  if (agent.status !== 'enabled')
    return { online: false, reason: 'agentArchived', onlineRunners: 0 };
  if (!mayInvoke(agent, userId))
    return { online: false, reason: 'forbidden', onlineRunners: 0 };
  if (onlineRunners > 0) return { online: true, reason: null, onlineRunners };
  return {
    online: false,
    reason: anyRunner ? 'othersPersonal' : 'noRunner',
    onlineRunners: 0,
  };
}

/** Whether the agent may be woken for the person at all (it may still wait for a runner). */
export function wakeable(
  agent: Agent | null,
  userId: string,
  mayInvoke: (agent: Agent, userId: string) => boolean,
): agent is Agent {
  return Boolean(
    agent && agent.status === 'enabled' && mayInvoke(agent, userId),
  );
}
