import { describe, expect, it } from 'vitest';
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { defineAppRuntime } from '@nocobase/app-client/runtime';
import appRuntime from '../../client/runtime.js';
import { createApplicationRoutes } from '../../client/routes.js';
import cliPlugins from '../../cli/plugins.js';
import serverPlugins from '../../server/plugins.js';
import settingsRoutes from '../../client/pages/settings/routes.js';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
} from '../../client/routing/route-navigation.js';

describe('default Foundation integration', () => {
  it('registers the Foundation deployment evidence build hook', () => {
    expect(
      cliPlugins.plugins.filter(
        (plugin) => plugin.packageName === '@nocobase/app-plugin-foundation',
      ),
    ).toHaveLength(1);
  });
  it('exposes Foundation and Database Explorer in System settings and removes the entry when both are denied', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const menu = buildRouteNavigation(runtime.routes, new Set());
    // One System settings entry; Foundation is a card on its home, not a sidebar entry of its own.
    expect(menu.map(({ route }) => route.name)).toEqual([
      'home',
      'settingsHome',
    ]);
    const category = buildSettingsCatalog(runtime.routes, new Set()).find(
      ({ route }) => route.name === 'settingsSystem',
    );
    const page = category?.modules.find(
      ({ route }) => route.name === 'foundation',
    )?.route;
    expect(page).toMatchObject({
      path: '/foundation',
      auth: 'required',
      authz: 'unrestricted',
    });
    if (!page) throw new Error('Foundation route missing');
    const explorer = category?.modules.find(
      ({ route }) => route.name === 'databaseExplorer',
    )?.route;
    if (!explorer) throw new Error('Database Explorer route missing');
    const key = (route: typeof page) =>
      `${route.packageName}:${route.path}:${route.id}`;
    // Denying Foundation alone keeps System settings for Database Explorer, which has its own grant.
    expect(
      buildSettingsCatalog(runtime.routes, new Set([key(page)])).map(
        (entry) => [
          entry.route.name,
          entry.modules.map(({ route }) => route.name),
        ],
      ),
    ).toEqual([['settingsSystem', ['databaseExplorer']]]);
    const denied = new Set([key(page), key(explorer)]);
    expect(
      buildRouteNavigation(runtime.routes, denied).map(
        ({ route }) => route.name,
      ),
    ).toEqual(['home']);
    expect(buildSettingsCatalog(runtime.routes, denied)).toEqual([]);
    expect(
      serverPlugins.plugins.filter(
        (plugin) => plugin.packageName === '@nocobase/app-plugin-foundation',
      ),
    ).toHaveLength(1);
  });

  it('keeps Foundation beside business settings without changing its protected URL', async () => {
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        ...appRuntime,
        routes: () => [...createApplicationRoutes(), settingsRoutes],
      }),
    );
    const menu = buildRouteNavigation(runtime.routes, new Set());
    expect(menu.some(({ route }) => route.name === 'foundationSettings')).toBe(
      false,
    );
    expect(
      buildSettingsCatalog(runtime.routes, new Set()).map((category) => [
        category.route.name,
        category.modules.map(({ route, target }) => [route.name, target.path]),
      ]),
    ).toEqual([
      [
        'settingsAccount',
        [
          ['settingsUsers', '/settings/users'],
          ['permissionManagement', '/settings/roles'],
        ],
      ],
      [
        'settingsSystem',
        [
          ['databaseExplorer', '/settings/database-explorer'],
          ['foundation', '/foundation'],
        ],
      ],
    ]);
  });
});
