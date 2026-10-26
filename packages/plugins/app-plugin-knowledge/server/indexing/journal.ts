import type { DatabaseConnection } from '@nocobase/db';
import type { KnowledgeEvent } from '../services/context.js';
import { findDoc } from '../services/store.js';
import { advanceSources, type SettingsRow } from './store.js';

/** Runs before the business commit; events are only a collection mechanism, never the reliable outbox. */
export async function journalChanges(
  conn: DatabaseConnection,
  settings: SettingsRow,
  events: readonly KnowledgeEvent[],
  newId: () => string,
  now: string,
): Promise<void> {
  const changes = new Map<
    string,
    { docId: string; spaceId: string; deleted: boolean }
  >();
  for (const event of events)
    if (event.type === 'chunks.changed') {
      const doc = await findDoc(conn, event.docId);
      changes.set(event.docId, {
        docId: event.docId,
        spaceId: doc?.spaceId ?? event.spaceId,
        deleted: !doc || Boolean(doc.archivedAt) || doc.kind === 'folder',
      });
    }
  await advanceSources(conn, settings, [...changes.values()], newId, now);
}
