import { splitSidebarNavigation } from '../../client/lib/navigation-transform.js';
import { describe, expect, it } from 'vitest';
import {
  createCapabilityCatalog,
  type DependencyManifest,
} from '@nocobase/app-plugin-foundation/capability-guide';
import packageMetadata from '../../package.json' with { type: 'json' };
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { defineAppRuntime } from '@nocobase/app-client/runtime';
import appRuntime from '../../client/runtime.js';
import { createApplicationRoutes } from '../../client/routes.js';
import cliPlugins from '../../cli/plugins.js';
import serverPlugins from '../../server/plugins.js';
import settingsRoutes from '../../client/pages/settings/routes.js';
import {
  routeKey,
  selectedNavigationId,
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
  it('keeps Features and extensions in the sidebar footer, outside System settings', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const menu = buildRouteNavigation(runtime.routes, new Set());
    const { main, footer } = splitSidebarNavigation(menu);
    expect(main.some(({ route }) => route.name === 'capabilityGuide')).toBe(
      false,
    );
    expect(footer).toHaveLength(1);
    const guide = footer[0].route;
    for (const path of ['/capabilities', '/capabilities/app-plugin-file']) {
      expect(selectedNavigationId(runtime.routes, path)).toBe(routeKey(guide));
    }
    expect(
      splitSidebarNavigation(
        buildRouteNavigation(runtime.routes, new Set([routeKey(guide)])),
      ).footer,
    ).toEqual([]);
    expect(
      menu.filter(({ route }) => route.name === 'settingsHome'),
    ).toHaveLength(1);
    const modules = buildSettingsCatalog(runtime.routes, new Set()).find(
      ({ route }) => route.name === 'settingsSystem',
    )!.modules;
    expect(modules.some(({ route }) => route.name === 'foundation')).toBe(
      false,
    );
    expect(guide).toMatchObject({
      path: '/capabilities',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'nav.capabilityGuide' },
    });
    const walk = (routes: typeof runtime.routes): typeof runtime.routes =>
      routes.flatMap((route) => [route, ...walk(route.children ?? [])]);
    const legacy = walk(runtime.routes).find(
      (route) => route.name === 'foundation',
    );
    expect(legacy).toMatchObject({
      path: '/foundation',
      authz: 'unrestricted',
    });
    expect(legacy?.navigation).toBeUndefined();
    expect(
      serverPlugins.plugins.filter(
        (plugin) => plugin.packageName === '@nocobase/app-plugin-foundation',
      ),
    ).toHaveLength(1);
    expect(modules.some(({ route }) => route.name === 'capabilityGuide')).toBe(
      false,
    );
    const deniedLegacy = new Set([routeKey(legacy!)]);
    expect(
      splitSidebarNavigation(buildRouteNavigation(runtime.routes, deniedLegacy))
        .footer,
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
      ['settingsSystem', [['databaseExplorer', '/settings/database-explorer']]],
    ]);
  });

  it('lists every plugin this application declares in the capability guide, with the six core modules introduced on their own', () => {
    const manifest = packageMetadata as DependencyManifest;
    const { entries } = createCapabilityCatalog(manifest);
    const declared = Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })
      .filter((name) => name.includes('app-plugin-'))
      .sort();
    expect(
      entries
        .filter((entry) => entry.source === 'plugin')
        .map((entry) => entry.packageName)
        .sort(),
    ).toEqual(declared);
    expect(
      entries
        .filter((entry) => entry.source === 'kernel')
        .map((entry) => entry.name),
    ).toEqual(['db', 'jobs', 'lifecycle', 'queue', 'realtime']);
    // Every entry has its own wording; none falls back to the generic text.
    expect(entries.filter((entry) => !entry.known)).toEqual([]);
    expect(entries.filter((entry) => entry.role === 'example').length).toBe(0);
  });
});
