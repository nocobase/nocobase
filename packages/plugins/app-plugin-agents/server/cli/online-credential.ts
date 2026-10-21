import { HEADERS } from '@nocobase/agent-protocol';
import type {
  CredentialResolver,
  IssuedCredential,
} from '@nocobase/app-plugin-authentication';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { ApiError } from '@nocobase/app-server/router';
import { createCredential, hashCredential } from '../kernel/crypto.js';

export const ONLINE_AGENT_CREDENTIAL = 'online-agent';
const PREFIX = 'fgo_';
const refused = () =>
  new ApiError({
    status: 'UNAUTHENTICATED',
    reason: 'ONLINE_AGENT_TOKEN_INVALID',
    domain: 'agents',
    message: 'The OnlineAgent credential is invalid or expired.',
  });

/** Application-owned execution credentials. Only the dispatch closure retains the plaintext. */
export class OnlineAgentCredentials {
  private readonly entries = new Map<string, IssuedCredential>();
  constructor(private readonly ttlMs: number = 30 * 60_000) {}

  issue(
    userId: string,
    executionId: string,
  ): { token: string; release(): void } {
    const now = Date.now();
    for (const [key, credential] of this.entries) {
      if (credential.expiresAt && credential.expiresAt.getTime() <= now)
        this.entries.delete(key);
    }
    const token = createCredential(PREFIX);
    const key = hashCredential(token);
    const release = () => {
      this.entries.delete(key);
    };
    this.entries.set(key, {
      type: ONLINE_AGENT_CREDENTIAL,
      id: executionId,
      userId,
      scheme: 'runToken',
      expiresAt: new Date(now + this.ttlMs),
    });
    return { token, release };
  }

  readonly resolve: CredentialResolver = (headers) => {
    const token = headers.get(HEADERS.runToken);
    if (!token?.startsWith(PREFIX)) return Promise.resolve(undefined);
    const entry = this.entries.get(hashCredential(token));
    if (!entry || !entry.expiresAt || entry.expiresAt.getTime() <= Date.now())
      throw refused();
    return Promise.resolve({ ...entry });
  };
}

export const onlineAgentCredentialsToken: ServiceToken<OnlineAgentCredentials> =
  createServiceToken<OnlineAgentCredentials>(
    '@nocobase/agents/online-credentials',
  );
