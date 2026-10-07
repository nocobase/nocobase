import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { AgentsProvider } from './agents.js';
import { AgentsAuthorizationProvider } from './authorization.js';
import { RunnersProvider } from './runners.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  AgentsProvider,
  RunnersProvider,
  AgentsAuthorizationProvider,
];

export default serviceProviders;
