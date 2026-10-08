/**
 * Which runners a run's variables may be handed to. A team runner gets them: whoever shared it with the team accepted
 * that every run it takes leaves its values there. A personal runner gets them only when its owner may change every
 * scope they come from, as the variables settings decide it for that person: an agent's (its owner, or whoever the
 * application says may edit it, `setAgentEditors`), a working directory's or a registered scope's (`ScopeKind.access`).
 * Otherwise the owner could read on their own machine values they may not even see in the settings.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Agent } from '../../../shared/agents.js';
import type { Runner } from '../../../shared/runners.js';
import type { ScopeKindRegistry } from '../../kernel/scopes.js';
import { findAgent } from '../agents/index.js';
import type { VariableTarget } from '../variables/index.js';

/** Whether `userId` may edit `agent` besides its owner, such as a manager of agents. */
export type AgentEditors = (
  agent: Pick<Agent, 'id' | 'ownerUserId'>,
  userId: string,
) => Promise<boolean>;

export interface SecretTrust {
  /** Sets who may edit an agent besides its owner; returns what removes it. Unset, its owner alone. */
  setAgentEditors(editors: AgentEditors): () => void;
  /** Whether `runner` may receive the variables kept in `targets` (the ones that hold any). */
  mayReceive(
    conn: DatabaseConnection,
    runner: Pick<Runner, 'trust' | 'ownerUserId'>,
    targets: readonly VariableTarget[],
  ): Promise<boolean>;
}

export function createSecretTrust(deps: {
  readonly scopes: Pick<ScopeKindRegistry, 'access'>;
}): SecretTrust {
  let editors: AgentEditors | undefined;

  async function mayManage(
    conn: DatabaseConnection,
    target: VariableTarget,
    userId: string,
  ): Promise<boolean> {
    if (target.scope === 'agent') {
      const agent = await findAgent(conn, target.scopeId);
      if (!agent) return false;
      if (agent.ownerUserId === userId) return true;
      return (await editors?.(agent, userId)) ?? false;
    }
    const access = await deps.scopes.access(
      target.scope,
      target.scopeId,
      userId,
    );
    return access?.manage ?? false;
  }

  return {
    setAgentEditors(next) {
      editors = next;
      return () => {
        if (editors === next) editors = undefined;
      };
    },

    async mayReceive(conn, runner, targets) {
      if (runner.trust === 'team' || targets.length === 0) return true;
      const owner = runner.ownerUserId;
      if (!owner) return false;
      for (const target of targets)
        if (!(await mayManage(conn, target, owner))) return false;
      return true;
    },
  };
}
