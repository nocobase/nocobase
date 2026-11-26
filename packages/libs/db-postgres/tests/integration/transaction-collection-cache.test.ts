import { randomBytes } from 'node:crypto';
import type { Knex } from 'knex';
import { createDatabaseManager } from '@nocobase/db';
import { expect, it } from 'vitest';
import { describeCollectionCache } from '@nocobase/db-testkit';
import postgres from '../../src/index.js';
import { postgresTestConnection } from '../../src/testing.js';

async function fixture() {
  const options = postgresTestConnection(process.env);
  const schema = `collection_cache_${randomBytes(6).toString('hex')}`;
  const admin = createDatabaseManager({
    connections: { main: postgres(options) },
  });
  const client = await admin.connection().client<Knex>();
  await client.schema.createSchema(schema);
  const manager = (transactionCollectionCache: boolean = true) =>
    createDatabaseManager({
      connections: {
        main: postgres({ ...options, schema, transactionCollectionCache }),
      },
    });
  const first = manager();
  const second = manager();
  const uncached = manager(false);
  return {
    first,
    second,
    uncached,
    async cleanup() {
      try {
        await Promise.all([
          first.destroy(),
          second.destroy(),
          uncached.destroy(),
        ]);
        await client.schema.dropSchemaIfExists(schema, true);
      } finally {
        await admin.destroy();
      }
    },
  };
}

describeCollectionCache(fixture, 2);

it('probes the first member read after another connection commits DDL', async () => {
  const { first, second, cleanup } = await fixture();
  const reader = first.connection();
  const writer = second.connection();
  try {
    await writer.builder.createCollection('tasks', (table) =>
      table.increments('id'),
    );
    await writer.builder.createCollection('members', (table) =>
      table.increments('id'),
    );
    await reader.transaction(async (transaction) => {
      await transaction.collections.get('tasks');
      await transaction.collections.get('members');
    });
    await reader.transaction(async (transaction) => {
      expect(await transaction.repository('tasks').findMany()).toEqual([]);
      await writer.builder.addField('members', {
        name: 'added',
        type: 'string',
      });
      expect(
        (await transaction.collections.get('members'))?.fields?.map(
          (field) => field.name,
        ),
      ).toEqual(['id', 'added']);
    });
  } finally {
    await cleanup();
  }
});
