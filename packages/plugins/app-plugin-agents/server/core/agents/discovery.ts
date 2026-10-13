import type { DatabaseConnection, Repository } from '@nocobase/db';
import { ProtocolError } from '../../kernel/errors.js';

export interface DiscoveryPreference {
  readonly key: string;
  readonly ignored: boolean;
  readonly revision: number;
  readonly updatedAt?: string;
}

export const preferences = (
  conn: DatabaseConnection,
): Repository<DiscoveryPreference> =>
  conn.repository<DiscoveryPreference>('agDiscoveryPreferences');

export async function discoveryPreferences(
  conn: DatabaseConnection,
): Promise<Map<string, DiscoveryPreference>> {
  return new Map(
    (await preferences(conn).findMany()).map((row) => [row.key, row]),
  );
}

/** All state transitions in a model group lock the same persisted row. Reports never reset it. */
export async function lockDiscovery(
  conn: DatabaseConnection,
  key: string,
  expectedRevision?: number,
): Promise<DiscoveryPreference> {
  let row = await preferences(conn).findOne({ filter: { key } });
  if (!row) {
    try {
      await conn.transaction(async (savepoint) => {
        await preferences(savepoint).createOne({
          values: {
            key,
            ignored: false,
            revision: 0,
            updatedAt: new Date().toISOString(),
          },
        });
      });
    } catch (error) {
      if (!(await preferences(conn).findOne({ filter: { key } }))) throw error;
    }
    row = await preferences(conn).findOne({ filter: { key } });
  }
  if (
    !row ||
    (expectedRevision !== undefined && row.revision !== expectedRevision)
  )
    throw new ProtocolError(
      'REVISION_CONFLICT',
      'The discovery group changed. Reload before trying again.',
    );
  const result = await preferences(conn).updateMany({
    filter: { key, revision: row.revision },
    values: { revision: row.revision + 1, updatedAt: new Date().toISOString() },
  });
  if (!result.updatedCount)
    throw new ProtocolError(
      'REVISION_CONFLICT',
      'The discovery group changed. Reload before trying again.',
    );
  return { key: row.key, ignored: row.ignored, revision: row.revision + 1 };
}
