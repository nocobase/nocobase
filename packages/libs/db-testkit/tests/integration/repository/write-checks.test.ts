import { upsertPhysicalRow, type DatabaseWrite } from '@nocobase/db';
import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../helpers.js';
import { createEventsFixture } from './events/fixture.js';

describeIntegrationDatabases('Database write checks', (context) => {
  const collection = 'lateRecords';
  const denied = new Error('Database is read-only');
  const createRecords = async () =>
    context.builder.createCollection(collection, (c) => {
      c.string('id').primary().notNull();
      c.string('title').notNull();
    });
  const values = { id: 'initial', title: 'Initial' };
  const changed = { title: 'Changed' };

  it('checks future tables and previously obtained handles before scalar and bulk writes', async () => {
    const { connection } = context;
    const repository = connection.repository(collection);
    const pending = connection.query.insertInto(collection).values(values);
    const checked: DatabaseWrite[] = [];
    let blocked = false;
    const remove = connection.addWriteCheck((write) => {
      checked.push(write);
      if (blocked && write.table === context.table(collection)) throw denied;
    });

    await createRecords();
    pending.compile();
    expect(checked).toEqual([]);
    await pending.execute();
    expect(checked.splice(0)).toEqual([
      {
        connection: connection.name,
        table: context.table(collection),
        operation: 'insert',
        source: 'query',
      },
    ]);

    blocked = true;
    const other = { id: 'other', title: 'Other' };
    const filter = { id: values.id };
    const query = connection.query;
    const mutations = [
      ['repository', 'insert', () => repository.createOne({ values: other })],
      [
        'repository',
        'insert',
        () => repository.createMany({ values: [other] }),
      ],
      [
        'repository',
        'insert',
        () =>
          repository.upsertOne({
            filter: { id: other.id },
            create: other,
            update: changed,
          }),
      ],
      [
        'repository',
        'update',
        () => repository.upsertOne({ filter, create: values, update: changed }),
      ],
      [
        'repository',
        'update',
        () => repository.updateOne({ filter, values: changed }),
      ],
      [
        'repository',
        'update',
        () => repository.updateMany({ all: true, values: changed }),
      ],
      ['repository', 'delete', () => repository.deleteOne({ filter })],
      ['repository', 'delete', () => repository.deleteMany({ all: true })],
      [
        'query',
        'insert',
        () => query.insertInto(collection).values([other]).execute(),
      ],
      [
        'query',
        'update',
        () =>
          query
            .updateTable(`${collection} as r`)
            .set(changed)
            .where('r.id', '=', values.id)
            .execute(),
      ],
      [
        'query',
        'delete',
        () => query.deleteFrom(collection).allowAllRows().execute(),
      ],
    ] as const;
    for (const [source, operation, mutate] of mutations) {
      await expect(mutate()).rejects.toBe(denied);
      expect(checked.splice(0)).toEqual([
        {
          connection: connection.name,
          table: context.table(collection),
          ...(source === 'repository' ? { collection } : {}),
          source,
          operation,
        },
      ]);
    }
    expect(await repository.findMany()).toEqual([values]);
    expect(checked).toEqual([]);

    remove();
    await repository.deleteMany({ all: true });
    expect(await repository.count()).toBe(0);
    expect(checked).toEqual([]);
  });

  it('shares checks with existing transactions, savepoints and policy-bound and restricted handles', async () => {
    await createRecords();
    const { connection } = context;
    const repository = connection.repository(collection);
    const policy = {
      [collection]: {
        read: { scope: true },
        create: { scope: true },
        update: { scope: true, fields: ['title'] },
        delete: { scope: true },
      },
    } as const;
    const scoped = connection.withPolicies(policy, undefined);
    const restricted = connection.restrict(policy, undefined);
    const calls: string[] = [];

    let remove: (() => void) | undefined;
    await scoped.transaction(async (transaction) => {
      await transaction.query.insertInto(collection).values(values).execute();
      remove = transaction.addWriteCheck(async (write, writingConnection) => {
        calls.push(write.operation);
        expect(await writingConnection.repository(collection).count()).toBe(1);
      });
      await transaction.transaction(async (savepoint) => {
        await savepoint.query
          .updateTable(collection)
          .allowAllRows()
          .set(changed)
          .execute();
      });
      await transaction.repository(collection).updateOne({
        filter: { id: values.id },
        values: { title: 'Committed' },
      });
    });
    await repository.updateMany({ all: true, values: { title: 'Committed' } });
    remove?.();
    const block = scoped.addWriteCheck(() => {
      throw denied;
    });
    await expect(
      restricted.transaction((transaction) =>
        transaction.repository(collection).deleteMany({ all: true }),
      ),
    ).rejects.toBe(denied);
    await expect(
      repository.createMany({ values: [{ id: 'other', title: 'Other' }] }),
    ).rejects.toBe(denied);
    block();
    expect(calls).toEqual(['update', 'update', 'update']);
    expect(await repository.findMany()).toEqual([
      { ...values, title: 'Committed' },
    ]);
  });

  it('checks nested targets and through writes and rolls back an implicit Repository transaction', async () => {
    await createEventsFixture(context);
    const { connection } = context;
    const projects = connection.repository('projects');
    const filter = { id: 'project-1' };
    const before = await projects.findOne({ filter });
    const edges = connection.repository('projectTags');
    const initialEdges = await edges.count();
    let blocked = 'projectTags';
    const writes: DatabaseWrite[] = [];
    connection.addWriteCheck(async (write, writingConnection) => {
      writes.push(write);
      if (write.collection === blocked) {
        // The source update has executed in the same implicit transaction.
        expect(
          await writingConnection.repository('projects').findOne({ filter }),
        ).toMatchObject({ name: 'Pending' });
        throw denied;
      }
    });

    await expect(
      projects.updateOne({
        filter,
        values: { name: 'Pending', tags: { connect: { id: 'tag-db' } } },
      }),
    ).rejects.toBe(denied);
    expect(writes.splice(0)).toMatchObject([
      { collection: 'projects', operation: 'update' },
      {
        collection: 'projectTags',
        table: context.table('projectTags'),
        operation: 'insert',
      },
    ]);
    expect(await edges.count()).toBe(initialEdges);

    blocked = 'tasks';
    await expect(
      projects.updateOne({
        filter,
        values: {
          name: 'Pending',
          tasks: {
            update: {
              filter: { id: 'task-edit' },
              values: { title: 'Denied' },
            },
          },
        },
      }),
    ).rejects.toBe(denied);
    expect(writes.at(-1)).toMatchObject({
      collection: 'tasks',
      operation: 'update',
    });
    expect(await projects.findOne({ filter })).toEqual(before);
  });

  it('checks listener writes and rolls back the event transaction', async () => {
    await createRecords();
    const { connection } = context;
    await context.builder.createCollection('writeLog', (c) => {
      c.string('id').primary().notNull();
    });
    const checked: DatabaseWrite[] = [];
    connection.addWriteCheck((write) => {
      checked.push(write);
      if (write.table === context.table('writeLog')) throw denied;
    });
    connection.onRepositoryMutation(
      { collections: [collection] },
      {
        inTransaction: async (_, transaction) => {
          await transaction.query
            .insertInto('writeLog')
            .values({ id: 'log' })
            .execute();
        },
      },
    );

    await expect(
      connection.repository(collection).createOne({ values }),
    ).rejects.toBe(denied);
    expect(checked).toMatchObject([
      { collection, source: 'repository' },
      { table: context.table('writeLog'), source: 'query' },
    ]);
    expect(await connection.repository(collection).count()).toBe(0);
    expect(await connection.repository('writeLog').count()).toBe(0);
  });

  it('checks physical upserts and returns check errors without retrying', async () => {
    await createRecords();
    const { connection } = context;
    const options = {
      table: context.table(collection),
      key: { id: values.id },
      create: { title: values.title },
      update: changed,
    };
    const retryShapedError = Object.assign(new Error('Read-only'), {
      code: '40P01',
    });
    const seen: DatabaseWrite[] = [];
    const refuse = connection.addWriteCheck((write) => {
      seen.push(write);
      throw retryShapedError;
    });
    await expect(upsertPhysicalRow(connection, options)).rejects.toBe(
      retryShapedError,
    );
    expect(seen.splice(0)).toEqual([
      {
        connection: connection.name,
        table: options.table,
        source: 'query',
        operation: 'insert',
      },
    ]);
    expect(await connection.repository(collection).count()).toBe(0);
    refuse();
    await upsertPhysicalRow(connection, options);

    connection.addWriteCheck((write) => {
      seen.push(write);
      throw denied;
    });
    await expect(
      connection.transaction((transaction) =>
        upsertPhysicalRow(transaction, options),
      ),
    ).rejects.toBe(denied);
    expect(seen).toMatchObject([
      { table: options.table, source: 'query', operation: 'update' },
    ]);
    expect(await connection.repository(collection).findMany()).toEqual([
      values,
    ]);
  });
});
