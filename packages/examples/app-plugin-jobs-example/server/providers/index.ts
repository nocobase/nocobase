import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { JobExampleProvider } from '../job/provider.js';
import { ScheduleExampleProvider } from '../schedule/provider.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ScheduleExampleProvider,
  JobExampleProvider,
];

export default serviceProviders;
