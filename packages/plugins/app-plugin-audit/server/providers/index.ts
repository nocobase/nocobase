import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { AuditFileProvider } from './audit.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  AuditFileProvider,
];

export default serviceProviders;
