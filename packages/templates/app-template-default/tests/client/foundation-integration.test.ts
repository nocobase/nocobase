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
  it('exposes Foundation in System settings for an unrestricted administrator and removes the entry when denied', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const menu = buildRouteNavigation(runtime.routes, new Set());
    // The capability guide is a sidebar entry for every signed-in user; App usage stays a card on the System
    // settings home, not a sidebar entry of its own.
    expect(menu.map(({ route }) => route.name)).toEqual([
      'home',
      'capabilityGuide',
      'settingsHome',
    ]);
    expect(
      runtime.routes.find((route) => route.name === 'capabilityGuide'),
    ).toMatchObject({ path: '/capabilities', auth: 'required', authz: 'skip' });
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
    const denied = new Set([`${page.packageName}:${page.path}:${page.id}`]);
    expect(
      buildRouteNavigation(runtime.routes, denied).map(
        ({ route }) => route.name,
      ),
    ).toEqual(['home', 'capabilityGuide']);
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
      ['settingsSystem', [['foundation', '/foundation']]],
    ]);
  });

  it('lists every plugin this application declares in the capability guide, with the seven core modules introduced on their own', () => {
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
    ).toEqual([
      'concurrency',
      'db',
      'i18n',
      'jobs',
      'lifecycle',
      'queue',
      'realtime',
    ]);
    // Every entry has its own wording; none falls back to the generic text.
    expect(entries.filter((entry) => !entry.known)).toEqual([]);
    expect(entries.filter((entry) => entry.role === 'example').length).toBe(0);
  });
});
