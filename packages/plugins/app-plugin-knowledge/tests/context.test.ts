// @vitest-environment node
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

import { NO_ACCESS } from '../server/services/access.js';
import { createKnowledgeContext } from '../server/services/context.js';

describe('knowledge transaction completion', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    await testDatabase.database
      .createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-knowledge',
      })
      .latest();
  });

  afterEach(async () => {
    await testDatabase?.destroy();
  });

  const context = (onError = vi.fn()) =>
    createKnowledgeContext({
      database: testDatabase.database,
      access: NO_ACCESS,
      newId: () => 'unused',
      onError,
    });

  it('waits for post-commit work without holding the database transaction open', async () => {
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let completed = false;
    const operation = context()
      .transaction(async (tx) => {
        tx.afterCommit(async () => {
          started.resolve();
          await release.promise;
        });
        return 'committed';
      })
      .then((result) => {
        completed = true;
        return result;
      });

    try {
      await started.promise;
      // Another transaction can finish while the committed operation is still cleaning up.
      await testDatabase.database.transaction(async () => undefined);
      expect(completed).toBe(false);
    } finally {
      release.resolve();
      await operation;
    }
    await expect(operation).resolves.toBe('committed');
  });

  it('reports post-commit failures and still completes the remaining work', async () => {
    const onError = vi.fn();
    const failure = new Error('Cleanup failed');
    const finished: string[] = [];
    const result = await context(onError).transaction(async (tx) => {
      tx.afterCommit(() => {
        throw failure;
      });
      tx.afterCommit(async () => {
        await Promise.resolve();
        throw failure;
      });
      tx.afterCommit(async () => {
        await Promise.resolve();
        finished.push('cleaned');
      });
      return 'committed';
    });

    expect(result).toBe('committed');
    expect(finished).toEqual(['cleaned']);
    expect(onError.mock.calls).toEqual([
      ['Knowledge work after a commit failed.', failure],
      ['Knowledge work after a commit failed.', failure],
    ]);
  });

  it('does not run post-commit work after rollback', async () => {
    const cleanup = vi.fn();
    await expect(
      context().transaction(async (tx) => {
        tx.afterCommit(cleanup);
        throw new Error('Rollback');
      }),
    ).rejects.toThrow('Rollback');
    expect(cleanup).not.toHaveBeenCalled();
  });
});
