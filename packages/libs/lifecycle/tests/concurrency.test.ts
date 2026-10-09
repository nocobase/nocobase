// Races and crashes, staged one step at a time on a memory store: what two
// sweeps, two workers or a stop between two writes must not be able to do.
import { describe, expect, it } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  LifecycleRuntime,
  MemoryLifecycleStore,
  planTransition,
  type EffectDispatcher,
  type Lifecycle,
  type LifecycleRecord,
  type LifecycleStore,
} from '../src/index.js';

type OrderState = 'waiting' | 'approved' | 'paid';

interface Order extends LifecycleRecord {
  readonly status: OrderState;
  readonly approverId: string;
  readonly paymentRef: string | null;
}

interface Controls {
  pay(attempt: number, key: string): Promise<{ ref: string }>;
  /** Makes recording the payment throw, as a database error would. */
  breakRecording: boolean;
  /** Makes recording the payment refuse once with a conflict. */
  conflictOnce: boolean;
}

interface OrderTypes {
  record: Order;
  state: OrderState;
  parameters: { escalateAfterMinutes: number };
  services: Controls;
}

const NEXT_APPROVER: Readonly<Record<string, string>> = { a: 'b', b: 'c' };

const pay = defineEffect<OrderTypes>({
  name: 'orders.pay',
  retry: { attempts: 2 },
  onSuccess: 'paid',
  run: ({ services, attempt, idempotencyKey }) =>
    services.pay(attempt, idempotencyKey),
});

const orders: Lifecycle<OrderTypes> = defineLifecycle<OrderTypes>({
  name: 'orders',
  initial: 'waiting',
  states: ['waiting', 'approved', { name: 'paid', final: true }],
  parameters: { escalateAfterMinutes: 10 },
  transitions: {
    escalate: {
      from: 'waiting',
      to: 'waiting',
      guard: ({ record, actor }) =>
        actor.system === true && NEXT_APPROVER[record.approverId] !== undefined,
      set: ({ record }) => ({ approverId: NEXT_APPROVER[record.approverId] }),
    },
    approve: {
      from: 'waiting',
      to: 'approved',
      guard: ({ record, actor }) => actor.id === record.approverId,
    },
    paid: {
      from: 'approved',
      to: 'paid',
      guard: ({ actor }) => actor.system === true,
      set: ({ input, services }) => {
        if (services.breakRecording) throw new Error('The database went away.');
        if (services.conflictOnce) {
          services.conflictOnce = false;
          throw new LifecycleError('CONFLICT', 'Someone else wrote it first.');
        }
        return { paymentRef: String(input.ref) };
      },
    },
  },
  onEnter: { approved: [pay] },
  triggers: {
    escalateIdle: {
      transition: 'escalate',
      when: 'waiting',
      after: ({ escalateAfterMinutes }) => escalateAfterMinutes * 60_000,
    },
  },
});

/** A promise and the function that settles it. */
function gate<T>(): { promise: Promise<T>; open(value: T): void } {
  let open!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

/** Hands runs to the test instead of running them. */
class HeldDispatcher implements EffectDispatcher {
  public readonly runs: string[] = [];

  public dispatch(runId: string): Promise<void> {
    this.runs.push(runId);
    return Promise.resolve();
  }
}

function setup(options: { dispatcher?: EffectDispatcher } = {}) {
  const store = new MemoryLifecycleStore();
  let now = new Date('2026-10-01T09:00:00Z').getTime();
  const keys: string[] = [];
  const controls: Controls = {
    pay: (attempt, key) => {
      keys.push(key);
      return Promise.resolve({ ref: `PAY-${attempt}` });
    },
    breakRecording: false,
    conflictOnce: false,
  };
  const make = (over: LifecycleStore = store): LifecycleRuntime => {
    const runtime = new LifecycleRuntime({
      store: over,
      clock: () => new Date(now),
      leaseMs: 60_000,
      ...(options.dispatcher ? { dispatcher: options.dispatcher } : {}),
    });
    runtime.register(orders, { services: controls });
    return runtime;
  };
  const order = store.insertRecord('orders', {
    status: 'waiting',
    approverId: 'a',
    paymentRef: null,
    statusChangedAt: new Date(now).toISOString(),
    lifecycleVersion: 0,
  });
  return {
    store,
    controls,
    keys,
    make,
    id: order.id,
    advance: (minutes: number): void => {
      now += minutes * 60_000;
    },
    record: (): Order => store.record('orders', order.id) as Order,
  };
}

describe('lifecycle concurrency', () => {
  it('does not write a self-transition decided on a version that has moved on', async () => {
    const { store, make, id, record, controls } = setup();
    const runtime = make();
    const stale = record();
    await runtime.fire('orders', id, 'escalate', {
      actor: { id: 'system', system: true },
    });
    // A second escalation planned from the record as it was before the
    // first one: same state, so only the version tells them apart.
    const plan = await planTransition(orders, stale, 'escalate', {
      actor: { id: 'system', system: true },
      parameters: { escalateAfterMinutes: 10 },
      services: controls,
      now: new Date(),
    });
    expect(
      await store.updateRecordIf(
        'orders',
        id,
        {
          stateField: 'status',
          state: plan.from,
          versionField: 'lifecycleVersion',
          version: plan.version,
        },
        plan.values,
      ),
    ).toBe(false);
    expect(record()).toMatchObject({ approverId: 'b', lifecycleVersion: 1 });
  });

  it('refuses a decision made on a page that showed an older version', async () => {
    const { make, id } = setup();
    const runtime = make();
    await runtime.fire('orders', id, 'escalate', {
      actor: { id: 'system', system: true },
    });
    await expect(
      runtime.fire('orders', id, 'approve', {
        actor: { id: 'b' },
        expect: { version: 0 },
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('numbers every log entry with the version it wrote', async () => {
    const { make, id } = setup();
    const runtime = make();
    await runtime.fire('orders', id, 'escalate', {
      actor: { id: 'system', system: true },
    });
    await runtime.fire('orders', id, 'approve', { actor: { id: 'b' } });
    const { transitions } = await runtime.history('orders', id);
    expect(transitions.map((entry) => entry.version)).toEqual([1, 2, 3]);
  });

  it('does not escalate twice when a second sweep read the record before the first committed', async () => {
    const { store, make, advance, record } = setup();
    advance(11);
    const seen = await store.findIdleRecords('orders', {
      stateField: 'status',
      states: ['waiting'],
      changedAtField: 'statusChangedAt',
      changedBefore: new Date(
        Date.parse(record().statusChangedAt as string) + 60_000,
      ).toISOString(),
      limit: 10,
    });
    expect(await make().runTriggers()).toBe(1);
    // The second sweep still holds what it read before the first one wrote.
    const late: LifecycleStore = Object.assign(
      Object.create(store) as LifecycleStore,
      {
        findIdleRecords: () => Promise.resolve(seen),
      },
    );
    expect(await make(late).runTriggers()).toBe(0);
    expect(record()).toMatchObject({ approverId: 'b' });
  });

  it('drops the outcome of an attempt that recover() took back', async () => {
    const dispatcher = new HeldDispatcher();
    const { make, id, controls, advance, record } = setup({ dispatcher });
    const runtime = make();
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    const [runId] = dispatcher.runs;
    const first = gate<{ ref: string }>();
    const second = gate<{ ref: string }>();
    const started = gate<undefined>();
    controls.pay = (attempt) => {
      started.open(undefined);
      return attempt === 1 ? first.promise : second.promise;
    };

    const stalled = runtime.runEffect(runId!);
    await started.promise;
    advance(2);
    await runtime.recover();
    const replacement = runtime.runEffect(runId!);
    // The stalled attempt answers while its replacement is still running.
    first.open({ ref: 'PAY-1' });
    await stalled;
    expect(record()).toMatchObject({ status: 'approved' });
    second.open({ ref: 'PAY-2' });
    const run = await replacement;

    expect(run).toMatchObject({
      status: 'succeeded',
      attempts: 2,
      result: { ref: 'PAY-2' },
    });
    expect(record()).toMatchObject({ status: 'paid', paymentRef: 'PAY-2' });
    const { transitions } = await runtime.history('orders', id);
    expect(transitions.map((entry) => entry.transition)).toEqual([
      'approve',
      'paid',
    ]);
  });

  it('queues an attempt again when recording its outcome fails, instead of leaving it claimed', async () => {
    const dispatcher = new HeldDispatcher();
    const { make, id, controls, record, keys, store } = setup({ dispatcher });
    const runtime = make();
    controls.breakRecording = true;
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    const [runId] = dispatcher.runs;
    expect(await runtime.runEffect(runId!)).toMatchObject({
      status: 'queued',
      attempts: 1,
      claimedAt: null,
      error: expect.stringContaining('could not be recorded'),
    });
    // Neither the success nor the payment it should have recorded stuck,
    // and the run was handed over again rather than waiting for a lease.
    expect(record()).toMatchObject({ status: 'approved', paymentRef: null });
    expect(dispatcher.runs).toEqual([runId, runId]);

    controls.breakRecording = false;
    expect(await runtime.runEffect(runId!)).toMatchObject({
      status: 'succeeded',
      attempts: 2,
    });
    expect(record()).toMatchObject({ status: 'paid', paymentRef: 'PAY-2' });
    expect(await store.findEffectRun(runId!)).toMatchObject({ attempts: 2 });
    // Paid twice, under one key: the payment service makes it count once.
    expect(new Set(keys).size).toBe(1);
  });

  it('gives up once every attempt failed to record, and a retry counts on from there', async () => {
    const { make, id, controls, record, keys } = setup();
    const runtime = make();
    controls.breakRecording = true;
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    const [run] = (await runtime.history('orders', id)).effectRuns;
    expect(run).toMatchObject({ status: 'dead', attempts: 2 });
    expect(record()).toMatchObject({ status: 'approved', paymentRef: null });
    expect(keys).toHaveLength(2);

    controls.breakRecording = false;
    // A fresh budget, not a fresh count: attempt 3 cannot be mistaken for
    // an attempt 1 that is still finishing somewhere.
    expect(await runtime.retryRun(run!.id)).toMatchObject({
      status: 'succeeded',
      attempts: 3,
      maxAttempts: 4,
    });
    expect(record()).toMatchObject({ status: 'paid', paymentRef: 'PAY-3' });
    expect(new Set(keys).size).toBe(1);
  });

  it('gives up on a run whose every attempt was interrupted, without failing over', async () => {
    const dispatcher = new HeldDispatcher();
    const { make, id, store, advance, record, keys } = setup({ dispatcher });
    const runtime = make();
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    const [runId] = dispatcher.runs;
    // Both attempts were claimed by processes that then stopped.
    await store.updateEffectRun(
      runId!,
      { status: 'queued' },
      { status: 'running', attempts: 2, claimedAt: '2026-10-01T09:00:00.000Z' },
    );
    advance(60 * 24);
    await runtime.recover();
    const run = await runtime.runEffect(runId!);

    expect(run).toMatchObject({ status: 'dead', attempts: 2 });
    expect(keys).toEqual([]);
    expect(record()).toMatchObject({ status: 'approved' });
  });
  it('runs a continuation that met a conflict again instead of dropping it', async () => {
    const { make, id, controls, record, keys } = setup();
    const runtime = make();
    controls.conflictOnce = true;
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    // The conflict put the attempt back in the queue, and the next one paid.
    expect(record()).toMatchObject({ status: 'paid', paymentRef: 'PAY-2' });
    const [run] = (await runtime.history('orders', id)).effectRuns;
    expect(run).toMatchObject({ status: 'succeeded', attempts: 2 });
    expect(new Set(keys).size).toBe(1);
  });

  it('reclaims an attempt whose lease expired without waiting for a restart', async () => {
    const dispatcher = new HeldDispatcher();
    const { make, id, store, advance, record } = setup({ dispatcher });
    const runtime = make();
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    const [runId] = dispatcher.runs;
    // Claimed by a process that then stopped.
    await store.updateEffectRun(
      runId!,
      { status: 'queued' },
      { status: 'running', attempts: 1, claimedAt: '2026-10-01T09:00:00.000Z' },
    );
    expect(await runtime.reclaim()).toBe(0);
    advance(2);
    expect(await runtime.reclaim()).toBe(1);
    expect(await store.findEffectRun(runId!)).toMatchObject({
      status: 'queued',
      attempts: 1,
      claimedAt: null,
    });
    expect(dispatcher.runs).toEqual([runId, runId]);
    expect(await runtime.runEffect(runId!)).toMatchObject({
      status: 'succeeded',
      attempts: 2,
    });
    expect(record()).toMatchObject({ status: 'paid' });
  });

  it('hands over a queued run whose dispatch was lost, once it has waited a lease', async () => {
    // A dispatcher that loses everything it is handed, as a failed enqueue would.
    const lost = new HeldDispatcher();
    const { make, id, store, advance, record } = setup({ dispatcher: lost });
    const runtime = make();
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    const [runId] = lost.runs;
    expect(await store.findEffectRun(runId!)).toMatchObject({
      status: 'queued',
    });

    // Within a lease it may still be on its way: left alone.
    expect(await runtime.reclaim()).toBe(0);
    advance(2);
    expect(await runtime.reclaim()).toBe(1);
    expect(lost.runs).toEqual([runId, runId]);
    expect(await runtime.runEffect(runId!)).toMatchObject({
      status: 'succeeded',
    });
    expect(record()).toMatchObject({ status: 'paid' });
  });

  it('leaves alone a queued run whose backoff is not over, or whose effect it does not know', async () => {
    const lost = new HeldDispatcher();
    const { make, id, store, advance } = setup({ dispatcher: lost });
    const runtime = make();
    await runtime.fire('orders', id, 'approve', { actor: { id: 'a' } });
    const [runId] = lost.runs;
    // Requeued an hour ago with a retry due in an hour.
    await store.updateEffectRun(
      runId!,
      { status: 'queued' },
      { runAfter: '2026-10-01T11:00:00.000Z' },
    );
    await store.createEffectRun({
      transitionId: '1',
      lifecycle: 'orders',
      recordId: String(id),
      effect: 'orders.renamedLongAgo',
      status: 'queued',
      attempts: 0,
      maxAttempts: 1,
      result: null,
      error: null,
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-01T09:00:00.000Z',
      claimedAt: null,
      runAfter: null,
      stayBound: true,
    });
    advance(60);
    expect(await runtime.reclaim()).toBe(0);
    // Once the retry has been due for a lease, it is handed over.
    advance(62);
    expect(await runtime.reclaim()).toBe(1);
    expect(lost.runs).toEqual([runId, runId]);
  });

  it('keeps sweeping past a broken record, then reports it', async () => {
    type State = 'idle' | 'done';
    interface Item extends LifecycleRecord {
      readonly status: State;
      readonly broken: boolean;
    }
    const items = defineLifecycle<{
      record: Item;
      state: State;
      parameters: object;
      services: object;
    }>({
      name: 'items',
      initial: 'idle',
      states: ['idle', { name: 'done', final: true }],
      transitions: {
        finish: {
          from: 'idle',
          to: 'done',
          // A routing bug that only some records reach.
          route: ({ record }) => (record.broken ? ('lost' as State) : 'done'),
        },
      },
      triggers: {
        finishIdle: { transition: 'finish', when: 'idle', after: () => 0 },
      },
    });
    const store = new MemoryLifecycleStore();
    const at = '2026-10-01T09:00:00.000Z';
    const broken = store.insertRecord('items', {
      status: 'idle',
      broken: true,
      statusChangedAt: at,
      lifecycleVersion: 0,
    });
    const fine = store.insertRecord('items', {
      status: 'idle',
      broken: false,
      statusChangedAt: at,
      lifecycleVersion: 0,
    });
    const runtime = new LifecycleRuntime({
      store,
      clock: () => new Date('2026-10-01T10:00:00Z'),
    });
    runtime.register(items);

    await expect(runtime.runTriggers()).rejects.toMatchObject({
      code: 'INVALID_ROUTE',
    });
    expect(store.record('items', fine.id)).toMatchObject({ status: 'done' });
    expect(store.record('items', broken.id)).toMatchObject({ status: 'idle' });
  });

  it('pages past records a trigger cannot move, so they do not starve the ones behind them', async () => {
    type State = 'waiting' | 'done';
    interface Item extends LifecycleRecord {
      readonly status: State;
      readonly stuck: boolean;
    }
    const items = defineLifecycle<{
      record: Item;
      state: State;
      parameters: object;
      services: object;
    }>({
      name: 'items',
      initial: 'waiting',
      states: ['waiting', { name: 'done', final: true }],
      transitions: {
        finish: {
          from: 'waiting',
          to: 'done',
          guard: ({ record, actor }) => actor.system === true && !record.stuck,
        },
      },
      triggers: {
        finishIdle: {
          transition: 'finish',
          when: 'waiting',
          after: () => 0,
          batchSize: 3,
        },
      },
    });
    const store = new MemoryLifecycleStore();
    const minute = 60_000;
    const base = Date.parse('2026-10-01T09:00:00Z');
    // Seven refused records are the oldest, more than two full pages of them.
    for (let index = 0; index < 7; index += 1)
      store.insertRecord('items', {
        status: 'waiting',
        stuck: true,
        statusChangedAt: new Date(base + index * minute).toISOString(),
        lifecycleVersion: 0,
      });
    const movable = Array.from({ length: 5 }, (_, index) =>
      store.insertRecord('items', {
        status: 'waiting',
        stuck: false,
        statusChangedAt: new Date(base + (10 + index) * minute).toISOString(),
        lifecycleVersion: 0,
      }),
    );
    const runtime = new LifecycleRuntime({
      store,
      clock: () => new Date(base + 60 * minute),
    });
    runtime.register(items);

    // Three per sweep, none of them a refused one standing in the way.
    expect(await runtime.runTriggers()).toBe(3);
    expect(await runtime.runTriggers()).toBe(2);
    expect(await runtime.runTriggers()).toBe(0);
    for (const record of movable)
      expect(store.record('items', record.id)).toMatchObject({
        status: 'done',
      });
  });
});
