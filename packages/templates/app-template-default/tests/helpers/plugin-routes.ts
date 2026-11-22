import type { AppClientRouteContribution } from '@nocobase/app-client/plugins';
import clientPlugins from '../../client/plugins.js';

/**
 * The route contribution of a client plugin this application registers, with the options `client/plugins.ts` gives
 * it, for a test that composes the application's routes the way the client runtime does.
 */
export function registeredPluginRoutes(packageName: string): {
  readonly packageName: string;
  readonly source: 'plugin';
  readonly routes: readonly AppClientRouteContribution[];
} {
  const plugin = clientPlugins.plugins.find(
    (candidate) => candidate.packageName === packageName,
  );
  if (!plugin) throw new Error(`${packageName} is not registered.`);
  return { packageName, source: 'plugin', routes: plugin.routes };
}

/** Roles and permissions: the authorization plugin's System settings pages. */
export const authorizationPages = (): ReturnType<
  typeof registeredPluginRoutes
> => registeredPluginRoutes('@nocobase/app-plugin-authorization');
