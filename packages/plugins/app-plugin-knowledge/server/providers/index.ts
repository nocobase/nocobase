import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { KnowledgeAuthorizationProvider } from './authorization.js';
import { KnowledgeProvider } from './knowledge.js';
import { KnowledgeOnlineAgentProvider } from './online-agent.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  KnowledgeProvider,
  KnowledgeAuthorizationProvider,
  KnowledgeOnlineAgentProvider,
];

export default serviceProviders;
