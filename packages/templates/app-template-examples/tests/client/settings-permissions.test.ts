import { describe, expect, it } from 'vitest';
import {
  setPermission,
  setPermissions,
  permissionSections,
  setScope,
  type CatalogResource,
} from '../../client/pages/settings/permissions-model.js';
const resource: CatalogResource = {
  type: 'composite',
  id: 'orders',
  title: 'Orders',
  actions: [{ name: 'edit', title: 'Edit' }],
  dataScopes: {
    edit: [
      {
        key: 'records',
        title: 'Records',
        collection: 'orders',
        fields: [],
        recordAccess: ['mine', 'all'],
        defaultValue: 'mine',
      },
    ],
  },
};
describe('settings permission drafts', () => {
  it('adds only the explicit action at its registered default and keeps unrelated policies intact', () => {
    const untouched = {
      resource: { type: 'settings', id: 'notification' },
      actions: [{ action: 'read', policy: { type: 'custom', region: 'east' } }],
    };
    const original = [untouched];
    const next = setPermission(original, resource, 'edit', true);
    expect(next).toContainEqual(untouched);
    expect(next[1]?.actions).toEqual([
      {
        action: 'edit',
        policy: { type: 'composite', scopes: { records: 'mine' } },
      },
    ]);
    expect(original).toEqual([untouched]);
    expect(setPermission(next, resource, 'edit', false)).toEqual([untouched]);
  });
  it('changes one scope without losing a different scope or custom grant', () => {
    const original = [
      {
        resource: { type: 'composite', id: 'orders' },
        actions: [
          {
            action: 'edit',
            policy: {
              type: 'composite',
              scopes: {
                records: 'mine',
                attachments: { selected: ['file-1'] },
              },
            },
          },
          { action: 'approve' },
        ],
      },
    ];
    const next = setScope(
      original,
      JSON.stringify(['composite', 'orders', 'edit', 'records']),
      'all',
    );
    expect(next[0]?.actions[0]?.policy).toMatchObject({
      scopes: { records: 'all', attachments: { selected: ['file-1'] } },
    });
    expect(next[0]?.actions[1]).toEqual({ action: 'approve' });
    expect(original[0]?.actions[0]?.policy.scopes.records).toBe('mine');
  });
});

it('keeps action scopes inline and folds a visible batch without resetting existing policies', () => {
  const catalog = {
    sections: [
      {
        name: 'business',
        title: 'Business',
        subsections: [
          {
            name: 'orders',
            title: 'Orders',
            resources: [
              {
                ...resource,
                actions: [
                  ...resource.actions,
                  { name: 'export', title: 'Export' },
                ],
              },
            ],
          },
        ],
      },
    ],
    recordAccess: [
      { key: 'mine', title: 'Mine' },
      { key: 'all', title: 'All' },
    ],
  } as unknown as Parameters<typeof permissionSections>[0];
  const unrelated = {
    resource: { type: 'unknown', id: 'legacy' },
    actions: [{ action: 'custom', policy: { type: 'custom', keep: true } }],
  };
  const original = [...setPermission([], resource, 'edit', true), unrelated];
  const before = JSON.stringify(original);
  const changed = setPermissions(original, catalog, [
    { id: JSON.stringify(['composite', 'orders', 'export']), enabled: true },
    { id: JSON.stringify(['composite', 'orders', 'edit']), enabled: true },
    {
      id: JSON.stringify(['composite', 'orders', 'notRegistered']),
      enabled: true,
    },
  ]);
  expect(changed).toContainEqual(unrelated);
  expect(changed[0]?.actions).toEqual([
    ...original[0]!.actions,
    { action: 'export' },
  ]);
  expect(JSON.stringify(original)).toBe(before);
  const result = permissionSections(catalog, changed, (value) =>
    typeof value === 'string' ? value : value.key,
  );
  expect(result[0]?.groups[0]?.rows).toHaveLength(2);
  expect(result[0]?.groups[0]?.rows[0]?.scopes?.[0]).toMatchObject({
    label: 'Records',
    level: 'mine',
    id: JSON.stringify(['composite', 'orders', 'edit', 'records']),
  });
});

it('replaces a raw collection scope caption with localized data-range text', () => {
  const scopedResource = {
    ...resource,
    dataScopes: {
      edit: [{ ...resource.dataScopes!.edit![0]!, title: 'orders' }],
    },
  };
  const catalog = {
    sections: [
      {
        name: 's',
        title: 'Business',
        subsections: [
          { name: 'orders', title: 'Orders', resources: [scopedResource] },
        ],
      },
    ],
    recordAccess: [{ key: 'mine', title: 'Mine' }],
  } as unknown as Parameters<typeof permissionSections>[0];
  const result = permissionSections(
    catalog,
    setPermission([], scopedResource, 'edit', true),
    (value) =>
      typeof value === 'string'
        ? value
        : value.key === 'settings.recordScope'
          ? 'Record scope'
          : value.key,
  );
  expect(result[0]?.groups[0]?.rows[0]?.scopes?.[0]?.label).toBe(
    'Record scope',
  );
});

it('preserves an existing policy when enabling the same permission again', () => {
  const original = [
    {
      resource: { type: 'composite', id: 'orders' },
      actions: [
        {
          action: 'edit',
          policy: {
            type: 'composite',
            scopes: {
              records: {
                type: 'recordAccess',
                key: 'mine',
                params: { ownerField: 'assignee' },
              },
            },
            extra: true,
          },
        },
      ],
    },
  ];
  expect(setPermission(original, resource, 'edit', true)).toBe(original);
  expect(
    setScope(
      original,
      JSON.stringify(['composite', 'orders', 'edit', 'records']),
      'mine',
    ),
  ).toBe(original);
});

it.each(['retiredScope', { type: 'legacyPolicy', filter: { owner: 'me' } }])(
  'shows a preserved selection for an unrecognized scope without rewriting it: %j',
  (value) => {
    const catalog = {
      sections: [
        {
          name: 'business',
          title: 'Business',
          subsections: [
            { name: 'orders', title: 'Orders', resources: [resource] },
          ],
        },
      ],
      recordAccess: [
        { key: 'mine', title: 'Mine' },
        { key: 'all', title: 'All' },
      ],
    } as unknown as Parameters<typeof permissionSections>[0];
    const original = [
      {
        resource: { type: 'composite', id: 'orders' },
        actions: [
          {
            action: 'edit',
            policy: { type: 'composite', scopes: { records: value } },
          },
        ],
      },
    ];
    const before = JSON.stringify(original);
    const sections = permissionSections(catalog, original, (text) =>
      typeof text === 'string' ? text : text.key,
    );
    const scope = sections[0]!.groups[0]!.rows[0]!.scopes![0]!;
    expect(
      scope.levels.find((level) => level.value === scope.level)?.label,
    ).toBe('settings.preservedRecordScope');
    expect(setScope(original, scope.id, scope.level!)).toBe(original);
    expect(JSON.stringify(original)).toBe(before);
    expect(
      setScope(original, scope.id, 'all')[0]!.actions[0]!.policy!.scopes,
    ).toEqual({ records: 'all' });
  },
);

it('describes unselected data ranges without claiming that inherited access is denied', () => {
  const described = {
    ...resource,
    actions: [
      { name: 'edit', title: 'Edit', description: 'Change order information.' },
    ],
  };
  const grants = [
    {
      resource: { type: 'composite', id: 'orders' },
      actions: [
        {
          action: 'edit',
          policy: { type: 'composite', scopes: { records: '' } },
        },
      ],
    },
  ];
  const before = structuredClone(grants);
  const catalog = {
    sections: [
      {
        name: 'business',
        title: 'Business operations',
        order: 100,
        subsections: [
          { name: 'orders', title: 'Orders', resources: [described] },
        ],
      },
    ],
    recordAccess: [],
  } as unknown as Parameters<typeof permissionSections>[0];
  const result = permissionSections(catalog, grants, (value) =>
    typeof value === 'string' ? value : value.key,
  );
  expect(result[0]?.description).toBe('settings.businessOperationsHint');
  expect(result[0]?.groups[0]?.rows[0]?.hint).toBe('Change order information.');
  expect(result[0]?.groups[0]?.rows[0]?.scopes?.[0]).toMatchObject({
    level: '',
    hint: 'settings.noAdditionalScopeHint',
  });
  expect(grants).toEqual(before);
});

it('shows a shared plugin action explanation once without duplicating row hints', () => {
  const catalog = {
    sections: [
      {
        name: 'administration',
        title: 'System and tools',
        order: 200,
        subsections: [
          {
            name: 'agents',
            title: 'Agents',
            resources: [
              {
                type: 'agents',
                id: 'agents.agents',
                title: 'Agents and skills',
                actions: [
                  {
                    name: 'edit.related',
                    title: 'Manage own',
                    description: 'Includes archiving and deletion.',
                  },
                  {
                    name: 'edit.all',
                    title: 'Manage all',
                    description: 'Includes archiving and deletion.',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    recordAccess: [],
  } as unknown as Parameters<typeof permissionSections>[0];
  const result = permissionSections(catalog, [], (value) =>
    typeof value === 'string' ? value : value.key,
  );
  expect(result[0]?.groups[0]?.actionHint).toBe(
    'Includes archiving and deletion.',
  );
  expect(result[0]?.groups[0]?.rows.every((row) => !row.hint)).toBe(true);
});

it('keeps scope metadata while ungranted without creating a grant or selecting its default', () => {
  const catalog = {
    sections: [
      {
        name: 'business',
        title: 'Business',
        subsections: [{ name: 'orders', resources: [resource] }],
      },
    ],
    recordAccess: [
      { key: 'mine', title: 'Own' },
      { key: 'all', title: 'All' },
    ],
  } as unknown as Parameters<typeof permissionSections>[0];
  const grants: Parameters<typeof permissionSections>[1] = [];
  const row = permissionSections(catalog, grants, (value) =>
    typeof value === 'string' ? value : value.key,
  )[0]!.groups[0]!.rows[0]!;
  expect(row.enabled).toBe(false);
  expect(row.scopes?.[0]).toMatchObject({
    id: JSON.stringify(['composite', 'orders', 'edit', 'records']),
    level: '',
  });
  expect(grants).toEqual([]);
  const enabled = permissionSections(
    catalog,
    setPermission(grants, resource, 'edit', true),
    (value) => (typeof value === 'string' ? value : value.key),
  )[0]!.groups[0]!.rows[0]!;
  expect(enabled.scopes?.map((scope) => scope.id)).toEqual(
    row.scopes?.map((scope) => scope.id),
  );
  expect(enabled.scopes?.[0]?.level).toBe('mine');
});
