// An authorization resource id carries the connection: these tools address a collection as
// `{ dataSource, collection }`, and a flat catalog of bare names cannot say which connection `orders` lives on. So a
// resource must be registered as `<connection>.<collection>`, and a bare name is skipped rather than assumed to mean
// the default connection.
//
// The authorization plugin accepts either form and its own Skill's examples use the bare one, so this is the seam
// where the two disagree. It is pinned here because the failure is quiet: discovery returns nothing at all — not even
// the connection — and only a direct query says why.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import { afterEach, describe, expect, it } from 'vitest';
import { createDataServices } from '../server/service/data-services.js';

const testDatabases: TestDatabase[] = [];
afterEach(async () => {
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
});

/** Who the read grant is assigned to: the user directly, or a team the user belongs to. */
type Grantee = 'user' | 'team';

async function build(resourceName: string, grantee: Grantee = 'user') {
  const testDatabase = await createTestDatabase();
  testDatabases.push(testDatabase);
  const { database } = testDatabase;
  const authorizationPath = dirname(
    createRequire(import.meta.url).resolve(
      '@nocobase/app-plugin-authorization/package.json',
    ),
  );
  await database
    .createMigrator({
      directory: join(authorizationPath, 'database/migrations'),
      packageName: '@nocobase/app-plugin-authorization',
    })
    .latest();
  const authorization = createAppAuthorization({
    connection: database.connection(),
    database,
    config: {},
  });
  await database.builder().createCollection('orders', (collection) => {
    collection.title('Orders');
    collection.string('id').primary();
    collection.string('ownerId');
  });
  await database
    .repository('orders')
    .createOne({ values: { id: 'a1', ownerId: 'alice' } });

  // The one variable: what name the resource is registered and granted under.
  authorization.database.collections.add({
    name: resourceName,
    title: 'Orders',
    actions: ['read'],
  });
  const permission = await authorization.permissionSets.create({
    key: 'orders-read',
    grants: [
      {
        resource: { type: 'database.collection', id: resourceName },
        actions: [
          {
            action: 'read',
            policy: {
              type: 'database',
              fields: ['id', 'ownerId'],
              recordAccess: ['allRecords'],
            },
          },
        ],
      },
    ],
  });
  if (grantee === 'team') {
    // A membership the authorization middleware would resolve for an HTTP request.
    authorization.subjects.add('team', {
      resolveFor: async (principal) =>
        principal.type === 'user' && principal.id === 'alice' ? ['sales'] : [],
      filterActive: async (ids) => ids,
    });
  }
  await authorization.permissionSets.assign({
    permissionSet: permission.key,
    subject:
      grantee === 'team'
        ? { type: 'team', id: 'sales' }
        : { type: 'user', id: 'alice' },
  });

  return createDataServices({
    database,
    authorization,
    actor: { id: 'alice', roles: [], isRoot: false },
  });
}

describe('authorization resource names carry the connection', () => {
  it('reaches a collection registered as <connection>.<collection>', async () => {
    const service = await build('main.orders');

    expect(await service.getDataSources({})).toMatchObject({
      items: [{ name: 'main' }],
    });
    expect(await service.getCollectionNames({})).toMatchObject({
      items: [{ name: 'orders', title: 'Orders' }],
    });
    expect(
      await service.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
    ).toMatchObject({ items: [{ id: 'a1' }] });
  });

  it('skips a bare name, leaving discovery empty and only a direct query explaining', async () => {
    // Registering and granting both succeed here — the authorization plugin takes either form. The disagreement is
    // entirely on this side.
    const service = await build('orders');

    // Not "the table is missing": the connection is missing too, which sends a reader looking in the wrong place.
    expect(await service.getDataSources({})).toMatchObject({ items: [] });
    expect(await service.getCollectionNames({})).toMatchObject({ items: [] });
    await expect(
      service.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
    ).rejects.toThrow('Data access denied or resource unavailable');
  });
});

describe('inherited subjects', () => {
  it('sees a collection granted to a team the user belongs to, as a request would', async () => {
    const service = await build('main.orders', 'team');

    expect(await service.getDataSources({})).toMatchObject({
      items: [{ name: 'main' }],
    });
    expect(await service.getCollectionNames({})).toMatchObject({
      items: [{ name: 'orders', title: 'Orders' }],
    });
    expect(
      await service.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
    ).toMatchObject({ items: [{ id: 'a1' }] });
  });
});
