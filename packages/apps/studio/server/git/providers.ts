/**
 * The code hosts Studio knows: each provider is its descriptor (`GitProviderDescriptor`, `shared/git.ts`: its name,
 * icon, the connection kinds it takes and how people connect their own account) and its `GitPlatform`. Connections,
 * repositories and webhooks name their provider and find its platform here, so another host is a new descriptor and
 * a new platform, registered in `provider.ts`.
 */
import { ProtocolError } from '@nocobase/agent-protocol';

import type { GitProvider, GitProviderDescriptor } from '../../shared/git.js';
import type { GitPlatform } from './platform.js';

export interface GitProviders {
  /** Every provider, in the order registered. */
  readonly descriptors: readonly GitProviderDescriptor[];
  /** Whether `id` names a registered provider. */
  has(id: string): id is GitProvider;
  /** The platform of a provider; a 400 for one Studio does not know. */
  platformOf(id: string): GitPlatform;
}

export function createGitProviders(
  platforms: readonly GitPlatform[],
): GitProviders {
  const byId = new Map<string, GitPlatform>(
    platforms.map((platform) => [platform.descriptor.id, platform]),
  );
  return {
    descriptors: platforms.map((platform) => platform.descriptor),
    has: (id): id is GitProvider => byId.has(id),
    platformOf(id) {
      const platform = byId.get(id);
      if (!platform)
        throw new ProtocolError(
          'INVALID_REQUEST',
          `Studio does not know the code host ${id}.`,
          { code: 'GIT_PROVIDER_UNKNOWN' },
        );
      return platform;
    },
  };
}
