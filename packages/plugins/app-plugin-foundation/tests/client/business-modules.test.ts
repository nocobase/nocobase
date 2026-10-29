import { describe, expect, it, vi } from 'vitest';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { businessModules } from '../../client/business-modules.js';
import type { FoundationProviderInventory } from '../../shared/foundation.js';

const loader = vi.fn();
function page(
  name: string,
  overrides: Partial<AppClientRegisteredRoute> = {},
): AppClientRegisteredRoute {
  return {
    name,
    id: `app:${name}`,
    packageName: 'app',
    source: 'application',
    path: `/${name}`,
    auth: 'required',
    authz: 'skip',
    componentLoader: loader,
    navigation: { title: `nav.${name}` },
    ...overrides,
  };
}
const inventory: FoundationProviderInventory = {
  complete: true,
  unreadable: [],
  entries: [
    {
      name: '@vendor/pro',
      version: '1',
      installed: true,
      kind: 'plugin',
      origin: 'unverified',
      categories: [],
      registration: 'observed',
      evidence: ['clientContribution'],
    },
    {
      name: '@nocobase/app-plugin-file',
      version: '1',
      installed: true,
      kind: 'plugin',
      origin: 'nocobase',
      categories: ['files'],
      registration: 'observed',
      evidence: ['clientContribution'],
    },
  ],
};

describe('automatic business modules', () => {
  it('merges matching static top-level navigation groups and deduplicates pages by route id', () => {
    const routes = [
      page('settingsA', {
        id: 'plugin:settings-a',
        packageName: '@vendor/hr',
        path: '/settings/',
        componentLoader: undefined,
        navigation: { title: 'settings.title' },
        breadcrumb: { title: 'settings.title' },
        children: [
          page('users', {
            id: 'plugin:user-list',
            packageName: '@vendor/hr',
          }),
        ],
      }),
      page('settingsB', {
        id: 'plugin:settings-b',
        packageName: '@vendor/hr',
        path: '/settings',
        componentLoader: undefined,
        navigation: { title: 'settings.title' },
        breadcrumb: { title: 'settings.title' },
        children: [
          page('usersDuplicate', {
            id: 'plugin:user-list',
            packageName: '@vendor/hr',
          }),
          page('roles', { id: 'plugin:roles', packageName: '@vendor/hr' }),
        ],
      }),
    ];
    const sources = {
      complete: false,
      routes: [
        {
          packageName: '@vendor/hr',
          routeName: 'users',
          providers: ['@nocobase/app-plugin-file'],
          complete: true,
        },
        {
          packageName: '@vendor/hr',
          routeName: 'usersDuplicate',
          providers: ['@vendor/pro'],
          complete: true,
        },
        {
          packageName: '@vendor/hr',
          routeName: 'roles',
          providers: [],
          complete: false,
        },
      ],
    };

    expect(
      businessModules(routes, inventory, sources, [
        'interface',
        'files',
        'extension:@vendor/pro',
      ]),
    ).toEqual([
      {
        id: 'plugin:settings-a',
        title: { key: 'settings.title', ns: '@vendor/hr' },
        pageCount: 2,
        complete: false,
        links: [
          { capability: 'interface', evidence: ['page'], providers: [] },
          {
            capability: 'files',
            evidence: ['source'],
            providers: ['@nocobase/app-plugin-file'],
          },
          {
            capability: 'extension:@vendor/pro',
            evidence: ['source'],
            providers: ['@vendor/pro'],
          },
        ],
      },
    ]);
  });

  it('keeps required pages when a matching guest group appears first', () => {
    const group = (
      name: string,
      auth: 'guest' | 'required',
      childName: string,
    ): AppClientRegisteredRoute =>
      page(name, {
        id: `plugin:${name}`,
        packageName: '@vendor/hr',
        path: '/settings',
        auth,
        componentLoader: undefined,
        navigation: { title: 'settings.title' },
        breadcrumb: { title: 'settings.title' },
        children: [
          page(childName, {
            id: `plugin:${childName}`,
            packageName: '@vendor/hr',
          }),
        ],
      });
    const guest = group('guest-settings', 'guest', 'guest-page');
    const required = group('required-settings', 'required', 'people-page');

    for (const routes of [
      [guest, required],
      [required, guest],
    ] satisfies AppClientRegisteredRoute[][]) {
      expect(
        businessModules(routes, inventory, undefined, [
          'interface',
          'usersAndOrganizations',
        ]),
      ).toMatchObject([
        {
          id: 'plugin:required-settings',
          pageCount: 1,
          links: [
            { capability: 'interface', evidence: ['page'] },
            {
              capability: 'usersAndOrganizations',
              evidence: ['authentication'],
            },
          ],
        },
      ]);
    }
    expect(
      businessModules([guest], inventory, undefined, ['interface']),
    ).toEqual([]);
  });

  it('does not merge groups with another package, path, title, descriptor, dynamic path, or loader', () => {
    const shared = {
      componentLoader: undefined,
      breadcrumb: { title: 'settings.title' },
    } as const;
    const routes = [
      page('one', {
        id: 'a:one',
        packageName: '@vendor/a',
        path: '/settings',
        ...shared,
        children: [page('onePage')],
      }),
      page('otherPackage', {
        id: 'b:one',
        packageName: '@vendor/b',
        path: '/settings',
        ...shared,
        children: [page('otherPackagePage')],
      }),
      page('otherPath', {
        id: 'a:other-path',
        packageName: '@vendor/a',
        path: '/settings/:tab',
        ...shared,
        children: [page('otherPathPage')],
      }),
      page('otherTitle', {
        id: 'a:other-title',
        packageName: '@vendor/a',
        path: '/settings',
        navigation: { title: 'nav.different' },
        ...shared,
        children: [page('otherTitlePage')],
      }),
      page('otherDescriptor', {
        id: 'a:other-descriptor',
        packageName: '@vendor/a',
        path: '/settings',
        ...shared,
        breadcrumb: { title: 'settings.other' },
        children: [page('otherDescriptorPage')],
      }),
      page('pageWithLoader', {
        id: 'a:page-with-loader',
        packageName: '@vendor/a',
        path: '/settings',
        ...shared,
        componentLoader: loader,
      }),
    ];

    expect(
      businessModules(routes, inventory, undefined, ['interface']),
    ).toHaveLength(6);
  });

  it('groups descendants, preserves translated menu titles and links only evidence present in the current capability list', () => {
    const routes = [
      page('customOrders', {
        authz: {
          resource: { type: 'page', id: 'unrelated-id' },
          action: 'access',
        },
        children: [page('detail', { navigation: undefined })],
      }),
      page('system', {
        componentLoader: undefined,
        children: [page('users'), page('roles')],
      }),
      page('login', { auth: 'guest' }),
      page('foundation', { packageName: '@nocobase/app-plugin-foundation' }),
    ];
    const sources = {
      complete: true,
      routes: [
        {
          packageName: 'app',
          routeName: 'customOrders',
          providers: ['@nocobase/app-plugin-file', '@vendor/pro'],
          complete: true,
        },
      ],
    };
    const modules = businessModules(routes, inventory, sources, [
      'interface',
      'usersAndOrganizations',
      'permissions',
      'files',
      'extension:@vendor/pro',
    ]);
    expect(modules.map((item) => item.id)).toEqual([
      'app:customOrders',
      'app:system',
    ]);
    expect(modules[0]).toMatchObject({
      title: { key: 'nav.customOrders', ns: 'app' },
      pageCount: 2,
      complete: false,
    });
    expect(modules[0]?.links.map((link) => link.capability)).toEqual([
      'interface',
      'usersAndOrganizations',
      'permissions',
      'files',
      'extension:@vendor/pro',
    ]);
    expect(modules[1]?.pageCount).toBe(2);
    expect(loader).not.toHaveBeenCalled();
    expect(businessModules([], inventory, sources, ['files'])).toEqual([]);
    expect(
      businessModules(routes, inventory, sources, ['interface'])[0]?.links.map(
        (link) => link.capability,
      ),
    ).toEqual(['interface']);
  });

  it('does not infer business use from names, installation or another module', () => {
    const modules = businessModules(
      [page('files-workflows-ai', { auth: 'optional' })],
      inventory,
      undefined,
      ['files', 'workflows', 'aiAgents', 'interface'],
    );
    expect(modules[0]?.links).toEqual([
      { capability: 'interface', evidence: ['page'], providers: [] },
    ]);
    expect(modules[0]?.complete).toBe(false);
  });

  it('keeps page evidence separate from broad provider categories and another module use', () => {
    const modules = businessModules(
      [
        page('one'),
        page('two', { source: 'plugin', packageName: '@vendor/broad' }),
      ],
      {
        ...inventory,
        entries: [
          ...inventory.entries,
          {
            name: '@vendor/broad',
            version: '1',
            installed: true,
            kind: 'plugin',
            origin: 'unverified',
            categories: ['files', 'workflows'],
            registration: 'observed',
            evidence: ['clientContribution'],
          },
        ],
      },
      {
        complete: true,
        routes: [
          {
            packageName: 'app',
            routeName: 'one',
            providers: ['@nocobase/app-plugin-file'],
            complete: true,
          },
        ],
      },
      ['interface', 'usersAndOrganizations', 'files', 'workflows'],
    );
    expect(modules[0]?.links.map((link) => link.capability)).toEqual([
      'interface',
      'usersAndOrganizations',
      'files',
    ]);
    expect(modules[1]?.links.map((link) => link.capability)).toEqual([
      'interface',
      'usersAndOrganizations',
    ]);
  });
});
