import { afterEach, expect, it, vi } from 'vitest';
import type { RepositoryMutationEvent } from '../../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../../helpers.js';
import { collectEvents, createEventsFixture, rowsOf } from './fixture.js';

describeIntegrationDatabases(
  'Repository mutation events: delivery',
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
      vi.restoreAllMocks();
    });

    function countRows(collection: string): Promise<number> {
      return context.connection.repository(collection).count();
    }

    it('delivers a call without a caller transaction once, after its implicit transaction commits', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      let statusWhenDelivered: unknown;
      subscribe(
        { collections: ['projects'] },
        {
          inTransaction: seen.listeners.inTransaction,
          afterCommit: async (events) => {
            seen.batches.push([...events]);
            statusWhenDelivered = (
              await context.connection
                .repository('projects')
                .findOne({ filter: { id: 'project-1' } })
            )?.status;
          },
        },
      );

      await context.connection.repository('projects').updateOne({
        filter: { id: 'project-1' },
        values: { status: 'published' },
      });

      expect(seen.batches).toHaveLength(1);
      expect(seen.batches[0]).toMatchObject([
        {
          collection: 'projects',
          operation: 'updateOne',
          scope: 'connection',
          meta: {},
          granularity: 'rows',
          changes: [
            {
              collection: 'projects',
              kind: 'updated',
              key: { id: 'project-1' },
              fields: ['status', 'version'],
            },
          ],
        },
      ]);
      expect(seen.batches[0]![0]!.operationId).toEqual(expect.any(String));
      expect(seen.batches[0]![0]).not.toHaveProperty('parentOperationId');
      expect(statusWhenDelivered).toBe('published');
    });

    it('batches every call of a caller transaction into one delivery after transaction() resolves', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe({ collections: ['projects'] }, seen.listeners);

      await context.database.transaction(async (connection) => {
        await connection.repository('projects').updateOne({
          filter: { id: 'project-1' },
          values: { status: 'a' },
        });
        await connection.repository('projects').updateOne({
          filter: { id: 'project-2' },
          values: { status: 'b' },
        });
        expect(seen.inTransaction).toHaveLength(2);
        expect(seen.batches).toHaveLength(0);
      }, context.spec.name);

      expect(seen.batches).toHaveLength(1);
      expect(
        seen.batches[0]!.map((event) => [event.scope, rowsOf([event])[0]!.key]),
      ).toEqual([
        ['transaction', { id: 'project-1' }],
        ['transaction', { id: 'project-2' }],
      ]);
    });

    it('drops the events of a caller transaction that rolls back', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe({ collections: ['projects'] }, seen.listeners);

      await expect(
        context.database.transaction(async (connection) => {
          await connection.repository('projects').updateOne({
            filter: { id: 'project-1' },
            values: { status: 'a' },
          });
          throw new Error('abort');
        }, context.spec.name),
      ).rejects.toThrow('abort');

      expect(seen.inTransaction).toHaveLength(1);
      expect(seen.batches).toEqual([]);
    });

    it('drops only the events of a savepoint that rolls back', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe({ collections: ['projects'] }, seen.listeners);

      await context.database.transaction(async (connection) => {
        await connection.repository('projects').updateOne({
          filter: { id: 'project-1' },
          values: { status: 'kept' },
        });
        await expect(
          connection.transaction(async (savepoint) => {
            await savepoint.repository('projects').updateOne({
              filter: { id: 'project-2' },
              values: { status: 'dropped' },
            });
            throw new Error('savepoint');
          }),
        ).rejects.toThrow('savepoint');
        await connection.transaction(async (savepoint) => {
          await savepoint.repository('projects').updateOne({
            filter: { id: 'project-other' },
            values: { status: 'released' },
          });
        });
      }, context.spec.name);

      expect(seen.batches).toHaveLength(1);
      expect(rowsOf(seen.batches[0]!).map((change) => change.key.id)).toEqual([
        'project-1',
        'project-other',
      ]);
    });

    it('fails the call with the listener error and rolls back its implicit transaction', async () => {
      await createEventsFixture(context);
      const failure = new Error('invariant violated');
      const later = vi.fn();
      const committed = vi.fn();
      subscribe(
        { collections: ['tasks'] },
        {
          inTransaction: () => {
            throw failure;
          },
          afterCommit: committed,
        },
      );
      subscribe({ collections: ['tasks'] }, { inTransaction: later });

      await expect(
        context.connection.repository('projects').updateOne({
          filter: { id: 'project-1' },
          values: { tasks: { create: { id: 'task-x', title: 'X' } } },
        }),
      ).rejects.toBe(failure);

      expect(later).not.toHaveBeenCalled();
      expect(committed).not.toHaveBeenCalled();
      expect(
        await context.connection
          .repository('tasks')
          .findOne({ filter: { id: 'task-x' } }),
      ).toBeUndefined();
    });

    it('withdraws the delivery of a call whose listener failed inside a caller transaction that still commits', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe({ collections: ['projects'] }, seen.listeners);
      subscribe(
        { collections: ['projects'] },
        {
          inTransaction: (event) => {
            if (rowsOf([event])[0]!.key.id === 'project-2') {
              throw new Error('refused');
            }
          },
        },
      );

      await context.database.transaction(async (connection) => {
        await connection.repository('projects').updateOne({
          filter: { id: 'project-1' },
          values: { status: 'a' },
        });
        await expect(
          connection.repository('projects').updateOne({
            filter: { id: 'project-2' },
            values: { status: 'b' },
          }),
        ).rejects.toThrow('refused');
      }, context.spec.name);

      expect(seen.batches).toHaveLength(1);
      expect(rowsOf(seen.batches[0]!).map((change) => change.key.id)).toEqual([
        'project-1',
      ]);
    });

    it('lets an inTransaction listener write in the same transaction, emitting an event with parentOperationId', async () => {
      await createEventsFixture(context);
      const notes = collectEvents();
      let parent: RepositoryMutationEvent | undefined;
      subscribe(
        { collections: ['tasks'] },
        {
          inTransaction: async (event, connection) => {
            parent = event;
            await connection
              .repository('notes')
              .createOne({ values: { body: `audit ${event.operation}` } });
          },
        },
      );
      subscribe({ collections: ['notes'] }, notes.listeners);

      await context.connection.repository('tasks').updateOne({
        filter: { id: 'task-edit' },
        values: { title: 'Audited' },
      });

      expect(notes.batches).toHaveLength(1);
      expect(notes.batches[0]).toMatchObject([
        {
          collection: 'notes',
          operation: 'createOne',
          scope: 'transaction',
          parentOperationId: parent!.operationId,
          meta: {},
        },
      ]);
      expect(await countRows('notes')).toBe(3);
    });

    it('rolls back everything when listener writes nest beyond the depth limit', async () => {
      await createEventsFixture(context);
      subscribe(
        { collections: ['notes'] },
        {
          inTransaction: async (_event, connection) => {
            await connection
              .repository('notes')
              .createOne({ values: { body: 'echo' } });
          },
        },
      );

      await expect(
        context.connection
          .repository('notes')
          .createOne({ values: { body: 'start' } }),
      ).rejects.toMatchObject({
        code: 'REPOSITORY_EVENT_RECURSION',
        details: { maxDepth: 8 },
      });
      expect(await countRows('notes')).toBe(2);
    });

    it('reports a failing afterCommit listener without failing the call or the other listeners', async () => {
      await createEventsFixture(context);
      const warnings = vi
        .spyOn(process, 'emitWarning')
        .mockImplementation(() => undefined);
      const later = vi.fn();
      subscribe(
        { id: 'broken', collections: ['projects'] },
        {
          afterCommit: () => {
            throw new Error('delivery failed');
          },
        },
      );
      subscribe({ collections: ['projects'] }, { afterCommit: later });

      await context.connection.repository('projects').updateOne({
        filter: { id: 'project-1' },
        values: { status: 'published' },
      });

      expect(later).toHaveBeenCalledOnce();
      expect(warnings).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'delivery failed',
          code: 'REPOSITORY_EVENT_LISTENER_FAILED',
          detail: expect.stringContaining('broken') as unknown,
          cause: expect.objectContaining({
            message: 'delivery failed',
          }) as unknown,
        }),
      );
    });

    it('lets an afterCommit listener write through the connection it receives, with the batch as parent', async () => {
      await createEventsFixture(context);
      const notes = collectEvents();
      let batch: readonly RepositoryMutationEvent[] = [];
      subscribe(
        { collections: ['tasks'] },
        {
          afterCommit: async (events, connection) => {
            batch = events;
            await connection
              .repository('notes')
              .createOne({ values: { body: 'after commit' } });
          },
        },
      );
      subscribe({ collections: ['notes'] }, notes.listeners);

      await context.connection.repository('tasks').updateOne({
        filter: { id: 'task-edit' },
        values: { title: 'Audited' },
      });

      expect(batch).toHaveLength(1);
      expect(notes.batches).toHaveLength(1);
      expect(notes.batches[0]).toMatchObject([
        {
          collection: 'notes',
          operation: 'createOne',
          scope: 'connection',
          parentOperationId: batch[0]!.operationId,
        },
      ]);
      expect(await countRows('notes')).toBe(3);
    });

    it('stops an afterCommit listener that keeps writing what it observes at the depth limit', async () => {
      await createEventsFixture(context);
      const warnings = vi
        .spyOn(process, 'emitWarning')
        .mockImplementation(() => undefined);
      subscribe(
        { collections: ['notes'] },
        {
          afterCommit: async (_events, connection) => {
            await connection
              .repository('notes')
              .createOne({ values: { body: 'echo' } });
          },
        },
      );

      await context.connection
        .repository('notes')
        .createOne({ values: { body: 'start' } });

      // The start plus the eight echoes the limit allows; the ninth is refused
      // before it runs and reported, so the call returns instead of looping.
      expect(await countRows('notes')).toBe(2 + 1 + 8);
      expect(warnings).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          code: 'REPOSITORY_EVENT_LISTENER_FAILED',
          cause: expect.objectContaining({
            code: 'REPOSITORY_EVENT_RECURSION',
          }) as unknown,
        }),
      );
    });

    it('matches a subscription on the root Collection when the call wrote only nested rows', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe({ collections: ['teams'] }, seen.listeners);

      await context.connection.repository('teams').updateOne({
        filter: { id: 'team-1' },
        values: {
          members: {
            connect: [{ where: { id: 'user-2' }, through: { role: 'member' } }],
          },
        },
      });

      expect(seen.batches).toHaveLength(1);
      expect(seen.batches[0]).toMatchObject([
        {
          collection: 'teams',
          operation: 'updateOne',
          granularity: 'rows',
          changes: [
            {
              collection: 'memberships',
              kind: 'created',
              key: { teamId: 'team-1', userId: 'user-2' },
            },
          ],
        },
      ]);
    });

    it('matches a subscription by any changed Collection and skips one whose Collections were not written', async () => {
      await createEventsFixture(context);
      const tasks = collectEvents();
      const users = collectEvents();
      subscribe({ collections: ['tasks'] }, tasks.listeners);
      // users is reachable through owner, but connecting an owner writes only
      // the project's foreign key.
      subscribe({ collections: ['users'] }, users.listeners);

      await context.connection.repository('projects').updateOne({
        filter: { id: 'project-1' },
        values: {
          owner: { connect: { id: 'user-2' } },
          tasks: { disconnect: { id: 'task-detach' } },
        },
      });

      expect(tasks.batches).toHaveLength(1);
      expect(tasks.batches[0]![0]!.collection).toBe('projects');
      expect(users.inTransaction).toEqual([]);
      expect(users.batches).toEqual([]);
    });

    it('emits nothing for a call that writes no row', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe({ collections: ['tasks', 'projects'] }, seen.listeners);

      await context.connection.repository('tasks').updateMany({
        filter: { projectId: 'none' },
        values: { status: 'done' },
      });
      await expect(
        context.connection.repository('projects').updateOne({
          filter: { id: 'project-404' },
          values: { status: 'x' },
        }),
      ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });

      expect(seen.inTransaction).toEqual([]);
      expect(seen.batches).toEqual([]);
    });

    it('shares subscriptions registered through a transaction connection with the whole connection', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      await context.database.transaction(async (connection) => {
        subscriptions.push(
          connection.onRepositoryMutation(
            { collections: ['projects'] },
            seen.listeners,
          ),
        );
      }, context.spec.name);

      await context.connection.repository('projects').updateOne({
        filter: { id: 'project-1' },
        values: { status: 'later' },
      });

      expect(seen.batches).toHaveLength(1);
    });

    it('stops delivering once unsubscribed', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      const off = subscribe({ collections: ['projects'] }, seen.listeners);
      off();

      await context.connection.repository('projects').updateOne({
        filter: { id: 'project-1' },
        values: { status: 'unobserved' },
      });

      expect(seen.inTransaction).toEqual([]);
    });

    it('does not report the row of an upsert create that lost a concurrent insert and updated instead', async () => {
      await createEventsFixture(context);
      const seen = collectEvents();
      subscribe({ collections: ['projects'] }, seen.listeners);
      let upsert: Promise<unknown> | undefined;

      await context.database.transaction(async (connection) => {
        await connection
          .repository('projects')
          .createOne({ values: { id: 'p-race', name: 'First' } });
        // Where the database lets the upsert run alongside, it finds no row,
        // tries to insert in a savepoint, waits on the uncommitted key, fails
        // once this commits, rolls the savepoint back and updates instead.
        upsert = context.connection.repository('projects').upsertOne({
          filter: { id: 'p-race' },
          create: { id: 'p-race', name: 'Second' },
          update: { name: 'Updated' },
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }, context.spec.name);
      await upsert;

      const raced = seen.inTransaction.filter(
        (event) => event.operation === 'upsertOne',
      );
      expect(raced).toHaveLength(1);
      expect(rowsOf(raced)).toEqual([
        {
          collection: 'projects',
          kind: 'updated',
          key: { id: 'p-race' },
          fields: ['name', 'version'],
        },
      ]);
    });
  },
);
