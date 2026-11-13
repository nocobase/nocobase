import type { AuthSession } from '@nocobase/app-plugin-authentication';
import type { KnowledgeReader } from '../services/access.js';
import type { ServiceContainer } from '@nocobase/service-provider';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

export interface KnowledgeOnlineAgentIntegration {
  readonly onlineAgent: Agents['onlineAgent'];
  readonly credentialType: string;
  readerOf(session: NonNullable<AuthSession>): KnowledgeReader;
}

/** Resolve the host's original token, never a second service or a process-wide cache. */
export async function knowledgeOnlineAgent(
  container: ServiceContainer,
): Promise<KnowledgeOnlineAgentIntegration | null> {
  let entry: typeof import('@nocobase/app-plugin-agents/server/tokens');
  try {
    entry = await import('@nocobase/app-plugin-agents/server/tokens');
  } catch (error) {
    const failure =
      error instanceof Error && error.cause instanceof Error
        ? error.cause
        : error;
    if (
      failure instanceof Error &&
      'code' in failure &&
      (failure.code === 'MODULE_NOT_FOUND' ||
        failure.code === 'ERR_MODULE_NOT_FOUND') &&
      /Cannot find (?:package|module) ['"]@nocobase\/app-plugin-agents(?:\/server\/tokens)?['"]/u.test(
        failure.message,
      )
    )
      return null;
    throw error;
  }
  if (!container.has(entry.agentsToken)) return null;
  return {
    onlineAgent: container.resolve(entry.agentsToken).onlineAgent,
    credentialType: entry.ONLINE_AGENT_CREDENTIAL,
    readerOf(session) {
      const run = entry.runIdentityOf(session);
      return {
        userId: session.user.id,
        ...(run?.agent && run.run
          ? {
              actor: { kind: 'agent', id: run.agent.id, runId: run.run.run.id },
            }
          : session.credential?.type === entry.ONLINE_AGENT_CREDENTIAL
            ? { actor: { kind: 'online-agent', id: session.credential.id } }
            : {}),
      };
    },
  };
}
