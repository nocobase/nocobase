import type { ServiceContainer } from '@nocobase/service-provider';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

export interface KnowledgeOnlineAgentIntegration {
  readonly onlineAgent: Agents['onlineAgent'];
  readonly credentialType: string;
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
  };
}
