import { createTestDatabase } from '@nocobase/app-testing/server';
import type { AccessConstraint } from '@nocobase/authorization/core';
import { describe, expect, it } from 'vitest';

import { createAppAuthorization } from '../../../server/index.js';
import { migratePlugins } from '../../helpers/database-fixture.js';
import { json, mountedRouter } from '../../helpers/mounted-router.js';

describe('the records a subject reaches, for the permission inspector', () => {
  it('answers which of the given records a composite action reaches, data rules included', async () => {
    const testDatabase = await createTestDatabase();
    try {
      const { database } = testDatabase;
      await migratePlugins(database, 'app-plugin-authorization');
      await database
        .connection()
        .builder.createCollection('quotes', (collection) => {
          collection.string('id', { length: 64 }).notNull();
          collection.string('title', { length: 120 }).nullable();
          collection.primary('id', { name: 'pk_quotes' });
        });
      await database
        .connection()
        .query.insertInto('quotes')
        .values([
          { id: 'q1', title: 'One' },
          { id: 'q2', title: 'Two' },
          { id: 'q3', title: 'Three' },
        ])
        .execute();
      const restriction: AccessConstraint = {
        source: { plugin: 'restriction-rules', id: 'some' },
        effect: 'restrict',
        selection: { type: 'records', ids: ['q1', 'q3'] },
      };
      const authz = createAppAuthorization({
        connection: database.connection(),
        database,
        config: {
          plugins: [
            {
              id: 'rules',
              setup(setup) {
                setup.constraints.add({
                  id: 'rules',
                  resolve: (input) =>
                    Promise.resolve(
                      input.resource.id === 'quotes' ? [restriction] : [],
                    ),
                });
              },
            },
          ],
        },
      });
      authz.database.collections.add({ name: 'quotes', title: 'Quotes' });
      authz.compositeResources.define({
        name: 'shop.quotes',
        title: 'Quotes',
        actions: [
          {
            name: 'view',
            title: 'View',
            dataScopes: [{ key: 'quote', title: 'Quotes' }],
            grants: [
              {
                resource: { type: 'database.collection', id: 'quotes' },
                actions: [
                  {
                    action: 'read',
                    scopeKey: 'quote',
                    policy: { type: 'database', fields: ['id', 'title'] },
                  },
                ],
              },
            ],
          },
        ],
      });
      await authz.permissionSets.create({ key: 'root', grants: [] });
      await authz.permissionSets.assign({
        subject: { type: 'user', id: 'admin' },
        permissionSet: 'root',
      });
      await authz.permissionSets.create({
        key: 'reader',
        grants: [
          {
            resource: { type: 'composite', id: 'shop.quotes' },
            actions: [
              {
                action: 'view',
                policy: {
                  type: 'composite',
                  scopes: { quote: { type: 'records', ids: ['q1', 'q2'] } },
                },
              },
            ],
          },
        ],
      });
      await authz.permissionSets.assign({
        subject: { type: 'user', id: 'robot' },
        permissionSet: 'reader',
      });
      const router = await mountedRouter(authz);
      const reached = async (ids: string[]) =>
        (
          (await (
            await router.request(
              '/api/authorization/inspector/records',
              json('POST', {
                subject: { type: 'user', id: 'robot' },
                resource: { type: 'composite', id: 'shop.quotes' },
                action: 'view',
                scope: 'quote',
                ids,
              }),
            )
          ).json()) as { data: { reached: string[] } }
        ).data.reached.sort();
      // Chosen q1 and q2; the restriction rule keeps q1 and q3: q1 is what it reaches.
      expect(await reached(['q1', 'q2'])).toEqual(['q1']);
      expect(await reached(['q3'])).toEqual([]);
    } finally {
      await testDatabase.destroy();
    }
  });
});
