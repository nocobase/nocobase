import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { FoundationAuthorizationProvider } from './authorization.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  FoundationAuthorizationProvider,
];

export default serviceProviders;
