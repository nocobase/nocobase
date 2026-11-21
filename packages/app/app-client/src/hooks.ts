import type { ServiceToken } from '@nocobase/service-provider';
import { useContext, useMemo } from 'react';

import type { ApiClient } from '@nocobase/api-client';
import { apiClientToken, type ClientApplication } from './application.js';
import { ClientApplicationContext } from './application-context.js';
import type { AppClientRegisteredHeaderAction } from './header-actions.js';

const NO_HEADER_ACTIONS: readonly AppClientRegisteredHeaderAction[] =
  Object.freeze([]);

/**
 * The header actions the application and its plugins registered, in header order with the application's overrides
 * applied, that the viewer may see. A layout renders them left of its account menu and says whether someone is signed
 * in: for a signed-out visitor only `auth: 'optional'` actions remain, without their badges, so no badge hook and no
 * `required` action's component runs there — a badge counts something waiting on a person. Outside an application
 * there are none.
 */
export function useHeaderActions({
  signedIn,
}: {
  readonly signedIn: boolean;
}): readonly AppClientRegisteredHeaderAction[] {
  const actions =
    useContext(ClientApplicationContext)?.runtime.headerActions ??
    NO_HEADER_ACTIONS;
  return useMemo(
    () =>
      signedIn
        ? actions
        : actions.flatMap(({ badge: _badge, ...action }) =>
            action.auth === 'optional' ? [Object.freeze(action)] : [],
          ),
    [actions, signedIn],
  );
}

export function useClientApplication(): ClientApplication {
  const app = useContext(ClientApplicationContext);
  if (!app) {
    throw new Error(
      'useClientApplication() must be used inside AppClientRoot.',
    );
  }
  return app;
}

export function useService<T>(token: ServiceToken<T>): T {
  return useClientApplication().services.resolve(token);
}

export function useApiClient(): ApiClient {
  return useService(apiClientToken);
}
