import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';
import type { PropsWithChildren, ReactElement } from 'react';

import { DemoModeNotice } from '../components/demo-mode-notice.js';

export const reactProviders: readonly AppClientReactProviderDefinition[] =
  defineClientReactProviders([
    {
      name: 'demo-mode',
      component: ({ children }: PropsWithChildren): ReactElement => (
        <DemoModeNotice>{children}</DemoModeNotice>
      ),
    },
  ]);

export default reactProviders;
