import type { ReactElement } from 'react';
import { beforeEach } from 'vitest';
import { renderWithApp } from '@nocobase/app-testing/client';
import {
  AuthenticationProvider,
  authenticationClientToken,
  type AuthClient,
} from '@nocobase/app-plugin-authentication/client';

// Presentation tests keep their existing API doubles; native authentication is exercised separately against the server.
beforeEach(() => window.sessionStorage.clear());
export function renderSettingsClient(
  ui: ReactElement,
  options: Parameters<typeof renderWithApp>[1] = {},
): ReturnType<typeof renderWithApp> {
  return renderWithApp(<AuthenticationProvider>{ui}</AuthenticationProvider>, {
    ...options,
    services: (app) => {
      options.services?.(app);
      app.container.instance(authenticationClientToken, {
        getSession: async () => ({
          data: {
            user: { id: 'settings-test-user' },
            session: { id: 'settings-test-session' },
          },
          error: null,
        }),
      } as unknown as AuthClient);
    },
  });
}
