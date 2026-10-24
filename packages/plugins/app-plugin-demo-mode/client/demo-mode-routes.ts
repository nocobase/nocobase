import type { PublicAppConfig } from '@nocobase/app-client';
import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
import { readAppClientPublicConfig } from '@nocobase/app-client/runtime';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    demoMode: { enabled?: boolean };
  }
}

/** Include application-owned demo routes and their navigation only in demo deployments. */
export function demoModeRoutes(
  routes: readonly AppClientRouteDefinition[],
): readonly AppClientRouteDefinition[] {
  const config = readAppClientPublicConfig() as Partial<PublicAppConfig> | null;
  return config?.demoMode?.enabled === true ? routes : [];
}
