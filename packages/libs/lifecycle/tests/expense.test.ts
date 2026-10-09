import { describe, expect, it } from 'vitest';

import {
  createLifecycleTestKit,
  type LifecycleTestKit,
} from '../src/testing.js';
import {
  expenseLifecycle,
  fakeExpenseServices,
  type ExpenseTypes,
} from './fixtures/expense.js';

function setup(): {
  kit: LifecycleTestKit<ExpenseTypes>;
  services: ReturnType<typeof fakeExpenseServices>;
} {
  const services = fakeExpenseServices();
  const kit = createLifecycleTestKit(expenseLifecycle, {
    now: '2026-10-01T09:00:00Z',
    services,
  });
  return { kit, services };
}

describe('expense approval lifecycle', () => {
  it('approves and pays an expense up to the automatic limit', async () => {
    const { kit, services } = setup();
    const expense = kit.create({ applicantId: 'alice', amount: 3000 });
    await kit.fire(expense, 'submit', {}, { actor: 'alice' });
    expect(kit.get(expense)).toMatchObject({
      status: 'paid',
      // The payment effect's result reached the transition it continued with.
      paymentRef: `PAY-${String(expense.id)}`,
    });
    expect(await kit.history(expense)).toEqual(['submit', 'paid']);
    expect(services.payments).toHaveLength(1);
  });

  it('sends a large expense to the manager and then to finance', async () => {
    const { kit, services } = setup();
    const expense = kit.create({ applicantId: 'alice', amount: 80000 });
    await kit.fire(expense, 'submit', {}, { actor: 'alice' });
    expect(kit.get(expense)).toMatchObject({
      status: 'awaitingManager',
      approverId: 'bob',
    });
    await kit.fire(expense, 'approve', { comment: 'OK' }, { actor: 'bob' });
    expect(kit.get(expense)).toMatchObject({
      status: 'awaitingFinance',
      approverId: 'dora',
    });
    await kit.fire(expense, 'approve', {}, { actor: 'dora' });
    expect(kit.get(expense)).toMatchObject({
      status: 'paid',
      approverId: null,
    });
    expect(services.notifications).toEqual([
      'bob:expense-pending',
      'dora:expense-pending',
      'alice:approved',
    ]);
    expect((await kit.transitions(expense))[1]).toMatchObject({
      transition: 'approve',
      actorId: 'bob',
      input: { comment: 'OK' },
    });
  });

  it('refuses an approval from anyone but the current approver', async () => {
    const { kit } = setup();
    const expense = kit.create({ applicantId: 'alice', amount: 8000 });
    await kit.fire(expense, 'submit', {}, { actor: 'alice' });
    await expect(
      kit.fire(expense, 'approve', {}, { actor: 'alice' }),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
  });

  it('routes again after the applicant lowers the amount', async () => {
    const { kit } = setup();
    const expense = kit.create({ applicantId: 'alice', amount: 8000 });
    await kit.fire(expense, 'submit', {}, { actor: 'alice' });
    await kit.fire(expense, 'requestInfo', {}, { actor: 'bob' });
    kit.update(expense, { amount: 4500 });
    await kit.fire(expense, 'resubmit', {}, { actor: 'alice' });
    expect(kit.get(expense).status).toBe('paid');
  });

  it('records a rejection with its reason', async () => {
    const { kit } = setup();
    const expense = kit.create({ applicantId: 'alice', amount: 8000 });
    await kit.fire(expense, 'submit', {}, { actor: 'alice' });
    await expect(
      kit.fire(expense, 'reject', {}, { actor: 'bob' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await kit.fire(
      expense,
      'reject',
      { reason: 'Over budget' },
      { actor: 'bob' },
    );
    expect(kit.get(expense).status).toBe('rejected');
    expect((await kit.transitions(expense)).at(-1)?.input).toEqual({
      reason: 'Over budget',
    });
  });

  it('escalates to the next manager after three idle days', async () => {
    const { kit, services } = setup();
    const expense = kit.create({ applicantId: 'alice', amount: 8000 });
    await kit.fire(expense, 'submit', {}, { actor: 'alice' });
    kit.advance({ days: 3, minutes: 1 });
    expect(await kit.runTriggers()).toBe(1);
    expect(kit.get(expense)).toMatchObject({
      status: 'awaitingManager',
      approverId: 'carol',
    });
    expect(services.notifications).toEqual([
      'bob:expense-pending',
      'carol:expense-pending',
    ]);
    // The escalation restarted the wait.
    kit.advance({ days: 1 });
    expect(await kit.runTriggers()).toBe(0);
  });

  it('keeps the approval when every payment attempt fails', async () => {
    const { kit } = setup();
    kit.failEffect('expenses.requestPayment', { times: 3 });
    const expense = kit.create({ applicantId: 'alice', amount: 3000 });
    await kit.fire(expense, 'submit', {}, { actor: 'alice' });
    expect(kit.get(expense).status).toBe('approved');
    expect(
      (await kit.effectRuns(expense)).find(
        (run) => run.effect === 'expenses.requestPayment',
      ),
    ).toMatchObject({ status: 'failed', attempts: 3 });
  });
});
