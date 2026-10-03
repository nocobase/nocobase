import { afterEach, expect, it } from 'vitest';
import { defineRepositoryEventMeta } from '../../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../../helpers.js';
import { collectEvents, createEventsFixture, rowsOf } from './fixture.js';

describeIntegrationDatabases(
  'Repository mutation events: options',
  (context) => {
    const subscriptions: Array<() => void> = [];
    const subscribe: typeof context.connection.onRepositoryMutation = (
      options,
      listeners,
    ) => {
      const off = context.connection.onRepositoryMutation(options, listeners);
      subscriptions.push(off);
      return off;
    };

    afterEach(() => {
      for (const off of subscriptions.splice(0)) off();
    });

    it('reports every selected row of a keyed deleteMany when a cascade removed some of them', async () => {
      // SQL Server refuses a self-referencing ON DELETE CASCADE.
      if (context.spec.dialect === 'mssql') return;
      await context.builder.createCollection('cascadeNodes', (collection) => {
        collection.string('id').primary().notNull();
        collection.string('parentId').nullable();
        collection.foreignKey('parentId', {
          references: { collection: 'cascadeNodes', fields: ['id'] },
          onDelete: 'cascade',
        });
      });
      const repository = context.connection.repository('cascadeNodes');
      const id = (index: number): string =>
        `n${String(index).padStart(3, '0')}`;
      // Rows 201-250 are children of rows 1-50: their parents fall in the
      // first key batch and the children in the second.
      for (let start = 1; start <= 250; start += 50) {
        await repository.createMany({
          values: [
            ...Array.from({ length: 50 }, (_, offset) => {
              const index = start + offset;
              return index > 200
                ? { id: id(index), parentId: id(index - 200) }
                : { id: id(index) };
            }),
          ] as [{ id: string }, ...{ id: string }[]],
        });
      }
      const nodes = collectEvents();
      subscribe({ collections: ['cascadeNodes'] }, nodes.listeners);

      await expect(repository.deleteMany({ all: true })).resolves.toEqual({
        deletedCount: 250,
      });

      expect(nodes.batches).toHaveLength(1);
      const deleted = rowsOf(nodes.batches[0]!);
      expect(deleted).toHaveLength(250);
      expect(deleted.every((change) => change.kind === 'deleted')).toBe(true);
    });

    it('rejects a subscription without Collections or listeners', () => {
      expect(() =>
        context.connection.onRepositoryMutation(
          { collections: [] },
          { afterCommit: () => undefined },
        ),
      ).toThrow(TypeError);
      expect(() =>
        context.connection.onRepositoryMutation({ collections: ['tasks'] }, {}),
      ).toThrow(TypeError);
    });

    it('carries meta to every change of the call but not to writes a listener makes', async () => {
      await createEventsFixture(context);
      const audit = defineRepositoryEventMeta<{ actorId: string }>('audit');
      const tasks = collectEvents();
      const notes = collectEvents();
      subscribe({ collections: ['tasks'] }, tasks.listeners);
      subscribe(
        { collections: ['tasks'] },
        {
          inTransaction: async (_event, connection) => {
            await connection
              .repository('notes')
              .createOne({ values: { body: 'audit' } });
          },
        },
      );
      subscribe({ collections: ['notes'] }, notes.listeners);

      await context.connection.repository('projects').updateOne({
        filter: { id: 'project-1' },
        values: { tasks: { create: { id: 'task-m', title: 'M' } } },
        meta: [audit({ actorId: 'user-1' })],
      });

      expect(tasks.batches).toHaveLength(1);
      expect(audit.read(tasks.batches[0]![0]!)).toEqual({ actorId: 'user-1' });
      expect(audit.read(notes.batches[0]![0]!)).toBeUndefined();
      expect(notes.batches[0]![0]!.meta).toEqual({});
    });

    it('rejects meta that names a namespace twice or was not built by a handle', async () => {
      await createEventsFixture(context);
      const audit = defineRepositoryEventMeta<string>('audit');
      const tasks = context.connection.repository('tasks');

      await expect(
        tasks.updateMany({
          filter: { projectId: 'project-1' },
          values: { status: 'done' },
          meta: [audit('a'), audit('b')],
        }),
      ).rejects.toMatchObject({ code: 'INVALID_MUTATION', path: ['meta', 1] });
      await expect(
        tasks.deleteMany({
          filter: { projectId: 'project-1' },
          meta: [{ namespace: 'audit', value: 'a' }] as never,
        }),
      ).rejects.toMatchObject({ code: 'INVALID_MUTATION', path: ['meta', 0] });
      expect(await tasks.count({ filter: { status: 'done' } })).toBe(0);
    });

    it('adds written values only for subscriptions that ask for them', async () => {
      await createEventsFixture(context);
      const plain = collectEvents();
      const valued = collectEvents();
      subscribe({ collections: ['tasks'] }, plain.listeners);
      subscribe({ collections: ['tasks'], values: true }, valued.listeners);

      await context.connection.repository('projects').updateOne({
        filter: { id: 'project-1' },
        values: {
          tasks: {
            create: { id: 'task-v', title: 'Valued' },
            update: {
              filter: { id: 'task-edit' },
              values: { points: { increment: 2 } },
            },
          },
        },
      });
      await context.connection.repository('tasks').updateMany({
        filter: { id: 'task-v' },
        values: { status: 'done', points: { increment: 1 } },
      });

      expect(rowsOf(plain.inTransaction).some((change) => change.values)).toBe(
        false,
      );
      const [nested, bulk] = valued.inTransaction;
      expect(rowsOf([nested!])).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collection: 'tasks',
            kind: 'created',
            key: { id: 'task-v' },
            values: { id: 'task-v', title: 'Valued', projectId: 'project-1' },
          }),
          expect.objectContaining({
            collection: 'tasks',
            kind: 'updated',
            key: { id: 'task-edit' },
            fields: ['points'],
            values: { points: 2 },
          }),
          // The incremented version is written by the database.
          expect.objectContaining({
            collection: 'projects',
            fields: ['version'],
          }),
        ]),
      );
      expect(
        rowsOf([nested!]).find((change) => change.collection === 'projects'),
      ).not.toHaveProperty('values');
      // A bulk atomic update's per-row result is never read back.
      expect(rowsOf([bulk!])).toEqual([
        {
          collection: 'tasks',
          kind: 'updated',
          key: { id: 'task-v' },
          fields: ['status', 'points'],
          values: { status: 'done' },
        },
      ]);
    });

    it('keeps bulk writes counted when every matching subscription accepts counts', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe(
        { collections: ['tasks', 'notes'], keys: false },
        seen.listeners,
      );

      await context.connection.repository('tasks').updateMany({
        filter: { projectId: 'project-1' },
        values: { status: 'done' },
      });
      await context.connection
        .repository('tasks')
        .deleteMany({ filter: { status: 'done' } });
      await context.connection
        .repository('notes')
        .createMany({ values: [{ body: 'a' }, { body: 'b' }] });
      await context.connection
        .repository('tasks')
        .updateOne({ filter: { id: 'task-loose' }, values: { title: 'One' } });

      expect(
        seen.batches.flat().map((event) => ({
          operation: event.operation,
          granularity: event.granularity,
          count: event.granularity === 'count' ? event.count : undefined,
        })),
      ).toEqual([
        { operation: 'updateMany', granularity: 'count', count: 3 },
        { operation: 'deleteMany', granularity: 'count', count: 3 },
        { operation: 'createMany', granularity: 'count', count: 2 },
        // A single-row write knows its key anyway.
        { operation: 'updateOne', granularity: 'rows', count: undefined },
      ]);
    });

    it('reports rows to counting subscriptions when the call knows its keys anyway', async () => {
      await createEventsFixture(context);
      const counted = collectEvents();
      subscribe({ collections: ['tasks'], keys: false }, counted.listeners);

      await context.connection.repository('tasks').deleteMany({
        filter: { projectId: 'project-1' },
        select: (s) => s.fields('id'),
      });

      expect(counted.batches.flat()).toMatchObject([
        { operation: 'deleteMany', granularity: 'rows' },
      ]);
      expect(rowsOf(counted.batches.flat())).toHaveLength(3);
    });

    it('switches to keyed execution when any matching subscription asks for keys', async () => {
      await createEventsFixture(context);
      const counted = collectEvents();
      const keyed = collectEvents();
      subscribe({ collections: ['tasks'], keys: false }, counted.listeners);
      subscribe({ collections: ['tasks'] }, keyed.listeners);

      await context.connection
        .repository('tasks')
        .deleteMany({ filter: { projectId: 'project-1' } });

      expect(counted.batches.flat()).toMatchObject([{ granularity: 'rows' }]);
      expect(keyed.batches).toEqual(counted.batches);
      expect(
        rowsOf(keyed.batches.flat())
          .map((change) => change.key.id)
          .sort(),
      ).toEqual(['task-detach', 'task-edit', 'task-obsolete']);
    });

    it('reports counts for bulk writes on Collections whose rows have no identity', async () => {
      await context.builder.createCollections([
        {
          name: 'eventLog',
          definition: (c) => {
            c.string('code');
            c.string('message');
          },
        },
        {
          name: 'nullableKeys',
          definition: (c) => {
            c.string('email').nullable().unique();
            c.string('label').notNull();
          },
        },
      ]);
      const seen = collectEvents();
      subscribe({ collections: ['eventLog', 'nullableKeys'] }, seen.listeners);

      await context.connection.repository('eventLog').createMany({
        values: [
          { code: 'a', message: 'one' },
          { code: 'a', message: 'two' },
        ],
      });
      await context.connection.repository('eventLog').updateMany({
        filter: { code: 'a' },
        values: { message: 'same' },
      });
      await context.connection.repository('nullableKeys').createMany({
        values: [
          { email: null, label: 'A' },
          { email: null, label: 'B' },
          { email: 'c@example.com', label: 'C' },
        ],
      });
      await context.connection
        .repository('nullableKeys')
        .deleteMany({ filter: { label: 'A' } });
      // A Policy scope check makes the call learn its rows by the nullable
      // unique key, which is still no identity the event can report.
      const scoped = context.connection.withPolicies(
        {
          nullableKeys: {
            read: { scope: true },
            create: { scope: true, fields: ['email', 'label'] },
            delete: { scope: true },
            update: {
              scope: (filter) => filter.string('label').startsWith('C'),
              fields: ['label'],
            },
          },
        },
        undefined,
      );
      await scoped.repository('nullableKeys').updateMany({
        filter: { label: 'C' },
        values: { label: 'C2' },
      });

      expect(
        seen.batches
          .flat()
          .map((event) => [
            event.collection,
            event.operation,
            event.granularity,
            event.granularity === 'count' ? event.count : undefined,
          ]),
      ).toEqual([
        ['eventLog', 'createMany', 'count', 2],
        ['eventLog', 'updateMany', 'count', 2],
        ['nullableKeys', 'createMany', 'count', 3],
        ['nullableKeys', 'deleteMany', 'count', 1],
        ['nullableKeys', 'updateMany', 'count', 1],
      ]);
      expect(await context.connection.repository('nullableKeys').count()).toBe(
        2,
      );
    });

    it('still detaches relation targets without a row identity, leaving them unreported', async () => {
      await context.builder.createCollections([
        {
          name: 'logLines',
          definition: (c) => {
            c.string('ownerId').nullable();
            c.string('message').notNull();
          },
        },
        {
          name: 'logOwners',
          definition: (c) => {
            c.string('id').primary().notNull();
            c.hasMany('lines', 'logLines')
              .sourceKey('id')
              .foreignKey('ownerId');
          },
        },
      ]);
      await context.connection
        .repository('logOwners')
        .createOne({ values: { id: 'owner-1' } });
      await context.connection.repository('logLines').createMany({
        values: [
          { ownerId: 'owner-1', message: 'a' },
          { ownerId: 'owner-1', message: 'b' },
        ],
      });
      const seen = collectEvents();
      subscribe({ collections: ['logLines'] }, seen.listeners);

      await context.connection.repository('logOwners').updateOne({
        filter: { id: 'owner-1' },
        values: { lines: { set: [] } },
      });

      expect(
        await context.connection
          .repository('logLines')
          .count({ filter: { ownerId: 'owner-1' } }),
      ).toBe(0);
      expect(seen.inTransaction).toEqual([]);
    });

    it('explains how calls run for the subscriptions matching a Collection', async () => {
      await createEventsFixture(context);
      const explain = (
        collection: string,
        operation: Parameters<
          typeof context.connection.explainRepositoryEvents
        >[0]['operation'],
      ) =>
        context.connection.explainRepositoryEvents({ collection, operation });

      await expect(explain('tasks', 'updateMany')).resolves.toEqual({
        subscriptions: [],
        strategy: 'unchanged',
        granularity: 'none',
        implicitTransaction: false,
      });

      subscribe(
        { id: 'task-cache', collections: ['tasks'], keys: false },
        { afterCommit: () => undefined },
      );
      await expect(explain('tasks', 'updateMany')).resolves.toEqual({
        subscriptions: [
          {
            id: 'task-cache',
            keys: false,
            values: false,
            phases: ['afterCommit'],
          },
        ],
        strategy: 'single-statement',
        granularity: 'count',
        implicitTransaction: false,
      });

      subscribe(
        { id: 'audit', collections: ['tasks'], values: true },
        { inTransaction: () => undefined, afterCommit: () => undefined },
      );
      await expect(explain('tasks', 'deleteMany')).resolves.toMatchObject({
        subscriptions: [
          { id: 'task-cache' },
          {
            id: 'audit',
            keys: true,
            values: true,
            phases: ['inTransaction', 'afterCommit'],
          },
        ],
        strategy: 'lock-then-write-by-key',
        granularity: 'rows',
        implicitTransaction: true,
      });
      await expect(explain('tasks', 'updateOne')).resolves.toMatchObject({
        strategy: 'unchanged',
        granularity: 'rows',
        implicitTransaction: true,
      });
      const createMany = await explain('notes', 'createMany');
      expect(createMany.granularity).toBe('none');
      subscribe({ collections: ['notes'] }, { afterCommit: () => undefined });
      expect((await explain('notes', 'createMany')).strategy).toMatch(
        /^insert-(returning|per-row)$/u,
      );
    });
  },
);
