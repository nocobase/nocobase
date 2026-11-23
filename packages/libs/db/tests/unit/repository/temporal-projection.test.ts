import knex, { type Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';
import {
  attachDatabaseDriverRuntime,
  type DatabaseDriverRuntime,
} from '../../../src/database/runtime.js';
import { temporalProjection } from '../../../src/repository/internal/temporal-sql.js';

describe('temporal projections', () => {
  const clients: Knex[] = [];

  afterEach(async () => {
    await Promise.all(clients.splice(0).map((client) => client.destroy()));
  });

  async function createClient(
    repository?: DatabaseDriverRuntime['repository'],
  ): Promise<Knex> {
    const client = knex({
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    clients.push(client);
    if (repository)
      attachDatabaseDriverRuntime(client, {
        repository,
      } as DatabaseDriverRuntime);
    await client.schema.createTable('events', (table) => {
      table.integer('id').primary();
      table.string('occurred_at').nullable();
    });
    await client('events').insert([
      { id: 1, occurred_at: '2026-09-06 12:30:00.120' },
      { id: 2, occurred_at: null },
    ]);
    return client;
  }

  async function read(client: Knex): Promise<unknown[]> {
    const rows = await client('events')
      .select(
        client.raw('? as ??', [
          temporalProjection(
            client,
            { name: 'occurredAt', type: 'datetimeTz' },
            'occurred_at',
          ),
          'occurredAt',
        ]),
      )
      .orderBy('id');
    return rows.map((row: { occurredAt: unknown }) => row.occurredAt);
  }

  it('keeps NULL when a dialect concatenates NULL as an empty string', async () => {
    // Mimics a dialect whose `||` treats NULL as '' (KingbaseES in
    // Oracle-compatible mode): the driver's formatting alone yields "Z".
    const client = await createClient({
      temporalProjection: ({ client, reference }) =>
        client.raw("replace(coalesce(??, ''), ' ', 'T') || 'Z'", [reference]),
    });

    expect(await read(client)).toEqual(['2026-09-06T12:30:00.120Z', null]);
  });

  it('leaves the reference untouched when the driver does not format temporals', async () => {
    const client = await createClient();

    expect(
      temporalProjection(
        client,
        { name: 'occurredAt', type: 'datetimeTz' },
        'occurred_at',
      ).toQuery(),
    ).toBe('`occurred_at`');
    expect(await read(client)).toEqual(['2026-09-06 12:30:00.120', null]);
  });
});
