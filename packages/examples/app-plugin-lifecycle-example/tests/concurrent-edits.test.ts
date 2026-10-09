// Edits and transitions racing on one expense report, on the test database:
// every edit moves the lifecycle version on, so a submit decided on the
// report before an edit landed is refused rather than committed over values
// it never saw, and two edits that interleave both keep their fields.
import type { DatabaseManager, Repository } from '@nocobase/db';
import {
  createRepositoryLifecycleStore,
  LifecycleRuntime,
} from '@nocobase/lifecycle';
import { afterEach, describe, expect, vi } from 'vitest';

import { expenseLifecycle } from '../server/lifecycles/expense.js';
import { createExampleServices } from '../server/lifecycles/services.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../server/scope.js';
import { LifecycleExampleService } from '../server/services/lifecycle-example.js';
import { test } from './fixtures.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function serviceOn(database: DatabaseManager): LifecycleExampleService {
  const runtime = new LifecycleRuntime({
    store: createRepositoryLifecycleStore(database, {
      collections: {
        transitions: LIFECYCLE_EXAMPLE_COLLECTIONS.transitions,
        effectRuns: LIFECYCLE_EXAMPLE_COLLECTIONS.effectRuns,
      },
    }),
    // Effects stay queued: only the transitions matter here.
    dispatcher: { dispatch: () => Promise.resolve() },
  });
  runtime.register(expenseLifecycle, {
    services: createExampleServices({ info: () => undefined }),
  });
  return new LifecycleExampleService(database, runtime);
}

const line = {
  date: '2026-09-28',
  category: 'transport',
  description: '打车',
  amountCents: 12_000,
};

/**
 * Has the next read of the expenses collection run `meanwhile` before it
 * answers: another change lands after the caller read the report and before
 * it writes.
 */
function interleave(
  database: DatabaseManager,
  meanwhile: () => Promise<void>,
  times = 1,
): { readonly reads: () => number } {
  const repository = database.repository.bind(database);
  let reads = 0;
  vi.spyOn(database, 'repository').mockImplementation(
    (name: string, ...rest: unknown[]) => {
      const target = (repository as (...args: unknown[]) => Repository)(
        name,
        ...rest,
      );
      if (name !== expenseLifecycle.collection) return target;
      return new Proxy(target, {
        get(object, property) {
          const value: unknown = Reflect.get(object, property, object);
          if (property !== 'findOne' || typeof value !== 'function')
            return typeof value === 'function' ? value.bind(object) : value;
          return async (...args: unknown[]) => {
            const found: unknown = await value.apply(object, args);
            if (reads < times) {
              reads += 1;
              await meanwhile();
            }
            return found;
          };
        },
      });
    },
  );
  return { reads: () => reads };
}

describe('an edit racing a transition', () => {
  test('refuses a submit decided on the report before an edit landed', async ({
    database,
  }) => {
    const service = serviceOn(database);
    const expense = await service.createExpense(
      { title: '打车', purpose: '', items: [line], failPayments: 0 },
      'lin',
    );
    const id = String(expense.id);
    // The page shows a 120-yuan report, which would be approved at once.
    const seen = await service.runtime.view('expenses', id, { id: 'lin' });
    // Meanwhile the applicant raises it above the manager's limit.
    await service.updateExpense(
      id,
      { items: [{ ...line, amountCents: 6_000_000 }] },
      'lin',
    );
    // A submit decided on what the page showed does not commit on the
    // report as it now is.
    await expect(
      service.runtime.fire('expenses', id, 'submit', {
        actor: { id: 'lin' },
        expect: { version: seen.version },
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const after = await service.runtime.view('expenses', id, { id: 'lin' });
    expect(after.state).toBe('draft');
    expect(after.history.transitions.map((entry) => entry.transition)).toEqual([
      '$create',
    ]);
    // Decided again on the report as it is, it goes to the manager.
    await service.runtime.fire('expenses', id, 'submit', {
      actor: { id: 'lin' },
      expect: { version: after.version },
    });
    expect(
      (await service.runtime.view('expenses', id, { id: 'lin' })).state,
    ).toBe('awaitingManager');
  });
});

describe('two edits that interleave', () => {
  test('both keep their fields', async ({ database }) => {
    const service = serviceOn(database);
    const expense = await service.createExpense(
      { title: '打车', purpose: '拜访客户', items: [line], failPayments: 0 },
      'lin',
    );
    const id = String(expense.id);
    const other = serviceOn(database);
    const race = interleave(database, async () => {
      vi.restoreAllMocks();
      // The other edit reads and writes after this one read, before it writes.
      await other.updateExpense(id, { purpose: '年度回访' }, 'lin');
    });
    const edited = await service.updateExpense(
      id,
      { title: '打车往返' },
      'lin',
    );
    expect(race.reads()).toBe(1);
    expect(edited).toMatchObject({ title: '打车往返', purpose: '年度回访' });
    // Each edit moved the version on once.
    expect(
      (await service.runtime.view('expenses', id, { id: 'lin' })).version,
    ).toBe(3);
  });

  test('gives up with EXPENSE_CHANGED when every read is overtaken', async ({
    database,
  }) => {
    const service = serviceOn(database);
    const expense = await service.createExpense(
      { title: '打车', purpose: '', items: [line], failPayments: 0 },
      'lin',
    );
    const id = String(expense.id);
    const repository = database.repository(expenseLifecycle.collection);
    const race = interleave(
      database,
      async () => {
        await repository.updateMany({
          filter: { id: Number(id) },
          values: { lifecycleVersion: { increment: 1 } },
        });
      },
      Number.POSITIVE_INFINITY,
    );
    await expect(
      service.updateExpense(id, { title: '打车往返' }, 'lin'),
    ).rejects.toMatchObject({ code: 'CONFLICT', reason: 'EXPENSE_CHANGED' });
    expect(race.reads()).toBe(3);
    vi.restoreAllMocks();
    const stored = await database
      .repository(expenseLifecycle.collection)
      .findOne({ filter: { id: Number(id) } });
    expect(stored?.title).toBe('打车');
  });
});
