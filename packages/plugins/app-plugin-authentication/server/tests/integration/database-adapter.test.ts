// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';
import { databaseAdapter } from '../../better-auth/database-adapter.js';
import {
  createAuthTestDatabase,
  testSecret,
  type AuthTestDatabase,
} from './support.js';

describe('Better Auth database adapter', () => {
  const databases: AuthTestDatabase[] = [];
  const setup = async (underscored = true) => {
    const testDatabase = await createAuthTestDatabase({ underscored });
    databases.push(testDatabase);
    const connection = testDatabase.database.connection();
    const factory = databaseAdapter(connection);
    const adapter = factory({ database: factory, secret: testSecret });
    const insertUser = async (id: string, email: string) => {
      await connection.query
        .insertInto('user')
        .values({
          id,
          name: id,
          username: id,
          email,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    };
    return { connection, adapter, insertUser };
  };
  afterEach(async () => {
    await Promise.all(
      databases.splice(0).map((testDatabase) => testDatabase.destroy()),
    );
  });

  it('creates, finds, updates and deletes records through the adapter', async () => {
    const { adapter } = await setup();
    const now = new Date();
    const created = await adapter.create({
      model: 'user',
      data: {
        name: 'Alice',
        username: 'alice',
        email: 'alice@example.com',
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    });
    expect(created).toMatchObject({
      id: expect.any(String),
      email: 'alice@example.com',
    });
    const where = [{ field: 'id', value: created.id }];
    expect(await adapter.findOne({ model: 'user', where })).toMatchObject({
      name: 'Alice',
    });
    expect(
      await adapter.update({
        model: 'user',
        where,
        update: { name: 'Alicia' },
      }),
    ).toMatchObject({ name: 'Alicia' });
    await adapter.delete({ model: 'user', where });
    expect(await adapter.findOne({ model: 'user', where })).toBeNull();
  });

  it.each([true, false])(
    'resolves case-insensitive conditions with underscored=%s',
    async (underscored) => {
      const { adapter, insertUser } = await setup(underscored);
      await insertUser('user-one', 'alice@example.com');
      expect(
        await adapter.findOne({
          model: 'user',
          where: [
            { field: 'email', value: 'ALICE@EXAMPLE.COM', mode: 'insensitive' },
          ],
        }),
      ).toMatchObject({ id: 'user-one' });
    },
  );

  it('sorts and pages filtered records and reports their count', async () => {
    const { adapter, insertUser } = await setup();
    for (const [id, email] of [
      ['one', 'one@example.com'],
      ['two', 'two@example.com'],
      ['three', 'three@other.com'],
    ]) {
      await insertUser(id, email);
    }
    const where = [
      { field: 'email', value: 'example.com', operator: 'contains' as const },
    ];
    expect(await adapter.count({ model: 'user', where })).toBe(2);
    const page = await adapter.findMany({
      model: 'user',
      where,
      sortBy: { field: 'id', direction: 'desc' },
      limit: 1,
      offset: 1,
    });
    expect(page.map((row) => row.id)).toEqual(['one']);
  });

  it('rolls back writes when an adapter transaction fails', async () => {
    const { adapter } = await setup();
    await expect(
      adapter.transaction(async (transaction) => {
        await transaction.create({
          model: 'user',
          data: {
            name: 'Rollback',
            username: 'rollback',
            email: 'rollback@example.com',
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        throw new Error('abort');
      }),
    ).rejects.toThrow('abort');
    expect(
      await adapter.findOne({
        model: 'user',
        where: [{ field: 'email', value: 'rollback@example.com' }],
      }),
    ).toBeNull();
  });

  it('consumes a one-time verification record only once', async () => {
    const { adapter } = await setup();
    await adapter.create({
      model: 'verification',
      data: {
        identifier: 'reset-token',
        value: 'secret',
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const where = [{ field: 'identifier', value: 'reset-token' }];
    const consumed = await Promise.all([
      adapter.consumeOne({ model: 'verification', where }),
      adapter.consumeOne({ model: 'verification', where }),
    ]);
    expect(consumed.filter(Boolean)).toHaveLength(1);
    expect(consumed.find(Boolean)).toMatchObject({ value: 'secret' });
  });

  it('increments a counter without losing concurrent updates', async () => {
    const { connection, insertUser } = await setup();
    await connection.builder.alterCollection('user', (collection) => {
      collection.integer('loginCount').notNull().defaultTo(0);
    });
    await insertUser('counter-user', 'counter@example.com');
    const factory = databaseAdapter(connection);
    const adapter = factory({
      database: factory,
      secret: testSecret,
      user: {
        additionalFields: {
          loginCount: { type: 'number', required: false },
        },
      },
    });
    const input = {
      model: 'user',
      where: [{ field: 'id', value: 'counter-user' }],
      increment: { loginCount: 1 },
    };
    const updated = await Promise.all([
      adapter.incrementOne(input),
      adapter.incrementOne(input),
    ]);
    expect(updated.every(Boolean)).toBe(true);
    expect(
      await connection.query
        .selectFrom('user')
        .select('loginCount')
        .where('id', '=', 'counter-user')
        .executeTakeFirst(),
    ).toEqual({ loginCount: 2 });
  });
});
