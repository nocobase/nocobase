// @vitest-environment node

import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import clientPlugins from '../../client/plugins.js';

// The plugins whose pages the permission workspace offers as page grants.
const PAGE_GRANT_PLUGINS = [
  '@nocobase/app-plugin-users',
  '@nocobase/app-plugin-notification',
  '@nocobase/app-plugin-api-keys',
  '@nocobase/app-plugin-database-explorer',
];

describe('plugin page authorization', () => {
  it('offers a page grant for each listed plugin', () => {
    const resolved = resolveAppClientContributions(
      clientPlugins.plugins.map((plugin) => ({
        packageName: plugin.packageName,
        source: 'plugin' as const,
        routes: plugin.routes,
      })),
    );
    const pages = entryPages([
      ...resolved.routes,
      ...resolved.settingsRouteTree,
    ]).filter((route) => PAGE_GRANT_PLUGINS.includes(route.packageName));

    // A page may check another resource type; each plugin still offers a page grant.
    const granted = pages.filter(
      (route) =>
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page' &&
        route.authz.action === 'access',
    );
    expect(new Set(granted.map((route) => route.packageName))).toEqual(
      new Set(PAGE_GRANT_PLUGINS),
    );
  });
});

/** Pages without a page above them: nested pages share their parent's check. */
function entryPages(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) =>
    route.componentLoader ? [route] : entryPages(route.children ?? []),
  );
}
