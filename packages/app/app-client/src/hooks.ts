import type { ServiceToken } from '@nocobase/service-provider';
import { useContext } from 'react';

import type { ApiClient } from '@nocobase/api-client';
import { apiClientToken, type ClientApplication } from './application.js';
import { ClientApplicationContext } from './application-context.js';
import type { AppClientRegisteredHeaderAction } from './header-actions.js';

const NO_HEADER_ACTIONS: readonly AppClientRegisteredHeaderAction[] =
  Object.freeze([]);

/**
 * The header actions the application and its plugins registered, in header order with the application's overrides
 * applied. A layout renders them left of its account menu; outside an application there are none.
 */
export function useHeaderActions(): readonly AppClientRegisteredHeaderAction[] {
  return (
    useContext(ClientApplicationContext)?.runtime.headerActions ??
    NO_HEADER_ACTIONS
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
