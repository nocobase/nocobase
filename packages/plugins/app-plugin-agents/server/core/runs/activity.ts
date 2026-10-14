/** Atomic activity versions shared by append, claim, start and event reports. */
import type { DatabaseConnection, UpdateQuery } from '@nocobase/db';
import type { Knex } from 'knex';

export async function activityVersion(
  conn: DatabaseConnection,
  now: string,
): Promise<{ expression: Knex.Raw }> {
  const client = await conn.client<Knex>();
  const collection = await conn.collections.get('agRuns');
  const name =
    collection?.naming?.underscored === false
      ? 'lastActivityAt'
      : 'last_activity_at';
  const field = collection?.fields?.find(
    (field) => field.name === 'lastActivityAt' && field.type === 'datetimeTz',
  );
  const bound =
    field?.type === 'datetimeTz' && conn.runtime.repository?.temporalBinding
      ? conn.runtime.repository.temporalBinding({ client, field, value: now })
      : now;
  switch (conn.dialect) {
    case 'sqlite':
      return {
        expression: client.raw(
          "max(?, coalesce(strftime('%Y-%m-%dT%H:%M:%fZ', ??, '+0.001 seconds'), ?))",
          [bound, name, bound],
        ),
      };
    case 'postgres':
    case 'duckdb':
      return {
        expression: client.raw(
          "greatest(?, coalesce(?? + interval '1 millisecond', ?))",
          [bound, name, bound],
        ),
      };
    case 'mysql':
    case 'mariadb':
    case 'oceanbase':
      return {
        expression: client.raw(
          'greatest(?, coalesce(timestampadd(microsecond, 1000, ??), ?))',
          [bound, name, bound],
        ),
      };
    case 'mssql':
      return {
        expression: client.raw(
          'case when ?? >= ? then dateadd(millisecond, 1, ??) else ? end',
          [name, bound, name, bound],
        ),
      };
    case 'oracle':
      return {
        expression: client.raw(
          "greatest(?, coalesce(?? + numtodsinterval(0.001, 'SECOND'), ?))",
          [bound, name, bound],
        ),
      };
    default:
      throw new Error(
        `Atomic run activity versions are unavailable on ${conn.dialect}.`,
      );
  }
}

/** A version guard uses canonical values through the database layer's temporal bindings. */
export function guardVersion(
  conn: DatabaseConnection,
  id: string,
  version: string | null,
): UpdateQuery {
  return conn.query
    .updateTable('agRuns')
    .where('id', '=', id)
    .where('lastActivityAt', version === null ? 'is' : '=', version);
}
