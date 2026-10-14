// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { convertStudioAccessGrants } from '../../database/main/seeds/202610250020_studio_access_v2.js';
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
