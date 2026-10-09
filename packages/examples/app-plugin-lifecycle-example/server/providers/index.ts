import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { LifecycleExampleProvider } from './lifecycle-example.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  LifecycleExampleProvider,
];

export default serviceProviders;
