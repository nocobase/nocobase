import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { QueueExampleProvider } from './queue-example.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  QueueExampleProvider,
];

export default serviceProviders;
