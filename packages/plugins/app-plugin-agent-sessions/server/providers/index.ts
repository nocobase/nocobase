import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { AgentSessionsProvider } from './agent-sessions.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  AgentSessionsProvider,
];

export default serviceProviders;
