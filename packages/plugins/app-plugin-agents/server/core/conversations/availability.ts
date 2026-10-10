/**
 * Whether an agent can answer a person now: it exists, is not archived, the person may wake it, and it has where to
 * run. A runner agent needs an online runner with one of its tools installed and signed in that may run that person's
 * work (shared with the team, or the person's own), with the features and variable restrictions claim requires;
 * an online agent needs the service of the entry the conversation
 * uses to offer its model, the system default chat model when it lists none.
 */
import type { Agent, OnlineModelEntry } from '../../../shared/agents.js';
import type { ChatAvailability } from '../../../shared/conversations.js';
import { offersEntry, type ModelCatalog } from '../../../shared/models.js';
import { onlineEntryOf } from '../runs/index.js';

export function availabilityOf(
  agent: Agent | null,
  userId: string,
  mayInvoke: (agent: Agent, userId: string) => boolean,
  /** The count returned by claim eligibility, computed outside the write transaction. */
  onlineRunners: number,
  /** With the system default chat model, which an online agent that lists no model answers with. */
  catalog: Pick<ModelCatalog, 'services' | 'defaultModel'>,
  /** The entry the conversation asks for; the agent's first when absent or no longer listed. */
  wanted?: OnlineModelEntry,
): ChatAvailability {
  if (!agent)
    return { online: false, reason: 'agentMissing', onlineRunners: 0 };
  if (agent.archivedAt)
    return { online: false, reason: 'agentArchived', onlineRunners: 0 };
  if (!mayInvoke(agent, userId))
    return { online: false, reason: 'forbidden', onlineRunners: 0 };
  if (agent.type === 'online')
    return offersEntry(
      catalog,
      onlineEntryOf(agent, wanted, catalog.defaultModel ?? null),
    )
      ? { online: true, reason: null, onlineRunners: 1 }
      : { online: false, reason: 'modelUnavailable', onlineRunners: 0 };
  return onlineRunners > 0
    ? { online: true, reason: null, onlineRunners }
    : { online: false, reason: 'noRunner', onlineRunners: 0 };
}

/** Whether the agent may be woken for the person at all (it may still wait for a runner). */
export function wakeable(
  agent: Agent | null,
  userId: string,
  mayInvoke: (agent: Agent, userId: string) => boolean,
): agent is Agent {
  return Boolean(agent && !agent.archivedAt && mayInvoke(agent, userId));
}
