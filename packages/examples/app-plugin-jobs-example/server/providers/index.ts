import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { JobsExampleAuthorizationProvider } from '../authorization.js';
import { JobExampleProvider } from '../job/provider.js';
import { ScheduleExampleProvider } from '../schedule/provider.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ScheduleExampleProvider,
  JobExampleProvider,
  JobsExampleAuthorizationProvider,
];

export default serviceProviders;
