import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';
import { generationsRepo, type SettingsRow } from './store.js';

const idsOf = (values: unknown): readonly string[] =>
  z
    .array(z.object({ id: z.string() }))
    .parse(values)
    .map((row) => row.id);
const pointersOf = (settings: SettingsRow): readonly string[] =>
  [settings.activeGenerationId, settings.buildingGenerationId].filter(
    (id): id is string => id !== null,
  );
/** The caller holds the settings lock. Rotation timestamps are fairness hints, never execution ownership. */
export async function dueCleanupTargets(
  conn: DatabaseConnection,
  settings: SettingsRow,
  now: string,
): Promise<readonly string[]> {
  let query = conn.query
    .selectFrom('kbIndexGenerations')
    .select('id')
    .where('state', 'in', ['retired', 'superseded', 'failed', 'dropping'])
    .where('cleanupAfter', '<=', now);
  const pointers = pointersOf(settings);
  if (pointers.length) query = query.where('id', 'not in', pointers);
  const ids = idsOf(
    await query
      .orderBy('updatedAt', 'asc')
      .orderBy('id', 'asc')
      .limit(10)
      .execute(),
  );
  for (const id of ids)
    await generationsRepo(conn).updateMany({
      filter: { id },
      values: { state: 'dropping', updatedAt: now },
    });
  return ids;
}
/** Keep external closed markers and source tombstones; only acknowledged dropped generations may expire. */
export async function purgeIndexingMetadata(
  conn: DatabaseConnection,
  settings: SettingsRow,
  now: string,
): Promise<void> {
  const cutoff = new Date(new Date(now).getTime() - 7 * 86400000).toISOString();
  let query = conn.query
    .selectFrom('kbIndexGenerations')
    .select('id')
    .where('state', '=', 'dropped')
    .where('updatedAt', '<=', cutoff);
  const pointers = pointersOf(settings);
  if (pointers.length) query = query.where('id', 'not in', pointers);
  const generations = idsOf(
    await query
      .orderBy('updatedAt', 'asc')
      .orderBy('id', 'asc')
      .limit(10)
      .execute(),
  );
  if (generations.length)
    await conn.query
      .deleteFrom('kbIndexGenerations')
      .where('id', 'in', generations)
      .execute();
  const requests = idsOf(
    await conn.query
      .selectFrom('kbIndexRequests')
      .select('id')
      .where('expiresAt', '<=', now)
      .orderBy('expiresAt', 'asc')
      .orderBy('id', 'asc')
      .limit(100)
      .execute(),
  );
  if (requests.length)
    await conn.query
      .deleteFrom('kbIndexRequests')
      .where('id', 'in', requests)
      .execute();
}
