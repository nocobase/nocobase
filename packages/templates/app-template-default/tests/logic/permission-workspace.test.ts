import { describe, expect, it } from 'vitest';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type { AuthorizationOptionsResponse } from '@nocobase/app-plugin-authorization/client';
import {
  permissionWorkspaceCatalog,
  permissionScopeVisible,
  permissionFilterFieldLabel,
} from '../../client/pages/settings/permission-workspace.js';
import {
  permissionSections,
  setPermissions,
} from '../../client/pages/settings/permissions-model.js';

const source = {
  sections: [
    {
      name: 'pages',
      title: 'Pages',
      order: 0,
      subsections: [
        {
          name: 'page',
          title: 'Pages',
          recordType: {
            type: 'page',
            actions: [{ name: 'access', title: 'Access' }],
          },
          resources: [],
        },
      ],
    },
    {
      name: 'business',
      title: 'Business operations',
      order: 100,
      subsections: [
        {
          name: 'borrowing',
          title: 'Borrowing',
          resources: [
            {
              type: 'composite',
              id: 'borrowing',
              title: 'Borrowing',
              actions: [
                {
                  name: 'approve',
                  title: 'Approve request',
                  description: 'Approve an eligible request.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'administration',
      title: 'System and tools',
      order: 200,
      subsections: [
        {
          name: 'rules',
          title: 'Rules',
          resources: [
            {
              type: 'settings',
              id: 'authorization.sharing-rules',
              title: 'Sharing rules',
              actions: [{ name: 'update', title: 'Edit' }],
            },
          ],
        },
      ],
    },
    {
      name: 'unused-plugin',
      title: 'Unused optional plugin',
      order: 300,
      subsections: [
        {
          name: 'tools',
          title: 'Tools',
          resources: [
            {
              type: 'settings',
              id: 'unused',
              title: 'Unused tool',
              actions: [{ name: 'read', title: 'Read' }],
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [],
  subjectTypes: [],
  collections: [],
} as AuthorizationOptionsResponse;

const businessSelection = {
  business: [
    { type: 'composite', id: 'borrowing', actions: ['approve', 'unsupported'] },
  ],
  settings: [],
};
const configurationRoutes = [
  {
    name: 'rules',
    path: '/rules',
    componentLoader: async () => ({}),
    authz: {
      resource: { type: 'settings', id: 'authorization.sharing-rules' },
      action: 'read',
    },
  },
] as unknown as AppClientRegisteredRoute[];

describe('application-owned permission presentation', () => {
  it('can hide a created-record selector while retaining a related-record selector and stored policy', () => {
    const resource = {
      type: 'composite',
      id: 'requests',
      title: 'Requests',
      actions: [{ name: 'create', title: 'Submit' }],
      dataScopes: {
        create: [
          {
            key: 'requests',
            collection: 'requests',
            title: 'Requests',
            fields: ['id'],
            recordAccess: ['allRecords'],
          },
          {
            key: 'equipment',
            collection: 'equipment',
            title: 'Equipment',
            fields: ['assetCode'],
            recordAccess: ['allRecords'],
          },
        ],
      },
    };
    const selection = {
      settings: [],
      business: [
        {
          type: 'composite',
          id: 'requests',
          actions: ['create'],
          hiddenActionScopes: { create: ['requests'] },
          actionScopeTitles: { create: { equipment: 'Borrowable equipment' } },
        },
      ],
      filterFieldTitles: { equipment: { assetCode: 'Asset number' } },
    };
    const catalog = permissionWorkspaceCatalog(
      {
        ...source,
        sections: [
          {
            name: 'business',
            title: 'Business',
            order: 1,
            subsections: [
              { name: 'requests', title: 'Requests', resources: [resource] },
            ],
          },
        ],
      } as AuthorizationOptionsResponse,
      [],
      [],
      selection,
    );
    const grants = [
      {
        resource: { type: 'composite', id: 'requests' },
        actions: [
          {
            action: 'create',
            policy: {
              type: 'composite',
              scopes: { requests: 'allRecords', equipment: 'allRecords' },
            },
          },
        ],
      },
    ];
    const rows = permissionSections(
      catalog,
      grants,
      (value) => (typeof value === 'string' ? value : value.key),
      (item, action, scopeKey) =>
        permissionScopeVisible(item, action, scopeKey, selection),
    );
    expect(
      rows[0]?.groups[0]?.rows[0]?.scopes?.map((scope) => scope.label),
    ).toEqual(['Borrowable equipment']);
    expect(
      catalog.sections[0]?.subsections[0]?.resources[0]?.dataScopes?.create,
    ).toHaveLength(2);
    expect(grants[0]?.actions[0]?.policy.scopes.requests).toBe('allRecords');
    expect(
      permissionFilterFieldLabel(
        'equipment',
        'assetCode',
        (key) => key,
        selection,
      ),
    ).toBe('Asset number');
  });

  it('does not expose registered business or plugin capabilities without application opt-in', () => {
    const before = structuredClone(source);
    expect(permissionWorkspaceCatalog(source, [], []).sections).toEqual([]);
    expect(source).toEqual(before);
  });

  it('projects only the actual selected business actions and preserves their metadata', () => {
    const catalog = permissionWorkspaceCatalog(
      source,
      [],
      [],
      businessSelection,
    );
    expect(catalog.sections.map((section) => section.name)).toEqual([
      'business',
    ]);
    const resources = catalog.sections.flatMap((section) =>
      section.subsections.flatMap((sub) => sub.resources),
    );
    expect(resources).toHaveLength(1);
    expect(resources[0]?.actions).toEqual([
      {
        name: 'approve',
        title: 'Approve request',
        description: 'Approve an eligible request.',
      },
    ]);
    expect(
      permissionSections(catalog, [], (text) =>
        typeof text === 'string' ? text : text.key,
      ).map((section) => section.title),
    ).toEqual(['Business operations']);
  });

  it('fills the page section from real page resources without inventing account permissions', () => {
    const page = {
      type: 'page',
      id: 'borrowings',
      title: 'Borrowings',
      actions: [{ name: 'access', title: 'Access' }],
    };
    const catalog = permissionWorkspaceCatalog(source, [], [page]);
    expect(catalog.sections[0]?.subsections[0]?.resources).toEqual([page]);
    expect(catalog.sections.some((section) => section.name === 'users')).toBe(
      false,
    );
  });

  it('includes only the account operations implemented by the registered user management page', () => {
    const routes = [
      {
        name: 'settings',
        path: '/settings',
        children: [
          {
            name: 'users',
            path: '/users',
            componentLoader: async () => ({}),
            authz: { resource: { type: 'user', id: '*' }, action: 'read' },
          },
        ],
      },
    ] as unknown as AppClientRegisteredRoute[];
    const catalog = permissionWorkspaceCatalog(source, routes, []);
    expect(catalog.sections[0]?.name).toBe('users');
    const actions = catalog.sections[0]?.subsections.flatMap((sub) =>
      sub.resources.flatMap((resource) =>
        resource.actions.map((action) => action.name),
      ),
    );
    expect(actions).toEqual([
      'read',
      'create',
      'update',
      'disable',
      'enable',
      'revoke-sessions',
      'assign-role',
    ]);
    expect(
      catalog.sections.some((section) => section.name === 'administration'),
    ).toBe(false);
  });

  it('requires app opt-in, a real configuration page and a registered action together', () => {
    const selection = {
      business: [],
      settings: [
        {
          id: 'authorization.sharing-rules',
          actions: ['update', 'unsupported'],
        },
      ],
    };
    expect(
      permissionWorkspaceCatalog(source, configurationRoutes, [], {
        business: [],
        settings: [],
      }).sections,
    ).toEqual([]);
    expect(
      permissionWorkspaceCatalog(source, [], [], selection).sections,
    ).toEqual([]);
    const catalog = permissionWorkspaceCatalog(
      source,
      configurationRoutes,
      [],
      selection,
    );
    expect(catalog.sections.map((section) => section.name)).toEqual([
      'configuration',
    ]);
    const resources = catalog.sections[0]?.subsections[0]?.resources;
    expect(resources?.map((resource) => resource.id)).toEqual([
      'authorization.sharing-rules',
    ]);
    expect(resources?.[0]?.actions.map((action) => action.name)).toEqual([
      'update',
    ]);
    expect(
      permissionWorkspaceCatalog(
        { ...source, sections: [] },
        configurationRoutes,
        [],
        selection,
      ).sections,
    ).toEqual([]);
  });

  it('does not mistake a navigation wrapper or a different settings page for a configuration surface', () => {
    const selection = {
      business: [],
      settings: [{ id: 'authorization.sharing-rules', actions: ['update'] }],
    };
    const wrapperOnly = [
      { ...configurationRoutes[0], componentLoader: undefined },
    ] as unknown as AppClientRegisteredRoute[];
    expect(
      permissionWorkspaceCatalog(source, wrapperOnly, [], selection).sections,
    ).toEqual([]);
    const otherPage = [
      {
        ...configurationRoutes[0],
        authz: { resource: { type: 'settings', id: 'unused' }, action: 'read' },
      },
    ] as unknown as AppClientRegisteredRoute[];
    expect(
      permissionWorkspaceCatalog(source, otherPage, [], selection).sections,
    ).toEqual([]);
  });

  it('adapts app-owned descriptions and scope captions without changing backend identifiers or supported choices', () => {
    const scoped = {
      ...source,
      sections: source.sections.map((section) => ({
        ...section,
        subsections: section.subsections.map((sub) => ({
          ...sub,
          resources: sub.resources.map((resource) =>
            resource.id === 'borrowing'
              ? {
                  ...resource,
                  dataScopes: {
                    approve: [
                      {
                        key: 'stock',
                        title: 'warehouses',
                        collection: 'warehouses',
                        fields: ['id'],
                        recordAccess: ['own'],
                        defaultValue: 'own',
                      },
                    ],
                  },
                }
              : resource,
          ),
        })),
      })),
    };
    const catalog = permissionWorkspaceCatalog(scoped, [], [], {
      settings: [],
      business: [
        {
          type: 'composite',
          id: 'borrowing',
          actions: ['approve'],
          actionDescriptions: { approve: 'Confirm the request.' },
          scopeTitles: { warehouses: 'Warehouse records' },
        },
      ],
    });
    const resource = catalog.sections[0]?.subsections[0]?.resources[0];
    expect(resource?.actions[0]?.description).toBe('Confirm the request.');
    expect(resource?.dataScopes?.approve?.[0]).toEqual({
      key: 'stock',
      title: 'Warehouse records',
      collection: 'warehouses',
      fields: ['id'],
      recordAccess: ['own'],
      defaultValue: 'own',
    });
  });

  it('preserves hidden grants and unknown scope parameters when a visible permission changes', () => {
    const catalog = permissionWorkspaceCatalog(
      source,
      [],
      [],
      businessSelection,
    );
    const hidden = {
      resource: { type: 'settings', id: 'authorization.sharing-rules' },
      actions: [
        {
          action: 'update',
          policy: { type: 'custom', keep: { region: 'east' } },
        },
      ],
    };
    const unknown = {
      resource: { type: 'legacy', id: 'archive' },
      actions: [
        { action: 'inspect', policy: { scope: { value: 'retained' } } },
      ],
    };
    const grants = [hidden, unknown];
    const next = setPermissions(grants, catalog, [
      {
        id: JSON.stringify(['composite', 'borrowing', 'approve']),
        enabled: true,
      },
    ]);
    expect(next).toContainEqual(hidden);
    expect(next).toContainEqual(unknown);
    expect(next).toContainEqual({
      resource: { type: 'composite', id: 'borrowing' },
      actions: [{ action: 'approve' }],
    });
    expect(grants).toEqual([hidden, unknown]);
  });
});

it('partitions selected configuration actions by actual application pages and keeps scopes and draft ids', () => {
  const resource = {
    type: 'composite',
    id: 'borrowing',
    title: 'Borrowing',
    actions: [
      { name: 'approve', title: 'Approve' },
      { name: 'monitor', title: 'Monitor' },
    ],
    dataScopes: {
      monitor: [
        {
          key: 'records',
          title: 'Records',
          collection: 'requests',
          fields: ['id'],
          recordAccess: ['customFilter'],
        },
      ],
    },
  };
  const catalog = {
    ...source,
    sections: [
      {
        name: 'business',
        title: 'Business',
        subsections: [
          { name: 'borrowing', title: 'Borrowing', resources: [resource] },
        ],
      },
    ],
  } as AuthorizationOptionsResponse;
  const selection = {
    settings: [],
    business: [
      {
        type: 'composite',
        id: 'borrowing',
        actions: ['approve', 'monitor', 'missing'],
        configurationActions: [
          { name: 'monitor', routes: ['monitoring'] },
          { name: 'missing', routes: ['monitoring'] },
        ],
      },
    ],
  };
  const routes = [
    {
      name: 'monitoring',
      source: 'application',
      componentLoader: async () => ({}),
    },
  ] as unknown as AppClientRegisteredRoute[];
  const projected = permissionWorkspaceCatalog(catalog, routes, [], selection);
  expect(projected.sections.map((section) => section.name)).toEqual([
    'business',
    'configuration',
  ]);
  expect(
    projected.sections[0]!.subsections[0]!.resources[0]!.actions.map(
      (action) => action.name,
    ),
  ).toEqual(['approve']);
  const config = projected.sections[1]!.subsections[0]!.resources[0]!;
  expect(config.actions.map((action) => action.name)).toEqual(['monitor']);
  expect(config.dataScopes?.monitor).toEqual(resource.dataScopes.monitor);
  const grants = [
    {
      resource: { type: 'composite', id: 'borrowing' },
      actions: [
        {
          action: 'monitor',
          policy: {
            type: 'composite',
            scopes: {
              records: {
                type: 'recordAccess',
                key: 'customFilter',
                params: { filter: { retained: true } },
              },
            },
          },
        },
      ],
    },
  ];
  const rows = permissionSections(projected, grants, (value) =>
    typeof value === 'string' ? value : value.key,
  ).flatMap((section) => section.groups.flatMap((group) => group.rows));
  expect(
    rows.find((row) => row.id === '["composite","borrowing","monitor"]')
      ?.enabled,
  ).toBe(true);
  for (const absent of [
    [],
    [{ ...routes[0], componentLoader: undefined }],
    [{ ...routes[0], source: 'plugin' }],
  ]) {
    const result = permissionWorkspaceCatalog(
      catalog,
      absent as AppClientRegisteredRoute[],
      [],
      selection,
    );
    expect(result.sections.map((section) => section.name)).toEqual([
      'business',
    ]);
    expect(JSON.stringify(result)).not.toContain('"name":"monitor"');
  }
  expect(
    catalog.sections[0]!.subsections[0]!.resources[0]!.actions,
  ).toHaveLength(2);
});
