import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../../helpers.js';
import { collectEvents, createEventsFixture, rowsOf } from './fixture.js';

const tempRoot = join(process.cwd(), 'tests/.tmp');

const projectOneTasks = {
  tasks: {
    read: { scope: { projectId: 'project-1' } },
    create: { scope: true, fields: ['id', 'title', 'projectId'] },
    update: { scope: { projectId: 'project-1' }, fields: ['title', 'status'] },
    delete: { scope: { projectId: 'project-1' } },
  },
} as const;

describeIntegrationDatabases(
  'Repository mutation events: connection scopes',
  (context) => {
    const subscriptions: Array<() => void> = [];
    const directories: string[] = [];

    afterEach(async () => {
      for (const off of subscriptions.splice(0)) off();
      await Promise.all(
        directories
          .splice(0)
          .map((directory) => rm(directory, { recursive: true, force: true })),
      );
    });

    it('observes writes through a policy-bound connection and hands listeners the unbound transaction connection', async () => {
      await createEventsFixture(context);
      const scoped = context.connection.withPolicies(
        projectOneTasks,
        undefined,
      );
      const seen = collectEvents();
      let visibleToListener: number | undefined;
      let listenerCanBind = false;
      subscriptions.push(
        scoped.onRepositoryMutation(
          { collections: ['tasks'] },
          {
            inTransaction: async (event, connection) => {
              seen.inTransaction.push(event);
              listenerCanBind = typeof connection.withPolicies === 'function';
              visibleToListener = await connection.repository('tasks').count();
            },
            afterCommit: seen.listeners.afterCommit,
          },
        ),
      );

      await scoped.repository('tasks').updateMany({
        all: true,
        values: { status: 'done' },
      });

      expect(
        rowsOf(seen.inTransaction)
          .map((change) => change.key.id)
          .sort(),
      ).toEqual(['task-detach', 'task-edit', 'task-obsolete']);
      expect(listenerCanBind).toBe(true);
      expect(visibleToListener).toBe(5);
      expect(seen.batches).toHaveLength(1);

      await scoped.transaction(async (transaction) => {
        await transaction
          .repository('tasks')
          .updateOne({ filter: { id: 'task-edit' }, values: { title: 'T' } });
      });
      expect(seen.batches[1]).toMatchObject([
        { operation: 'updateOne', scope: 'transaction' },
      ]);
    });

    it.each([true, false])(
      'emits nothing for migration and seed writes with transaction=%s',
      async (transaction) => {
        await createEventsFixture(context);
        const seen = collectEvents();
        subscriptions.push(
          context.connection.onRepositoryMutation(
            { collections: ['notes', 'tasks'] },
            seen.listeners,
          ),
        );
        const migrations = await createTempDirectory('migrations-');
        const seeds = await createTempDirectory('seeds-');
        const migration = '202610020001_events_silent';
        const seed = '202610020002_events_silent';
        await writeFile(
          join(migrations, `${migration}.ts`),
          `import { defineMigration } from '../../../../db/src/index.js';
export default defineMigration({
  name: '${migration}',
  transaction: ${transaction},
  irreversible: true,
  async up({ repository }) {
    await repository('notes').createOne({ values: { body: 'migrated' } });
    await repository('tasks').updateMany({ all: true, values: { status: 'migrated' } });
  },
});
`,
        );
        await writeFile(
          join(seeds, `${seed}.ts`),
          `import { defineSeed } from '../../../../db/src/index.js';
export default defineSeed({
  name: '${seed}',
  transaction: ${transaction},
  async run({ repository }) {
    await repository('notes').createMany({ values: [{ body: 'seeded' }] });
    await repository('tasks').deleteMany({ filter: { projectId: 'project-other' } });
  },
});
`,
        );

        await context.database
          .createMigrator({
            connection: context.spec.name,
            directory: migrations,
            packageName: 'events-silence',
            tableName: context.table('eventsMigrationHistory'),
            lockTableName: context.table('eventsMigrationLock'),
          })
          .latest();
        await context.database
          .createSeeder({
            connection: context.spec.name,
            directory: seeds,
            packageName: 'events-silence',
            tableName: context.table('eventsSeedHistory'),
            lockTableName: context.table('eventsSeedLock'),
          })
          .run();

        expect(await context.connection.repository('notes').count()).toBe(4);
        expect(
          await context.connection
            .repository('tasks')
            .count({ filter: { status: 'migrated' } }),
        ).toBe(4);
        expect(seen.inTransaction).toEqual([]);
        expect(seen.batches).toEqual([]);

        // The same connection still reports ordinary writes.
        await context.connection
          .repository('notes')
          .createOne({ values: { body: 'after' } });
        expect(seen.batches).toHaveLength(1);
      },
    );

    async function createTempDirectory(prefix: string): Promise<string> {
      await mkdir(tempRoot, { recursive: true });
      const directory = await mkdtemp(join(tempRoot, prefix));
      directories.push(directory);
      return directory;
    }
  },
);
