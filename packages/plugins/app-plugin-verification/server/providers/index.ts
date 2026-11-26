import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { VerificationProvider } from './verification.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  VerificationProvider,
];

export default serviceProviders;
