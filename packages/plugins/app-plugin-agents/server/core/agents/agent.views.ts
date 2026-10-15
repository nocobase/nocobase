/**
 * Agents as a person sees them: on the Agent page (`AgentView`, where each can run and why it cannot take the
 * person's work), and as the agents they may give work to (`AvailableAgent`, the roster a project manager picks from).
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  AGENT_UNREPORTED_AFTER_MS,
  effortsFor,
  type Agent,
  type AgentUnusableReason,
  type AgentView,
  type AvailableAgent,
} from '../../../shared/agents.js';
import { catalogEntry, discoveryKey } from '../../../shared/model-catalog.js';
import { discoveryPreferences } from './discovery.js';
import type { AgentAvailability, Availability } from '../runs/availability.js';

/** Whether a runner reported the agent's tool and model recently enough; an application's own agent always counts. */
export function isReported(agent: Agent, now: Date): boolean {
  if (agent.source !== 'runner') return true;
  return (
    agent.lastReportedAt !== null &&
    now.getTime() - Date.parse(agent.lastReportedAt) < AGENT_UNREPORTED_AFTER_MS
  );
}

/** Why the agent cannot take the work of the person `availability` was worked out for; null when it can. */
export function unusableReason(
  agent: Agent,
  availability: AgentAvailability | undefined,
  now: Date,
): AgentUnusableReason | null {
  if (agent.status === 'pending') return 'pending';
  if (agent.status === 'disabled') return 'disabled';
  if (agent.modelEntries.length === 0) return 'notConfigured';
  if (!isReported(agent, now)) return 'unreported';
  if (availability?.online) return null;
  return availability &&
    availability.runners.personal > availability.runners.mine &&
    availability.runners.team === 0
    ? 'othersPersonal'
    : 'noRunner';
}

/** Each agent as the Agent page shows it to `userId`. */
export async function agentViews(
  conn: DatabaseConnection,
  agents: readonly Agent[],
  options: {
    readonly availability: Availability;
    readonly userId: string;
    readonly canEdit: boolean;
    readonly now: Date;
  },
): Promise<AgentView[]> {
  const availability = await options.availability(conn, agents, options.userId);
  const preferences = await discoveryPreferences(conn);
  return agents.map((agent): AgentView => {
    const entry = agent.modelEntries[0];
    const known =
      agent.tool && agent.model ? catalogEntry(agent.tool, agent.model) : null;
    const load = availability.get(agent.id);
    return {
      ...agent,
      ...(agent.tool && agent.model
        ? {
            discoveryKey: discoveryKey(agent.tool, agent.model),
            discoveryRevision:
              preferences.get(discoveryKey(agent.tool, agent.model))
                ?.revision ?? 0,
            ignored:
              preferences.get(discoveryKey(agent.tool, agent.model))?.ignored ??
              false,
          }
        : {}),
      effort: entry?.effort ?? null,
      efforts: agent.source === 'runner' && entry ? effortsFor(entry) : [],
      reported: isReported(agent, options.now),
      runners: load?.runners ?? { team: 0, personal: 0, mine: 0, names: [] },
      personalOnly: load?.personalOnly ?? false,
      unusable: unusableReason(agent, load, options.now),
      busy: load?.busy ?? 0,
      suggestion: known ? known.goodAt : null,
      canEdit: options.canEdit && agent.source === 'runner',
    };
  });
}

/**
 * The agents `userId` may give work to: enabled agents discovered from runners whose tool and model a runner reported
 * within `AGENT_UNREPORTED_AFTER_MS`, each with whether a runner would take the person's work now. The application's
 * own agents (a project manager) are not among them.
 */
export async function availableAgents(
  conn: DatabaseConnection,
  agents: readonly Agent[],
  options: {
    readonly availability: Availability;
    readonly userId: string;
    readonly now: Date;
  },
): Promise<AvailableAgent[]> {
  const offered = agents.filter(
    (agent) =>
      agent.source === 'runner' &&
      agent.status === 'enabled' &&
      agent.modelEntries.length > 0 &&
      isReported(agent, options.now),
  );
  const availability = await options.availability(
    conn,
    offered,
    options.userId,
  );
  return offered.map((agent): AvailableAgent => {
    const load = availability.get(agent.id);
    return {
      id: agent.id,
      name: agent.name,
      goodAt: agent.description ?? '',
      tool: agent.tool,
      model: agent.model,
      online: load?.online ?? false,
      runners: load?.runners ?? { team: 0, personal: 0, mine: 0, names: [] },
      personalOnly: load?.personalOnly ?? false,
      busy: load?.busy ?? 0,
    };
  });
}
