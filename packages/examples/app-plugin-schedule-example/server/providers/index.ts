import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { ScheduleExampleProvider } from './schedule-example.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ScheduleExampleProvider,
];

export default serviceProviders;
