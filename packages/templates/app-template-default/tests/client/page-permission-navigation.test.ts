import { describe, expect, it } from 'vitest';
import {
  defineAppRoutes,
  resolveAppClientContributions,
} from '@nocobase/app-client/plugins';
import type { LocalizedText } from '@nocobase/app-plugin-authorization/client';
import type {
  PermissionEditorNavigationNode,
  PermissionEditorSection,
} from '../../client/components/permission-editor.js';
import {
  pagePermissionNavigation,
  pagePermissionResources,
  permissionNavigationSections,
} from '../../client/pages/settings/page-permissions.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const componentLoader = async () => ({ default: () => null });
const text = (value: LocalizedText): string =>
  typeof value === 'string' ? value : value.key;
const resource = (id: string) => ({
  resource: { type: 'page' as const, id },
  action: 'access',
});
const flatten = (
  nodes: readonly PermissionEditorNavigationNode[],
): PermissionEditorNavigationNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
const fixture = () =>
  resolveAppClientContributions([
    {
      packageName: 'private-app',
      source: 'application',
      routes: defineAppRoutes([
        {
          name: 'basic',
          navigation: { title: 'Basic data' },
          children: [
            {
              name: 'materials',
              path: '/materials',
              navigation: { title: 'Materials' },
              authz: resource('legacy-materials'),
              componentLoader,
            },
            {
              name: 'locations',
              navigation: { title: 'Locations' },
              children: [
                {
                  name: 'warehouses',
                  path: '/warehouses',
                  navigation: { title: 'Warehouses' },
                  authz: resource('legacy-warehouses'),
                  componentLoader,
                },
              ],
            },
          ],
        },
        {
          name: 'loans',
          path: '/loans',
          navigation: { title: 'Loans' },
          authz: resource('legacy-loans'),
          componentLoader,
          children: [
            { name: 'loanDetail', path: ':id', componentLoader },
            {
              name: 'reviews',
              path: 'reviews',
              navigation: { title: 'Reviews' },
              authz: resource('legacy-reviews'),
              componentLoader,
            },
            {
              name: 'audit',
              path: 'audit',
              authz: resource('legacy-audit'),
              componentLoader,
            },
          ],
        },
        {
          name: 'alias',
          path: '/loan-alias',
          navigation: { title: 'Loan alias' },
          authz: resource('legacy-loans'),
          componentLoader,
        },
        {
          name: 'settings',
          path: '/settings',
          navigation: { title: 'Settings' },
          authz: {
            resource: { type: 'settings', id: 'rules' },
            action: 'read',
          },
          componentLoader,
        },
        {
          name: 'landing',
          path: '/',
          navigation: { title: 'Landing' },
          authz: 'skip',
          componentLoader,
        },
      ]),
    },
  ]);

describe('page permission navigation projection', () => {
  it('supplies named disclosure and non-menu labels in both supported languages', () => {
    for (const locale of [enUS, zhCN]) {
      const settings = Reflect.get(locale, 'settings') as Record<
        string,
        unknown
      >;
      for (const key of [
        'expandPermissionGroup',
        'collapsePermissionGroup',
        'pagesOutsideNavigation',
      ]) {
        const value = settings[key];
        expect(typeof value).toBe('string');
        expect(String(value).trim()).not.toBe('');
        expect(value).not.toBe(key);
        if (key !== 'pagesOutsideNavigation')
          expect(value).toContain('{{name}}');
      }
    }
  });
  it('preserves real groups, deeper menus and independent parent/child identities', () => {
    const { routes } = fixture();
    const result = pagePermissionNavigation(
      routes,
      { audit: 'Audit details' },
      (path) => `Unnamed (${path})`,
      text,
    );
    expect(result.map((node) => node.label)).toEqual([
      'Basic data',
      'Loans',
      'settings.pagesOutsideNavigation',
    ]);
    expect(result[0]?.rowId).toBeUndefined();
    expect(result[0]?.children?.map((node) => node.label)).toEqual([
      'Materials',
      'Locations',
    ]);
    expect(result[0]?.children?.[1]?.children?.[0]?.label).toBe('Warehouses');
    expect(result[1]?.rowId).toBe('["page","legacy-loans","access"]');
    expect(result[1]?.children?.[0]?.rowId).toBe(
      '["page","legacy-reviews","access"]',
    );
    expect(
      flatten(result)
        .filter((node) => node.rowId)
        .map((node) => node.rowId),
    ).toEqual([
      '["page","legacy-materials","access"]',
      '["page","legacy-warehouses","access"]',
      '["page","legacy-loans","access"]',
      '["page","legacy-reviews","access"]',
      '["page","legacy-audit","access"]',
    ]);
  });

  it('keeps actual non-menu independent pages and deduplicates inherited and aliased grants', () => {
    const { routes } = fixture();
    const before = JSON.stringify(routes);
    const pages = pagePermissionResources(
      routes,
      { audit: 'Audit details' },
      (path) => `Unnamed (${path})`,
    );
    const result = pagePermissionNavigation(
      routes,
      { audit: 'Audit details' },
      (path) => `Unnamed (${path})`,
      text,
    );
    expect(result.at(-1)?.children).toEqual([
      {
        id: 'page:legacy-audit',
        label: 'Audit details',
        rowId: '["page","legacy-audit","access"]',
      },
    ]);
    expect(flatten(result).filter((node) => node.rowId)).toHaveLength(
      pages.length,
    );
    expect(flatten(result).map((node) => node.label)).not.toContain(
      'Loan alias',
    );
    expect(flatten(result).map((node) => node.label)).not.toContain('Landing');
    expect(flatten(result).map((node) => node.label)).not.toContain('Settings');
    expect(JSON.stringify(routes)).toBe(before);
    expect(
      pagePermissionNavigation(
        routes,
        { audit: 'Audit details' },
        (path) => `Unnamed (${path})`,
        text,
      ),
    ).toEqual(result);
  });

  it('renders single-level menus at a single level without inventing groups', () => {
    const { routes } = resolveAppClientContributions([
      {
        packageName: 'flat-app',
        source: 'application',
        routes: defineAppRoutes([
          {
            name: 'one',
            path: '/one',
            navigation: { title: 'One' },
            authz: resource('one'),
            componentLoader,
          },
          {
            name: 'two',
            path: '/two',
            navigation: { title: 'Two' },
            authz: resource('two'),
            componentLoader,
          },
        ]),
      },
    ]);
    const result = pagePermissionNavigation(routes, {}, () => 'Unnamed', text);
    expect(result.map((node) => node.label)).toEqual(['One', 'Two']);
    expect(result.every((node) => !node.children?.length)).toBe(true);
    expect(result.every((node) => node.rowId)).toBe(true);
  });
});

it('omits menus governed by settings or account permissions instead of mirroring them as page controls or links', () => {
  const { routes } = resolveAppClientContributions([
    {
      packageName: 'app',
      source: 'application',
      routes: defineAppRoutes([
        {
          name: 'settings',
          path: '/settings',
          navigation: { title: 'System settings' },
          children: [
            {
              name: 'users',
              path: 'users',
              navigation: { title: 'User management' },
              authz: { resource: { type: 'user', id: '*' }, action: 'read' },
              componentLoader,
            },
            {
              name: 'roles',
              path: 'roles',
              navigation: { title: 'Permission management' },
              authz: {
                resource: {
                  type: 'settings',
                  id: 'authorization.permission-sets',
                },
                action: 'read',
              },
              componentLoader,
            },
            {
              name: 'logs',
              path: 'logs',
              navigation: { title: 'Notification logs' },
              authz: resource('logs'),
              componentLoader,
            },
          ],
        },
      ]),
    },
  ]);
  const result = pagePermissionNavigation(routes, {}, (path) => path, text);
  expect(result).toEqual([]);
  const withoutPage = routes.map((route) => ({
    ...route,
    children: route.children?.filter(({ name }) => name !== 'logs'),
  }));
  expect(
    pagePermissionNavigation(withoutPage, {}, (path) => path, text),
  ).toEqual([]);
});

it.each(['settings', 'systemManagement'])(
  'moves all %s controls into configuration without changing or duplicating grants',
  (rootName) => {
    const { routes } = resolveAppClientContributions([
      {
        packageName: 'app',
        source: 'application',
        routes: defineAppRoutes([
          {
            name: 'orders',
            path: '/orders',
            navigation: { title: 'Orders' },
            authz: resource('orders'),
            componentLoader,
          },
          {
            name: rootName,
            path: '/settings',
            navigation: { title: 'Settings' },
            children: [
              {
                name: 'users',
                path: 'users',
                navigation: { title: 'Users' },
                authz: { resource: { type: 'user', id: '*' }, action: 'read' },
                componentLoader,
              },
              {
                name: 'logs',
                path: 'logs',
                navigation: { title: 'Logs' },
                authz: resource('logs'),
                componentLoader,
              },
            ],
          },
        ]),
      },
    ]);
    const user = {
      id: '["user","*","read"]',
      label: 'View users',
      enabled: true,
    };
    const accountAction = {
      id: '["user","*","disable"]',
      label: 'Disable account',
      enabled: false,
    };
    const order = {
      id: '["page","orders","access"]',
      label: 'Orders',
      enabled: true,
    };
    const logs = {
      id: '["page","logs","access"]',
      label: 'Logs',
      enabled: false,
    };
    const sections: PermissionEditorSection[] = [
      {
        id: 'users',
        title: 'Users and accounts',
        groups: [{ id: 'users', rows: [user, accountAction] }],
      },
      {
        id: 'pages',
        title: 'Page access',
        groups: [
          { id: 'orders', accessOnly: true, rows: [order] },
          { id: 'logs', accessOnly: true, rows: [logs] },
        ],
      },
    ];
    const before = JSON.stringify(sections);
    const result = permissionNavigationSections(
      sections,
      routes,
      {},
      (path) => path,
      text,
    );
    expect(result.map(({ id }) => id)).toEqual(['pages', 'configuration']);
    expect(result[0]?.groups.flatMap(({ rows }) => rows)).toEqual([order]);
    expect(
      flatten(result[0]?.navigation ?? []).flatMap(({ rowId }) =>
        rowId ? [rowId] : [],
      ),
    ).toEqual([order.id]);
    expect(result[1]?.groups.flatMap(({ rows }) => rows)).toEqual([
      user,
      accountAction,
      logs,
    ]);
    expect(result[1]?.groups[0]?.rows[0]).toBe(user);
    expect(JSON.stringify(sections)).toBe(before);
    expect(
      permissionNavigationSections(result, routes, {}, (path) => path, text),
    ).toEqual(result);
  },
);
