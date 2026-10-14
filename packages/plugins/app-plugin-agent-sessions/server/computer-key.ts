/**
 * A computer's key as a credential of the application's authentication: a request carrying `BRIDGE_HEADERS.computerKey`
 * acts for the computer's owner, as a scoped session that only the bridge's routes accept (their security lists
 * `computerKey`), and only for that computer (`bridgeCaller`). A key no computer has, such as a removed computer's,
 * answers 401 `AGENT_SESSIONS_COMPUTER_KEY_INVALID`.
 */
import { BRIDGE_HEADERS } from '@nocobase/acp-bridge/protocol';
import type {
  AuthEnv,
  CredentialResolver,
} from '@nocobase/app-plugin-authentication';
import {
  ApiError,
  type ApiDocumentFragment,
} from '@nocobase/app-server/router';

import enUS from './locales/en-US.js';
import { AgentSessionsError, signedInUser } from './errors.js';
import type { AgentSessionsService } from './service.js';

/** The credential's `type`, and the security scheme naming it in the API document. */
export const COMPUTER_CREDENTIAL = 'agentSessionsComputer';
export const COMPUTER_KEY_SCHEME = 'computerKey';

export function computerKeyResolver(
  service: Pick<AgentSessionsService, 'computerOfKey'>,
): CredentialResolver {
  return async (headers) => {
    const key = headers.get(BRIDGE_HEADERS.computerKey);
    if (!key) return undefined;
    const computer = await service.computerOfKey(key);
    if (!computer)
      throw new ApiError({
        status: 'UNAUTHENTICATED',
        reason: 'AGENT_SESSIONS_COMPUTER_KEY_INVALID',
        domain: 'agentSessions',
        message: enUS.errors.computerKeyInvalid,
      });
    return {
      type: COMPUTER_CREDENTIAL,
      id: computer.id,
      userId: computer.userId,
      scheme: COMPUTER_KEY_SCHEME,
    };
  };
}

/** The scheme, with the header it travels in, merged into the API document by the plugin's provider. */
export function computerKeyFragment(): ApiDocumentFragment {
  return {
    owner: '@nocobase/app-plugin-agent-sessions',
    namespace: 'agentSessions',
    components: {
      securitySchemes: {
        [COMPUTER_KEY_SCHEME]: {
          type: 'apiKey',
          in: 'header',
          name: BRIDGE_HEADERS.computerKey,
          description:
            "A computer's key, issued when its owner registered it with `<cli> acp start`. It acts as the owner, for that computer's bridge only, until the computer is removed or registered again.",
        },
      },
    },
  };
}

/**
 * Who a bridge request acts for: the signed-in person, or the owner of the computer whose key it carries, which then may
 * act for that computer only. `keyed` says which.
 */
export function bridgeCaller(
  context: { readonly var: AuthEnv['Variables'] },
  computerId: string | null,
): { readonly userId: string; readonly keyed: boolean } {
  const userId = signedInUser(context);
  const credential = context.var.auth?.credential;
  if (credential?.type !== COMPUTER_CREDENTIAL) return { userId, keyed: false };
  if (credential.id !== computerId)
    throw new AgentSessionsError('computerNotFound');
  return { userId, keyed: true };
}
