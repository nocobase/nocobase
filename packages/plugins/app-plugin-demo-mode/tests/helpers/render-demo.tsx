import { createAppClientConfig } from '@nocobase/app-client';
import { defineClientPlugin } from '@nocobase/app-client/plugins';
import {
  renderWithApp,
  type RenderedApp,
  type RenderWithAppOptions,
} from '@nocobase/app-testing/client';
import type { PropsWithChildren, ReactElement } from 'react';

import { DemoEntryLoadingContext } from '../../client/index.js';

export const appEntryLoading = defineClientPlugin({
  packageName: '@test/demo-entry-app',
  reactProviders: [
    {
      name: 'demo-entry-loading',
      component: ({ children }: PropsWithChildren): ReactElement => (
        <DemoEntryLoadingContext
          value={<p role='status'>Application loading</p>}
        >
          {children}
        </DemoEntryLoadingContext>
      ),
    },
  ],
});

export function renderDemo(
  ui: ReactElement,
  options: RenderWithAppOptions & { demoModeEnabled?: boolean } = {},
): Promise<RenderedApp> {
  const { demoModeEnabled = true, services, ...rest } = options;
  return renderWithApp(ui, {
    ...rest,
    services(app) {
      // The shared harness does not yet accept server-published configuration.
      Object.defineProperty(app.config, 'public', {
        value: createAppClientConfig({
          rawConfig: {},
          rawPublicConfig: { demoMode: { enabled: demoModeEnabled } },
        }).public,
      });
      services?.(app);
    },
  });
}
