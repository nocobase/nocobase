import type { Knex } from 'knex';
import { defineMigration, type MigrationContext } from '@nocobase/db';

/**
 * Every run and node-run timestamp is an instant, but they were declared
 * `datetime`, which is the zone-free type. On PostgreSQL that becomes
 * `timestamp without time zone`: the engine's UTC values were written with
 * their `Z` discarded and read back as a `Date` rebuilt in the host's zone, so
 * each round trip moved a value by the host offset. On MySQL the same write was
 * rejected outright. Both columns hold instants, so both become `datetimeTz`.
 *
 * The stored values are UTC wall clock, which is exactly what `datetimeTz`
 * means on the databases that keep a zone-free physical type (MySQL's
 * `DATETIME(3)` and SQLite's `TEXT`), so those need no data change. PostgreSQL
 * does convert, reading each naive value in the session time zone, so the
 * session is pinned to UTC for the conversion rather than trusting whatever the
 * server was configured with.
 *
 * What this cannot repair is history. A node run's `startedAt` was re-persisted
 * from a value that had already been decoded once, so on an affected PostgreSQL
 * deployment existing rows carry one extra host offset that nothing recorded;
 * their durations stay wrong. Runs created after this migration are correct.
 */

const RUN_INSTANTS = ['startedAt', 'finishedAt', 'expiresAt'] as const;
const NODE_RUN_INSTANTS = ['startedAt', 'finishedAt', 'expiresAt'] as const;

/**
 * PostgreSQL widens a zone-free timestamp by reading it in the session time
 * zone, so the conversion below is only correct with that zone pinned to UTC.
 *
 * `SET LOCAL` scopes the pin to the surrounding transaction, which is how
 * migrations run by default — and outside one PostgreSQL merely warns and
 * ignores it, which would shift every stored value by whatever the server is
 * configured with and leave nothing behind saying so. The pin is therefore read
 * back: a migration that cannot pin the zone has to fail rather than convert.
 */
async function pinPostgresSessionToUtc(
  connection: MigrationContext['connection'],
): Promise<void> {
  if (connection.dialect !== 'postgres') return;
  const client = await connection.client<Knex>();
  await client.raw("SET LOCAL TIME ZONE 'UTC'");
  const result = await client.raw<{ rows?: { TimeZone?: string }[] }>(
    'SHOW TIME ZONE',
  );
  const pinned = result.rows?.[0]?.TimeZone;
  if (pinned !== 'UTC')
    throw new Error(
      `Migration 202609110001 needs the session time zone pinned to UTC to convert these columns, but it is "${String(pinned)}". Run it inside a transaction.`,
    );
}

export default defineMigration({
  name: '202609110001_workflow_instant_columns',

  async up({ builder, connection }): Promise<void> {
    await pinPostgresSessionToUtc(connection);
    for (const name of RUN_INSTANTS) {
      await builder.alterField('workflowRuns', name, {
        type: 'datetimeTz',
        nullable: true,
      });
    }
    await builder.alterField('workflowRuns', 'createdAt', {
      type: 'datetimeTz',
      nullable: false,
    });
    for (const name of NODE_RUN_INSTANTS) {
      await builder.alterField('workflowNodeRuns', name, {
        type: 'datetimeTz',
        nullable: name !== 'startedAt',
      });
    }
  },

  async down({ builder, connection }): Promise<void> {
    await pinPostgresSessionToUtc(connection);
    for (const name of NODE_RUN_INSTANTS) {
      await builder.alterField('workflowNodeRuns', name, {
        type: 'datetime',
        nullable: name !== 'startedAt',
      });
    }
    await builder.alterField('workflowRuns', 'createdAt', {
      type: 'datetime',
      nullable: false,
    });
    for (const name of RUN_INSTANTS) {
      await builder.alterField('workflowRuns', name, {
        type: 'datetime',
        nullable: true,
      });
    }
  },
});
