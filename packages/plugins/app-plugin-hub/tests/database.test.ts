import operatorKeysMigration from '../database/migrations/202609170001_operator_manage_own_api_keys.js';
import operatorRemovalMigration from '../database/migrations/202609160008_operator_remove_own_apps.js';
import removeDeploymentMode from '../database/migrations/202609160006_remove_deployment_mode.js';
import configFingerprintMigration from '../database/migrations/202609160007_release_config_fingerprint.js';
import publishingMigration from '../database/migrations/202609160005_release_publishing.js';

import logAccessMigration from '../database/migrations/202609170001_grant_hub_log_access.js';
import type { DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
  expectCollection,
} from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import ownershipMigration from '../database/migrations/202609160004_hub_app_ownership.js';
import appTablesMigration from '../database/migrations/202609010001_create_hub_app_tables.js';
import permissionSetsMigration from '../database/migrations/202609080001_create_hub_permission_sets.js';
import removeViewerMigration from '../database/migrations/202609230001_remove_hub_viewer_permission_set.js';
import administratorSeed from '../database/seeds/202609080002_assign_hub_administrator.js';

const COLLECTIONS = ['hubApps', 'hubAppReleases', 'hubAppDeployments'] as const;

describe('@nocobase/app-plugin-hub database migration', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  const collection = (name: string) =>
    expectCollection(database.connection(), name);
  const metadata = (name: string) =>
    database.connection().collectionMetadata.get(name);

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('adds and reverses the publishing configuration fingerprint while preserving existing rows', async () => {
    await migrate(appTablesMigration, 'up', database);
    await migrate(publishingMigration, 'up', database);
    await database
      .query()
      .insertInto('hubReleaseChecksums')
      .values({ appId: 'crm', checksum: 'a'.repeat(64), releaseId: 'old' })
      .execute();
    await migrate(configFingerprintMigration, 'up', database);
    await collection('hubReleaseChecksums').toHaveField('configFingerprint');
    expect(
      await database
        .query()
        .selectFrom('hubReleaseChecksums')
        .selectAll()
        .execute(),
    ).toMatchObject([{ releaseId: 'old', configFingerprint: null }]);
    await migrate(configFingerprintMigration, 'down', database);
    await collection('hubReleaseChecksums').not.toHaveField(
      'configFingerprint',
    );
    await migrate(configFingerprintMigration, 'up', database);
    expect(
      await database
        .query()
        .selectFrom('hubReleaseChecksums')
        .selectAll()
        .execute(),
    ).toHaveLength(1);
  });

  it('preserves duplicate release history while selecting a canonical checksum and reverses publishing tables', async () => {
    await migrate(appTablesMigration, 'up', database);
    for (const id of ['old', 'new'])
      await database
        .query()
        .insertInto('hubAppReleases')
        .values({
          id,
          appId: 'crm',
          version: '1.0.0',
          artifactKey: id,
          checksum: 'a'.repeat(64),
          size: 1,
          configTemplate: null,
          manifest: null,
          createdAt: new Date(id === 'old' ? '2026-01-01' : '2026-02-01'),
        })
        .execute();
    await migrate(publishingMigration, 'up', database);
    expect(
      await database.query().selectFrom('hubAppReleases').selectAll().execute(),
    ).toHaveLength(2);
    expect(
      await database
        .query()
        .selectFrom('hubReleaseChecksums')
        .selectAll()
        .execute(),
    ).toMatchObject([{ releaseId: 'old' }]);
    await expect(
      database
        .query()
        .insertInto('hubReleaseChecksums')
        .values({ appId: 'crm', checksum: 'a'.repeat(64), releaseId: 'new' })
        .execute(),
    ).rejects.toThrow();
    await migrate(removeDeploymentMode, 'up', database);
    await collection('hubApps').not.toHaveField('deploymentMode');
    await migrate(removeDeploymentMode, 'down', database);
    await migrate(publishingMigration, 'down', database);
    await collection('hubApps').not.toHaveField('deploymentMode');
    await collection('hubReleaseChecksums').not.toExist();
    await migrate(publishingMigration, 'up', database);
    expect(
      await database
        .query()
        .selectFrom('hubReleaseChecksums')
        .selectAll()
        .execute(),
    ).toHaveLength(1);
  });

  it('creates the App, Release, and Deployment schema', async () => {
    await migrate(appTablesMigration, 'up', database);

    for (const name of COLLECTIONS) await collection(name).toExist();
    await collection('hubApps').toHaveField('currentDeploymentId');
    await collection('hubApps').not.toHaveField('config');
    await collection('hubAppReleases').toHaveField('configTemplate');
    await collection('hubAppDeployments').toHaveField('releaseId');
    await collection('hubAppDeployments').toHaveField('config');
    await expect(
      metadata('hubAppReleases').then((stored) => stored?.document),
    ).resolves.toMatchObject({
      fields: { configTemplate: { type: 'text' } },
    });
    await expect(
      metadata('hubAppDeployments').then((stored) => stored?.document),
    ).resolves.toMatchObject({
      fields: { config: { type: 'json' } },
    });
    const appMetadata = await metadata('hubApps');
    expect(appMetadata?.document.fields).toBeDefined();
    expect(appMetadata?.document.fields).not.toHaveProperty('config');
  });

  it('adds nullable ownership without assigning legacy Apps and reverses schema and metadata', async () => {
    await migrate(appTablesMigration, 'up', database);
    const query = database.query();
    await query
      .insertInto('hubApps')
      .values({
        id: 'legacy',
        name: 'Legacy',
        enabled: false,
        basePath: '/legacy',
        backend: 'in-process',
        startupMode: 'lazy',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    await migrate(ownershipMigration, 'up', database);
    await collection('hubApps').toHaveField('createdBy');
    expect((await metadata('hubApps'))?.document.fields).toHaveProperty(
      'createdBy',
    );
    expect(
      await query.selectFrom('hubApps').select(['id', 'createdBy']).execute(),
    ).toEqual([{ id: 'legacy', createdBy: null }]);
    await migrate(ownershipMigration, 'down', database);
    await collection('hubApps').not.toHaveField('createdBy');
    expect((await metadata('hubApps'))?.document.fields).not.toHaveProperty(
      'createdBy',
    );
    await migrate(ownershipMigration, 'up', database);
    expect(await query.selectFrom('hubApps').select('id').execute()).toEqual([
      { id: 'legacy' },
    ]);
  });

  it('drops the schema and metadata', async () => {
    await migrate(appTablesMigration, 'up', database);
    await migrate(appTablesMigration, 'down', database);

    for (const name of COLLECTIONS) {
      await collection(name).not.toExist();
      await expect(metadata(name)).resolves.toBeUndefined();
    }
  });

  it.each([
    { action: 'remove', migration: operatorRemovalMigration },
    { action: 'manage-api-keys', migration: operatorKeysMigration },
  ])(
    'adds Operator $action once while preserving other grants, roles, and assignments',
    async ({ action, migration }) => {
      await createAuthorizationTables(database);
      await migrate(permissionSetsMigration, 'up', database);
      const query = database.connection().query;
      const customGrant = {
        resource: { type: 'custom.resource', id: 'mine' },
        actions: [{ action: 'read', policy: { type: 'custom-policy' } }],
      };
      const before = await query
        .selectFrom('authorizationPermissionSets')
        .selectAll()
        .orderBy('key')
        .execute();
      const operator = before.find((role) => role.key === 'hub-operator')!;
      const grants = (
        typeof operator.grants === 'string'
          ? JSON.parse(operator.grants)
          : operator.grants
      ) as unknown[];
      await query
        .updateTable('authorizationPermissionSets')
        .set({ grants: JSON.stringify([...grants, customGrant]) })
        .where('key', '=', 'hub-operator')
        .execute();
      const assignments = await query
        .selectFrom('authorizationPermissionSetAssignments')
        .selectAll()
        .execute();

      await migrate(migration, 'up', database);
      const after = await query
        .selectFrom('authorizationPermissionSets')
        .selectAll()
        .orderBy('key')
        .execute();
      const changed = after.find((role) => role.key === 'hub-operator')!;
      const updated = (
        typeof changed.grants === 'string'
          ? JSON.parse(changed.grants)
          : changed.grants
      ) as unknown[];
      expect(updated).toEqual([
        ...grants.map((grant) => {
          const value = grant as {
            resource: { type: string; id: string };
            actions: { action: string }[];
          };
          return value.resource.type === 'hub.app' && value.resource.id === '*'
            ? { ...value, actions: [...value.actions, { action }] }
            : value;
        }),
        customGrant,
      ]);
      expect(after.filter((role) => role.key !== 'hub-operator')).toEqual(
        before.filter((role) => role.key !== 'hub-operator'),
      );
      expect(
        await query
          .selectFrom('authorizationPermissionSetAssignments')
          .selectAll()
          .execute(),
      ).toEqual(assignments);
      await migrate(migration, 'up', database);
      expect(
        await query
          .selectFrom('authorizationPermissionSets')
          .selectAll()
          .orderBy('key')
          .execute(),
      ).toEqual(after);
    },
  );

  it('grants log access only to administrators and operators and reverses it', async () => {
    await createAuthorizationTables(database);
    await migrate(permissionSetsMigration, 'up', database);
    await migrate(logAccessMigration, 'up', database);
    await migrate(logAccessMigration, 'up', database);
    const rows = await database
      .connection()
      .query.selectFrom('authorizationPermissionSets')
      .select(['key', 'grants'])
      .orderBy('key', 'asc')
      .execute();
    expect(grantActions(rows[0]?.grants, 'hub.app')).toContain('read-log');
    expect(grantActions(rows[1]?.grants, 'hub.app')).toContain('read-log');
    expect(grantActions(rows[2]?.grants, 'hub.app')).not.toContain('read-log');
    await migrate(logAccessMigration, 'down', database);
    const row = await database
      .connection()
      .query.selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', 'hub-administrator')
      .executeTakeFirst();
    expect(grantActions(row?.grants, 'hub.app')).not.toContain('read-log');
  });

  it('creates fixed Hub roles and upgrades every system administrator', async () => {
    await createAuthorizationTables(database);
    const query = database.connection().query;
    const now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: 'system-administrator',
        key: 'system-administrator',
        title: 'System administrator',
        grants: JSON.stringify([]),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values([
        {
          id: 'user:admin-1:system-administrator',
          subjectType: 'user',
          subjectId: 'admin-1',
          permissionSetKey: 'system-administrator',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'user:admin-1:hub-viewer',
          subjectType: 'user',
          subjectId: 'admin-1',
          permissionSetKey: 'hub-viewer',
          createdAt: now,
          updatedAt: now,
        },
      ])
      .execute();

    await migrate(permissionSetsMigration, 'up', database);
    await migrate(permissionSetsMigration, 'up', database);

    const titles = await query
      .selectFrom('authorizationPermissionSets')
      .select(['key', 'title'])
      .where('key', 'in', ['hub-administrator', 'hub-operator', 'hub-viewer'])
      .orderBy('key', 'asc')
      .execute();
    expect(titles).toEqual([
      {
        key: 'hub-administrator',
        title: JSON.stringify({
          key: 'roles.names.hub-administrator',
          ns: '@nocobase/app-plugin-hub',
        }),
      },
      {
        key: 'hub-operator',
        title: JSON.stringify({
          key: 'roles.names.hub-operator',
          ns: '@nocobase/app-plugin-hub',
        }),
      },
      {
        key: 'hub-viewer',
        title: JSON.stringify({
          key: 'roles.names.hub-viewer',
          ns: '@nocobase/app-plugin-hub',
        }),
      },
    ]);

    const sets = await query
      .selectFrom('authorizationPermissionSets')
      .select(['key', 'grants'])
      .where('key', 'in', ['hub-administrator', 'hub-operator', 'hub-viewer'])
      .orderBy('key', 'asc')
      .execute();
    expect(sets.map(({ key }) => key)).toEqual([
      'hub-administrator',
      'hub-operator',
      'hub-viewer',
    ]);
    expect(grantActions(sets[0]?.grants, 'user')).toEqual([
      'read',
      'create',
      'update',
      'disable',
      'enable',
      'assign-role',
      'reset-password',
      'revoke-sessions',
    ]);
    expect(grantActions(sets[1]?.grants, 'hub.app')).not.toContain('remove');
    expect(grantActions(sets[2]?.grants, 'hub.app')).toEqual([
      'read',
      'read-release',
      'read-deployment',
    ]);
    await expect(
      query
        .selectFrom('authorizationPermissionSetAssignments')
        .select(['subjectId', 'permissionSetKey'])
        .where('permissionSetKey', 'in', [
          'hub-administrator',
          'hub-operator',
          'hub-viewer',
        ])
        .execute(),
    ).resolves.toEqual([
      { subjectId: 'admin-1', permissionSetKey: 'hub-administrator' },
    ]);

    await migrate(permissionSetsMigration, 'down', database);
    await expect(
      query
        .selectFrom('authorizationPermissionSets')
        .select('key')
        .where('key', 'in', ['hub-administrator', 'hub-operator', 'hub-viewer'])
        .execute(),
    ).resolves.toEqual([]);
  });

  it('removes the Viewer Permission Set with its assignments and restores the set on rollback', async () => {
    await createAuthorizationTables(database);
    const query = database.connection().query;
    await migrate(permissionSetsMigration, 'up', database);
    const now = new Date();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values([
        {
          id: 'user:viewer-1:hub-viewer',
          subjectType: 'user',
          subjectId: 'viewer-1',
          permissionSetKey: 'hub-viewer',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'user:operator-1:hub-operator',
          subjectType: 'user',
          subjectId: 'operator-1',
          permissionSetKey: 'hub-operator',
          createdAt: now,
          updatedAt: now,
        },
      ])
      .execute();

    await migrate(removeViewerMigration, 'up', database);
    await migrate(removeViewerMigration, 'up', database);

    const keys = async (): Promise<readonly string[]> =>
      (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('key')
          .orderBy('key', 'asc')
          .execute()
      ).map(({ key }) => String(key));
    expect(await keys()).toEqual(['hub-administrator', 'hub-operator']);
    expect(
      (
        await query
          .selectFrom('authorizationPermissionSetAssignments')
          .select('permissionSetKey')
          .execute()
      ).map(({ permissionSetKey }) => String(permissionSetKey)),
    ).toEqual(['hub-operator']);

    await migrate(removeViewerMigration, 'down', database);

    expect(await keys()).toEqual([
      'hub-administrator',
      'hub-operator',
      'hub-viewer',
    ]);
    const restored = await query
      .selectFrom('authorizationPermissionSets')
      .select(['title', 'grants'])
      .where('key', '=', 'hub-viewer')
      .executeTakeFirstOrThrow();
    expect(restored.title).toBe(
      JSON.stringify({
        key: 'roles.names.hub-viewer',
        ns: '@nocobase/app-plugin-hub',
      }),
    );
    expect(grantActions(restored.grants, 'hub.app')).toEqual([
      'read',
      'read-release',
      'read-deployment',
    ]);
    // The assignments it carried are gone for good; a rollback only restores the set.
    expect(
      await query
        .selectFrom('authorizationPermissionSetAssignments')
        .select('permissionSetKey')
        .where('permissionSetKey', '=', 'hub-viewer')
        .execute(),
    ).toEqual([]);
  });

  it('assigns the initial superuser after all seeds have run', async () => {
    await createAuthorizationTables(database);
    const query = database.connection().query;
    const now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values([
        {
          id: 'root',
          key: 'root',
          title: 'Root',
          grants: JSON.stringify([]),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'hub-administrator',
          key: 'hub-administrator',
          title: 'Hub administrator',
          grants: JSON.stringify([]),
          createdAt: now,
          updatedAt: now,
        },
      ])
      .execute();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values([
        {
          id: 'user:admin-1:root',
          subjectType: 'user',
          subjectId: 'admin-1',
          permissionSetKey: 'root',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'user:admin-1:hub-operator',
          subjectType: 'user',
          subjectId: 'admin-1',
          permissionSetKey: 'hub-operator',
          createdAt: now,
          updatedAt: now,
        },
      ])
      .execute();

    await administratorSeed.run({ query, connection: database.connection() });
    await administratorSeed.run({ query, connection: database.connection() });

    await expect(
      query
        .selectFrom('authorizationPermissionSetAssignments')
        .select(['subjectId', 'permissionSetKey'])
        .where('permissionSetKey', 'in', [
          'hub-administrator',
          'hub-operator',
          'hub-viewer',
        ])
        .execute(),
    ).resolves.toEqual([
      { subjectId: 'admin-1', permissionSetKey: 'hub-administrator' },
    ]);
  });
});

async function migrate(
  migration: typeof appTablesMigration,
  direction: 'up' | 'down',
  database: DatabaseManager,
): Promise<void> {
  const connection = database.connection();
  const context = {
    builder: connection.builder,
    query: connection.query,
    connection,
  };
  if (direction === 'up') await migration.up(context);
  else await migration.down?.(context);
}

async function createAuthorizationTables(database: DatabaseManager) {
  const builder = database.connection().builder;
  await builder.createCollection(
    'authorizationPermissionSets',
    (collection) => {
      collection.string('id').primary();
      collection.string('key').notNull().unique();
      collection.string('title').nullable();
      collection.json('grants').notNull();
      collection.datetime('createdAt').notNull();
      collection.datetime('updatedAt').notNull();
    },
  );
  await builder.createCollection(
    'authorizationPermissionSetAssignments',
    (collection) => {
      collection.string('id').primary();
      collection.string('subjectType').notNull();
      collection.string('subjectId').notNull();
      collection.string('permissionSetKey').notNull();
      collection.datetime('createdAt').notNull();
      collection.datetime('updatedAt').notNull();
      collection.unique(['subjectType', 'subjectId', 'permissionSetKey']);
    },
  );
}

function grantActions(value: unknown, resourceType: string): string[] {
  const grants = (typeof value === 'string' ? JSON.parse(value) : value) as {
    resource: { type: string };
    actions: { action: string }[];
  }[];
  return grants
    .filter(({ resource }) => resource.type === resourceType)
    .flatMap(({ actions }) => actions)
    .map(({ action }) => action);
}
