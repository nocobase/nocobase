/**
 * Whether a runner would actually take work of an agent done as a person, by the claim's own rules (`claim.ts`), for
 * the places that decide before any run exists: whether an agent can take a person's work now (`availability`),
 * whether work may be queued to run as the person who asks, and whether a conversation should answer with another
 * agent. A runner counts when it fits the agent and the person (`fitsActor`: tool, local policy, named runners, trust,
 * features) and, when the work gets a variable for team runners only (`teamRunnersOnly`), is a team runner.
 *
 * The variables are the agent's and those of the scopes the caller names, which a claim would take from the subject's
 * assembly, merged as a run gets them; the features are those the caller names besides `secrets`, which follows from
 * the variables. What only the assembled payload tells (working directories, skills) is the claim's to check.
 */
import type { RunnerFeature } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agent } from '../../../shared/agents.js';
import type { Runner } from '../../../shared/runners.js';
import { supportsWorkspaceKey } from '../../../shared/runners.js';
import type { VariableRef } from '../../../shared/variables.js';
import { cleanList } from '../../kernel/values.js';
import type { VariableService, VariableTarget } from '../variables/index.js';
import { fitsActor } from './claim.js';

/** Work as `actorUserId` would be: who it runs as, and what else its run would need. */
export interface EligibilityRequest {
  /** The payload needs the application's separately named workspace. */
  readonly workspaceKey?: boolean;
  readonly actorUserId: string;
  /** Scopes the work's variables come from besides the agent's, such as its subject's; none by default. */
  readonly scopes?: readonly VariableTarget[];
  /** Runner features the work needs besides what its variables do. */
  readonly requires?: readonly RunnerFeature[];
  /** A request-local snapshot of the runners, for callers checking several agents. Never cache across requests. */
  readonly runners?: readonly Runner[];
  readonly variableState?: {
    readonly held: boolean;
    readonly teamOnly: boolean;
  };
}

export interface ClaimEligibility {
  prepare?(
    conn: DatabaseConnection,
    agents: readonly Agent[],
    request: Pick<EligibilityRequest, 'scopes'>,
  ): Promise<
    ReadonlyMap<string, { readonly held: boolean; readonly teamOnly: boolean }>
  >;
  /** The online runners that would take the work now; none for an online or archived agent. */
  runnersFor(
    conn: DatabaseConnection,
    agent: Agent,
    request: EligibilityRequest,
  ): Promise<Runner[]>;
  /** Whether any online runner would. */
  canClaim(
    conn: DatabaseConnection,
    agent: Agent,
    request: EligibilityRequest,
  ): Promise<boolean>;
  /**
   * Whether queuing the work can lead anywhere: false only when runners that fit the agent and the person are
   * registered, online or not, and none of them would take it, such as only personal ones for work that gets a
   * variable for team runners only. With no fitting runner registered at all, the work may wait for one.
   */
  mayQueue(
    conn: DatabaseConnection,
    agent: Agent,
    request: EligibilityRequest,
  ): Promise<boolean>;
  /** The variables the work would get that are for team runners only. */
  teamOnly(
    conn: DatabaseConnection,
    agent: Agent,
    request: Pick<EligibilityRequest, 'scopes'>,
  ): Promise<VariableRef[]>;
}

export function createClaimEligibility(deps: {
  readonly runners: {
    online(conn: DatabaseConnection): Promise<Runner[]>;
    all(conn: DatabaseConnection): Promise<Runner[]>;
  };
  readonly variables: Pick<
    VariableService,
    'holding' | 'teamOnly' | 'admissionMetadata'
  >;
}): ClaimEligibility {
  const targetsOf = (
    agent: Agent,
    request: Pick<EligibilityRequest, 'scopes'>,
  ): VariableTarget[] => [
    ...(request.scopes ?? []),
    { scope: 'agent', scopeId: agent.id },
  ];

  async function eligible(
    conn: DatabaseConnection,
    agent: Agent,
    request: EligibilityRequest,
    candidates: readonly Runner[],
  ): Promise<Runner[]> {
    if (agent.status !== 'enabled') return [];
    // No variable reads when the tool, policy and trust rules already rule every runner out.
    const possible = candidates.filter(
      (runner) =>
        (!request.workspaceKey || supportsWorkspaceKey(runner)) &&
        fitsActor(runner, agent, request.actorUserId, request.requires ?? []),
    );
    if (possible.length === 0) return [];
    const targets = targetsOf(agent, request);
    const held =
      request.variableState?.held ??
      (await deps.variables.holding(conn, targets)).length > 0;
    if (!held) return possible;
    const requires = cleanList([
      ...(request.requires ?? []),
      'secrets',
    ]) as RunnerFeature[];
    const teamOnly =
      request.variableState?.teamOnly ??
      (await deps.variables.teamOnly(conn, targets)).length > 0;
    return possible.filter(
      (runner) =>
        fitsActor(runner, agent, request.actorUserId, requires) &&
        (!teamOnly || runner.trust === 'team'),
    );
  }

  return {
    async prepare(conn, agents, request) {
      const metadata = await deps.variables.admissionMetadata?.(
        conn,
        agents.flatMap((agent) => targetsOf(agent, request)),
      );
      const result = new Map<string, { held: boolean; teamOnly: boolean }>();
      if (!metadata) return result;
      for (const agent of agents) {
        const merged = new Map<string, boolean>();
        let held = false;
        for (const target of targetsOf(agent, request)) {
          const records = metadata.filter(
            (record) =>
              record.scope === target.scope &&
              record.scopeId === target.scopeId,
          );
          held ||= records.some((record) => record.kind === 'value');
          for (const record of records)
            merged.set(record.name, record.teamRunnersOnly);
        }
        result.set(agent.id, {
          held,
          teamOnly: [...merged.values()].some(Boolean),
        });
      }
      return result;
    },
    runnersFor: async (conn, agent, request) =>
      eligible(
        conn,
        agent,
        request,
        request.runners ?? (await deps.runners.online(conn)),
      ),
    async canClaim(conn, agent, request) {
      return (
        (
          await eligible(
            conn,
            agent,
            request,
            request.runners ?? (await deps.runners.online(conn)),
          )
        ).length > 0
      );
    },
    async mayQueue(conn, agent, request) {
      const registered = (request.runners ?? (await deps.runners.all(conn)))
        .map((runner) => ({
          ...runner,
          unavailableModels: (runner.unavailableModels ?? []).filter(
            (mark) => mark.reason !== 'toolQuota',
          ),
        }))
        .filter(
          (runner) =>
            runner.status !== 'revoked' &&
            fitsActor(
              runner,
              agent,
              request.actorUserId,
              request.requires ?? [],
            ),
        );
      if (registered.length === 0) return true;
      return (await eligible(conn, agent, request, registered)).length > 0;
    },
    teamOnly: (conn, agent, request) =>
      deps.variables.teamOnly(conn, targetsOf(agent, request)),
  };
}
