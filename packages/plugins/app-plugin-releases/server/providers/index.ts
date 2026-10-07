import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { ReleasesAuthorizationProvider } from './authorization.js';
import { ReleasesProvider } from './releases.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ReleasesProvider,
  ReleasesAuthorizationProvider,
];

export default serviceProviders;
