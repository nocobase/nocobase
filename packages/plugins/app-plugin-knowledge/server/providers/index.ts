import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { KnowledgeAuthorizationProvider } from './authorization.js';
import { KnowledgeProvider } from './knowledge.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  KnowledgeProvider,
  KnowledgeAuthorizationProvider,
];

export default serviceProviders;
