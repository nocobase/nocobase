import { describe, expect, it, vi } from 'vitest';
import {
  createAuthorization,
  defaultAccessPlugin,
  permissionSetsPlugin,
  PermissionSetLastAssignmentError,
  PermissionSetProtectedError,
  PermissionSetSubjectNotAllowedError,
  PERMISSION_SETS_PROTECTION_OWNER,
  restrictionRulesPlugin,
  sharingRulesPlugin,
  type AuthorizationPlugin,
  type DefaultAccessOptions,
  type DefaultAccessRule,
  type PermissionSetAssignment,
  type PermissionSetsOptions,
  type RestrictionRule,
  type RestrictionRulesOptions,
  type SharingRule,
  type SharingRulesOptions,
} from '../src/index.js';
import { MemoryRuleStore } from './helpers/memory-rule-store.js';
import {
  MockPermissionSetStore,
  type MockPermissionSetStoreOptions,
} from './helpers/mock-permission-set-store.js';

const resource = {
  type: 'database.collection',
  id: 'main.orders',
} as const;
const alice = { principal: { type: 'user', id: 'alice' } };

/** The mock store ignores it; only its presence changes what the service does. */
const transaction = {};

function readerStore(): MockPermissionSetStore {
  return new MockPermissionSetStore({
    permissionSets: [
      {
        key: 'order-reader',
        grants: [
          {
            resource,
            actions: [{ action: 'read', policy: { type: 'database' } }],
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'reader-assignment',
        subject: { type: 'user', id: 'alice' },
        permissionSet: 'order-reader',
      },
    ],
  });
}

/** Records the order of the reads the invariant depends on. */
class RecordingPermissionSetStore extends MockPermissionSetStore {
  readonly calls: string[] = [];

  async lock(key: string): Promise<void> {
    this.calls.push(`lock:${key}`);
  }

  override async listAssignments(
    permissionSet?: string,
  ): Promise<readonly PermissionSetAssignment[]> {
    this.calls.push(`listAssignments:${permissionSet ?? '*'}`);
    return super.listAssignments(permissionSet);
  }
}

function administratorOptions(
  subjectIds: readonly string[],
): MockPermissionSetStoreOptions {
  return {
    permissionSets: [
      { key: 'administrator', title: 'Administrator', grants: [] },
      { key: 'viewer', title: 'Viewer', grants: [] },
    ],
    assignments: subjectIds.map((subjectId) => ({
      id: `${subjectId}-administrator`,
      subject: { type: 'user', id: subjectId },
      permissionSet: 'administrator',
    })),
  };
}

function createProtectedAuthorization(options: {
  store: MockPermissionSetStore;
  requireActiveAssignment?: boolean;
  unrestricted?: boolean;
  /** Ids of the `user` subjects that can no longer act. */
  disabledUsers?: readonly string[];
}) {
  const authorization = createAuthorization({
    plugins: [permissionSetsPlugin({ store: options.store })],
  });
  if (options.disabledUsers) {
    const disabled = new Set(options.disabledUsers);
    authorization.subjects.add('user', {
      filterActive: (ids) =>
        Promise.resolve(ids.filter((id) => !disabled.has(id))),
    });
  }
  authorization.permissionSets.protect({
    owner: '@nocobase/test',
    keys: ['administrator'],
    allow: ['assign', 'revoke'],
    ...(options.requireActiveAssignment === false
      ? {}
      : { requireActiveAssignment: true }),
    ...(options.unrestricted ? { unrestricted: true } : {}),
  });
  return authorization;
}

function authorizationWith(
  options: Omit<PermissionSetsOptions, 'store'> = {},
  subjectIds: readonly string[] = ['root'],
) {
  return createAuthorization({
    plugins: [
      permissionSetsPlugin({
        store: new MockPermissionSetStore(administratorOptions(subjectIds)),
        ...options,
      }),
    ],
  });
}

describe('the Permission Sets service', () => {
  // TypeScript requires the store; this is what a JavaScript caller sees.
  it.each([
    [
      'Permission Sets',
      () => permissionSetsPlugin({} as PermissionSetsOptions),
    ],
    ['Default Access', () => defaultAccessPlugin({} as DefaultAccessOptions)],
    ['Sharing Rules', () => sharingRulesPlugin({} as SharingRulesOptions)],
    [
      'Restriction Rules',
      () => restrictionRulesPlugin({} as RestrictionRulesOptions),
    ],
  ])('%s requires a store', (name, create) => {
    expect(create).toThrow(`${name} requires a store`);
  });

  it('manages permission sets and assignments through the plugin API', async () => {
    const authorization = createAuthorization({
      plugins: [permissionSetsPlugin({ store: readerStore() })],
    });
    await authorization.permissionSets.create({
      key: 'order-creator',
      grants: [{ resource, actions: [{ action: 'create' }] }],
    });
    const assignment = await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'bob' },
      permissionSet: 'order-creator',
    });
    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'user', id: 'bob' },
      }),
    ).resolves.toHaveLength(1);
    await authorization.permissionSets.revoke(assignment.id);
    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'user', id: 'bob' },
      }),
    ).resolves.toHaveLength(0);
  });

  it('rejects assignments to an unknown Permission Set', async () => {
    const authorization = createAuthorization({
      plugins: [permissionSetsPlugin({ store: new MockPermissionSetStore() })],
    });
    await expect(
      authorization.permissionSets.assign({
        permissionSet: 'missing',
        subject: { type: 'user', id: 'alice' },
      }),
    ).rejects.toThrow('Unknown Permission Set: missing');
  });

  it('replaces only assignments in one managed scope and notifies once', async () => {
    const changed = vi.fn();
    const store = new MockPermissionSetStore({
      permissionSets: [
        { key: 'hub-administrator', grants: [] },
        { key: 'hub-viewer', grants: [] },
        { key: 'other-role', grants: [] },
      ],
      assignments: [
        {
          id: 'hub-admin',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'hub-administrator',
        },
        {
          id: 'other-role',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'other-role',
        },
      ],
    });
    const authorization = createAuthorization({
      plugins: [permissionSetsPlugin({ store })],
    });
    authorization.onGrantsChanged(changed);

    await authorization.permissionSets.replaceSubjectAssignments({
      subject: { type: 'user', id: 'alice' },
      managedPermissionSets: ['hub-administrator', 'hub-viewer'],
      permissionSets: ['hub-viewer'],
    });

    await expect(
      authorization.permissionSets.listAssignments(),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ permissionSet: 'hub-viewer' }),
        expect.objectContaining({ permissionSet: 'other-role' }),
      ]),
    );
    expect(changed).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledWith({ type: 'user', id: 'alice' });

    await authorization.permissionSets.replaceSubjectAssignments({
      subject: { type: 'user', id: 'alice' },
      managedPermissionSets: ['hub-administrator', 'hub-viewer'],
      permissionSets: ['hub-viewer'],
    });
    expect(changed).toHaveBeenCalledOnce();
  });

  it('resolves application-supplied Role and authenticated subjects without putting them on the Principal', async () => {
    const store = new MockPermissionSetStore({
      permissionSets: [
        { key: 'role-permissions', grants: [] },
        { key: 'authenticated-user', grants: [] },
      ],
      assignments: [
        {
          id: 'role-assignment',
          subject: { type: 'role', id: 'manager' },
          permissionSet: 'role-permissions',
        },
        {
          id: 'authenticated-assignment',
          subject: { type: 'authenticated', id: '*' },
          permissionSet: 'authenticated-user',
        },
      ],
    });
    const authorization = createAuthorization({
      plugins: [permissionSetsPlugin({ store })],
    });

    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'user', id: 'alice' },
        subjects: [{ type: 'role', id: 'manager' }],
      }),
    ).resolves.toMatchObject([{ key: 'role-permissions' }]);
    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'anonymous', id: 'guest' },
      }),
    ).resolves.toEqual([]);
    await expect(
      authorization.permissionSets.getEffective({
        principal: { type: 'user', id: 'alice' },
        subjects: [{ type: 'authenticated', id: '*' }],
      }),
    ).resolves.toMatchObject([{ key: 'authenticated-user' }]);
  });

  it('one context reads grants and rules once', async () => {
    const store = new MockPermissionSetStore({
      permissionSets: [
        {
          key: 'settings',
          grants: [
            {
              resource: { type: 'batch', id: '*' },
              actions: [{ action: 'read' }],
            },
          ],
        },
      ],
      assignments: [
        {
          id: 'settings-alice',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'settings',
        },
      ],
    });
    const defaults = new MemoryRuleStore<DefaultAccessRule>([]);
    const sharing = new MemoryRuleStore<SharingRule>([]);
    const restrictions = new MemoryRuleStore<RestrictionRule>([]);
    const reads = [
      vi.spyOn(defaults, 'list'),
      vi.spyOn(sharing, 'list'),
      vi.spyOn(restrictions, 'list'),
    ];
    const authz = createAuthorization({
      plugins: [
        permissionSetsPlugin({ store }),
        defaultAccessPlugin({ store: defaults }),
        sharingRulesPlugin({ store: sharing }),
        restrictionRulesPlugin({ store: restrictions }),
      ],
    });
    authz.resourceTypes.add({
      type: 'batch',
      actions: ['read'],
      async authorize(request, context) {
        await context.grants.resolve(request);
        await context.constraints.resolve(request);
        return { effect: 'permit', reasons: [] };
      },
    });
    const context = authz.for(alice);
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        context.authorize({
          resource: { type: 'batch', id: String(i) },
          action: 'read',
        }),
      ),
    );
    await context.snapshot();
    expect(store.findAssignmentsCalls).toBe(1);
    expect(store.getCalls).toBe(1);
    reads.forEach((read) => expect(read).toHaveBeenCalledTimes(1));

    await authz
      .for(alice)
      .authorize({ resource: { type: 'batch', id: '0' }, action: 'read' });
    expect(store.findAssignmentsCalls).toBe(2);
    reads.forEach((read) => expect(read).toHaveBeenCalledTimes(2));
  });

  it('keeps resource policies owned by their plugins', async () => {
    const store = new MockPermissionSetStore({
      permissionSets: [
        {
          key: 'file-reader',
          grants: [
            {
              resource: { type: 'file.object', id: '*' },
              actions: [
                {
                  action: 'download',
                  policy: {
                    type: 'file',
                    recordAccess: ['filesIOwn'],
                  },
                },
              ],
            },
          ],
        },
      ],
      assignments: [
        {
          id: 'file-assignment',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'file-reader',
        },
      ],
    });
    let resolvedPolicyType: string | undefined;
    const filePlugin: AuthorizationPlugin = {
      id: 'file',
      requiresGrants: true,
      setup(authz): void {
        const grants = authz.grants;
        authz.resourceTypes.add({
          type: 'file.object',
          actions: ['download'],
          async authorize(request) {
            const resolved = await grants.resolve(request);
            resolvedPolicyType = resolved[0]?.policy?.type;
            return {
              effect: resolvedPolicyType === 'file' ? 'permit' : 'deny',
              reasons: [],
            };
          },
        });
      },
    };
    const authorization = createAuthorization({
      plugins: [filePlugin, permissionSetsPlugin({ store })],
    });
    await expect(
      authorization.for(alice).can({
        resource: { type: 'file.object', id: 'file-123' },
        action: 'download',
      }),
    ).resolves.toBe(true);
    expect(resolvedPolicyType).toBe('file');
  });
});

describe('Permission Sets that require an active assignment', () => {
  it('refuses the revocation that would remove the last assignment', async () => {
    const store = new MockPermissionSetStore(
      administratorOptions(['root', 'second']),
    );
    const authorization = createProtectedAuthorization({ store });

    await authorization.permissionSets.revoke('second-administrator');
    await expect(
      authorization.permissionSets.revoke('root-administrator'),
    ).rejects.toBeInstanceOf(PermissionSetLastAssignmentError);
    await expect(
      authorization.permissionSets.listAssignments('administrator'),
    ).resolves.toHaveLength(1);
  });

  it('counts the people who can still act rather than the assignment rows', async () => {
    const options = administratorOptions(['root', 'disabled']);
    const authorization = createProtectedAuthorization({
      store: new MockPermissionSetStore(options),
      disabledUsers: ['disabled'],
    });

    // Two rows remain, but only one of them belongs to an account that can
    // still sign in, so the enabled one is already the last.
    await expect(
      authorization.permissionSets.revoke('root-administrator'),
    ).rejects.toBeInstanceOf(PermissionSetLastAssignmentError);
    await expect(
      authorization.permissionSets.revoke('disabled-administrator'),
    ).resolves.toBeUndefined();

    // With no subject type declared, every row counts.
    const undeclared = createProtectedAuthorization({
      store: new MockPermissionSetStore(options),
    });
    await expect(
      undeclared.permissionSets.revoke('root-administrator'),
    ).resolves.toBeUndefined();
  });

  it('enforces nothing for a set that does not declare the flag', async () => {
    const store = new MockPermissionSetStore(administratorOptions(['root']));
    // Unrestricted access alone must not imply the rule.
    const authorization = createProtectedAuthorization({
      store,
      requireActiveAssignment: false,
      unrestricted: true,
    });

    await expect(
      authorization.permissionSets.revoke('root-administrator'),
    ).resolves.toBeUndefined();
    await expect(
      authorization.permissionSets.listAssignments('administrator'),
    ).resolves.toHaveLength(0);
  });

  it('refuses to replace away the last assignment', async () => {
    const store = new MockPermissionSetStore(
      administratorOptions(['root', 'second']),
    );
    const authorization = createProtectedAuthorization({ store });
    const replace = (
      subjectId: string,
    ): Promise<readonly PermissionSetAssignment[]> =>
      authorization.permissionSets.replaceSubjectAssignments({
        subject: { type: 'user', id: subjectId },
        managedPermissionSets: ['administrator', 'viewer'],
        permissionSets: ['viewer'],
      });

    await expect(replace('second')).resolves.toMatchObject([
      { permissionSet: 'viewer' },
    ]);
    await expect(replace('root')).rejects.toBeInstanceOf(
      PermissionSetLastAssignmentError,
    );
    await expect(
      authorization.permissionSets.listAssignments('administrator'),
    ).resolves.toHaveLength(1);
  });

  it('answers assertSubjectRemovable for the subjects that hold the set', async () => {
    const store = new MockPermissionSetStore(
      administratorOptions(['root', 'second']),
    );
    await store.assign({
      id: 'viewer-viewer',
      subject: { type: 'user', id: 'viewer' },
      permissionSet: 'viewer',
    });
    const authorization = createProtectedAuthorization({ store });
    const removable = (subjectId: string): Promise<void> =>
      authorization.permissionSets.assertSubjectRemovable({
        type: 'user',
        id: subjectId,
      });

    await expect(removable('viewer')).resolves.toBeUndefined();
    await expect(removable('root')).resolves.toBeUndefined();

    await authorization.permissionSets.revoke('second-administrator');
    await expect(removable('root')).rejects.toBeInstanceOf(
      PermissionSetLastAssignmentError,
    );
  });

  it('takes the store lock before reading the assignments it counts', async () => {
    const store = new RecordingPermissionSetStore(
      administratorOptions(['root']),
    );
    const authorization = createProtectedAuthorization({ store });

    await expect(
      authorization.permissionSets.revoke('root-administrator'),
    ).rejects.toBeInstanceOf(PermissionSetLastAssignmentError);
    const lockIndex = store.calls.indexOf('lock:administrator');
    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(store.calls.indexOf('listAssignments:*')).toBeGreaterThan(lockIndex);
    expect(
      store.calls.indexOf('listAssignments:administrator'),
    ).toBeGreaterThan(lockIndex);
  });
});

describe('the Permission Set the library protects as the root set', () => {
  it('protects it exactly as an explicit protect call did, and only when declared', () => {
    expect(
      authorizationWith({
        rootSet: 'administrator',
      }).permissionSets.protection('administrator'),
    ).toEqual({
      owner: PERMISSION_SETS_PROTECTION_OWNER,
      allow: ['assign', 'revoke'],
      requireActiveAssignment: true,
      unrestricted: true,
    });
    expect(
      authorizationWith({
        rootSet: { key: 'administrator', assignableTo: ['user'] },
      }).permissionSets.protection('administrator'),
    ).toMatchObject({ assignableTo: ['user'] });
    expect(
      authorizationWith().permissionSets.protection('administrator'),
    ).toBeUndefined();
  });

  it('lets the application keep the set empty', async () => {
    const authorization = authorizationWith({
      rootSet: { key: 'administrator', requireActiveAssignment: false },
    });

    expect(authorization.permissionSets.protection('administrator')).toEqual({
      owner: PERMISSION_SETS_PROTECTION_OWNER,
      allow: ['assign', 'revoke'],
      unrestricted: true,
    });
    await expect(
      authorization.permissionSets.revoke('root-administrator'),
    ).resolves.toBeUndefined();
  });
});

describe('the Permission Set the library protects as the default set', () => {
  it('keeps its grants editable while the set and its binding are not, and only when declared', () => {
    const authorization = authorizationWith({ defaultSet: 'member' });

    expect(authorization.permissionSets.protection('member')).toEqual({
      owner: PERMISSION_SETS_PROTECTION_OWNER,
      allow: ['update'],
    });
    expect(() =>
      authorization.permissionSets.assertWritable('member', 'update'),
    ).not.toThrow();
    for (const operation of ['delete', 'assign', 'revoke'] as const) {
      expect(() =>
        authorization.permissionSets.assertWritable('member', operation),
      ).toThrow(PermissionSetProtectedError);
    }
    expect(
      authorizationWith().permissionSets.protection('member'),
    ).toBeUndefined();
  });
});

describe('the subject types a Permission Set may be assigned to', () => {
  function authorizationWithAssignableTo(assignableTo?: readonly string[]) {
    const authorization = authorizationWith({}, []);
    authorization.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['administrator'],
      allow: ['assign', 'revoke'],
      ...(assignableTo ? { assignableTo } : {}),
    });
    return authorization;
  }

  it('refuses a subject type the set does not declare', async () => {
    const authorization = authorizationWithAssignableTo(['user']);

    await expect(
      authorization.permissionSets.assign({
        subject: { type: 'authenticated', id: '*' },
        permissionSet: 'administrator',
      }),
    ).rejects.toBeInstanceOf(PermissionSetSubjectNotAllowedError);
    await expect(
      authorization.permissionSets.listAssignments('administrator'),
    ).resolves.toEqual([]);

    await expect(
      authorization.permissionSets.assign({
        subject: { type: 'user', id: 'alice' },
        permissionSet: 'administrator',
      }),
    ).resolves.toMatchObject({ permissionSet: 'administrator' });
  });

  it('refuses the same subject type when assignments are replaced', async () => {
    const authorization = authorizationWithAssignableTo(['user']);

    await expect(
      authorization.permissionSets.replaceSubjectAssignments({
        subject: { type: 'authenticated', id: '*' },
        managedPermissionSets: ['administrator', 'viewer'],
        permissionSets: ['administrator'],
      }),
    ).rejects.toBeInstanceOf(PermissionSetSubjectNotAllowedError);
    await expect(
      authorization.permissionSets.listAssignments('administrator'),
    ).resolves.toEqual([]);

    await expect(
      authorization.permissionSets.replaceSubjectAssignments({
        subject: { type: 'user', id: 'alice' },
        managedPermissionSets: ['administrator', 'viewer'],
        permissionSets: ['administrator'],
      }),
    ).resolves.toMatchObject([{ permissionSet: 'administrator' }]);
  });

  it('accepts any subject type when the set declares none', async () => {
    const authorization = authorizationWithAssignableTo();

    await expect(
      authorization.permissionSets.assign({
        subject: { type: 'authenticated', id: '*' },
        permissionSet: 'administrator',
      }),
    ).resolves.toMatchObject({ subject: { type: 'authenticated' } });
  });
});

describe('subscribing to assignment changes', () => {
  it('notifies every subscriber when an assignment changes', async () => {
    const authorization = authorizationWith();
    const changed = vi.fn();
    authorization.onGrantsChanged(changed);

    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'second' },
      permissionSet: 'administrator',
    });

    expect(changed.mock.calls).toEqual([[{ type: 'user', id: 'second' }]]);
  });

  it('notifies assigned subjects when a Permission Set changes or is deleted', async () => {
    const changed = vi.fn();
    const store = new MockPermissionSetStore({
      permissionSets: [{ key: 'operators', grants: [] }],
      assignments: [
        {
          id: 'alice-operator',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'operators',
        },
        {
          id: 'authenticated-operator',
          subject: { type: 'authenticated', id: '*' },
          permissionSet: 'operators',
        },
      ],
    });
    const authorization = createAuthorization({
      plugins: [permissionSetsPlugin({ store })],
    });
    authorization.onGrantsChanged(changed);

    await authorization.permissionSets.update('operators', {
      key: 'renamed-operators',
      grants: [],
    });

    expect(changed.mock.calls).toEqual([
      [{ type: 'user', id: 'alice' }],
      [{ type: 'authenticated', id: '*' }],
    ]);

    changed.mockClear();
    await authorization.permissionSets.delete('renamed-operators');

    expect(changed.mock.calls).toEqual([
      [{ type: 'user', id: 'alice' }],
      [{ type: 'authenticated', id: '*' }],
    ]);
  });

  it('notifies nobody from a service bound to a transaction', async () => {
    const authorization = authorizationWith();
    const changed = vi.fn();
    authorization.onGrantsChanged(changed);

    await authorization.permissionSets.withTransaction(transaction).assign({
      subject: { type: 'user', id: 'second' },
      permissionSet: 'administrator',
    });

    expect(changed).not.toHaveBeenCalled();
  });

  it('notifies after the commit of a transaction that offers afterCommit', async () => {
    const authorization = authorizationWith();
    const changed = vi.fn();
    authorization.onGrantsChanged(changed);
    const committed: Array<() => Promise<void>> = [];
    const connection = {
      afterCommit: (callback: () => Promise<void>) => {
        committed.push(callback);
      },
    };

    await authorization.permissionSets.withTransaction(connection).assign({
      subject: { type: 'user', id: 'second' },
      permissionSet: 'administrator',
    });
    expect(changed).not.toHaveBeenCalled();

    for (const callback of committed) await callback();
    expect(changed).toHaveBeenCalledExactlyOnceWith({
      type: 'user',
      id: 'second',
    });
  });

  it('stops notifying once the subscription is released', async () => {
    const authorization = authorizationWith();
    const changed = vi.fn();
    const release = authorization.onGrantsChanged(changed);

    release();
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'second' },
      permissionSet: 'administrator',
    });

    expect(changed).not.toHaveBeenCalled();
  });
});
