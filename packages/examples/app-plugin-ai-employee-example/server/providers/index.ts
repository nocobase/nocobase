import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { AIEmployeeExampleResourcesProvider } from './ai-resources.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  AIEmployeeExampleResourcesProvider,
];

export default serviceProviders;
