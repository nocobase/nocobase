// The lifecycles tested as plain function calls: a memory store, a fake
// clock and in-process effects. No database, server or jobs service.
import { createLifecycleTestKit } from '@nocobase/lifecycle/testing';
import { describe, expect, it } from 'vitest';
import { isCalendarDate, itemProblems } from '../shared/expense.js';

import { expenseLifecycle } from '../server/lifecycles/expense.js';
import type { ExampleServices } from '../server/lifecycles/services.js';
import { ticketLifecycle } from '../server/lifecycles/ticket.js';

function services(): ExampleServices & {
  readonly sent: string[];
  readonly paid: string[];
} {
  const sent: string[] = [];
  const paid: string[] = [];
  const calls = new Map<string, number>();
  return {
    sent,
    paid,
    shouldFail: (key, times) => {
      const count = (calls.get(key) ?? 0) + 1;
      calls.set(key, count);
      return count <= times;
    },
    deliver: (to) => void sent.push(to),
    pay: (payee, amountCents) => {
      paid.push(`${payee}:${amountCents}`);
      return `PAY-${paid.length}`;
    },
  };
}

describe('support ticket', () => {
  function kit() {
    const fake = services();
    return {
      fake,
      tickets: createLifecycleTestKit(ticketLifecycle, {
        services: fake,
        now: '2026-10-01T09:00:00Z',
      }),
    };
  }
  const ticket = {
    subject: '无法登录后台',
    description: '输入密码后提示会话过期',
    category: 'account',
    priority: 'high',
    requesterId: 'customer-li',
    assigneeId: null,
    failNotifications: 0,
  };

  it('is taken by the agent who first replies, and emails the customer', async () => {
    const { tickets, fake } = kit();
    const created = tickets.create(ticket);
    await tickets.fire(
      created,
      'reply',
      { message: '请清除浏览器缓存后重试' },
      { actor: 'agent-zhou' },
    );
    expect(tickets.get(created)).toMatchObject({
      status: 'awaitingCustomer',
      assigneeId: 'agent-zhou',
    });
    expect(fake.sent).toEqual(['li@xinghe.example.com']);
  });

  it('closes a ticket the customer leaves unanswered', async () => {
    const { tickets } = kit();
    const created = tickets.create(ticket);
    await tickets.fire(
      created,
      'reply',
      { message: '请重试' },
      { actor: 'agent-zhou' },
    );
    tickets.advance({ minutes: 1 });
    expect(await tickets.runTriggers()).toBe(0);
    tickets.advance({ minutes: 2 });
    expect(await tickets.runTriggers()).toBe(1);
    expect(tickets.get(created)).toMatchObject({
      status: 'closed',
      closedReason: 'timeout',
    });
  });

  it('restarts the wait when the agent follows up', async () => {
    const { tickets, fake } = kit();
    const created = tickets.create(ticket);
    await tickets.fire(
      created,
      'reply',
      { message: '请重试' },
      { actor: 'agent-zhou' },
    );
    tickets.advance({ minutes: 1.5 });
    await tickets.fire(
      created,
      'reply',
      { message: '补充：也可以换个浏览器试试' },
      { actor: 'agent-zhou' },
    );
    tickets.advance({ minutes: 1 });
    expect(await tickets.runTriggers()).toBe(0);
    expect(tickets.get(created)).toMatchObject({ status: 'awaitingCustomer' });
    expect(fake.sent).toHaveLength(2);
  });

  it('goes back to the agent when the customer replies, and tells them', async () => {
    const { tickets, fake } = kit();
    const created = tickets.create(ticket);
    await tickets.fire(
      created,
      'reply',
      { message: '请重试' },
      { actor: 'agent-zhou' },
    );
    await tickets.fire(
      created,
      'customerReply',
      { message: '还是不行' },
      { actor: 'customer-li' },
    );
    expect(tickets.get(created).status).toBe('open');
    expect(fake.sent.at(-1)).toBe('zhou.ning@example.com');
    tickets.advance({ hours: 1 });
    await tickets.runTriggers();
    expect(tickets.get(created).status).toBe('open');
  });

  it('lets only the requester write as the customer, and only agents reply', async () => {
    const { tickets } = kit();
    const created = tickets.create(ticket);
    await expect(
      tickets.fire(
        created,
        'customerReply',
        { message: '我也是' },
        { actor: 'customer-wang' },
      ),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
    await expect(
      tickets.fire(
        created,
        'reply',
        { message: '好的' },
        { actor: 'customer-li' },
      ),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
  });

  it('can be reopened by the customer within seven days of closing', async () => {
    const { tickets } = kit();
    const first = tickets.create(ticket);
    await tickets.fire(first, 'accept', {}, { actor: 'agent-zhou' });
    await tickets.fire(first, 'resolve', {}, { actor: 'agent-zhou' });
    tickets.advance({ days: 2 });
    await tickets.fire(
      first,
      'reopen',
      { message: '问题又出现了' },
      { actor: 'customer-li' },
    );
    expect(tickets.get(first)).toMatchObject({
      status: 'open',
      closedReason: null,
    });

    await tickets.fire(first, 'resolve', {}, { actor: 'agent-zhou' });
    tickets.advance({ days: 8 });
    await expect(
      tickets.fire(
        first,
        'reopen',
        { message: '又坏了' },
        { actor: 'customer-li' },
      ),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
      // The customer may reopen it; it is the time since it closed that refuses.
      blockers: [{ code: 'reopenExpired', kind: 'precondition' }],
    });
  });

  it('lets only a customer file a ticket, for themselves, with every field', async () => {
    const { tickets } = kit();
    const values = { ...ticket, requesterId: 'customer-li' };
    await expect(
      tickets.start(values, { actor: 'agent-zhou' }),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
      blockers: [{ code: 'customersOnly' }],
    });
    await expect(
      tickets.start(values, { actor: 'customer-wang' }),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
    await expect(
      tickets.start(
        { ...values, subject: ' ', category: 'gossip' },
        { actor: 'customer-li' },
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      problems: [{ field: 'subject' }, { field: 'category' }],
    });
    expect(await tickets.start(values, { actor: 'customer-li' })).toMatchObject(
      { status: 'new', requesterId: 'customer-li' },
    );
  });

  it('retries a failing email after its backoff and keeps the reply', async () => {
    const { tickets } = kit();
    const created = tickets.create({ ...ticket, failNotifications: 2 });
    await tickets.fire(
      created,
      'reply',
      { message: '请重试' },
      { actor: 'agent-zhou' },
    );
    expect(await tickets.effectRuns(created)).toMatchObject([
      { status: 'queued', attempts: 1, runAfter: '2026-10-01T09:00:02.000Z' },
    ]);
    // The second attempt waits two seconds, the third four.
    tickets.advance({ seconds: 1 });
    expect(await tickets.runDue()).toBe(0);
    tickets.advance({ seconds: 1 });
    expect(await tickets.runDue()).toBe(1);
    tickets.advance({ seconds: 4 });
    expect(await tickets.runDue()).toBe(1);
    expect(await tickets.effectRuns(created)).toMatchObject([
      { status: 'succeeded', attempts: 3 },
    ]);
  });
});

describe('expense report', () => {
  function kit() {
    const fake = services();
    return {
      fake,
      expenses: createLifecycleTestKit(expenseLifecycle, {
        services: fake,
        now: '2026-10-01T09:00:00Z',
      }),
    };
  }
  const item = (amountCents: number) => ({
    date: '2026-09-28',
    category: 'transport',
    description: '往返机票',
    amountCents,
  });
  const report = (amountCents: number, failPayments = 0) => {
    const items = [item(amountCents)];
    return {
      title: '上海客户拜访',
      purpose: '季度客户回访',
      items,
      amountCents,
      applicantId: 'lin',
      approverId: null,
      failPayments,
    };
  };

  it('refuses to submit a report without items', async () => {
    const { expenses } = kit();
    const created = expenses.create({ ...report(0), items: [] });
    // The request is fine; the report is not ready, which is its state.
    await expect(
      expenses.fire(created, 'submit', {}, { actor: 'lin' }),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE',
      message: expect.stringContaining('at least one expense line'),
    });
  });

  it('pays up to 5,000 yuan without anyone approving, and records the payment', async () => {
    const { expenses, fake } = kit();
    const created = expenses.create(report(300_000));
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    expect(expenses.get(created)).toMatchObject({
      status: 'paid',
      paymentRef: 'PAY-1',
    });
    expect(fake.paid).toEqual(['lin:300000']);
  });

  it('needs the manager, then finance, above 50,000 yuan', async () => {
    const { expenses } = kit();
    const created = expenses.create(report(8_000_000));
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    expect(expenses.get(created)).toMatchObject({
      status: 'awaitingManager',
      approverId: 'chen',
    });
    await expenses.fire(
      created,
      'approve',
      { comment: '同意' },
      { actor: 'chen' },
    );
    expect(expenses.get(created)).toMatchObject({
      status: 'awaitingFinance',
      approverId: 'zhao',
    });
    await expenses.fire(created, 'approve', {}, { actor: 'zhao' });
    expect(expenses.get(created).status).toBe('paid');
    expect(await expenses.history(created)).toEqual([
      'submit',
      'approve',
      'approve',
      'paid',
    ]);
  });

  it('lets the applicant withdraw while it waits, and edit before resubmitting', async () => {
    const { expenses } = kit();
    const created = expenses.create(report(800_000));
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    await expenses.fire(created, 'withdraw', {}, { actor: 'lin' });
    expect(expenses.get(created)).toMatchObject({
      status: 'draft',
      approverId: null,
    });
    expenses.update(created, { items: [item(450_000)], amountCents: 450_000 });
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    expect(expenses.get(created).status).toBe('paid');
  });

  it('sends a report back for information and routes it again', async () => {
    const { expenses } = kit();
    const created = expenses.create(report(800_000));
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    await expect(
      expenses.fire(created, 'requestInfo', {}, { actor: 'chen' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expenses.fire(
      created,
      'requestInfo',
      { reason: '请补充发票' },
      { actor: 'chen' },
    );
    expect(expenses.get(created)).toMatchObject({
      status: 'needsInfo',
      approverId: null,
    });
    await expenses.fire(created, 'resubmit', {}, { actor: 'lin' });
    expect(expenses.get(created)).toMatchObject({
      status: 'awaitingManager',
      approverId: 'chen',
    });
  });

  it('passes an idle manager over for theirs, once', async () => {
    const { expenses, fake } = kit();
    const created = expenses.create(report(800_000));
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    expenses.advance({ minutes: 4 });
    expect(await expenses.runTriggers()).toBe(1);
    expect(expenses.get(created)).toMatchObject({
      status: 'awaitingManager',
      approverId: 'wang',
    });
    expect(fake.sent).toEqual(['chen.ming@example.com', 'wang.li@example.com']);
    // 王丽 has nobody above her: waiting longer escalates no further.
    expenses.advance({ minutes: 10 });
    expect(await expenses.runTriggers()).toBe(0);
  });

  it('lets only an employee file a report, for themselves', async () => {
    const { expenses } = kit();
    const values = { ...report(300_000), applicantId: 'lin' };
    await expect(
      expenses.start(values, { actor: 'chen' }),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
      blockers: [{ code: 'applicantsOnly' }],
    });
    expect(await expenses.start(values, { actor: 'lin' })).toMatchObject({
      status: 'draft',
    });
  });

  it('stays approved when every payment attempt fails', async () => {
    const { expenses } = kit();
    const created = expenses.create(report(300_000, 5));
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    expenses.advance({ seconds: 2 });
    await expenses.runDue();
    expenses.advance({ seconds: 4 });
    await expenses.runDue();
    expect(expenses.get(created).status).toBe('approved');
    const payment = (await expenses.effectRuns(created)).find(
      (run) => run.effect === 'expenses.requestPayment',
    );
    expect(payment).toMatchObject({ status: 'failed', attempts: 3 });
  });

  it('pays once someone retries a payment that gave up', async () => {
    const { expenses, fake } = kit();
    // Four failures: the three attempts, then the first retry's first try.
    const created = expenses.create(report(300_000, 4));
    await expenses.fire(created, 'submit', {}, { actor: 'lin' });
    expenses.advance({ seconds: 2 });
    await expenses.runDue();
    expenses.advance({ seconds: 4 });
    await expenses.runDue();
    const failed = (await expenses.effectRuns(created)).find(
      (run) => run.effect === 'expenses.requestPayment',
    );
    expect(failed?.status).toBe('failed');
    await expenses.runtime.retryRun(failed!.id);
    // The retry's first try fails too, and its second waits out the capped backoff.
    expenses.advance({ seconds: 10 });
    await expenses.runDue();
    expect(expenses.get(created)).toMatchObject({
      status: 'paid',
      paymentRef: 'PAY-1',
    });
    expect(fake.paid).toHaveLength(1);
  });
});

describe('expense items', () => {
  const item = {
    date: '2026-09-28',
    category: 'transport',
    description: '高铁',
    amountCents: 12_000,
  };

  it('refuses a date that names no real day instead of moving it', () => {
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2026-02-31')).toBe(false);
    expect(itemProblems([item])).toEqual([]);
    expect(itemProblems([{ ...item, date: '2026-02-31' }])).toEqual([
      'Line 1: the date is invalid.',
    ]);
  });
});
