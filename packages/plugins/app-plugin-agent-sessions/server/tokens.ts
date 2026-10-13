import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { AgentSessionsService } from './service.js';

/** The agent sessions service: what applications tie to sessions (`registerLinkKind`, `link`). */
export const agentSessionsToken: ServiceToken<AgentSessionsService> =
  createServiceToken<AgentSessionsService>(
    '@nocobase/app-plugin-agent-sessions/service',
  );
