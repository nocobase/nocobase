import { createServiceToken } from '@nocobase/service-provider';
import type { OnlineAgentSandboxProvider } from './types.js';
export const onlineAgentSandboxProviderToken: import('@nocobase/service-provider').ServiceToken<OnlineAgentSandboxProvider> =
  createServiceToken<OnlineAgentSandboxProvider>(
    '@nocobase/agents/online-sandbox',
  );
