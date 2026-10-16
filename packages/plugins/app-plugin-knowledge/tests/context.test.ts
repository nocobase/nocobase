// @vitest-environment node
import { createTestDatabase } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';

import { NO_ACCESS } from '../server/services/access.js';
import { createKnowledgeContext } from '../server/services/context.js';

it('returns after post-commit work finishes and reports its failures without undoing the committed result', async () => {
  const db = await createTestDatabase();
  let release: () => void = () => undefined;
  let entered: () => void = () => undefined;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const failures: unknown[] = [];
  const context = createKnowledgeContext({
    database: db.database,
    access: NO_ACCESS,
    newId: () => 'unused',
    onError: (_message, error) => {
      failures.push(error);
    },
  });
  let returned = false;
  const failure = new Error('Post-commit cleanup failed.');
  const result = context
    .transaction(async (tx) => {
      tx.afterCommit(async () => {
        entered();
        await waiting;
      });
      tx.afterCommit(async () => {
        throw failure;
      });
      return 'committed';
    })
    .then((value) => {
      returned = true;
      return value;
    });
  try {
    await started;
    await Promise.resolve();
    expect(returned).toBe(false);
    release();
    expect(await result).toBe('committed');
    expect(failures).toEqual([failure]);
  } finally {
    release();
    await result;
    await db.destroy();
  }
});
