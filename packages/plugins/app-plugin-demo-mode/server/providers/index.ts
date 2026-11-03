import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { DemoDataProvider } from './demo-data.js';
import { DemoModeProvider } from './demo-mode.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  DemoModeProvider,
  DemoDataProvider,
];

export default serviceProviders;
