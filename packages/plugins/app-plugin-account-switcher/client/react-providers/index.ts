import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';

import { AccountSwitcherProvider } from '../components/provider.js';

export const reactProviders: readonly AppClientReactProviderDefinition[] =
  defineClientReactProviders([
    {
      name: 'account-switcher',
      component: AccountSwitcherProvider,
      after: ['@nocobase/app-plugin-authentication:authentication'],
    },
  ]);

export default reactProviders;
