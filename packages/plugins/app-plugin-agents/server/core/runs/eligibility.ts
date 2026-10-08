/**
 * Whether a runner would actually take work of an agent done as a person, by the claim's own rules (`claim.ts`), for
 * the places that decide before any run exists: whether an agent can take a person's work now (`availability`),
 * whether work may be queued to run as the person who asks, and whether a conversation should answer with another
 * agent. A runner counts when it is online, fits the agent and the person (`fitsActor`: tool, local policy, named
 * runners, trust, features) and may receive the variables the work would get (`secret-trust.ts`).
 *
 * The variables are the agent's and those of the scopes the caller names, which a claim would take from the subject's
 * assembly; the features are those the caller names besides `secrets`, which follows from the variables. What only the
 * assembled payload tells (working directories, skills) is the claim's to check.
 *
 * Call it outside a transaction: the scope kinds and the application's authorization read on connections of their
 * own, which SQLite's one connection would not give them while a transaction holds it.
 */
import type { RunnerFeature } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agent } from '../../../shared/agents.js';
import type { Runner } from '../../../shared/runners.js';
import { cleanList } from '../../kernel/values.js';
import type { VariableService, VariableTarget } from '../variables/index.js';
import { fitsActor } from './claim.js';
import type { SecretTrust } from './secret-trust.js';

/** Work as `actorUserId` would be: who it runs as, and what else its run would need. */
export interface EligibilityRequest {
  readonly actorUserId: string;
  /** Scopes the work's variables come from besides the agent's, such as its subject's; none by default. */
  readonly scopes?: readonly VariableTarget[];
  /** Runner features the work needs besides what its variables do. */
  readonly requires?: readonly RunnerFeature[];
}

export interface ClaimEligibility {
  /** The online runners that would take the work now; none for an online or archived agent. */
  runnersFor(
    conn: DatabaseConnection,
    agent: Agent,
    request: EligibilityRequest,
  ): Promise<Runner[]>;
  /** Whether any runner would. */
  canClaim(
    conn: DatabaseConnection,
    agent: Agent,
    request: EligibilityRequest,
  ): Promise<boolean>;
}

export function createClaimEligibility(deps: {
  readonly runners: { online(conn: DatabaseConnection): Promise<Runner[]> };
  readonly variables: Pick<VariableService, 'holding'>;
  readonly secretTrust: Pick<SecretTrust, 'mayReceive'>;
}): ClaimEligibility {
  async function runnersFor(
    conn: DatabaseConnection,
    agent: Agent,
    request: EligibilityRequest,
  ): Promise<Runner[]> {
    if (agent.archivedAt || agent.type !== 'runner') return [];
    const held = await deps.variables.holding(conn, [
      ...(request.scopes ?? []),
      { scope: 'agent', scopeId: agent.id },
    ]);
    const requires = cleanList([
      ...(request.requires ?? []),
      ...(held.length > 0 ? ['secrets'] : []),
    ]) as RunnerFeature[];
    const fitting = (await deps.runners.online(conn)).filter((runner) =>
      fitsActor(runner, agent, request.actorUserId, requires),
    );
    const eligible: Runner[] = [];
    for (const runner of fitting)
      if (await deps.secretTrust.mayReceive(conn, runner, held))
        eligible.push(runner);
    return eligible;
  }

  return {
    runnersFor,
    async canClaim(conn, agent, request) {
      return (await runnersFor(conn, agent, request)).length > 0;
    },
  };
}
