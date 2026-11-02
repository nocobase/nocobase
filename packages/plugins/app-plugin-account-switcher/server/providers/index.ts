import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { AccountSwitcherProvider } from './account-switcher.js';

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  AccountSwitcherProvider,
];

export default serviceProviders;
