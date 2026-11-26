import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

interface CacheFixture {
  readonly first: DatabaseManager;
  readonly second: DatabaseManager;
  readonly uncached: DatabaseManager;
  cleanup(): Promise<void>;
}

export function describeCollectionCache(
  prepare: () => Promise<CacheFixture>,
  versionQueries: number,
): void {
  describe('transaction Collection cache', () => {
    let fixture: CacheFixture;
    let reader: DatabaseConnection;
    let writer: DatabaseConnection;

    beforeEach(async () => {
      fixture = await prepare();
      reader = fixture.first.connection();
      writer = fixture.second.connection();
      for (const name of ['tasks', 'members']) {
        await writer.builder.createCollection(name, (table) => {
          table.increments('id');
          table.string('label');
        });
      }
      await reader.connect();
    });
    afterEach(async () => fixture.cleanup());

    it('uses no structure queries in an empty transaction and warms from transaction-only reads', async () => {
      const client = await reader.client<Knex>();
      const statements: string[] = [];
      client.on('query', (query: { sql: string }) =>
        statements.push(query.sql),
      );
      await reader.transaction(async () => {});
      expect(statements).toMatchObject([
        expect.stringMatching(/^begin/i),
        expect.stringMatching(/^commit/i),
      ]);

      const read = () =>
        reader.transaction(async (transaction) => {
          for (const name of ['tasks', 'members']) {
            expect(await transaction.collections.get(name)).toMatchObject({
              name,
            });
            expect(
              await transaction.query.selectFrom(name).select('id').execute(),
            ).toEqual([]);
            expect(await transaction.repository(name).findMany()).toEqual([]);
          }
          await transaction.transaction(async (savepoint) => {
            expect(await savepoint.collections.get('tasks')).toMatchObject({
              name: 'tasks',
            });
          });
        });
      await read();
      statements.length = 0;
      await read();
      const version = statements.filter((sql) =>
        /__nocobase_collection_metadata_cache_[a-f\d]{8}/i.test(sql),
      );
      expect(version).toHaveLength(versionQueries);
      expect(
        statements.filter(
          (sql) =>
            /pragma_|sqlite_schema|pg_catalog|information_schema|collection_metadata/i.test(
              sql,
            ) && !version.includes(sql),
        ),
      ).toEqual([]);
      expect(statements[0]).toMatch(/^begin/i);
      expect(statements.at(-1)).toMatch(/^commit/i);
    });

    it('uses root-prewarmed definitions in the first transaction', async () => {
      for (const name of ['tasks', 'members'])
        await reader.collections.get(name);
      const client = await reader.client<Knex>();
      const statements: string[] = [];
      client.on('query', (query: { sql: string }) =>
        statements.push(query.sql),
      );
      await reader.transaction(async (transaction) => {
        for (const name of ['tasks', 'members']) {
          expect(await transaction.collections.get(name)).toMatchObject({
            name,
          });
        }
      });
      expect(statements).toHaveLength(2 + versionQueries);
      expect(
        statements
          .slice(1, -1)
          .every((sql) => sql.includes('collection_metadata_cache_')),
      ).toBe(true);
    });

    it('keeps a root write with an inTransaction listener within its query budget', async () => {
      const client = await reader.client<Knex>();
      const statements: string[] = [];
      const dispose = reader.onRepositoryMutation(
        { collections: ['tasks'] },
        {
          async inTransaction(_event, connection) {
            expect(await connection.repository('members').findMany()).toEqual(
              [],
            );
          },
          async afterCommit(_events, connection) {
            expect(await connection.repository('members').findMany()).toEqual(
              [],
            );
          },
        },
      );
      try {
        await reader
          .repository('tasks')
          .createOne({ values: { label: 'warm' } });
        client.on('query', (query: { sql: string }) =>
          statements.push(query.sql),
        );
        await reader
          .repository('tasks')
          .createOne({ values: { label: 'measured' } });
        expect(
          statements.filter((sql) =>
            /__nocobase_collection_metadata_cache_[a-f\d]{8}/i.test(sql),
          ),
        ).toHaveLength(1);
        expect(
          statements.filter(
            (sql) =>
              /pragma_|sqlite_schema|pg_catalog|information_schema|collection_metadata/i.test(
                sql,
              ) &&
              !/__nocobase_collection_metadata_cache_[a-f\d]{8}/i.test(sql),
          ),
        ).toEqual([]);
      } finally {
        dispose();
      }
    });

    it('sees builder, metadata, table creation and native DDL across connections', async () => {
      const read = (name: string = 'tasks') =>
        reader.transaction(async (transaction) =>
          transaction.collections.get(name),
        );
      expect((await read())?.fields?.map((field) => field.name)).toEqual([
        'id',
        'label',
      ]);
      await writer.builder.addField('tasks', { name: 'added', type: 'string' });
      expect((await read())?.fields?.map((field) => field.name)).toContain(
        'added',
      );
      await writer.builder.dropField('tasks', 'added');
      expect((await read())?.fields?.map((field) => field.name)).not.toContain(
        'added',
      );

      await writer.collectionMetadata.updateCollection('tasks', {
        title: 'Updated',
      });
      expect((await read())?.title).toBe('Updated');
      await writer.collectionMetadata.removeDocument('tasks');
      expect((await read())?.title).toBeUndefined();
      await writer.collectionMetadata.updateCollection('tasks', {
        title: 'Recreated',
      });
      expect((await read())?.title).toBe('Recreated');

      expect(await read('newItems')).toBeUndefined();
      await writer.builder.createCollection('newItems', (table) =>
        table.increments('id'),
      );
      await reader.transaction(async (transaction) => {
        expect(
          await transaction.query.selectFrom('newItems').selectAll().execute(),
        ).toEqual([]);
        expect(await transaction.repository('newItems').findMany()).toEqual([]);
      });

      const client = await writer.client<Knex>();
      await writer.notifySchemaChange(async () =>
        client.schema.alterTable('tasks', (table) => table.string('native')),
      );
      expect((await read())?.fields?.map((field) => field.name)).toContain(
        'native',
      );
    });

    it('keeps rollback local and still inspects raw DDL with reuse disabled', async () => {
      const read = () =>
        reader.transaction(async (transaction) =>
          transaction.collections.get('tasks'),
        );
      await read();
      const rollback = new Error('Expected rollback');
      await expect(
        reader.transaction(async (transaction) => {
          const client = await transaction.client<Knex>();
          await transaction.collections.get('tasks');
          await transaction.notifySchemaChange(async () =>
            client.schema.alterTable('tasks', (table) =>
              table.string('rolled_back'),
            ),
          );
          expect(
            (await transaction.collections.get('tasks'))?.fields?.map(
              (field) => field.name,
            ),
          ).toContain('rolledBack');
          throw rollback;
        }),
      ).rejects.toBe(rollback);
      expect((await read())?.fields?.map((field) => field.name)).not.toContain(
        'rolledBack',
      );

      const uncached = fixture.uncached.connection();
      const readUncached = () =>
        uncached.transaction(async (transaction) =>
          transaction.collections.get('tasks'),
        );
      await readUncached();
      const client = await writer.client<Knex>();
      await client.schema.alterTable('tasks', (table) =>
        table.string('uncached'),
      );
      expect(
        (await readUncached())?.fields?.map((field) => field.name),
      ).toContain('uncached');
    });

    it('refreshes definitions after schema.execute and savepoint release', async () => {
      await reader.transaction(async (transaction) => {
        expect(
          (await transaction.collections.get('tasks'))?.fields,
        ).toHaveLength(2);
        await transaction.transaction(async (savepoint) => {
          await savepoint.schema.execute([
            {
              type: 'alterTable',
              tableName: 'tasks',
              operations: [
                {
                  type: 'addColumn',
                  column: { name: 'direct', type: 'string' },
                },
              ],
            },
          ]);
          expect(
            (await savepoint.collections.get('tasks'))?.fields?.map(
              (field) => field.name,
            ),
          ).toContain('direct');
        });
        expect(
          (await transaction.collections.get('tasks'))?.fields?.map(
            (field) => field.name,
          ),
        ).toContain('direct');
      });
    });

    it('stays cold while a second non-transactional schema change is active', async () => {
      const client = await writer.client<Knex>();
      const add = async (name: string): Promise<void> => {
        await client.schema.alterTable('tasks', (table) => table.string(name));
      };
      const read = () =>
        reader.transaction(async (transaction) =>
          (await transaction.collections.get('tasks'))?.fields?.map(
            (field) => field.name,
          ),
        );
      await read();
      const started = deferred();
      const proceed = deferred();
      const second = writer.notifySchemaChange(async () => {
        try {
          await add('first');
          started.resolve();
          await proceed.promise;
          await add('second');
          throw new Error('Second change failed after DDL');
        } catch (error) {
          started.reject(error);
          throw error;
        }
      });
      const failed = expect(second).rejects.toThrow(
        'Second change failed after DDL',
      );
      try {
        await started.promise;
        await writer.notifySchemaChange(async () => add('overlap'));
        expect(await read()).toEqual(['id', 'label', 'first', 'overlap']);
        const readerClient = await reader.client<Knex>();
        const statements: string[] = [];
        const trace = (query: { sql: string }): void => {
          statements.push(query.sql);
        };
        readerClient.on('query', trace);
        try {
          await read();
          expect(
            statements.some((sql) =>
              /pragma_|sqlite_schema|pg_catalog/i.test(sql),
            ),
          ).toBe(true);
        } finally {
          readerClient.off('query', trace);
        }
      } finally {
        proceed.resolve();
        await failed;
      }
      expect(await read()).toEqual([
        'id',
        'label',
        'first',
        'overlap',
        'second',
      ]);
    });

    it.each([false, true])(
      'invalidates after partial migration failure in the same migration: %s',
      async (sameMigration) => {
        const directory = await mkdtemp(
          join(tmpdir(), 'collection-cache-migration-'),
        );
        const read = () =>
          reader.transaction(async (transaction) =>
            transaction.collections.get('tasks'),
          );
        await read();
        try {
          const write = async (
            name: string,
            transaction: boolean,
            code: string,
          ): Promise<void> => {
            await writeFile(
              join(directory, `${name}.mjs`),
              `
            import { defineMigration } from ${JSON.stringify(import.meta.resolve('@nocobase/db'))};
            export default defineMigration({ name: '${name}', transaction: ${transaction}, irreversible: true, async up({ connection }) {
              const client = await connection.client();
              ${code}
            } });
          `,
            );
          };
          const alter =
            "await client.schema.alterTable('tasks', (table) => table.string('migrated'));";
          const fail =
            "await client.schema.createTable('tasks', (table) => table.increments('id'));";
          if (sameMigration) {
            await write('202611260001_partial', false, alter + fail);
          } else {
            await write('202611260001_success', true, alter);
            await write('202611260002_failure', true, fail);
          }
          const migrator = fixture.second.createMigrator({
            directory,
            packageName: 'collection-cache-test',
            extensions: ['.mjs'],
          });
          await expect(migrator.latest()).rejects.toThrow(/already exists/i);
          expect((await read())?.fields?.map((field) => field.name)).toContain(
            'migrated',
          );
        } finally {
          await rm(directory, { recursive: true, force: true });
        }
      },
    );
  });
}

function deferred(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
} {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, failed) => {
    resolve = done;
    reject = failed;
  });
  return { promise, resolve, reject };
}
