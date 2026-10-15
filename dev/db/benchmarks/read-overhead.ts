import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createDatabaseManager, rawRows } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import postgres from '@nocobase/db-postgres';
import type { Knex } from 'knex';
import { runWithDatabaseService } from '../../../packages/libs/db-testkit/src/integration-runner.js';
import { integrationService } from '../../../packages/libs/db-postgres/scripts/integration-service.js';
import { connectionConfig } from './numeric/config.js';
import { measure } from './numeric/measure.js';

// PostgreSQL always uses a disposable database; SQLite stays in memory.
const dialect = process.argv[2] ?? 'sqlite';
if (dialect !== 'sqlite' && dialect !== 'postgres') {
  throw new Error(
    'Usage: node --import tsx dev/db/benchmarks/read-overhead.ts [sqlite|postgres]',
  );
}
if (dialect === 'postgres' && !process.env.NOCOBASE_READ_BENCH_SERVICE) {
  process.exitCode = await runWithDatabaseService({
    ...integrationService,
    command: process.execPath,
    args: ['--import', 'tsx', fileURLToPath(import.meta.url), dialect],
    environment: { NOCOBASE_READ_BENCH_SERVICE: '1' },
  });
} else {
  await benchmark(dialect);
}

async function benchmark(dialect: 'sqlite' | 'postgres'): Promise<void> {
  const prefix = `reads_${randomBytes(4).toString('hex')}_`;
  const database = createDatabaseManager({
    drivers: { sqlite, postgres },
    connections: {
      main: { ...connectionConfig(dialect), naming: { tablePrefix: prefix } },
    },
  });
  const root = database.connection();
  const client = await root.client<Knex>();
  const table = (name: string): string => `${prefix}${name}`;
  const names = [
    'runs',
    'usage',
    ...Array.from({ length: 10 }, (_, i) => `related${i}`),
  ];
  try {
    for (const name of names) {
      await root.builder.createCollection(name, (collection) => {
        collection.increments('id');
        collection.string('agentId');
        collection.string('status');
        collection.integer('runId');
        collection.integer('inputTokens');
        collection.integer('outputTokens');
        collection.datetime('createdAt');
        collection.datetime('updatedAt');
        collection.datetime('startedAt');
        collection.datetime('finishedAt');
        collection.datetime('reportedAt');
        collection.index(['agentId']);
        collection.index(['status']);
        collection.index(['runId']);
      });
    }
    for (const name of ['runs', 'usage']) {
      for (let start = 0; start < 4000; start += 100) {
        await client(table(name)).insert(
          Array.from({ length: 100 }, (_, i) => ({
            id: start + i + 1,
            run_id: start + i + 1,
            agent_id: `agent-${i % 4}`,
            status: 'completed',
            input_tokens: 1234,
            output_tokens: 567,
            created_at: '2026-10-14 10:20:30.123',
            updated_at: '2026-10-14 10:20:30.123',
            started_at: '2026-10-14 10:20:30.123',
            finished_at: '2026-10-14 10:20:30.123',
            reported_at: '2026-10-14 10:20:30.123',
          })),
        );
      }
    }
    // Warm the root's naming snapshot and Collections before measuring transactions.
    for (const name of names) await root.collections.get(name);
    const query = root.query
      .selectFrom('runs as r')
      .innerJoin('usage as u', 'u.runId', 'r.id')
      .select([
        'r.id',
        'r.agentId',
        'r.status',
        'r.createdAt',
        'r.updatedAt',
        'r.startedAt',
        'r.finishedAt',
        'u.inputTokens',
        'u.outputTokens',
        'u.reportedAt',
      ])
      .orderBy('r.id');
    let statement: { sql: string; bindings: Knex.RawBinding[] } | undefined;
    const capture = (event: {
      sql: string;
      bindings: Knex.RawBinding[];
    }): void => {
      if (event.sql.includes('inner join')) statement = event;
    };
    client.on('query', capture);
    const expected = await query.execute();
    client.off('query', capture);
    assert.equal(expected.length, 4000);
    assert.deepEqual(expected[0], {
      id: 1,
      agentId: 'agent-0',
      status: 'completed',
      createdAt: '2026-10-14T10:20:30.123',
      updatedAt: '2026-10-14T10:20:30.123',
      startedAt: '2026-10-14T10:20:30.123',
      finishedAt: '2026-10-14T10:20:30.123',
      inputTokens: 1234,
      outputTokens: 567,
      reportedAt: '2026-10-14T10:20:30.123',
    });
    assert.ok(statement);
    const sql = statement;
    // Query events expose PostgreSQL's numbered placeholders; knex.raw takes
    // question marks. This fixture has no literal dollar-number text.
    const rawSql =
      dialect === 'postgres' ? sql.sql.replace(/\$\d+/g, '?') : sql.sql;
    const native = await measure(
      client,
      {
        name: '4000-row join, identical SQL',
        api: 'knex',
        run: async () => rawRows(await client.raw(rawSql, sql.bindings)),
        verify: (rows) => {
          assert.equal((rows as unknown[]).length, 4000);
        },
      },
      30,
      10,
    );
    const mapped = await measure(
      client,
      {
        name: '4000-row join, decoded',
        api: 'query',
        run: () => query.execute(),
        verify: (rows) => {
          assert.deepEqual(rows, expected);
        },
      },
      30,
      10,
    );
    const empty = await trace(() => root.transaction(async () => {}));
    const readCollections = () =>
      root.transaction(async (transaction) => {
        for (const name of names) {
          await transaction.query
            .selectFrom(name)
            .select('id')
            .limit(1)
            .execute();
        }
      });
    const reads = await trace(readCollections);
    const transaction = await measure(
      client,
      {
        name: '12-table transaction with three indexes per table',
        api: 'query',
        run: readCollections,
        verify: (result) => {
          assert.equal(result, undefined);
        },
      },
      30,
      10,
    );
    console.log(
      JSON.stringify(
        {
          dialect,
          node: process.version,
          rows: 4000,
          repeats: 30,
          warmups: 10,
          native,
          mapped,
          transaction,
          emptyTransaction: empty,
          twelveTableTransaction: reads,
        },
        null,
        2,
      ),
    );
  } finally {
    // Only this run's tables; PostgreSQL's surrounding runner also removes its database.
    try {
      for (const name of [...names].reverse())
        await client.schema.dropTableIfExists(table(name));
    } finally {
      await database.destroy();
    }
  }

  async function trace(run: () => Promise<void>): Promise<{
    total: number;
    metadata: number;
    statements: string[];
  }> {
    const statements: string[] = [];
    const record = (event: { sql: string }): void => {
      statements.push(event.sql);
    };
    client.on('query', record);
    try {
      await run();
    } finally {
      client.off('query', record);
    }
    return {
      total: statements.length,
      metadata: statements.filter((sql) =>
        /__nocobase_collection_metadata|pg_catalog|sqlite_schema|pragma_/i.test(
          sql,
        ),
      ).length,
      statements,
    };
  }
}
