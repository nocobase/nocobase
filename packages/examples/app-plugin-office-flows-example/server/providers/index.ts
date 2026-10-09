import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { OfficeFlowsProvider } from './office-flows.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  OfficeFlowsProvider,
];

export default serviceProviders;
