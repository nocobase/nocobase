/**
 * A run's token as a credential of the application's authentication: a request carrying `HEADERS.runToken` acts for
 * the person who woke the agent, as a scoped session the route accepts only when its security lists `runToken`. What
 * the run may do there is the application's to bound (the assembling application narrows the identity's scope to the agent's actions).
 */
import { HEADERS, ProtocolError } from '@nocobase/agent-protocol';
import type {
  AuthSession,
  CredentialResolver,
} from '@nocobase/app-plugin-authentication';

import type { Agent } from '../../shared/agents.js';
import type { Agents } from '../composition.js';
import { findAgent } from '../core/agents/index.js';
import type { CallerIdentity } from '../core/callers/index.js';
import type { RunTokenIdentity } from '../core/runs/index.js';
import { toApiError } from '../kernel/http.js';
import { SECURITY_SCHEMES } from '../routes/openapi.js';

/** The `type` of a run's credential. */
export const RUN_CREDENTIAL = 'run';

/** What a run's credential keeps: the run and its token, and the agent. */
export interface RunCredentialData {
  readonly run: RunTokenIdentity;
  readonly agent: Agent;
}

/** Recognizes a run token; a token that is not valid (any more) answers 401 `RUN_TOKEN_INVALID`. */
export function runCredentialResolver(
  services: Pick<Agents, 'runs' | 'tx'>,
): CredentialResolver {
  return async (headers) => {
    const token = headers.get(HEADERS.runToken);
    if (!token) return undefined;
    try {
      const run = await services.runs.authenticateToken(token);
      const agent = await findAgent(services.tx.read(), run.run.agentId);
      if (!agent)
        throw new ProtocolError('RUN_TOKEN_INVALID', 'The agent is gone.');
      const data: RunCredentialData = { run, agent };
      return {
        type: RUN_CREDENTIAL,
        id: run.run.id,
        userId: run.run.actorUserId,
        scheme: SECURITY_SCHEMES.runToken,
        expiresAt: new Date(run.token.expiresAt),
        data,
      };
    } catch (error) {
      throw error instanceof ProtocolError ? toApiError(error) : error;
    }
  };
}

/** The run a session authenticated as, as a command identity; undefined for anyone else. */
export function runIdentityOf(
  auth: AuthSession | undefined,
): CallerIdentity | undefined {
  const credential = auth?.credential;
  if (credential?.type !== RUN_CREDENTIAL) return undefined;
  const { run, agent } = credential.data as RunCredentialData;
  return {
    kind: 'run',
    userId: run.run.actorUserId,
    displayName: agent.name,
    run,
    agent,
  };
}
