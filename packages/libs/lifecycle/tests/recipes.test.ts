// The recipes in docs/examples.md, run. Each describe names its section and
// asserts what the cookbook says about it, the pitfalls included, so a change
// to the runtime that makes a recipe wrong fails here before a reader finds
// out. Recipes that need a database, routes or the jobs service are covered by
// the store and provider tests instead.
import { describe, expect, it } from 'vitest';

import {
  defineEffect,
  EffectFailure,
  defineLifecycle,
  LifecycleError,
  LifecycleRuntime,
  MemoryLifecycleStore,
  planTransition,
  SYSTEM_ACTOR,
  type EffectDispatcher,
  type GuardVerdict,
  type LifecycleActor,
  type LifecycleRecord,
} from '../src/index.js';
import { createLifecycleTestKit } from '../src/testing.js';

const DAY = 86_400_000;

function systemOnly({ actor }: { actor: LifecycleActor }): GuardVerdict {
  return actor.system === true || { code: 'systemOnly', message: 'Automatic.' };
}

/** Hands runs to the test instead of running them. */
class HeldDispatcher implements EffectDispatcher {
  public readonly runs: string[] = [];

  public dispatch(runId: string): Promise<void> {
    this.runs.push(runId);
    return Promise.resolve();
  }
}

function refusal(error: unknown): string {
  return error instanceof LifecycleError ? error.code : String(error);
}

describe('1. Route by amount', () => {
  type State = 'draft' | 'awaitingManager' | 'approved' | 'paid';
  interface Types {
    record: LifecycleRecord & { readonly amountCents: number };
    state: State;
    parameters: { autoApproveLimitCents: number };
  }
  const requestPayment = defineEffect<Types>({
    name: 'r1.requestPayment',
    onSuccess: 'paid',
    run: () => ({ paymentRef: 'PAY-1' }),
  });
  const expenses = defineLifecycle<Types>({
    name: 'r1',
    initial: 'draft',
    states: [
      'draft',
      'awaitingManager',
      'approved',
      { name: 'paid', final: true },
    ],
    parameters: { autoApproveLimitCents: 500_000 },
    transitions: {
      submit: {
        from: 'draft',
        to: ['approved', 'awaitingManager'],
        route: ({ record, parameters }) =>
          record.amountCents <= parameters.autoApproveLimitCents
            ? 'approved'
            : 'awaitingManager',
      },
      approve: { from: 'awaitingManager', to: 'approved' },
      paid: {
        from: 'approved',
        to: 'paid',
        guard: systemOnly,
        accept: ['paymentRef'],
      },
    },
    onEnter: { approved: [requestPayment] },
  });

  it('pays whichever way approved was reached', async () => {
    const kit = createLifecycleTestKit(expenses);
    const small = await kit.start({ amountCents: 300_000 });
    await kit.fire(small, 'submit');
    expect(kit.get(small)).toMatchObject({
      status: 'paid',
      paymentRef: 'PAY-1',
    });

    const large = await kit.start({ amountCents: 800_000 });
    await kit.fire(large, 'submit');
    expect(kit.get(large).status).toBe('awaitingManager');
    expect(await kit.effects(large)).toEqual([]);
    await kit.fire(large, 'approve');
    expect(kit.get(large).status).toBe('paid');
  });
});

describe('2. Approve through several levels', () => {
  type State = 'draft' | 'awaitingManager' | 'awaitingFinance' | 'approved';
  interface Types {
    record: LifecycleRecord & { readonly approverId: string | null };
    state: State;
  }
  const NEXT = {
    awaitingManager: 'awaitingFinance',
    awaitingFinance: 'approved',
  } as const;
  const APPROVER = { awaitingFinance: 'finance', approved: null } as const;
  const approverOnly = ({
    record,
    actor,
  }: {
    record: Types['record'];
    actor: LifecycleActor;
  }): GuardVerdict =>
    actor.id === record.approverId || {
      code: 'approverOnly',
      message: 'Only the current approver can decide.',
    };
  const requests = defineLifecycle<Types>({
    name: 'r2',
    initial: 'draft',
    states: [
      'draft',
      'awaitingManager',
      'awaitingFinance',
      { name: 'approved', final: true },
    ],
    transitions: {
      submit: {
        from: 'draft',
        to: 'awaitingManager',
        set: () => ({ approverId: 'manager' }),
      },
      approve: {
        from: ['awaitingManager', 'awaitingFinance'],
        to: ['awaitingFinance', 'approved'],
        guard: approverOnly,
        route: ({ record }) =>
          NEXT[record.status as 'awaitingManager' | 'awaitingFinance'],
        set: ({ to }) => ({
          approverId: APPROVER[to as 'awaitingFinance' | 'approved'],
        }),
      },
      returnToApplicant: {
        from: ['awaitingManager', 'awaitingFinance'],
        to: 'draft',
        guard: approverOnly,
        validate: (input) =>
          input.reason
            ? null
            : [{ field: 'reason', message: 'Give a reason.' }],
        accept: ['reason'],
        set: () => ({ approverId: null }),
      },
    },
  });

  it('moves the approver with each level behind one button', async () => {
    const kit = createLifecycleTestKit(requests);
    const request = await kit.start();
    await kit.fire(request, 'submit');
    await kit.fire(request, 'approve', {}, { actor: 'manager' });
    expect(kit.get(request)).toMatchObject({
      status: 'awaitingFinance',
      approverId: 'finance',
    });
    await kit.fire(request, 'approve', {}, { actor: 'finance' });
    expect(kit.get(request)).toMatchObject({
      status: 'approved',
      approverId: null,
    });
  });

  it('names the field a refusal is about', async () => {
    const kit = createLifecycleTestKit(requests);
    const request = await kit.start();
    await kit.fire(request, 'submit');
    await expect(
      kit.fire(request, 'returnToApplicant', {}, { actor: 'manager' }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      problems: [{ field: 'reason' }],
    });
  });
});

describe('3. Hand over, escalate, reassign', () => {
  type State = 'awaiting' | 'done';
  interface Types {
    record: LifecycleRecord & { readonly approverId: string };
    state: State;
  }
  const invite = defineEffect<Types>({ name: 'r3.invite', run: () => null });
  const notifyTransfer = defineEffect<Types>({
    name: 'r3.notifyTransfer',
    run: () => null,
  });
  const tasks = defineLifecycle<Types>({
    name: 'r3',
    initial: 'awaiting',
    states: ['awaiting', { name: 'done', final: true }],
    transitions: {
      transfer: {
        from: 'awaiting',
        to: 'awaiting',
        set: ({ input }) => ({ approverId: String(input.to) }),
        effects: [notifyTransfer],
      },
      finish: { from: 'awaiting', to: 'done' },
    },
    onEnter: { awaiting: [invite] },
  });

  it('runs the state onEnter again on a self-transition, and restarts the wait', async () => {
    const kit = createLifecycleTestKit(tasks);
    const task = await kit.start({ approverId: 'a' });
    const before = kit.get(task);
    kit.advance({ hours: 1 });
    await kit.fire(task, 'transfer', { to: 'b' });
    const after = kit.get(task);
    expect(after).toMatchObject({ approverId: 'b', lifecycleVersion: 2 });
    expect(after.statusChangedAt).not.toBe(before.statusChangedAt);
    // Entering awaiting again invited a second time: a notification that
    // belongs only to the hand-over goes on the transition's own effects.
    expect((await kit.effects(task)).sort()).toEqual([
      'r3.invite',
      'r3.invite',
      'r3.notifyTransfer',
    ]);
  });
});

describe('4. Withdraw or reopen', () => {
  type RequestState = 'draft' | 'submitted' | 'review' | 'approved';
  const requests = defineLifecycle<{
    record: LifecycleRecord;
    state: RequestState;
  }>({
    name: 'r4',
    initial: 'draft',
    states: ['draft', 'submitted', 'review', { name: 'approved', final: true }],
    transitions: {
      submit: { from: 'draft', to: 'submitted' },
      review: { from: 'submitted', to: 'review' },
      approve: { from: 'review', to: 'approved' },
      withdraw: { from: { except: ['draft', 'approved'] }, to: 'draft' },
    },
  });

  it('starts from every non-final state but the ones excepted', () => {
    expect(requests.transitions.get('withdraw')?.from).toEqual([
      'submitted',
      'review',
    ]);
  });

  type TicketState = 'open' | 'closed';
  interface TicketTypes {
    record: LifecycleRecord & { readonly statusChangedAt: string };
    state: TicketState;
  }
  const tickets = defineLifecycle<TicketTypes>({
    name: 'r4t',
    initial: 'open',
    // Reopenable, so not final.
    states: ['open', 'closed'],
    transitions: {
      close: { from: 'open', to: 'closed' },
      reopen: {
        from: 'closed',
        to: 'open',
        guard: ({ record, now }) =>
          now.getTime() - Date.parse(record.statusChangedAt) < 7 * DAY || {
            code: 'reopenExpired',
            message: 'The ticket closed too long ago to reopen.',
          },
      },
    },
  });

  it('reopens within the window and refuses after it', async () => {
    const kit = createLifecycleTestKit(tickets);
    const ticket = await kit.start();
    await kit.fire(ticket, 'close');
    kit.advance({ days: 6 });
    expect((await kit.can(ticket, 'reopen')).allowed).toBe(true);
    kit.advance({ days: 2 });
    expect(await kit.can(ticket, 'reopen')).toMatchObject({
      allowed: false,
      blockers: [{ code: 'reopenExpired' }],
    });
  });
});

describe('5 and 21. Frozen rules, administrator parameters and initial states', () => {
  type State = 'draft' | 'submitted' | 'approved' | 'review';
  interface Types {
    record: LifecycleRecord & {
      readonly amount: number;
      readonly limitAtSubmit: number;
    };
    state: State;
    parameters: { limit: number };
  }
  const claims = defineLifecycle<Types>({
    name: 'r5',
    initial: ['draft', 'submitted'],
    states: [
      'draft',
      'submitted',
      { name: 'approved', final: true },
      { name: 'review', final: true },
    ],
    parameters: { limit: 500 },
    transitions: {
      submit: {
        from: 'draft',
        to: 'submitted',
        set: ({ parameters }) => ({ limitAtSubmit: parameters.limit }),
      },
      decide: {
        from: 'submitted',
        to: ['approved', 'review'],
        route: ({ record }) =>
          record.amount <= record.limitAtSubmit ? 'approved' : 'review',
      },
    },
  });

  function setup() {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    // Read synchronously on every transition: memory, refreshed on change.
    let overrides: { limit?: number } = {};
    runtime.register(claims, { parameters: () => overrides });
    return {
      store,
      runtime,
      setOverrides: (next: { limit?: number }) => {
        overrides = next;
      },
    };
  }

  it('applies a changed parameter at once, and judges a submitted claim by its snapshot', async () => {
    const { runtime, store, setOverrides } = setup();
    setOverrides({ limit: 1000 });
    expect(runtime.parameters('r5')).toEqual({ limit: 1000 });
    const { record } = await runtime.create(
      'r5',
      { amount: 600 },
      { actor: { id: 'a' } },
    );
    await runtime.fire('r5', record.id, 'submit', { actor: { id: 'a' } });
    // The administrator tightens the limit after submission.
    setOverrides({ limit: 100 });
    await runtime.fire('r5', record.id, 'decide', { actor: { id: 'a' } });
    expect(store.record('r5', record.id)).toMatchObject({
      status: 'approved',
      limitAtSubmit: 1000,
    });
  });

  it('creates a record in another initial state when asked, and only then', async () => {
    const { runtime } = setup();
    const { record, entry } = await runtime.create(
      'r5',
      { amount: 50, limitAtSubmit: 500 },
      { actor: SYSTEM_ACTOR, state: 'submitted', input: { source: 'import' } },
    );
    expect(record.status).toBe('submitted');
    expect(entry).toMatchObject({
      from: null,
      to: 'submitted',
      input: { source: 'import' },
    });
    await expect(
      runtime.create(
        'r5',
        { amount: 50 },
        { actor: SYSTEM_ACTOR, state: 'approved' },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_STATE' });
  });
});

describe('6 and 7. Expiry, and why a reminder is not a trigger', () => {
  type State = 'awaiting' | 'escalated';
  const withReminderTrigger = defineLifecycle<{
    record: LifecycleRecord;
    state: State;
  }>({
    name: 'r7',
    initial: 'awaiting',
    states: ['awaiting', { name: 'escalated', final: true }],
    transitions: {
      remind: { from: 'awaiting', to: 'awaiting', guard: systemOnly },
      escalate: { from: 'awaiting', to: 'escalated', guard: systemOnly },
    },
    triggers: {
      remindIdle: {
        transition: 'remind',
        when: 'awaiting',
        after: () => 2 * DAY,
      },
      escalateIdle: {
        transition: 'escalate',
        when: 'awaiting',
        after: () => 3 * DAY,
      },
    },
  });

  it('never escalates when the reminder is a self-transition', async () => {
    const kit = createLifecycleTestKit(withReminderTrigger);
    const request = await kit.start();
    for (let sweep = 0; sweep < 5; sweep += 1) {
      kit.advance({ days: 2, minutes: 1 });
      await kit.runTriggers();
    }
    // Every reminder restarted the three days; the escalation never came.
    expect(kit.get(request).status).toBe('awaiting');
    expect(await kit.history(request)).toEqual([
      '$create',
      'remind',
      'remind',
      'remind',
      'remind',
      'remind',
    ]);
  });

  const escalationOnly = defineLifecycle<{
    record: LifecycleRecord;
    state: State;
  }>({
    name: 'r7b',
    initial: 'awaiting',
    states: ['awaiting', { name: 'escalated', final: true }],
    transitions: {
      escalate: { from: 'awaiting', to: 'escalated', guard: systemOnly },
    },
    triggers: {
      escalateIdle: {
        transition: 'escalate',
        when: 'awaiting',
        after: () => 3 * DAY,
      },
    },
  });

  it('escalates on the first sweep after the wait when the reminder stays out of the lifecycle', async () => {
    const kit = createLifecycleTestKit(escalationOnly);
    const request = await kit.start();
    kit.advance({ days: 2, minutes: 1 });
    expect(await kit.runTriggers()).toBe(0);
    kit.advance({ days: 1 });
    expect(await kit.runTriggers()).toBe(1);
    expect(kit.get(request).status).toBe('escalated');
  });
});

describe('9. A background process in steps', () => {
  type State = 'draft' | 'reserving' | 'shipping' | 'backorder' | 'done';
  interface Services {
    readonly stock: { inStock: boolean };
  }
  interface Types {
    record: LifecycleRecord & { readonly trackingNumber?: string };
    state: State;
    services: Services;
  }
  const reserveStock = defineEffect<Types>({
    name: 'r9.reserveStock',
    onSuccess: 'reserved',
    onFailure: 'backordered',
    run: ({ services }) => {
      if (!services.stock.inStock) throw new Error('Out of stock.');
      return { reserved: true };
    },
  });
  const createShipment = defineEffect<Types>({
    name: 'r9.createShipment',
    onSuccess: 'shipped',
    run: () => ({ trackingNumber: 'TRK-1' }),
  });
  const orders = defineLifecycle<Types>({
    name: 'r9',
    initial: 'draft',
    states: [
      'draft',
      'reserving',
      'shipping',
      'backorder',
      { name: 'done', final: true },
    ],
    transitions: {
      submit: { from: 'draft', to: 'reserving', effects: [reserveStock] },
      reserved: {
        from: 'reserving',
        to: 'shipping',
        guard: systemOnly,
        effects: [createShipment],
      },
      backordered: {
        from: 'reserving',
        to: 'backorder',
        guard: systemOnly,
        accept: ['error'],
      },
      shipped: {
        from: 'shipping',
        to: 'done',
        guard: systemOnly,
        accept: ['trackingNumber'],
      },
      retryReserve: {
        from: 'backorder',
        to: 'reserving',
        effects: [reserveStock],
      },
    },
  });

  it('goes to backorder on failure, and runs every step once stock arrives', async () => {
    const stock = { inStock: false };
    const kit = createLifecycleTestKit(orders, { services: { stock } });
    const order = await kit.start();
    await kit.fire(order, 'submit');
    expect(kit.get(order)).toMatchObject({
      status: 'backorder',
      error: 'Out of stock.',
    });

    stock.inStock = true;
    await kit.fire(order, 'retryReserve');
    expect(kit.get(order)).toMatchObject({
      status: 'done',
      trackingNumber: 'TRK-1',
    });
    expect(await kit.history(order)).toEqual([
      '$create',
      'submit',
      'backordered',
      'retryReserve',
      'reserved',
      'shipped',
    ]);
  });
});

describe('10 and 11. Payment, its keys, and the webhook', () => {
  type State = 'approved' | 'paid' | 'needsAttention' | 'needsNewAccount';
  class PaymentDeclined extends Error {}
  interface Services {
    readonly payments: {
      outcomes: ('timeout' | 'declined' | 'frozen' | 'ok')[];
      businessKeys: string[];
      runKeys: string[];
    };
  }
  interface Types {
    record: LifecycleRecord;
    state: State;
    services: Services;
  }
  const requestPayment = defineEffect<Types>({
    name: 'r10.requestPayment',
    retry: {
      attempts: 2,
      shouldRetry: (error) => !(error instanceof PaymentDeclined),
    },
    onSuccess: 'paid',
    onFailure: 'paymentFailed',
    run: ({ record, services, idempotencyKey }) => {
      const { payments } = services;
      payments.runKeys.push(idempotencyKey);
      payments.businessKeys.push(`expense-payment:${String(record.id)}`);
      const outcome = payments.outcomes.shift() ?? 'ok';
      if (outcome === 'declined') throw new PaymentDeclined('Declined.');
      // An answer the next transition branches on, by code rather than by wording.
      if (outcome === 'frozen')
        throw new EffectFailure('payeeFrozen', 'The payee account is frozen.', {
          details: { payeeId: 'lin' },
        });
      if (outcome === 'timeout') throw new Error('Timed out.');
      return { paymentRef: 'PAY-1' };
    },
  });
  const expenses = defineLifecycle<Types>({
    name: 'r10',
    initial: 'approved',
    states: [
      'approved',
      { name: 'paid', final: true },
      'needsAttention',
      'needsNewAccount',
    ],
    transitions: {
      paid: {
        from: 'approved',
        to: 'paid',
        guard: systemOnly,
        accept: ['paymentRef'],
      },
      paymentFailed: {
        from: 'approved',
        to: ['needsAttention', 'needsNewAccount'],
        guard: systemOnly,
        route: ({ input }) =>
          input.errorCode === 'payeeFrozen'
            ? 'needsNewAccount'
            : 'needsAttention',
        accept: ['error'],
      },
      retryPayment: { from: 'needsAttention', to: 'approved' },
      accountChanged: { from: 'needsNewAccount', to: 'approved' },
    },
    onEnter: { approved: [requestPayment] },
  });

  function setup(outcomes: Services['payments']['outcomes']) {
    const payments = {
      outcomes,
      businessKeys: [] as string[],
      runKeys: [] as string[],
    };
    return {
      kit: createLifecycleTestKit(expenses, { services: { payments } }),
      payments,
    };
  }

  it('does not retry a decline', async () => {
    const { kit } = setup(['declined']);
    const expense = await kit.start();
    expect(kit.get(expense).status).toBe('needsAttention');
    expect(await kit.effectRuns(expense)).toMatchObject([
      { status: 'failed', attempts: 1 },
    ]);
  });

  it('routes a structured failure by its code, without retrying it', async () => {
    const { kit, payments } = setup(['frozen']);
    const expense = await kit.start();
    expect(kit.get(expense).status).toBe('needsNewAccount');
    expect(payments.runKeys).toHaveLength(1);
    expect((await kit.transitions(expense)).at(-1)).toMatchObject({
      transition: 'paymentFailed',
      input: {
        error: 'The payee account is frozen.',
        errorCode: 'payeeFrozen',
        details: { payeeId: 'lin' },
      },
    });
  });

  it('retries a settled run only by force, and its late success still cannot reach paid', async () => {
    const { kit, payments } = setup(['timeout', 'timeout']);
    const expense = await kit.start();
    const [failed] = await kit.effectRuns(expense);
    expect(
      await kit.runtime.retryRun(failed!.id, {
        force: true,
        reason: 'The provider confirms nothing was paid.',
      }),
    ).toMatchObject({ status: 'succeeded', attempts: 3 });
    expect(payments.runKeys).toHaveLength(3);
    // paid cannot start from needsAttention: the success is recorded and leads nowhere.
    expect(kit.get(expense).status).toBe('needsAttention');
    expect(await kit.history(expense)).toEqual(['$create', 'paymentFailed']);
  });

  it('continues a run once per outcome, even when a forced retry fails again', async () => {
    const { kit } = setup(['timeout', 'timeout', 'timeout', 'timeout']);
    const expense = await kit.start();
    const [failed] = await kit.effectRuns(expense);
    expect(
      await kit.runtime.retryRun(failed!.id, { force: true }),
    ).toMatchObject({ status: 'failed', attempts: 4 });
    expect(await kit.history(expense)).toEqual(['$create', 'paymentFailed']);
  });

  it('cannot reach paid by retrying the run, and keeps one business key across runs', async () => {
    const { kit, payments } = setup(['timeout', 'timeout']);
    const expense = await kit.start();
    expect(kit.get(expense).status).toBe('needsAttention');
    const [failed] = await kit.effectRuns(expense);

    // onFailure already moved the report on: paying now would leave it
    // waiting for attention with the money gone.
    await expect(kit.runtime.retryRun(failed!.id)).rejects.toMatchObject({
      code: 'RUN_SETTLED',
      message: expect.stringContaining('"paymentFailed"'),
    });
    expect(payments.runKeys).toHaveLength(2);

    // The explicit recovery path re-enters approved: a new run, a new run key.
    await kit.fire(expense, 'retryPayment');
    expect(kit.get(expense)).toMatchObject({
      status: 'paid',
      paymentRef: 'PAY-1',
    });
    expect(new Set(payments.runKeys).size).toBe(2);
    expect(new Set(payments.businessKeys).size).toBe(1);
  });

  it('replays a redelivered callback, and refuses one for a record that moved on', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({
      store,
      dispatcher: new HeldDispatcher(),
    });
    runtime.register(expenses, {
      services: { payments: { outcomes: [], businessKeys: [], runKeys: [] } },
    });
    const { record } = await runtime.create('r10', {}, { actor: SYSTEM_ACTOR });
    const callback = (requestId: string) =>
      runtime.fire('r10', record.id, 'paid', {
        actor: SYSTEM_ACTOR,
        requestId,
        input: { paymentRef: 'PAY-9' },
      });
    await callback('payments:evt-1');
    expect((await callback('payments:evt-1')).replayed).toBe(true);
    expect(
      refusal(
        await callback('payments:evt-2').catch((error: unknown) => error),
      ),
    ).toBe('INVALID_STATE');
    const history = await runtime.history('r10', record.id);
    expect(history.transitions.map((entry) => entry.transition)).toEqual([
      '$create',
      'paid',
    ]);
  });
});

describe('12. Refuse while an effect is in flight', () => {
  type State = 'draft' | 'approved';
  interface Services {
    readonly paying: (id: unknown) => Promise<number>;
  }
  interface Types {
    record: LifecycleRecord;
    state: State;
    services: Services;
  }
  const requestPayment = defineEffect<Types>({
    name: 'r12.requestPayment',
    run: () => null,
  });
  const expenses = defineLifecycle<Types>({
    name: 'r12',
    initial: 'approved',
    states: ['draft', 'approved'],
    transitions: {
      submit: { from: 'draft', to: 'approved' },
      withdraw: {
        from: 'approved',
        to: 'draft',
        guard: async ({ record, services }) =>
          (await services.paying(record.id)) === 0 || {
            code: 'paymentInFlight',
            message: 'A payment is being made; wait for it to finish.',
          },
      },
    },
    onEnter: { approved: [requestPayment] },
  });

  it('refuses a withdrawal while the payment is queued, and allows it once the payment ran', async () => {
    const store = new MemoryLifecycleStore();
    const held = new HeldDispatcher();
    const runtime = new LifecycleRuntime({ store, dispatcher: held });
    // An application reads the effect runs through the transaction handle; the
    // memory store has no handle, so the test reads the store itself.
    runtime.register(expenses, {
      services: {
        paying: async (id) =>
          (
            await store.listEffectRuns({
              recordId: String(id),
              effect: 'r12.requestPayment',
            })
          ).filter((run) => run.status === 'queued' || run.status === 'running')
            .length,
      },
    });
    const { record } = await runtime.create('r12', {}, { actor: { id: 'a' } });
    expect(
      await runtime.can('r12', record.id, 'withdraw', { id: 'a' }),
    ).toMatchObject({
      allowed: false,
      blockers: [{ code: 'paymentInFlight' }],
    });
    await runtime.runEffect(held.runs[0]!);
    expect(
      (await runtime.can('r12', record.id, 'withdraw', { id: 'a' })).allowed,
    ).toBe(true);
  });
});

describe('14. Wait for every signer', () => {
  type State = 'signing' | 'approved' | 'rejected';
  interface Types {
    record: LifecycleRecord & {
      readonly assignees: readonly string[];
      readonly signedBy: readonly string[];
    };
    state: State;
  }
  const reviews = defineLifecycle<Types>({
    name: 'r14',
    initial: 'signing',
    states: [
      'signing',
      { name: 'approved', final: true },
      { name: 'rejected', final: true },
    ],
    transitions: {
      sign: {
        from: 'signing',
        to: ['signing', 'approved', 'rejected'],
        guard: ({ record, actor }) =>
          (record.assignees.includes(actor.id) &&
            !record.signedBy.includes(actor.id)) || {
            code: 'notYourTurn',
            message: 'Only an assignee who has not signed yet can countersign.',
          },
        route: ({ record, actor, input }) => {
          if (input.decision === 'reject') return 'rejected';
          const signed = new Set([...record.signedBy, actor.id]);
          return record.assignees.every((id) => signed.has(id))
            ? 'approved'
            : 'signing';
        },
        set: ({ record, actor }) => ({
          signedBy: [...record.signedBy, actor.id],
        }),
      },
    },
  });
  const start = { assignees: ['a', 'b', 'c'], signedBy: [] };

  it('stays in signing until the last agreement', async () => {
    const kit = createLifecycleTestKit(reviews);
    const review = await kit.start(start);
    await kit.fire(review, 'sign', { decision: 'agree' }, { actor: 'a' });
    await kit.fire(review, 'sign', { decision: 'agree' }, { actor: 'b' });
    expect(kit.get(review).status).toBe('signing');
    await expect(
      kit.fire(review, 'sign', { decision: 'agree' }, { actor: 'b' }),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
    });
    await kit.fire(review, 'sign', { decision: 'agree' }, { actor: 'c' });
    expect(kit.get(review).status).toBe('approved');
  });

  it('ends on the first objection', async () => {
    const kit = createLifecycleTestKit(reviews);
    const review = await kit.start(start);
    await kit.fire(review, 'sign', { decision: 'reject' }, { actor: 'b' });
    expect(kit.get(review).status).toBe('rejected');
  });
});

describe('15. Wait for child tasks', () => {
  interface Services {
    countOpen(parentId: unknown): Promise<number>;
    runtime: LifecycleRuntime;
  }
  interface DocTypes {
    record: LifecycleRecord & { readonly ownerId: string };
    state: 'processing' | 'done';
    services: Services;
  }
  interface TaskTypes {
    record: LifecycleRecord & { readonly parentId: unknown };
    state: 'pending' | 'finished';
    services: Services;
  }
  const documents = defineLifecycle<DocTypes>({
    name: 'r15docs',
    initial: 'processing',
    states: ['processing', { name: 'done', final: true }],
    transitions: {
      complete: {
        from: 'processing',
        to: 'done',
        guard: async ({ record, actor, services }) => {
          if (actor.system !== true && actor.id !== record.ownerId)
            return { code: 'ownerOnly', message: 'Only the owner can finish.' };
          return (
            (await services.countOpen(record.id)) === 0 || {
              code: 'openTasks',
              message: 'Finish the outstanding tasks first.',
            }
          );
        },
      },
    },
  });
  const nudgeParent = defineEffect<TaskTypes>({
    name: 'r15.nudgeParent',
    run: async ({ record, services }) => {
      if ((await services.countOpen(record.parentId)) > 0)
        return { waiting: true };
      try {
        await services.runtime.fire(
          'r15docs',
          record.parentId as string,
          'complete',
          {
            actor: SYSTEM_ACTOR,
          },
        );
        return { completed: true };
      } catch (error) {
        if (
          error instanceof LifecycleError &&
          (error.code === 'INVALID_STATE' || error.code === 'GUARD_REJECTED')
        )
          return { completed: false, reason: error.code };
        throw error;
      }
    },
  });
  const tasks = defineLifecycle<TaskTypes>({
    name: 'r15tasks',
    initial: 'pending',
    states: ['pending', { name: 'finished', final: true }],
    transitions: {
      finish: { from: 'pending', to: 'finished', effects: [nudgeParent] },
    },
  });

  it('lets the last task finish the document as the system, and refuses the owner while tasks are open', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    const taskIds: string[] = [];
    const services: Services = {
      runtime,
      countOpen: (parentId) =>
        Promise.resolve(
          taskIds.filter((id) => {
            const task = store.record('r15tasks', id);
            return (
              task !== undefined &&
              task.parentId === parentId &&
              task.status === 'pending'
            );
          }).length,
        ),
    };
    runtime.register(documents, { services });
    runtime.register(tasks, { services });
    const { record: doc } = await runtime.create(
      'r15docs',
      { ownerId: 'olga' },
      { actor: { id: 'olga' } },
    );
    for (const _ of [1, 2])
      taskIds.push(
        String(
          store.insertRecord('r15tasks', {
            parentId: doc.id,
            status: 'pending',
            statusChangedAt: new Date().toISOString(),
            lifecycleVersion: 0,
          }).id,
        ),
      );

    expect(
      refusal(
        await runtime
          .fire('r15docs', doc.id, 'complete', { actor: { id: 'olga' } })
          .catch((error: unknown) => error),
      ),
    ).toBe('GUARD_REJECTED');
    await runtime.fire('r15tasks', taskIds[0]!, 'finish', {
      actor: { id: 'clerk' },
    });
    expect(store.record('r15docs', doc.id)?.status).toBe('processing');
    await runtime.fire('r15tasks', taskIds[1]!, 'finish', {
      actor: { id: 'clerk' },
    });
    expect(store.record('r15docs', doc.id)?.status).toBe('done');
    const last = (await runtime.history('r15docs', doc.id)).transitions.at(-1);
    expect(last).toMatchObject({ transition: 'complete', actorId: 'system' });
  });
});

describe('17. Two lifecycles on one record', () => {
  interface Order extends LifecycleRecord {
    readonly status: 'packed' | 'shipped';
    readonly paymentStatus: 'paid' | 'refunded';
  }
  function lifecycles(fulfilVersion: string, paymentVersion: string) {
    const fulfil = defineLifecycle<{
      record: Order;
      state: 'packed' | 'shipped';
    }>({
      name: 'r17fulfil',
      collection: 'r17orders',
      stateField: 'status',
      changedAtField: 'statusChangedAt',
      versionField: fulfilVersion,
      initial: 'packed',
      states: ['packed', { name: 'shipped', final: true }],
      transitions: {
        ship: {
          from: 'packed',
          to: 'shipped',
          guard: ({ record }) =>
            record.paymentStatus === 'paid' || 'The order is not paid.',
        },
      },
    });
    const payment = defineLifecycle<{
      record: Order;
      state: 'paid' | 'refunded';
    }>({
      name: 'r17payment',
      collection: 'r17orders',
      stateField: 'paymentStatus',
      changedAtField: 'paymentStatusChangedAt',
      versionField: paymentVersion,
      initial: 'paid',
      states: ['paid', { name: 'refunded', final: true }],
      transitions: {
        refund: {
          from: 'paid',
          to: 'refunded',
          guard: ({ record }) =>
            record.status !== 'shipped' || 'A shipped order is returned.',
        },
      },
    });
    return { fulfil, payment };
  }

  /**
   * Two transactions that read the same row before either writes: each plans
   * its transition on that snapshot, then makes its conditional update.
   */
  async function decideBothFromOneSnapshot(
    fulfilVersion: string,
    paymentVersion: string,
  ) {
    const { fulfil, payment } = lifecycles(fulfilVersion, paymentVersion);
    const store = new MemoryLifecycleStore();
    const order = store.insertRecord('r17orders', {
      status: 'packed',
      paymentStatus: 'paid',
      statusChangedAt: '2026-10-01T09:00:00.000Z',
      paymentStatusChangedAt: '2026-10-01T09:00:00.000Z',
      [fulfilVersion]: 0,
      [paymentVersion]: 0,
    }) as Order;
    const context = {
      actor: { id: 'clerk' },
      parameters: {},
      services: {},
      now: new Date(),
    };
    const ship = await planTransition(fulfil, order, 'ship', context);
    const refund = await planTransition(payment, order, 'refund', context);
    const shipped = await store.updateRecordIf(
      'r17orders',
      order.id,
      {
        stateField: 'status',
        state: ship.from,
        versionField: fulfilVersion,
        version: ship.version,
      },
      ship.values,
    );
    const refunded = await store.updateRecordIf(
      'r17orders',
      order.id,
      {
        stateField: 'paymentStatus',
        state: refund.from,
        versionField: paymentVersion,
        version: refund.version,
      },
      refund.values,
    );
    return { shipped, refunded, order: store.record('r17orders', order.id) };
  }

  it('lets rules that read each other both pass when the versions are separate', async () => {
    const result = await decideBothFromOneSnapshot(
      'fulfilVersion',
      'paymentVersion',
    );
    expect(result).toMatchObject({ shipped: true, refunded: true });
    expect(result.order).toMatchObject({
      status: 'shipped',
      paymentStatus: 'refunded',
    });
  });

  it('refuses the second when the version is shared', async () => {
    const result = await decideBothFromOneSnapshot(
      'lifecycleVersion',
      'lifecycleVersion',
    );
    expect(result).toMatchObject({ shipped: true, refunded: false });
    expect(result.order).toMatchObject({
      status: 'shipped',
      paymentStatus: 'paid',
    });
  });

  it('protects only a lifecycle’s own fields from its set', async () => {
    const intruder = defineLifecycle<{
      record: Order;
      state: 'packed' | 'shipped';
    }>({
      name: 'r17intruder',
      collection: 'r17orders',
      initial: 'packed',
      states: ['packed', { name: 'shipped', final: true }],
      transitions: {
        ship: {
          from: 'packed',
          to: 'shipped',
          set: () => ({ paymentStatus: 'refunded' }),
        },
      },
    });
    const kit = createLifecycleTestKit(intruder);
    const order = await kit.start({ paymentStatus: 'paid' });
    await kit.fire(order, 'ship');
    // Nothing stopped it: never let one lifecycle write the other's fields.
    expect(kit.get(order).paymentStatus).toBe('refunded');
  });
});

describe('18, 19 and 25. Many records, another plugin’s rule, and a data fix', () => {
  type State = 'awaiting' | 'approved' | 'draft';
  interface Types {
    record: LifecycleRecord & { readonly budgetId: string };
    state: State;
    services: { readonly frozen: Set<string> };
  }
  const expenses = defineLifecycle<Types>({
    name: 'r18',
    initial: 'awaiting',
    states: ['awaiting', { name: 'approved', final: true }, 'draft'],
    transitions: {
      approve: { from: 'awaiting', to: 'approved' },
      note: { from: 'awaiting', to: 'awaiting' },
      repair: {
        from: 'awaiting',
        to: 'draft',
        guard: systemOnly,
        validate: (input) => (input.reason ? null : 'Say why.'),
        accept: ['reason'],
      },
      resubmit: { from: 'draft', to: 'awaiting' },
    },
  });

  function setup() {
    const frozen = new Set<string>();
    const kit = createLifecycleTestKit(expenses, { services: { frozen } });
    return { kit, frozen };
  }

  it('approves many records one by one and reports a stale one as a conflict', async () => {
    const { kit } = setup();
    const records = [await kit.start(), await kit.start(), await kit.start()];
    const shown = records.map((record) => ({
      id: record.id,
      version: kit.get(record).lifecycleVersion as number,
    }));
    // One changes after the page loaded.
    await kit.fire(records[1]!, 'note');
    const results = [];
    for (const { id, version } of shown) {
      try {
        await kit.runtime.fire('r18', id, 'approve', {
          actor: { id: 'approver' },
          requestId: `batch-1:${String(id)}`,
          expect: { version },
        });
        results.push({ id, ok: true });
      } catch (error) {
        results.push({ id, ok: false, code: refusal(error) });
      }
    }
    expect(results.map((result) => result.ok)).toEqual([true, false, true]);
    expect(results[1]).toMatchObject({ code: 'CONFLICT' });
  });

  it('lets another plugin veto a transition until it removes its guard', async () => {
    const { kit, frozen } = setup();
    const expense = await kit.start({ budgetId: 'B1' });
    const remove = kit.runtime.addGuard<Types>(
      'r18',
      ['approve'],
      ({ record, services }) =>
        !services.frozen.has(record.budgetId) || {
          code: 'budgetFrozen',
          message: 'Frozen.',
        },
    );
    frozen.add('B1');
    expect(await kit.can(expense, 'approve')).toMatchObject({
      allowed: false,
      blockers: [{ code: 'budgetFrozen' }],
    });
    remove();
    expect((await kit.can(expense, 'approve')).allowed).toBe(true);
  });

  it('runs a data fix as a system transition that a rerun of the script replays', async () => {
    const { kit } = setup();
    const expense = await kit.start();
    const repair = () =>
      kit.runtime.fire('r18', expense.id, 'repair', {
        actor: SYSTEM_ACTOR,
        input: { reason: 'Approver left; OPS-123' },
        requestId: `repair:OPS-123:${String(expense.id)}`,
      });
    await repair();
    expect((await repair()).replayed).toBe(true);
    expect(kit.get(expense)).toMatchObject({
      status: 'draft',
      reason: 'Approver left; OPS-123',
    });
    expect(await kit.history(expense)).toEqual(['$create', 'repair']);
    await expect(kit.fire(expense, 'resubmit')).resolves.toMatchObject({
      status: 'awaiting',
    });
    await expect(
      kit.fire(expense, 'repair', { reason: 'x' }),
    ).rejects.toMatchObject({
      code: 'GUARD_REJECTED',
    });
  });
});
