import { CAPABILITY_GUIDE_ACCESS } from '@nocobase/app-plugin-foundation/client';
import { permissionWorkspace } from '../../client/pages/settings/permission-workspace.js';
import { permissionRowId } from '../../client/pages/settings/permissions-model.js';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import appRuntime from '../../client/runtime.js';
import {
  routeKey,
  buildSettingsCatalog,
  buildRouteNavigation,
} from '../../client/routing/route-navigation.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  createCapabilityCatalog,
  entryContent,
  guideContent,
  type DependencyManifest,
} from '@nocobase/app-plugin-foundation/capability-guide';

import { defineAppRoutes } from '@nocobase/app-client/plugins';
import applicationRoutes from '../../client/routes.js';

describe('Examples Foundation integration', () => {
  it('ships the plugin as a deployment dependency', () => {
    expect(packageMetadata.dependencies).toHaveProperty(
      '@nocobase/app-plugin-foundation',
    );
  });

  it('registers Application configuration as a protected System settings page', async () => {
    const { routes } = await resolveAppRuntime(appRuntime);
    const system = routes.find((route) => route.name === 'settingsSystem');
    expect(
      system?.children?.find((route) => route.name === 'configInspector'),
    ).toMatchObject({
      surface: 'systemSettings',
      path: '/settings/config-inspector',
      auth: 'required',
      authz: {
        resource: { type: 'page', id: 'config-inspector' },
        action: 'access',
      },
    });
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
    expect(guide?.route.surface).toBe('systemSettings');
    expect(guide?.route.auth).toBe('required');
    expect(guide?.route.authz).toEqual(CAPABILITY_GUIDE_ACCESS);
    expect(
      buildSettingsCatalog(runtime.routes, new Set([routeKey(guide!.route)]))
        .flatMap((item) => item.modules)
        .some((item) => item.route.name === 'capabilityGuide'),
    ).toBe(false);
  });

  it('lists the capability guide, and every demo it offers opens a page this application registers', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    expect(
      runtime.routes
        .find((route) => route.name === 'settingsSystem')
        ?.children?.find((route) => route.name === 'capabilityGuide'),
    ).toMatchObject({
      path: '/settings/capabilities',
      auth: 'required',
      authz: CAPABILITY_GUIDE_ACCESS,
    });
    type Node = { readonly path?: string; readonly children?: readonly Node[] };
    const walk = (nodes: readonly Node[]): string[] =>
      nodes.flatMap((node) => [
        ...(node.path ? [node.path] : []),
        ...walk(node.children ?? []),
      ]);
    const paths = new Set(walk(runtime.routes as readonly Node[]));
    const demos = createCapabilityCatalog(packageMetadata)
      .entries.filter((entry) => entry.demo)
      .map((entry) => [entry.id, entry.demo]);
    expect(demos.length).toBeGreaterThan(0);
    expect(demos.filter(([, demo]) => !paths.has(demo!))).toEqual([]);
  });

  it('keeps Features and extensions in System when business and account routes are registered', async () => {
    const orders = defineAppRoutes([
      {
        name: 'fixtureOrders',
        path: '/fixture-orders',
        auth: 'required',
        authz: {
          resource: { type: 'page', id: 'fixture-orders' },
          action: 'access',
        },
        navigation: { title: 'Orders' },
        componentLoader: async () => ({ default: () => null }),
      },
    ]);
    const { routes } = await resolveAppRuntime(
      defineAppRuntime({
        ...appRuntime,
        routes: [...applicationRoutes, orders],
      }),
    );
    const catalog = buildSettingsCatalog(routes, new Set());
    const modules = (name: string) =>
      catalog
        .find(({ route }) => route.name === name)
        ?.modules.map(({ route, target }) => [route.name, target.path]);
    expect(modules('settingsAccount')).toContainEqual([
      'settingsUsers',
      '/settings/users',
    ]);
    expect(modules('settingsAccount')).toContainEqual([
      'permissionManagement',
      '/settings/roles',
    ]);
    expect(modules('settingsSystem')).toContainEqual([
      'capabilityGuide',
      '/settings/capabilities',
    ]);
    const menu = buildRouteNavigation(routes, new Set());
    const menuNames = menu.map(({ route }) => route.name);
    expect(menuNames).toContain('fixtureOrders');
    expect(menuNames).not.toContain('foundationSettings');
    expect(menuNames).not.toContain('capabilityGuide');
    expect(
      menu.filter(({ route }) => route.path.startsWith('/settings')),
    ).toMatchObject([
      { route: { name: 'settingsHome', path: '/settings' }, children: [] },
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
    expect(
      entries.filter((entry) => entry.role === 'example').length,
    ).toBeGreaterThan(0);
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

it('offers one Features and extensions page on the System settings tab', async () => {
  const { routes } = await resolveAppRuntime(appRuntime);
  const workspace = permissionWorkspace(
    { sections: [], recordAccess: [], subjectTypes: [], collections: [] },
    routes,
    {},
    {
      text: (value) => (typeof value === 'string' ? value : value.key),
      t: (key) => key,
    },
  );
  const open = permissionRowId(CAPABILITY_GUIDE_ACCESS.resource, 'access');
  const owners = workspace.settings.filter((page) =>
    page.objects.some((object) =>
      object.actions.some((action) => action.id === open),
    ),
  );
  expect(owners.map((page) => page.label)).toEqual(['nav.capabilityGuide']);
  // It is not a business menu.
  expect(
    [...workspace.menuPages.values()].some((pages) =>
      pages.includes(CAPABILITY_GUIDE_ACCESS.resource.id),
    ),
  ).toBe(false);
  expect(
    routes
      .find(({ name }) => name === 'settingsSystem')
      ?.children?.find(({ name }) => name === 'capabilityGuideEntry'),
  ).toMatchObject({
    path: '/settings/capabilities/:entryId',
    surface: 'systemSettings',
    authz: CAPABILITY_GUIDE_ACCESS,
  });
});
