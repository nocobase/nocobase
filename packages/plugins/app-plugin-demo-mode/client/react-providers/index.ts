import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';

import { DemoModeNotice } from '../components/demo-mode-notice.js';

export const reactProviders: readonly AppClientReactProviderDefinition[] =
  defineClientReactProviders([
    {
      name: 'demo-mode',
      component: DemoModeNotice,
    },
  ]);

export default reactProviders;
