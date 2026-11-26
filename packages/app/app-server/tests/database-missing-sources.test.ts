import type { Knex } from 'knex';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppMigrator } from '../src/database/migrator.js';
import { useTestDatabases } from './support/test-databases.js';

const provision = useTestDatabases();
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

async function fixture(sourceForm: 'directory' | 'sources') {
  const parent = path.resolve('tests/.tmp');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, 'missing-sources-'));
  roots.push(root);
  const directory = path.join(root, 'migrations');
  const databases = await provision();
  const test = await databases.open();
  const options = {
    database: test.database,
    config: { directory, packageName: 'test-app', autoRun: false },
    ...(sourceForm === 'sources'
      ? { sources: [{ directory, packageName: 'test-app' }] }
      : {}),
  };
  const name = '202611170001_create_rows';
  async function install() {
    await mkdir(directory);
    await writeFile(
      path.join(directory, `${name}.ts`),
      `
import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '${name}',
  async up({ builder, query }) {
    await builder.createCollection('rows', c => { c.increments('id'); c.string('event'); });
    await query.insertInto('rows').values({ event: 'up' }).execute();
  },
  async down({ query }) {
    await query.insertInto('rows').values({ event: 'down' }).execute();
  },
});
`,
    );
    await createAppMigrator(options).latest();
    await rm(directory, { recursive: true });
  }
  return { options, test, name, install };
}

describe.each(['directory', 'sources'] as const)(
  'missing app migration %s',
  (sourceForm) => {
    it('skips an empty application without creating migration bookkeeping', async () => {
      const { options, test } = await fixture(sourceForm);
      try {
        const migrator = createAppMigrator(options);
        expect(await migrator.latest()).toEqual({
          status: 'skipped',
          reason: 'missing-directory',
        });
        for (const dryRun of [true, false]) {
          expect(await migrator.rollback({ dryRun })).toEqual({
            status: 'skipped',
            reason: 'missing-directory',
          });
        }
        expect(await migrator.history()).toEqual([]);
        const client = await test.connection.client<Knex>();
        expect(await client.schema.hasTable('__nocobase_migrations')).toBe(
          false,
        );
        expect(await client.schema.hasTable('__nocobase_migration_lock')).toBe(
          false,
        );
      } finally {
        await test.destroy();
      }
    });

    it('warns by default and rejects strict forward runs when the last directory disappears', async () => {
      const { options, test, name, install } = await fixture(sourceForm);
      try {
        await install();
        const migrator = createAppMigrator(options);
        const history = await migrator.history();
        expect(await migrator.latest()).toMatchObject({
          status: 'completed',
          executed: [],
          warnings: [{ kind: 'missing-source', packageName: 'test-app', name }],
        });
        await expect(
          createAppMigrator({
            ...options,
            config: { ...options.config, onMissingSource: 'error' },
          }).latest(),
        ).rejects.toThrow('missing from migration sources');
        expect(await migrator.history()).toEqual(history);
        expect(
          await test.connection.query.selectFrom('rows').selectAll().execute(),
        ).toEqual([{ id: 1, event: 'up' }]);
      } finally {
        await test.destroy();
      }
    });

    it.each(['warn', 'error'] as const)(
      'preflights real and dry rollback with missing directories under %s',
      async (onMissingSource) => {
        const { options, test, name, install } = await fixture(sourceForm);
        try {
          await install();
          const migrator = createAppMigrator({
            ...options,
            config: { ...options.config, onMissingSource },
          });
          const history = await migrator.history();
          let message: string | undefined;
          for (const dryRun of [true, false]) {
            const error = await migrator
              .rollback({ dryRun })
              .catch((error: unknown) => error);
            expect(error).toBeInstanceOf(Error);
            const text = (error as Error).message;
            expect(text).toContain('test-app');
            expect(text).toContain(name);
            expect(text).toContain('missing from migration sources');
            expect(text).toContain('Restore compatible versions');
            if (message) expect(text).toBe(message);
            message = text;
            expect(await migrator.history()).toEqual(history);
            expect(
              await test.connection.query
                .selectFrom('rows')
                .selectAll()
                .execute(),
            ).toEqual([{ id: 1, event: 'up' }]);
          }
        } finally {
          await test.destroy();
        }
      },
    );
  },
);
