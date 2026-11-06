import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { FoundationProvider } from './foundation.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  FoundationProvider,
];

export default serviceProviders;
