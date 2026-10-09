// What happens after an effect: the transition it continues with commits with
// its outcome, a refusal of that continuation — its own or one raised by a
// lifecycle call its onTransition made — undoes the continuation and nothing
// of the outcome, and what follows the commit is told in cause-then-effect
// order. A refusal that would be the same next time does not run the effect
// again, and nobody else can spend the request id a continuation needs.
import { describe, expect, it, vi } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  EffectFailure,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  lifecycleErrorFields,
  type EffectDispatcher,
  type JsonObject,
  type Lifecycle,
  type LifecycleError,
  type LifecycleLogger,
  type LifecycleRecord,
  type TransitionDefinition,
} from '../src/index.js';

interface Services {
  readonly runtime: () => LifecycleRuntime;
  /** What the effects did, in order. */
  readonly calls: string[];
}

interface Order extends LifecycleRecord {
  readonly status: 'open' | 'closed';
  readonly blocked: boolean;
}

interface OrderTypes {
  record: Order;
  state: Order['status'];
  services: Services;
}

interface Task extends LifecycleRecord {
  readonly status: 'todo' | 'working' | 'done';
  readonly orderId: string;
}

interface TaskTypes {
  record: Task;
  state: Task['status'];
  services: Services;
}

const notifyCustomer = defineEffect<OrderTypes>({
  name: 'orders.notify',
  run: ({ services }) => void services.calls.push('orders.notify'),
});

const orders: Lifecycle<OrderTypes> = defineLifecycle<OrderTypes>({
  name: 'orders',
  initial: 'open',
  states: ['open', { name: 'closed', final: true }],
  transitions: {
    complete: {
      from: 'open',
      to: 'closed',
      guard: ({ record }) =>
        !record.blocked || {
          code: 'ORDER_BLOCKED',
          message: 'The order is blocked.',
          kind: 'precondition',
        },
    },
  },
  onEnter: { closed: [notifyCustomer] },
});

const work = defineEffect<TaskTypes>({
  name: 'tasks.work',
  retry: { attempts: 3 },
  onSuccess: 'finish',
  run: ({ services }) => {
    services.calls.push('tasks.work');
    return { done: true };
  },
});

const archive = defineEffect<TaskTypes>({
  name: 'tasks.archive',
  run: ({ services }) => void services.calls.push('tasks.archive'),
});

const tasks: Lifecycle<TaskTypes> = defineLifecycle<TaskTypes>({
  name: 'tasks',
  initial: 'todo',
  states: ['todo', 'working', { name: 'done', final: true }],
  transitions: {
    start: { from: 'todo', to: 'working' },
    // Sent back to be started over: a new stay in `working` later.
    reset: { from: 'working', to: 'todo' },
    // The last task moves its order on, in the same commit.
    finish: {
      from: 'working',
      to: 'done',
      onTransition: async ({ record, services, transactionHandle }) => {
        await services.runtime().fire('orders', record.orderId, 'complete', {
          actor: SYSTEM_ACTOR,
          transaction: transactionHandle,
        });
      },
    },
  },
  // The work of each stay in `working`, whichever transition began it.
  onEnter: { working: [work], done: [archive] },
});

/** Keeps every run it is handed, so a test runs each one when it chooses. */
class HeldDispatcher implements EffectDispatcher {
  public readonly handed: string[] = [];

  public constructor(
    private readonly store: MemoryLifecycleStore,
    private readonly trace: string[],
  ) {}

  public async dispatch(runId: string): Promise<void> {
    this.handed.push(runId);
    const run = await this.store.findEffectRun(runId);
    this.trace.push(`dispatch ${run?.effect ?? runId}`);
  }
}

function setup() {
  const store = new MemoryLifecycleStore();
  const trace: string[] = [];
  const dispatcher = new HeldDispatcher(store, trace);
  const logger = {
    warn: vi.fn<LifecycleLogger['warn']>(),
    error: vi.fn<LifecycleLogger['error']>(),
  };
  const clock = { now: new Date('2026-10-01T09:00:00.000Z') };
  const runtime = new LifecycleRuntime({
    store,
    dispatcher,
    logger,
    clock: () => clock.now,
  });
  const services: Services = { runtime: () => runtime, calls: [] };
  runtime.register(orders, { services });
  runtime.register(tasks, { services });
  runtime.on('completed', {}, ({ lifecycle, transition }) => {
    trace.push(`completed ${lifecycle}.${transition}`);
  });
  const order = store.insertRecord('orders', {
    status: 'open',
    lifecycleVersion: 0,
    blocked: false,
  });
  const task = store.insertRecord('tasks', {
    status: 'todo',
    lifecycleVersion: 0,
    orderId: String(order.id),
  });
  return {
    store,
    trace,
    dispatcher,
    logger,
    runtime,
    services,
    order,
    task,
    clock,
  };
}

async function startWork(context: ReturnType<typeof setup>): Promise<string> {
  const started = await context.runtime.fire(
    'tasks',
    context.task.id,
    'start',
    {
      actor: SYSTEM_ACTOR,
    },
  );
  context.trace.length = 0;
  return started.effectRuns[0].id;
}

describe('an effect’s continuation', () => {
  it('is told about before what its onTransition started', async () => {
    const context = setup();
    const runId = await startWork(context);
    await context.runtime.runEffect(runId);
    expect(context.trace).toEqual([
      'completed tasks.finish',
      'dispatch tasks.archive',
      'completed orders.complete',
      'dispatch orders.notify',
    ]);
    expect(context.store.record('tasks', context.task.id)?.status).toBe('done');
    expect(context.store.record('orders', context.order.id)?.status).toBe(
      'closed',
    );
  });

  it('is undone as a whole when a lifecycle call in its onTransition is refused, and waits for the sweep', async () => {
    const context = setup();
    context.store.patchRecord('orders', context.order.id, { blocked: true });
    const runId = await startWork(context);
    const run = await context.runtime.runEffect(runId);

    // The effect ran once and its success is recorded.
    expect(context.services.calls).toEqual(['tasks.work']);
    expect(run).toMatchObject({ status: 'succeeded', result: { done: true } });
    // Neither the task nor its order moved: no half of the continuation
    // committed, so no `done` task is left without the run its onEnter owes.
    expect(context.store.record('tasks', context.task.id)).toMatchObject({
      status: 'working',
      lifecycleVersion: 1,
    });
    expect(context.store.record('orders', context.order.id)).toMatchObject({
      status: 'open',
      lifecycleVersion: 0,
    });
    const history = await context.runtime.history('tasks', context.task.id);
    expect(history.transitions.map((entry) => entry.transition)).toEqual([
      'start',
    ]);
    expect(history.effectRuns.map((each) => each.effect)).toEqual([
      'tasks.work',
    ]);
    expect(
      (await context.runtime.history('orders', context.order.id)).transitions,
    ).toEqual([]);
    // Nothing is told and nothing more is handed over.
    expect(context.trace).toEqual([]);
    expect(context.dispatcher.handed).toEqual([runId]);
    // The task did not move on: its order refused, so the continuation
    // waits rather than being dropped.
    expect(run?.continuation).toMatchObject({
      transition: 'finish',
      code: 'GUARD_REJECTED',
      attempts: 1,
    });
    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('The order is blocked.'),
      expect.objectContaining({ runId, code: 'GUARD_REJECTED' }),
    );
    expect(context.logger.error).not.toHaveBeenCalled();

    // Once the order is unblocked, the next sweep it is due on finishes the
    // task and completes the order, and the effect does not run again.
    context.store.patchRecord('orders', context.order.id, { blocked: false });
    context.clock.now = new Date(context.clock.now.getTime() + 60_000);
    await expect(context.runtime.reclaim()).resolves.toBe(1);
    expect(context.store.record('tasks', context.task.id)?.status).toBe('done');
    expect(context.store.record('orders', context.order.id)?.status).toBe(
      'closed',
    );
    await expect(context.store.findEffectRun(runId)).resolves.toMatchObject({
      continuation: null,
    });
    expect(context.services.calls).toEqual(['tasks.work']);
    expect(context.trace).toEqual([
      'completed tasks.finish',
      'dispatch tasks.archive',
      'completed orders.complete',
      'dispatch orders.notify',
    ]);
  });

  it('answers a parent that no longer exists, at continueRun(), as a failed precondition and not as a missing resource', async () => {
    const context = setup();
    context.store.patchRecord('tasks', context.task.id, { orderId: '999' });
    const runId = await startWork(context);
    await context.runtime.runEffect(runId);
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      continuation: { transition: 'finish', code: 'RECORD_NOT_FOUND' },
    });

    const refused = await context.runtime.continueRun(runId).then(
      () => undefined,
      (error: unknown) => error as LifecycleError,
    );
    expect(refused).toMatchObject({ code: 'RECORD_NOT_FOUND' });
    // The run and its record are there: what is missing is the parent the
    // continuation's onTransition fires, which the operator cannot fix by
    // asking again.
    expect(
      refused && lifecycleErrorFields(refused, { continuation: true }),
    ).toEqual({
      status: 'FAILED_PRECONDITION',
      reason: 'RECORD_NOT_FOUND',
      message: refused?.message,
      metadata: { blockers: [], problems: [] },
    });
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      continuation: { code: 'RECORD_NOT_FOUND', attempts: 2 },
    });
  });

  it('records the outcome without running the effect again when the continuation refuses its input', async () => {
    const context = setup();
    const strict = defineLifecycle<TaskTypes>({
      name: 'strictTasks',
      collection: 'tasks',
      initial: 'todo',
      states: ['todo', 'working', { name: 'done', final: true }],
      transitions: {
        start: { from: 'todo', to: 'working', effects: [work] },
        finish: {
          from: 'working',
          to: 'done',
          // The effect returns no reference: the same next time.
          validate: (input: JsonObject) =>
            typeof input.reference === 'string'
              ? null
              : [{ field: 'reference', message: 'A reference is required.' }],
        },
      },
    });
    context.runtime.register(strict, { services: context.services });
    const started = await context.runtime.fire(
      'strictTasks',
      context.task.id,
      'start',
      { actor: SYSTEM_ACTOR },
    );
    const runId = started.effectRuns[0].id;
    const run = await context.runtime.runEffect(runId);

    expect(context.services.calls).toEqual(['tasks.work']);
    expect(run).toMatchObject({
      status: 'succeeded',
      attempts: 1,
      // Waiting for a definition that accepts it; see pending-continuation.test.ts.
      continuation: {
        transition: 'finish',
        code: 'INVALID_INPUT',
        input: { done: true },
      },
    });
    expect(context.dispatcher.handed).toEqual([runId]);
    expect(context.store.record('tasks', context.task.id)?.status).toBe(
      'working',
    );
    expect(context.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('A reference is required.'),
      expect.objectContaining({ runId, code: 'INVALID_INPUT' }),
    );
  });

  it('cannot have its request id spent by a caller first', async () => {
    const context = setup();
    const runId = await startWork(context);
    for (const requestId of [
      '',
      `$run:${runId}:succeeded`,
      `$run:${runId}:failed`,
      '$v:2',
    ]) {
      const refusal = await context.runtime
        .fire('tasks', context.task.id, 'finish', {
          actor: SYSTEM_ACTOR,
          requestId,
        })
        .then(
          () => undefined,
          (error: unknown) => error as LifecycleError,
        );
      expect(refusal).toMatchObject({ code: 'INVALID_REQUEST_ID' });
      expect(refusal && lifecycleErrorFields(refusal)).toMatchObject({
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_REQUEST_ID',
        fieldViolations: [{ field: 'requestId' }],
      });
    }
    // The run continues its record as if nobody had tried.
    await expect(context.runtime.runEffect(runId)).resolves.toMatchObject({
      status: 'succeeded',
    });
    expect(context.services.calls).toEqual(['tasks.work']);
    expect(context.store.record('tasks', context.task.id)?.status).toBe('done');
    expect(context.store.record('orders', context.order.id)?.status).toBe(
      'closed',
    );
    // An ordinary request id is still a caller's to use.
    const other = setup();
    await expect(
      other.runtime.fire('tasks', other.task.id, 'start', {
        actor: SYSTEM_ACTOR,
        requestId: 'form-1$',
      }),
    ).resolves.toMatchObject({ entry: { requestId: 'form-1$' } });
  });
});

describe('an EffectFailure’s details', () => {
  interface Payment extends LifecycleRecord {
    readonly status: 'paying' | 'failed' | 'paid';
    readonly failure?: JsonObject;
  }

  interface PaymentTypes {
    record: Payment;
    state: Payment['status'];
    services: { readonly details: () => JsonObject };
  }

  const pay = defineEffect<PaymentTypes>({
    name: 'payments.pay',
    onSuccess: 'settle',
    onFailure: 'fail',
    run: ({ services }) => {
      throw new EffectFailure('declined', 'The card was declined.', {
        details: services.details(),
      });
    },
  });

  const payments = defineLifecycle<PaymentTypes>({
    name: 'payments',
    initial: 'paying',
    states: [
      'paying',
      { name: 'failed', final: true },
      { name: 'paid', final: true },
    ],
    transitions: {
      start: { from: 'paying', to: 'paying', effects: [pay] },
      settle: { from: 'paying', to: 'paid' },
      fail: {
        from: 'paying',
        to: 'failed',
        set: ({ input }) => ({ failure: input }),
      },
    },
  });

  it.each([
    ['a BigInt', (): JsonObject => ({ amount: 10n }) as unknown as JsonObject],
    [
      'a cycle',
      (): JsonObject => {
        const details: Record<string, unknown> = {};
        details.self = details;
        return details as JsonObject;
      },
    ],
  ])(
    'that are not JSON, %s, fail the run as any failure would',
    async (_, details) => {
      const store = new MemoryLifecycleStore();
      const logger = {
        warn: vi.fn<LifecycleLogger['warn']>(),
        error: vi.fn<LifecycleLogger['error']>(),
      };
      const runtime = new LifecycleRuntime({ store, logger });
      runtime.register(payments, { services: { details } });
      const payment = store.insertRecord('payments', {
        status: 'paying',
        lifecycleVersion: 0,
      });
      const started = await runtime.fire('payments', payment.id, 'start', {
        actor: SYSTEM_ACTOR,
      });
      const [run] = (await runtime.history('payments', payment.id)).effectRuns;
      expect(run).toMatchObject({
        id: started.effectRuns[0].id,
        status: 'failed',
        attempts: 1,
        claimedAt: null,
      });
      expect(store.record('payments', payment.id)).toMatchObject({
        status: 'failed',
        failure: {
          error: 'The card was declined.',
          errorCode: 'declined',
          details: {},
        },
      });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('not JSON'),
        expect.objectContaining({ runId: run.id }),
      );
    },
  );
});

describe('a trigger refused on a sweep', () => {
  interface Reminder extends LifecycleRecord {
    readonly status: 'waiting' | 'expired';
    readonly orderId?: string;
  }
  interface ReminderTypes {
    record: Reminder;
    state: Reminder['status'];
    services: Services;
  }

  function sweepSetup(expire: TransitionDefinition<ReminderTypes>) {
    const reminders = defineLifecycle<ReminderTypes>({
      name: 'reminders',
      initial: 'waiting',
      states: ['waiting', { name: 'expired', final: true }],
      transitions: { expire },
      triggers: {
        expireIdle: { transition: 'expire', when: 'waiting', after: () => 0 },
      },
    });
    const store = new MemoryLifecycleStore();
    const logger = {
      warn: vi.fn<LifecycleLogger['warn']>(),
      error: vi.fn<LifecycleLogger['error']>(),
    };
    const runtime = new LifecycleRuntime({
      store,
      logger,
      clock: () => new Date('2026-10-02T00:00:00Z'),
    });
    const services: Services = { runtime: () => runtime, calls: [] };
    runtime.register(orders, { services });
    runtime.register(reminders, { services });
    const order = store.insertRecord('orders', {
      status: 'open',
      lifecycleVersion: 0,
      blocked: true,
    });
    const reminder = store.insertRecord('reminders', {
      status: 'waiting',
      statusChangedAt: '2026-10-01T00:00:00.000Z',
      lifecycleVersion: 0,
      orderId: String(order.id),
    });
    return { store, logger, runtime, reminder };
  }

  it('passes over a record its own guard refuses without a word, sweep after sweep', async () => {
    const { logger, runtime, store, reminder } = sweepSetup({
      from: 'waiting',
      to: 'expired',
      guard: () => ({ code: 'ON_HOLD', message: 'On hold.' }),
    });
    for (let sweep = 0; sweep < 3; sweep += 1)
      await expect(runtime.runTriggers()).resolves.toBe(0);
    expect(store.record('reminders', reminder.id)?.status).toBe('waiting');
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('says so on the 1st, 2nd, 4th… sweep when a lifecycle call in its onTransition is refused', async () => {
    const { logger, runtime, store, reminder } = sweepSetup({
      from: 'waiting',
      to: 'expired',
      // The blocked order refuses, on every sweep, until someone unblocks it.
      onTransition: ({ record, tx }) =>
        tx
          .fire('orders', String(record.orderId), 'complete', {
            actor: SYSTEM_ACTOR,
          })
          .then(() => undefined),
    });
    for (let sweep = 0; sweep < 5; sweep += 1)
      await expect(runtime.runTriggers()).resolves.toBe(0);
    expect(store.record('reminders', reminder.id)?.status).toBe('waiting');
    // Not on every sweep: a blocked parent may stay blocked for days.
    expect(logger.warn.mock.calls.map(([, details]) => details)).toEqual(
      [1, 2, 4].map((sweeps) => ({
        lifecycle: 'reminders',
        recordId: String(reminder.id),
        transition: 'expire',
        code: 'GUARD_REJECTED',
        sweeps,
      })),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('The order is blocked.'),
      expect.anything(),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('counts again from the first sweep once the refusal changes', async () => {
    const { logger, runtime, store, reminder } = sweepSetup({
      from: 'waiting',
      to: 'expired',
      onTransition: ({ record, tx }) =>
        tx
          .fire('orders', String(record.orderId), 'complete', {
            actor: SYSTEM_ACTOR,
          })
          .then(() => undefined),
    });
    for (let sweep = 0; sweep < 3; sweep += 1) await runtime.runTriggers();
    expect(logger.warn).toHaveBeenCalledTimes(2);
    // The order is gone now: another refusal, said at once.
    const order = store.record('orders', String(reminder.orderId));
    store.patchRecord('orders', String(order?.id), { status: 'closed' });
    await runtime.runTriggers();
    expect(logger.warn).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ code: 'INVALID_STATE', sweeps: 1 }),
    );
  });
});

describe('a continuation bound to the stay its run was queued for', () => {
  /** Sends the task back and starts it again: the same state, a new stay. */
  async function startOver(context: ReturnType<typeof setup>): Promise<string> {
    await context.runtime.fire('tasks', context.task.id, 'reset', {
      actor: SYSTEM_ACTOR,
    });
    const again = await context.runtime.fire(
      'tasks',
      context.task.id,
      'start',
      { actor: SYSTEM_ACTOR },
    );
    return again.effectRuns[0].id;
  }

  it('is not used for a new stay in the same state once the record left and came back', async () => {
    const context = setup();
    context.store.patchRecord('orders', context.order.id, { blocked: true });
    const runId = await startWork(context);
    await context.runtime.runEffect(runId);
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      continuation: { transition: 'finish', code: 'GUARD_REJECTED' },
    });

    // Sent back and submitted again: in `working` again, for a new round
    // whose own work has not been done yet.
    const second = await startOver(context);
    context.store.patchRecord('orders', context.order.id, { blocked: false });
    context.clock.now = new Date(context.clock.now.getTime() + 60_000);
    context.trace.length = 0;
    await expect(context.runtime.reclaim()).resolves.toBe(0);

    // The old outcome did not finish the new round, and nothing waits on it.
    expect(context.store.record('tasks', context.task.id)?.status).toBe(
      'working',
    );
    expect(context.store.record('orders', context.order.id)?.status).toBe(
      'open',
    );
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      status: 'succeeded',
      continuation: null,
    });
    expect(context.trace).toEqual([]);
    expect(context.logger.warn).toHaveBeenLastCalledWith(
      expect.stringContaining('no longer continues with "finish"'),
      expect.objectContaining({ runId, code: 'INVALID_STATE' }),
    );
    // The new round's own run continues it.
    await context.runtime.runEffect(second);
    expect(context.store.record('tasks', context.task.id)?.status).toBe('done');
  });

  it('is refused by continueRun() with INVALID_STATE, and dropped', async () => {
    const context = setup();
    context.store.patchRecord('orders', context.order.id, { blocked: true });
    const runId = await startWork(context);
    await context.runtime.runEffect(runId);
    await startOver(context);
    context.store.patchRecord('orders', context.order.id, { blocked: false });

    const refused = await context.runtime.continueRun(runId).then(
      () => undefined,
      (error: unknown) => error as LifecycleError,
    );
    expect(refused).toMatchObject({ code: 'INVALID_STATE' });
    // Named by the transition that left the stay, not the latest one.
    expect(refused?.message).toContain('has moved on with "reset"');
    expect(context.store.record('tasks', context.task.id)?.status).toBe(
      'working',
    );
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      continuation: null,
    });
  });

  it('does not continue a record that left and came back while the effect ran', async () => {
    const context = setup();
    const runId = await startWork(context);
    const second = await startOver(context);

    await expect(context.runtime.runEffect(runId)).resolves.toMatchObject({
      status: 'succeeded',
      continuation: null,
    });
    expect(context.store.record('tasks', context.task.id)?.status).toBe(
      'working',
    );
    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('could not continue with "finish"'),
      expect.objectContaining({ runId, code: 'INVALID_STATE' }),
    );
    await context.runtime.runEffect(second);
    expect(context.store.record('tasks', context.task.id)?.status).toBe('done');
  });

  it('still continues after an edit that only advanced the version', async () => {
    const context = setup();
    context.store.patchRecord('orders', context.order.id, { blocked: true });
    const runId = await startWork(context);
    await context.runtime.runEffect(runId);
    // An edit form advances the version without a transition.
    context.store.patchRecord('tasks', context.task.id, {
      lifecycleVersion: 7,
    });
    context.store.patchRecord('orders', context.order.id, { blocked: false });
    context.clock.now = new Date(context.clock.now.getTime() + 60_000);
    await expect(context.runtime.reclaim()).resolves.toBe(1);
    expect(context.store.record('tasks', context.task.id)?.status).toBe('done');
  });
});
