import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { ModulesProvider } from './modules.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ModulesProvider,
];

export default serviceProviders;
