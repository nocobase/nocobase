/**
 * Whether each agent could start work now, where, and how busy it is: an online runner of the runners plugin that has
 * one of its tools and models enabled, signed in and reported, whose owner's local policy lets it take the agent's
 * runs. Asked for a person (`actorUserId`), an agent counts only the runners that would take that person's work by the
 * claim's rules (`eligibility.ts`): trust, features and the agent's variables included. Ask outside a transaction then.
 */
import type { Clock } from '../../kernel/clock.js';
import type { QuotaLocation } from '../../../shared/quota.js';

import type { RunnerService } from '../../runners/index.js';
import type { DatabaseConnection } from '@nocobase/db';

import type { ClaimEligibility } from './eligibility.js';

import type { Agent, AgentRunners } from '../../../shared/agents.js';
import { quotaForAgent, runnerTakesAgent } from '../../../shared/runners.js';

/** How many runner names an agent's availability lists. */
const RUNNER_NAMES = 3;

/** Whether an agent could start work now, where it can run, and how busy it is. */
export interface AgentAvailability {
  readonly quota?: readonly QuotaLocation[];
  /** An online runner would take the work now: the person's, when asked for one. */
  readonly online: boolean;
  /** Its runs not finished (queued or held). */
  readonly busy: number;
  /** The online runners that have its tool and model, whoever's work they take. */
  readonly runners: AgentRunners;
  /** Only personal runners have it. */
  readonly personalOnly: boolean;
}

/** Per agent, read on `conn`; for a person's work with `actorUserId`. */
export type Availability = (
  conn: DatabaseConnection,
  agents: readonly Agent[],
  actorUserId?: string,
) => Promise<Map<string, AgentAvailability>>;

export function createAvailability(deps: {
  readonly clock: Clock;
  readonly runners: Pick<RunnerService, 'online'>;
  /** Whether a runner would take a person's work. */
  readonly eligibility: Pick<ClaimEligibility, 'canClaim' | 'prepare'>;
  /** Per agent, the runs it has not finished. */
  readonly openRuns: (
    conn: DatabaseConnection,
    agentIds: readonly string[],
  ) => Promise<ReadonlyMap<string, number>>;
}): Availability {
  return async (conn, agents, actorUserId) => {
    const runners = await deps.runners.online(conn);
    const busy = await deps.openRuns(
      conn,
      agents.map((agent) => agent.id),
    );
    const variables =
      actorUserId === undefined
        ? undefined
        : await deps.eligibility.prepare(conn, agents, {});
    const result = new Map<string, AgentAvailability>();
    for (const agent of agents) {
      const fitting = runners.filter((runner) =>
        runnerTakesAgent(runner, agent, deps.clock.now().getTime()),
      );
      const team = fitting.filter((runner) => runner.trust === 'team');
      const personal = fitting.filter((runner) => runner.trust !== 'team');
      const online =
        agent.status !== 'enabled'
          ? false
          : actorUserId === undefined
            ? fitting.length > 0
            : fitting.length > 0 &&
              (await deps.eligibility.canClaim(conn, agent, {
                actorUserId,
                runners,
                variableState: variables?.get(agent.id),
              }));
      result.set(agent.id, {
        online,
        quota: quotaForAgent(
          runners,
          agent,
          actorUserId,
          deps.clock.now().getTime(),
        ),
        busy: busy.get(agent.id) ?? 0,
        runners: {
          team: team.length,
          personal: personal.length,
          mine:
            actorUserId === undefined
              ? 0
              : personal.filter((runner) => runner.ownerUserId === actorUserId)
                  .length,
          names: [...team, ...personal]
            .slice(0, RUNNER_NAMES)
            .map((runner) => runner.name),
        },
        personalOnly: team.length === 0 && personal.length > 0,
      });
    }
    return result;
  };
}
