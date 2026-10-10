import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createDatabaseMailStore } from '../../server/store.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

let database: DatabaseManager;
beforeEach(async () => {
  database = await createMailTestDatabase();
});
afterEach(async () => {
  vi.restoreAllMocks();
  await destroyMailTestDatabase(database);
});

it('does not compare arbitrary Provider attachment identifiers with a local UUID upload column', async () => {
  const store = createDatabaseMailStore(database);
  // Native UUID databases reject part-0 rather than returning a missing upload.
  // Legacy localized drafts intentionally preserve these external identifiers.
  const query = vi.spyOn(database, 'query').mockImplementation(() => {
    throw new Error('Invalid Provider identifier reached a UUID query.');
  });
  for (const id of ['part-0', 'imap:2.1', 'local-draft:attachment']) {
    await expect(
      store.getOutboundAttachment('owner', id),
    ).resolves.toBeUndefined();
  }
  expect(query).not.toHaveBeenCalled();
});
