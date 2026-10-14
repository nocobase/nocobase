// @vitest-environment node
import { copyFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createSeeder } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  readStudioKeyInventory,
  studioKeyInventoryHash,
} from '../../database/main/seeds/202610250020_studio_access_v2.js';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization';
import { registerAccess } from './registry.js';
import {
  accessMigrationFixture,
  recordAccessFixtureCost,
} from './migration-fixture.js';
const accessMigrations = accessMigrationFixture();
afterAll(() => accessMigrations.dispose());
import { createApiKeyScopes } from '@nocobase/app-plugin-api-keys/server';
import { decodeKeyScope } from '@nocobase/app-plugin-api-keys/shared/scopes';
import { registerStudioKeyScopes } from '../../server/access/key-scopes.js';
import { readCatalog } from '../../server/access/catalog.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
let test: TestDatabase;
let directory: string;
const decode = (value: unknown): unknown =>
  typeof value === 'string' ? JSON.parse(value) : value;
const migrationSources = [
  ...[
    'app-plugin-authentication',
    'app-plugin-authorization',
    'app-plugin-users',
    'app-plugin-api-keys',
    'app-plugin-projects',
  ].map((name) => ({
    directory: path.join(ROOT, '../../plugins', name, 'database/migrations'),
    packageName: '@nocobase/' + name,
  })),
  {
    directory: accessMigrations.directory,
    packageName: 'studio',
  },
];
const sources = [
  { directory: path.join(ROOT, 'database/main/seeds'), packageName: 'studio' },
];
async function runUpgrade(
  maintenance = true,
  expectedHash?: string,
  defaultSet = 'member',
) {
  return createSeeder({
    database: test.database,
    connection: 'main',
    sources,
    config: {
      get<T>(key: string): T | undefined {
        return (
          key === 'studio.accessUpgrade.maintenance'
            ? maintenance
            : key === 'authorization.permissionSets.defaultSet'
              ? defaultSet
              : key === 'studio.accessUpgrade.expectedKeyInventoryHash'
                ? expectedHash
                : undefined
        ) as T | undefined;
      },
    },
  }).run();
}
async function roles() {
  return test.database
    .connection()
    .repository<{ id: string; key: string; grants: unknown }>(
      'authorizationPermissionSets',
    )
    .findMany({ sort: (s) => [s.field('key').asc()] });
}

beforeEach(async () => {
  const preparationStarted = performance.now();
  test = await createTestDatabase({
    migrations: [
      'app-plugin-authentication',
      'app-plugin-authorization',
      'app-plugin-users',
      'app-plugin-api-keys',
      'app-plugin-projects',
    ]
      .map((name) => ({
        directory: path.join(
          ROOT,
          '../../plugins',
          name,
          'database/migrations',
        ),
        packageName: '@nocobase/' + name,
      }))
      .concat([
        {
          directory: accessMigrations.directory,
          packageName: 'studio',
        },
      ]),
  });
  const connection = test.database.connection();
  for (const key of ['root', 'member'])
    await connection.repository('authorizationPermissionSets').createOne({
      values: {
        id: key,
        key,
        grants: [],
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  directory = mkdtempSync(path.join(tmpdir(), 'pm358-legacy-seeds-'));
  symlinkSync(
    path.join(ROOT, 'node_modules'),
    path.join(directory, 'node_modules'),
    'dir',
  );
  copyFileSync(
    path.join(ROOT, 'database/main/seeds/202610010022_studio_roles.ts'),
    path.join(directory, '202610010022_studio_roles.ts'),
  );
  await test.seed([{ directory, packageName: 'studio' }]);
  recordAccessFixtureCost(
    'upgrade-path',
    performance.now() - preparationStarted,
  );
});
afterEach(async () => {
  await test.destroy();
  rmSync(directory, { recursive: true, force: true });
});

describe('upgrading an existing Studio without new account grants', () => {
  it.each(['member', 'custom-default'])(
    'stops narrowing from the unmigrated %s default set without partial writes',
    async (defaultSet) => {
      const connection = test.database.connection();
      const grants = [
        {
          resource: { type: 'settings', id: 'pm.members' },
          actions: [{ action: 'define-roles' }],
        },
      ];
      if (defaultSet !== 'member')
        await connection.repository('authorizationPermissionSets').createOne({
          values: {
            id: defaultSet,
            key: defaultSet,
            grants,
            title: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      else
        await connection
          .repository('authorizationPermissionSets')
          .updateOne({ filter: { key: defaultSet }, values: { grants } });
      const subject = 'synthetic-default-user';
      await connection.repository('user').createOne({
        values: {
          id: subject,
          kind: 'person',
          name: 'Synthetic default user',
          email: 'default@example.test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await connection
        .repository('authorizationPermissionSetAssignments')
        .createOne({
          values: {
            id: 'default-assignment',
            subjectType: 'user',
            subjectId: subject,
            permissionSetKey: defaultSet,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      await connection.repository('apikey').createOne({
        values: {
          id: 'default-key',
          referenceId: subject,
          permissions: null,
          key: 'synthetic-unused-value',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      const authz = createAppAuthorization({
        connection,
        config: { permissionSets: { defaultSet } },
      });
      registerAccess(authz);
      const identity = {
        principal: { type: 'user', id: subject },
        subjects: [{ type: 'authenticated', id: '*' }],
      };
      expect(
        await authz.for(identity).can({
          resource: { type: 'settings', id: 'pm.members' },
          action: 'define-roles',
        }),
      ).toBe(true);
      expect(
        await authz.for(identity).can({
          resource: { type: 'settings', id: 'studio.roles' },
          action: 'manage',
        }),
      ).toBe(false);
      const before = await roles();
      const journalBefore = await connection
        .repository('studioAccessUpgradeChanges')
        .findMany();
      const inventory = await readStudioKeyInventory(
        connection,
        'root',
        defaultSet,
      );
      expect(inventory[0].status).toBe('review-required');
      expect(inventory[0].reason).toContain(
        'Unmigrated permission set ' + defaultSet,
      );
      expect(inventory[0].reason).toContain('define-roles');
      await expect(
        runUpgrade(true, studioKeyInventoryHash(inventory), defaultSet),
      ).rejects.toThrow('STUDIO_KEY_REVIEW_REQUIRED');
      expect(await roles()).toEqual(before);
      expect(
        await connection.repository('studioAccessUpgradeChanges').findMany(),
      ).toEqual(journalBefore);
      expect(
        await authz.for(identity).can({
          resource: { type: 'settings', id: 'pm.members' },
          action: 'define-roles',
        }),
      ).toBe(true);
    },
  );

  it('maps actual narrowed grants and retains identities, invitations, advanced payloads and null defaults', async () => {
    const connection = test.database.connection();
    const before = await roles();
    const admin = before.find((role) => role.key === 'admin')!;
    const advanced = {
      resource: { type: 'pm', id: 'pm.projects' },
      actions: [
        {
          action: 'edit.related',
          policy: { type: 'custom', condition: { status: 'open' } },
        },
      ],
    };
    await connection.repository('authorizationPermissionSets').updateOne({
      filter: { id: admin.id },
      values: {
        grants: [
          {
            resource: { type: 'settings', id: 'pm.members' },
            actions: [{ action: 'read' }, { action: 'invite' }],
          },
          advanced,
        ],
      },
    });
    await connection.repository('studioSettings').createOne({
      values: {
        key: 'defaultRole',
        value: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await runUpgrade();
    const after = await roles();
    expect(after.map(({ id, key }) => ({ id, key }))).toEqual(
      before.map(({ id, key }) => ({ id, key })),
    );
    const grants = decode(
      after.find((role) => role.key === 'admin')!.grants,
    ) as {
      resource: { type: string; id: string };
      actions: { action: string }[];
    }[];
    expect(grants).toContainEqual(advanced);
    expect(grants).toContainEqual({
      resource: { type: 'settings', id: 'pm.members' },
      actions: [{ action: 'invite' }],
    });
    expect(
      grants
        .filter((grant) => grant.resource.type === 'user')
        .flatMap((grant) => grant.actions.map((a) => a.action)),
    ).toEqual(['read']);
    expect(
      (await connection
        .repository<{ value: unknown }>('studioSettings')
        .findOne({ filter: { key: 'defaultRole' } }))!.value,
    ).toBeNull();
    expect(
      await connection.repository('studioAccessUpgradeChanges').count(),
    ).toBe(3);
    const unchanged = await roles();
    await runUpgrade();
    expect(await roles()).toEqual(unchanged);
  });
  it('requires maintenance and rolls back grants and recovery records on an ambiguous conversion', async () => {
    const before = await roles();
    await expect(runUpgrade(false)).rejects.toThrow(
      'STUDIO_ACCESS_MAINTENANCE_REQUIRED',
    );
    expect(await roles()).toEqual(before);
    expect(
      await test.database
        .connection()
        .repository('studioAccessUpgradeChanges')
        .count(),
    ).toBe(0);
    const admin = before.find((role) => role.key === 'admin')!;
    await test.database
      .connection()
      .repository('authorizationPermissionSets')
      .updateOne({
        filter: { id: admin.id },
        values: {
          grants: [
            {
              resource: { type: 'settings', id: 'pm.members' },
              actions: [{ action: 'read', policy: { type: 'restricted' } }],
            },
          ],
        },
      });
    const narrowed = await roles();
    await expect(runUpgrade()).rejects.toThrow('STUDIO_ACCESS_UNMAPPABLE');
    expect(await roles()).toEqual(narrowed);
    expect(
      await test.database
        .connection()
        .repository('studioAccessUpgradeChanges')
        .count(),
    ).toBe(0);
  });
  it('leaves historical invitations untouched without blocking the access upgrade', async () => {
    const invitations = test.database
      .connection()
      .repository('userInvitations');
    await invitations.createOne({
      values: {
        id: 'synthetic-invitation',
        email: 'synthetic@example.test',
        tokenHash: 'synthetic-non-credential-hash',
        roleScopes: { studio: ['admin'] },
        data: {},
        summary: [],
        status: 'pending',
        invitedById: 'synthetic-inviter',
        expiresAt: new Date(Date.now() + 60_000),
        sentAt: null,
        sendError: null,
        acceptedUserId: null,
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await runUpgrade();
    expect(
      await invitations.findOne({
        filter: { id: 'synthetic-invitation' },
        select: (s) => s.fields('id', 'status'),
      }),
    ).toEqual({ id: 'synthetic-invitation', status: 'pending' });
    expect(
      await test.database
        .connection()
        .repository('studioAccessUpgradeChanges')
        .count(),
    ).toBeGreaterThan(0);
  });
  it('keeps a provably unaffected release-only key and its private grants unchanged', async () => {
    const connection = test.database.connection();
    const permissions = JSON.stringify({
      $v: ['1'],
      'releases.apps': ['read', 'write'],
      'releases.apps@': ['synthetic-app'],
    });
    await connection.repository('apikey').createOne({
      values: {
        id: 'release-key',
        referenceId: 'service-release',
        key: 'synthetic-non-credential-hash',
        permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await connection.repository('authorizationPermissionSets').createOne({
      values: {
        id: 'private-release',
        key: 'api-key-service-release',
        title: null,
        grants: [
          {
            resource: { type: 'rel', id: 'rel.apps' },
            actions: [{ action: 'upload.all' }],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await connection.repository('user').createOne({
      values: {
        id: 'service-release',
        kind: 'service',
        name: 'Synthetic release subject',
        email: 'release@example.test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const keyBefore = await connection
      .repository('apikey')
      .findOne({ filter: { id: 'release-key' } });
    const privateBefore = (await roles()).find(
      (role) => role.key === 'api-key-service-release',
    );
    await runUpgrade();
    expect(
      await connection
        .repository('apikey')
        .findOne({ filter: { id: 'release-key' } }),
    ).toEqual(keyBefore);
    expect(
      (await roles()).find((role) => role.key === 'api-key-service-release'),
    ).toEqual(privateBefore);
    expect(
      await connection.repository('studioAccessUpgradeChanges').count(),
    ).toBeGreaterThan(0);
  });
  it.each(['ordinary', 'scoped', 'service'] as const)(
    'applies an exact %s key inventory without changing identity, scope or unrelated grants',
    async (kind) => {
      const connection = test.database.connection();
      const subject = 'equivalent-' + kind;
      const now = new Date();
      await connection.repository('user').createOne({
        values: {
          id: subject,
          kind: kind === 'service' ? 'service' : 'person',
          name: 'Synthetic subject',
          email: subject + '@example.test',
          createdAt: now,
          updatedAt: now,
        },
      });
      const scoped =
        kind === 'scoped'
          ? {
              $v: ['1'],
              'projects.projects': ['read'],
              'projects.projects@': ['picked-project'],
            }
          : kind === 'service'
            ? { $v: ['1'], 'studio.members': ['read', 'write', 'admin'] }
            : null;
      await connection.repository('apikey').createOne({
        values: {
          id: subject + '-key',
          referenceId: subject,
          permissions: scoped === null ? null : JSON.stringify(scoped),
          key: 'synthetic-non-credential-hash',
          createdAt: now,
          updatedAt: now,
        },
      });
      const setKey =
        kind === 'service' ? 'api-key-' + subject : 'custom-' + subject;
      const grants =
        kind === 'service'
          ? [
              {
                resource: { type: 'settings', id: 'pm.members' },
                actions: [{ action: 'define-roles' }],
              },
            ]
          : [
              {
                resource: { type: 'pm', id: 'pm.projects' },
                actions: [{ action: 'view.related' }],
              },
            ];
      await connection.repository('authorizationPermissionSets').createOne({
        values: {
          id: setKey,
          key: setKey,
          title: null,
          grants,
          createdAt: now,
          updatedAt: now,
        },
      });
      await connection
        .repository('authorizationPermissionSetAssignments')
        .createOne({
          values: {
            id: subject + '-assignment',
            subjectType: 'user',
            subjectId: subject,
            permissionSetKey: setKey,
            createdAt: now,
            updatedAt: now,
          },
        });
      const keyBefore = await connection.query
        .selectFrom('apikey')
        .select(['id', 'referenceId', 'permissions', 'createdAt'])
        .where('id', '=', subject + '-key')
        .executeTakeFirst();
      const inventory = await readStudioKeyInventory(connection);
      expect(inventory[0]?.status).toBe('equivalent-transition');
      const hash = studioKeyInventoryHash(inventory);
      await expect(runUpgrade()).rejects.toThrow(
        'STUDIO_KEY_INVENTORY_CONFLICT',
      );
      await expect(runUpgrade(true, 'stale-hash')).rejects.toThrow(
        'STUDIO_KEY_INVENTORY_CONFLICT',
      );
      const identityAssignments = await connection.query
        .selectFrom('authorizationPermissionSetAssignments')
        .selectAll()
        .where('subjectId', '=', subject)
        .execute();
      await runUpgrade(true, hash);
      expect(
        await connection.query
          .selectFrom('apikey')
          .select(['id', 'referenceId', 'permissions', 'createdAt'])
          .where('id', '=', subject + '-key')
          .executeTakeFirst(),
      ).toEqual(keyBefore);
      expect(
        await connection.query
          .selectFrom('authorizationPermissionSetAssignments')
          .selectAll()
          .where('subjectId', '=', subject)
          .execute(),
      ).toEqual(identityAssignments);
      const after = await connection
        .repository<{ grants: unknown }>('authorizationPermissionSets')
        .findOne({ filter: { key: setKey } });
      if (kind !== 'service') expect(decode(after!.grants)).toEqual(grants);
      else
        expect(decode(after!.grants)).toEqual([
          {
            resource: { type: 'settings', id: 'studio.roles' },
            actions: [{ action: 'manage' }],
          },
        ]);
      const authz = createAppAuthorization({ connection });
      registerAccess(authz);
      const scopes = createApiKeyScopes();
      registerStudioKeyScopes(scopes, {}, () => readCatalog(authz));
      const scope = decodeKeyScope(scoped);
      const identity = {
        principal: { type: 'user', id: subject },
        subjects: [{ type: 'authenticated', id: '*' }],
        ...(scope ? { keyScope: scopes.compile(subject + '-key', scope) } : {}),
      };
      const evaluator = authz.for(identity);
      expect(
        (await authz.permissionSets.getEffective(identity)).map(
          (set) => set.key,
        ),
      ).toContain(setKey);
      expect(
        await evaluator.can({
          resource:
            kind === 'service'
              ? { type: 'settings', id: 'studio.roles' }
              : { type: 'pm', id: 'pm.projects' },
          action: kind === 'service' ? 'manage' : 'view.related',
        }),
      ).toBe(true);
      expect(
        await evaluator.can({
          resource: { type: 'settings', id: 'studio.roles' },
          action: 'read',
        }),
      ).toBe(false);
      expect(
        await evaluator.can({
          resource: { type: 'user', id: '*' },
          action: 'reset-password',
        }),
      ).toBe(false);
      if (kind === 'service') {
        const changed = [
          ...(decode(after!.grants) as object[]),
          {
            resource: { type: 'page', id: 'unrelated' },
            actions: [{ action: 'access' }],
          },
        ];
        await connection
          .repository('authorizationPermissionSets')
          .updateOne({ filter: { key: setKey }, values: { grants: changed } });
        const edited = await roles();
        const { restoreStudioAccess } =
          await import('../../server/access/upgrade-recovery.js');
        await expect(
          restoreStudioAccess(test.database, authz),
        ).rejects.toMatchObject({ code: 'STUDIO_ACCESS_RESTORE_CONFLICT' });
        expect(await roles()).toEqual(edited);
      }
      if (scope && kind === 'scoped')
        expect(
          scopes.compile(subject + '-key', scope).objects('pm.projects'),
        ).toEqual(['picked-project']);
    },
  );
  it('refuses changed subject grants even when the scope hash is unchanged', async () => {
    const connection = test.database.connection();
    await connection.repository('user').createOne({
      values: {
        id: 'person-proof',
        kind: 'person',
        name: 'Synthetic person',
        email: 'proof@example.test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await connection.repository('apikey').createOne({
      values: {
        id: 'proof-key',
        referenceId: 'person-proof',
        permissions: null,
        key: 'synthetic-non-credential-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const before = await readStudioKeyInventory(connection);
    await connection
      .repository('authorizationPermissionSetAssignments')
      .createOne({
        values: {
          id: 'proof-assignment',
          subjectType: 'user',
          subjectId: 'person-proof',
          permissionSetKey: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    const after = await readStudioKeyInventory(connection);
    expect(after[0]?.scopeHash).toBe(before[0]?.scopeHash);
    expect(after[0]?.subjectHash).not.toBe(before[0]?.subjectHash);
    expect(after[0]?.reason).toContain('legacy read excludes disabled people');
    await expect(
      runUpgrade(true, studioKeyInventoryHash(before)),
    ).rejects.toThrow('STUDIO_KEY_REVIEW_REQUIRED');
  });
  it('blocks stored key delegation instead of copying human grants into it', async () => {
    await test.database
      .connection()
      .repository('apikey')
      .createOne({
        values: {
          id: 'synthetic-key',
          referenceId: 'synthetic-subject',
          key: 'synthetic-non-credential-hash',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    const before = await roles();
    await expect(runUpgrade()).rejects.toThrow('STUDIO_KEY_REVIEW_REQUIRED');
    expect(await roles()).toEqual(before);
  });
});

describe('interrupted first Studio role provisioning', () => {
  it('resumes the initial ledger without regranting an action withdrawn after provisioning', async () => {
    await test.reset();
    await test.migrate(migrationSources);
    const connection = test.database.connection();
    for (const key of ['root', 'member'])
      await connection.repository('authorizationPermissionSets').createOne({
        values: {
          id: key,
          key,
          grants: [],
          title: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    rmSync(path.join(directory, '202610010022_studio_roles.ts'));
    copyFileSync(
      path.join(
        ROOT,
        'database/main/seeds/202610010021z_studio_account_defaults.ts',
      ),
      path.join(directory, '202610010021z_studio_account_defaults.ts'),
    );
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      path.join(directory, '202610010021zz_stop_after_roles.ts'),
      "import {defineSeed} from '@nocobase/db'; export default defineSeed({name: '202610010021zz_stop_after_roles', async run(){throw new Error('SIMULATED_INSTALL_INTERRUPTION')}});",
    );
    await expect(
      test.seed([{ directory, packageName: 'studio' }]),
    ).rejects.toThrow('SIMULATED_INSTALL_INTERRUPTION');
    const admin = (await roles()).find((role) => role.key === 'admin')!;
    const grants = decode(admin.grants) as {
      resource: { type: string };
      actions: { action: string }[];
    }[];
    await connection.repository('authorizationPermissionSets').updateOne({
      filter: { id: admin.id },
      values: {
        grants: grants.map((grant) =>
          grant.resource.type === 'user'
            ? {
                ...grant,
                actions: grant.actions.filter(
                  (action) => action.action !== 'update',
                ),
              }
            : grant,
        ),
      },
    });
    rmSync(path.join(directory, '202610010021zz_stop_after_roles.ts'));
    copyFileSync(
      path.join(ROOT, 'database/main/seeds/202610010022_studio_roles.ts'),
      path.join(directory, '202610010022_studio_roles.ts'),
    );
    await test.seed([{ directory, packageName: 'studio' }]);
    await runUpgrade(false);
    const after = decode(
      (await roles()).find((role) => role.key === 'admin')!.grants,
    ) as { resource: { type: string }; actions: { action: string }[] }[];
    const actions = after
      .filter((grant) => grant.resource.type === 'user')
      .flatMap((grant) => grant.actions.map((action) => action.action));
    expect(actions).not.toContain('update');
    expect(actions).toEqual(
      expect.arrayContaining(['disable', 'enable', 'reset-password']),
    );
  });
});
