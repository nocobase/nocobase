import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';
import type { PropsWithChildren, ReactElement } from 'react';

import { DemoModeNotice } from '../components/demo-mode-notice.js';
import type { DemoModeClientOptions } from '../plugin.js';

export function demoModeReactProviders(
  options: DemoModeClientOptions = {},
): readonly AppClientReactProviderDefinition[] {
  const accountSwitcher = options.accountSwitcher ?? 'floating';
  return defineClientReactProviders([
    {
      name: 'demo-mode',
      component: ({ children }: PropsWithChildren): ReactElement => (
        <DemoModeNotice
          accountSwitcher={accountSwitcher}
          showFloatingAccountSwitcher={options.showFloatingAccountSwitcher}
        >
          {children}
        </DemoModeNotice>
      ),
    },
  ]);
}

export const reactProviders: readonly AppClientReactProviderDefinition[] =
  demoModeReactProviders();

export default reactProviders;
