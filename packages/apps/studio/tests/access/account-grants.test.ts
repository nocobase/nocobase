// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  convertStudioAccessGrants,
  reviewStudioAccessKeys,
} from '../../database/main/seeds/202610250020_studio_access_v2.js';
import {
  grantsOf,
  preserveUnmanagedGrants,
  roleOf,
} from '../../server/access/grants.js';
import { testCatalog } from './registry.js';

describe('Studio account permission conversion and editing', () => {
  const legacy = [
    {
      resource: { type: 'settings', id: 'pm.members' },
      actions: [
        { action: 'read' },
        { action: 'assign' },
        { action: 'define-roles' },
        { action: 'invite' },
      ],
    },
  ];
  it('maps individual old capabilities while retaining invitations and unrelated grants', () => {
    const unrelated = {
      resource: { type: 'pm', id: 'pm.issues' },
      actions: [{ action: 'edit.related' }],
    };
    const result = convertStudioAccessGrants([...legacy, unrelated]);
    expect(result).toContainEqual({
      resource: { type: 'settings', id: 'pm.members' },
      actions: [{ action: 'invite' }],
    });
    expect(result).toContainEqual(unrelated);
    expect(
      result
        .filter((g) => g.resource.type === 'user')
        .flatMap((g) => g.actions.map((a) => a.action)),
    ).toEqual(['read', 'assign-role']);
    expect(convertStudioAccessGrants(result)).toEqual(result);
  });
  it('retains duplicate unrelated grants instead of normalizing them', () => {
    const grant = {
      resource: { type: 'pm', id: 'pm.issues' },
      actions: [{ action: 'edit.related' }],
    };
    expect(convertStudioAccessGrants([grant, grant])).toEqual([grant, grant]);
  });
  it('does not infer role reading or new account actions from isolated role management', () => {
    expect(
      convertStudioAccessGrants([
        {
          resource: { type: 'settings', id: 'pm.members' },
          actions: [{ action: 'define-roles' }],
        },
      ]),
    ).toEqual([
      {
        resource: { type: 'settings', id: 'studio.roles' },
        actions: [{ action: 'manage' }],
      },
    ]);
  });
  it('stops conversion rather than dropping legacy policy restrictions', () => {
    expect(() =>
      convertStudioAccessGrants([
        {
          resource: { type: 'settings', id: 'pm.members' },
          actions: [{ action: 'read', policy: { type: 'restricted' } }],
        },
      ]),
    ).toThrow('STUDIO_ACCESS_UNMAPPABLE');
  });
  it('round-trips user actions and genuinely removes a cancelled managed action', () => {
    const catalog = testCatalog();
    const source = [
      {
        resource: { type: 'user', id: '*' },
        actions: [{ action: 'read' }, { action: 'update' }],
      },
    ];
    const role = roleOf(source, catalog);
    expect(role.settings['user/update']).toBe(true);
    role.settings['user/update'] = false;
    const saved = preserveUnmanagedGrants(
      source,
      grantsOf(role, catalog),
      catalog,
      new Set(['settings']),
    );
    expect(roleOf(saved, catalog).settings['user/update']).toBe(false);
    expect(roleOf(saved, catalog).settings['user/read']).toBe(true);
  });
  it('preserves scoped and unrecognized grant payloads when replacing managed actions', () => {
    const catalog = testCatalog();
    const policy = {
      resource: { type: 'user', id: 'one-user' },
      actions: [
        {
          action: 'update',
          policy: { type: 'custom', filter: { id: 'one-user' } },
        },
      ],
    };
    const source = [
      policy,
      { resource: { type: 'user', id: '*' }, actions: [{ action: 'read' }] },
    ];
    const role = roleOf(source, catalog);
    role.settings['user/read'] = false;
    const saved = preserveUnmanagedGrants(
      source,
      grantsOf(role, catalog),
      catalog,
      new Set(['settings']),
    );
    expect(saved).toEqual([policy]);
  });
});

describe('sensitive account actions require a sign-in', () => {
  it('rejects key and issued Agent credentials independently of their grants', async () => {
    const { studioUserManagementPolicy } =
      await import('../../server/access/user-management-policy.js');
    const policy = studioUserManagementPolicy('root');
    for (const action of ['update', 'disable', 'enable', 'reset-password']) {
      for (const credential of ['api-key', 'issued', 'invitation'] as const)
        await expect(
          policy.assertAction(action, {
            operation: 'replace',
            actor: { type: 'user', id: 'synthetic' },
            credential,
          }),
        ).rejects.toMatchObject({ code: 'SIGN_IN_REQUIRED' });
      await expect(
        policy.assertAction(action, {
          operation: 'replace',
          actor: { type: 'user', id: 'synthetic' },
          credential: 'session',
        }),
      ).resolves.toBeUndefined();
    }
  });
});

it('blocks legacy settings wildcards instead of silently losing account capabilities', () => {
  for (const id of ['pm.members', '*'])
    expect(() =>
      convertStudioAccessGrants([
        { resource: { type: 'settings', id }, actions: [{ action: '*' }] },
      ]),
    ).toThrow('STUDIO_ACCESS_UNMAPPABLE');
});

it('proves unchanged release-only delegation and flags ordinary, wildcard and member keys independently', () => {
  const cases = [
    ['ordinary', null],
    ['wildcard', { $v: ['1'], '*': ['admin'] }],
    ['members', { $v: ['1'], 'studio.members': ['read'] }],
    ['unknown', { $v: ['2'], 'releases.apps': ['read'] }],
    [
      'release-service',
      {
        $v: ['1'],
        'releases.apps': ['read', 'write'],
        'releases.apps@': ['app-one'],
      },
    ],
  ] as const;
  const result = reviewStudioAccessKeys(
    cases.map(([id, permissions]) => ({
      id,
      referenceId: 'synthetic-' + id,
      permissions: JSON.stringify(permissions),
    })),
  );
  expect(
    Object.fromEntries(result.map((key) => [key.keyId, key.status])),
  ).toEqual({
    ordinary: 'review-required',
    wildcard: 'review-required',
    members: 'review-required',
    unknown: 'review-required',
    'release-service': 'equivalent-unaffected',
  });
  expect(JSON.stringify(result)).not.toContain('permissions');
  expect(result.every((key) => /^[a-f0-9]{64}$/.test(key.scopeHash))).toBe(
    true,
  );
});

describe('key equivalence proof boundaries', () => {
  const sources = {
    rootSet: 'root',
    defaultSet: 'member',
    users: [{ id: 'synthetic-person', kind: 'person' }],
    sets: [
      { id: 'member', key: 'member', grants: [] },
      {
        id: 'custom',
        key: 'custom',
        grants: [
          {
            resource: { type: 'composite', id: 'dynamic-definition' },
            actions: [{ action: 'access' }],
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'assignment',
        subjectType: 'user',
        subjectId: 'synthetic-person',
        permissionSetKey: 'custom',
      },
    ],
  };
  it('stops a composite grant whose expansion cannot be frozen from stored key data', () => {
    const [proof] = reviewStudioAccessKeys(
      [{ id: 'key', referenceId: 'synthetic-person', permissions: null }],
      sources,
    );
    expect(proof?.status).toBe('review-required');
    expect(proof?.reason).toContain('Composite definitions are not frozen');
  });
  it('stops an unsupported level even when the group name is known', () => {
    const [proof] = reviewStudioAccessKeys(
      [
        {
          id: 'key',
          referenceId: 'synthetic-person',
          permissions: { $v: ['1'], 'agents.services': ['read', 'write'] },
        },
      ],
      { ...sources, assignments: [] },
    );
    expect(proof?.status).toBe('review-required');
    expect(proof?.reason).toContain(
      'Unknown scope group, level or object restriction',
    );
  });
});
