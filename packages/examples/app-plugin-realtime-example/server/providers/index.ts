import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { TaskExportsProvider } from './task-exports.js';
import { RealtimeExampleProvider } from './realtime-example.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  RealtimeExampleProvider,
  TaskExportsProvider,
];

export default serviceProviders;
