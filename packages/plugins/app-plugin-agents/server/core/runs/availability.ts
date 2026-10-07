/**
 * Whether each agent could start work now, and how busy it is: a runner agent while an online runner of the runners
 * plugin has one of its tools enabled, installed and signed in, is among the runners it may use, and its owner's local
 * policy lets it take the agent's runs; an online agent while the service of its first entry offers its model (the
 * system default chat model's, for one that lists none).
 */
import { policyAllowsAgent } from '@nocobase/agent-protocol';
import type { RunnerService } from '../../runners/index.js';
import type { DatabaseConnection } from '@nocobase/db';

import { hasTool, onlineEntryOf } from './claim.js';

import type { Agent } from '../../../shared/agents.js';
import { offersEntry } from '../../../shared/models.js';
import type { ModelGateway } from '../../online/gateway.js';

/** Whether an agent could start work now, and how busy it is. */
export interface AgentAvailability {
  readonly online: boolean;
  /** Its runs not finished (queued or held). */
  readonly busy: number;
}

/** Per agent, read on `conn`. */
export type Availability = (
  conn: DatabaseConnection,
  agents: readonly Agent[],
) => Promise<Map<string, AgentAvailability>>;

export function createAvailability(deps: {
  readonly runners: Pick<RunnerService, 'online'>;
  /** The models online agents use: an online agent is online while its service offers its model. */
  readonly models: Pick<ModelGateway, 'catalog'>;
  /** Per agent, the runs it has not finished. */
  readonly openRuns: (
    conn: DatabaseConnection,
    agentIds: readonly string[],
  ) => Promise<ReadonlyMap<string, number>>;
}): Availability {
  return async (conn, agents) => {
    const runners = await deps.runners.online(conn);
    const busy = await deps.openRuns(
      conn,
      agents.map((agent) => agent.id),
    );
    const catalog = agents.some((agent) => agent.type === 'online')
      ? await deps.models.catalog()
      : { services: [], defaultModel: null };
    return new Map(
      agents.map((agent) => [
        agent.id,
        {
          online:
            agent.type === 'online'
              ? offersEntry(
                  catalog,
                  onlineEntryOf(agent, undefined, catalog.defaultModel ?? null),
                )
              : runners.some(
                  (runner) =>
                    hasTool(runner, agent) &&
                    policyAllowsAgent(runner.policy, agent) &&
                    (agent.runnerIds.length === 0 ||
                      agent.runnerIds.includes(runner.id)),
                ),
          busy: busy.get(agent.id) ?? 0,
        },
      ]),
    );
  };
}
