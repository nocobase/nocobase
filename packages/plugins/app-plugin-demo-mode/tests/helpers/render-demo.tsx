import { createAppClientConfig } from '@nocobase/app-client';
import {
  renderWithApp,
  type RenderedApp,
  type RenderWithAppOptions,
} from '@nocobase/app-testing/client';
import type { ReactElement } from 'react';

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
