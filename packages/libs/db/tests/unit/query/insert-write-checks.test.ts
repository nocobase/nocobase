import type { Knex } from 'knex';
import { expect, it, vi } from 'vitest';

import { resolveDatabaseCapabilities } from '../../../src/database/capabilities.js';
import type {
  DatabaseConnection,
  DatabaseWriteCheck,
} from '../../../src/database/connection.js';
import { DatabaseWriteCheckRegistry } from '../../../src/database/internal/write-checks.js';
import { attachDatabaseDriverRuntime } from '../../../src/database/runtime.js';
import { DefaultNamingStrategy } from '../../../src/naming/default-strategy.js';
import { KnexQueryAdapter } from '../../../src/query/internal/knex/adapter.js';

it('checks every fallback insert before executing it and stops on rejection', async () => {
  const events: string[] = [];
  const client = (() => ({
    insert: (row: { id: number }) => ({
      then(resolve: (result: number[]) => unknown) {
        events.push(`insert ${row.id}`);
        return Promise.resolve([row.id]).then(resolve);
      },
    }),
  })) as unknown as Knex;
  attachDatabaseDriverRuntime(client, {
    dialect: 'test',
    capabilities: resolveDatabaseCapabilities(),
    query: { insertManyFallback: () => true },
  });

  const connection = { name: 'main' } as DatabaseConnection;
  const registry = new DatabaseWriteCheckRegistry();
  const denied = new Error('writes have been disabled');
  const check = vi.fn<DatabaseWriteCheck>(async () => {
    await Promise.resolve();
    events.push('check');
    if (check.mock.calls.length === 3) throw denied;
  });
  registry.add(check);
  const query = new KnexQueryAdapter(
    () => client,
    new DefaultNamingStrategy(),
    async () => ({ name: 'jobRuns' }),
    undefined,
    {
      registry,
      connectionName: connection.name,
      connectionFor: () => connection,
    },
  );

  await expect(
    query
      .insertInto('jobRuns')
      .values([{ id: 1 }, { id: 2 }, { id: 3 }])
      .execute(),
  ).rejects.toBe(denied);
  expect(events).toEqual(['check', 'insert 1', 'check', 'insert 2', 'check']);
  const write = {
    connection: 'main',
    table: 'job_runs',
    operation: 'insert',
    source: 'query',
  };
  expect(check.mock.calls).toEqual([
    [write, connection],
    [write, connection],
    [write, connection],
  ]);
});
