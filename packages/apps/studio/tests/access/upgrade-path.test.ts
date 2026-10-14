// @vitest-environment node
import { copyFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createSeeder } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ hookTimeout: 120_000, testTimeout: 120_000 });

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
    directory: path.join(ROOT, 'database/main/migrations'),
    packageName: 'studio',
  },
];
const sources = [
  { directory: path.join(ROOT, 'database/main/seeds'), packageName: 'studio' },
];
async function runUpgrade(maintenance = true) {
  return createSeeder({
    database: test.database,
    connection: 'main',
    sources,
    config: {
      get<T>(key: string): T | undefined {
        return (
          key === 'studio.accessUpgrade.maintenance' ? maintenance : undefined
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
          directory: path.join(ROOT, 'database/main/migrations'),
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
});
afterEach(async () => {
  await test.destroy();
  rmSync(directory, { recursive: true, force: true });
});

describe('upgrading an existing Studio without new account grants', () => {
  it('maps actual narrowed grants and retains identities, invitations, advanced payloads and null defaults', async () => {
    const connection = test.database.connection();
    const before = await roles();
    const admin = before.find((role) => role.key === 'admin')!;
    const advanced = {
      resource: { type: 'pm', id: 'pm.issues' },
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
