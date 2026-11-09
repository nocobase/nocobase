import { CAPABILITY_GUIDE_ACCESS } from '@nocobase/app-plugin-foundation/client';
import {
  pagePermissionResources,
  permissionNavigationSections,
} from '../../client/pages/settings/page-permissions.js';
import { permissionRowId } from '../../client/pages/settings/permissions-model.js';
import { describe, expect, it } from 'vitest';
import {
  createCapabilityCatalog,
  entryContent,
  guideContent,
  type DependencyManifest,
} from '@nocobase/app-plugin-foundation/capability-guide';
import packageMetadata from '../../package.json' with { type: 'json' };
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { defineAppRuntime } from '@nocobase/app-client/runtime';
import appRuntime from '../../client/runtime.js';
import { createApplicationRoutes } from '../../client/routes.js';
import cliPlugins from '../../cli/plugins.js';
import settingsRoutes from '../../client/pages/settings/routes.js';
import {
  routeKey,
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
  it('provides Features and extensions in System settings with its existing route', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const category = buildSettingsCatalog(runtime.routes, new Set()).find(
      ({ route }) => route.name === 'settingsSystem',
    );
    const guide = category?.modules.find(
      ({ route }) => route.name === 'capabilityGuide',
    );
    expect(guide?.target.path).toBe('/settings/capabilities');
    expect(guide?.route.auth).toBe('required');
    expect(guide?.route.authz).toEqual(CAPABILITY_GUIDE_ACCESS);
    expect(
      buildSettingsCatalog(runtime.routes, new Set([routeKey(guide!.route)]))
        .flatMap((item) => item.modules)
        .some((item) => item.route.name === 'capabilityGuide'),
    ).toBe(false);
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
          ['capabilityGuide', '/settings/capabilities'],
        ],
      ],
    ]);
  });

  it('lists every plugin this application declares in the capability guide, with the standalone core modules', () => {
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
    // Installed extensions may use the guide's generic introduction.
    for (const entry of entries) {
      for (const locale of ['en-US', 'zh-CN']) {
        const text = entryContent(guideContent(locale), entry);
        expect(text.title.trim()).not.toBe('');
        expect(text.summary.trim()).not.toBe('');
      }
    }
  });

  it('keeps an additional plugin discoverable without built-in wording', () => {
    const packageName = '@example/app-plugin-business-extension';
    const catalog = createCapabilityCatalog({
      ...packageMetadata,
      dependencies: {
        ...packageMetadata.dependencies,
        [packageName]: '1.0.0',
      },
    });
    const entry = catalog.entries.find(
      (item) => item.packageName === packageName,
    )!;
    expect(entry).toMatchObject({ source: 'plugin', known: false });
    expect(catalog.find(entry.id)).toBe(entry);
    for (const locale of ['en-US', 'zh-CN']) {
      const text = entryContent(guideContent(locale), entry);
      expect(text.title).toContain(packageName);
      expect(text.summary.trim()).not.toBe('');
      expect(text.prompts.main?.template).toContain(packageName);
    }
  });
});

it('offers one Features and extensions access control under system configuration', async () => {
  const { routes } = await resolveAppRuntime(appRuntime);
  const pages = pagePermissionResources(routes, {}, (path) => path);
  const controls = pages.filter(
    ({ id }) => id === CAPABILITY_GUIDE_ACCESS.resource.id,
  );
  expect(controls).toHaveLength(1);
  expect(controls[0]).toMatchObject({
    title: {
      key: 'nav.capabilityGuide',
      ns: '@nocobase/app-plugin-foundation',
    },
    actions: [{ name: 'access' }],
  });
  const row = {
    id: permissionRowId(CAPABILITY_GUIDE_ACCESS.resource, 'access'),
    label: 'Access',
    enabled: false,
  };
  const sections = permissionNavigationSections(
    [{ id: 'pages', title: 'Pages', groups: [{ id: 'guide', rows: [row] }] }],
    routes,
    {},
    (path) => path,
    (value) => (typeof value === 'string' ? value : value.key),
  );
  expect(sections).toHaveLength(1);
  expect(sections[0]?.id).toBe('configuration');
  expect(sections[0]?.groups.flatMap(({ rows }) => rows)).toEqual([row]);
  expect(
    routes.find(({ name }) => name === 'capabilityGuideEntry')?.authz,
  ).toEqual(CAPABILITY_GUIDE_ACCESS);
});
