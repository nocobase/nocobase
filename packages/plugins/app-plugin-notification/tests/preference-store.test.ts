// @vitest-environment node

import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DatabaseNotificationPreferenceStore } from '../server/preferences.js';
import { createNotificationTestDatabase } from './helpers/database.js';

const ROW = {
  userId: 'alice',
  kind: 'approval.requested',
  channelType: 'email',
};

/**
 * Wraps a builder chain so that the `execute()` at its end runs `after` once the real statement finished.
 */
function afterExecute<T extends object>(
  builder: T,
  after: () => Promise<void>,
): T {
  return new Proxy(builder, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        const result: unknown = Reflect.apply(value, target, args);
        if (property === 'execute')
          return (result as Promise<unknown>).then(async (outcome) => {
            await after();
            return outcome;
          });
        return result && typeof result === 'object'
          ? afterExecute(result, after)
          : result;
      };
    },
  });
}

/**
 * The database as a concurrent first save sees it: right after this save's update found no row, another save inserts
 * the same row, before this save's insert runs.
 */
function racingDatabase(database: DatabaseManager): DatabaseManager {
  let raced = false;
  return new Proxy(database, {
    get(target, property, receiver) {
      if (property !== 'transaction')
        return Reflect.get(target, property, receiver) as unknown;
      return <T>(fn: (connection: DatabaseConnection) => Promise<T>) =>
        target.transaction((connection) =>
          fn(
            new Proxy(connection, {
              get(inner, name, innerReceiver) {
                if (name !== 'query')
                  return Reflect.get(inner, name, innerReceiver) as unknown;
                return new Proxy(inner.query, {
                  get(query, method, queryReceiver) {
                    const value: unknown = Reflect.get(
                      query,
                      method,
                      queryReceiver,
                    );
                    if (method !== 'updateTable' || raced)
                      return typeof value === 'function'
                        ? (value as (...a: unknown[]) => unknown).bind(query)
                        : value;
                    raced = true;
                    return (...args: unknown[]) =>
                      afterExecute(
                        Reflect.apply(
                          value as (...a: unknown[]) => object,
                          query,
                          args,
                        ),
                        async () => {
                          await inner.query
                            .insertInto('notificationPreferences')
                            .values({
                              id: 'concurrent-first-save',
                              ...ROW,
                              enabled: true,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            })
                            .execute();
                        },
                      );
                  },
                });
              },
            }),
          ),
        );
    },
  });
}

describe('DatabaseNotificationPreferenceStore', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await createNotificationTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('keeps a first save that loses the race for the row to a concurrent one', async () => {
    const store = new DatabaseNotificationPreferenceStore(
      racingDatabase(testDatabase.database),
    );

    await store.save(ROW.userId, [
      { kind: ROW.kind, channelType: ROW.channelType, enabled: false },
    ]);

    await expect(
      new DatabaseNotificationPreferenceStore(
        testDatabase.database,
      ).listForUser(ROW.userId),
    ).resolves.toEqual([{ ...ROW, enabled: false }]);
  });

  it('replaces an earlier choice and adds new ones', async () => {
    const store = new DatabaseNotificationPreferenceStore(
      testDatabase.database,
    );
    await store.save('alice', [
      { kind: ROW.kind, channelType: 'email', enabled: false },
    ]);
    await store.save('alice', [
      { kind: ROW.kind, channelType: 'email', enabled: true },
      { kind: ROW.kind, channelType: 'web-push', enabled: false },
    ]);
    const records = await store.listForUser('alice');
    expect(
      [...records].sort((a, b) => a.channelType.localeCompare(b.channelType)),
    ).toEqual([
      { ...ROW, channelType: 'email', enabled: true },
      { ...ROW, channelType: 'web-push', enabled: false },
    ]);
  });
});
