// What a second layer of state needs from the lifecycle: one transaction
// across records and rows of its own, hooks on entering and leaving a state —
// carried by a state it provides — and transitions only server code fires.
// The fixture is a review with a hand-written second layer: entering
// `reviewing` opens one task per reviewer, answers are written to the tasks
// alone, and the last approval moves the review on in the same transaction.
import { describe, expect, it } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  type LifecycleDefinition,
  type LifecycleRecord,
  type LifecycleTransaction,
  type MemoryRows,
  type StateDefinition,
  type StateHookContext,
} from '../src/index.js';

type ReviewState = 'draft' | 'reviewing' | 'approved';

interface Review extends LifecycleRecord {
  readonly status: ReviewState;
  readonly reviewers: readonly string[];
}

interface ReviewTypes {
  record: Review;
  state: ReviewState;
  services: { readonly log: string[] };
}

const TASKS = 'reviewTasks';

function rows(tx: LifecycleTransaction): MemoryRows {
  return tx.handle as MemoryRows;
}

function openTasks(
  tx: LifecycleTransaction,
  reviewId: string,
): LifecycleRecord[] {
  return rows(tx)
    .records(TASKS)
    .filter((task) => task.reviewId === reviewId && task.status === 'open');
}

const notify = defineEffect<ReviewTypes>({
  name: 'reviews.notify',
  run: ({ services, to }) => void services.log.push(`effect:${to}`),
});

const base: LifecycleDefinition<ReviewTypes> = {
  name: 'reviews',
  initial: 'draft',
  states: ['draft', { name: 'approved', final: true }],
  transitions: {
    submit: { from: 'draft', to: 'reviewing' },
    withdraw: { from: 'reviewing', to: 'draft' },
  },
};

/** The review around a `reviewing` state, as a second layer provides it. */
function withReviewing(
  reviewing: StateDefinition<ReviewState, ReviewTypes>,
  transitions: LifecycleDefinition<ReviewTypes>['transitions'],
  rest: Partial<LifecycleDefinition<ReviewTypes>> = {},
): LifecycleDefinition<ReviewTypes> {
  return {
    ...base,
    ...rest,
    states: [...base.states, reviewing],
    transitions: { ...base.transitions, ...transitions },
  };
}

/** The second layer's state: tasks while reviewing, ended on the way out. */
const reviewing: StateDefinition<ReviewState, ReviewTypes> = {
  name: 'reviewing',
  onEnterState: ({ record, tx, services }) => {
    services.log.push('enter:reviewing');
    for (const reviewer of record.reviewers)
      rows(tx).insertRecord(TASKS, {
        reviewId: String(record.id),
        reviewer,
        status: 'open',
        enteredVersion: record.lifecycleVersion,
      });
  },
  onLeaveState: ({ record, tx, services, to }) => {
    services.log.push(`leave:reviewing->${to}`);
    for (const task of openTasks(tx, String(record.id)))
      rows(tx).patchRecord(TASKS, task.id, { status: 'void' });
  },
};

const reviewLifecycle = defineLifecycle(
  withReviewing(
    reviewing,
    {
      // The conclusion the tasks reach.
      concluded: { from: 'reviewing', to: 'approved', manual: false },
      restart: { from: 'reviewing', to: 'reviewing', manual: false },
    },
    { onEnter: { reviewing: [notify] } },
  ),
);

function setup() {
  const store = new MemoryLifecycleStore();
  const log: string[] = [];
  const runtime = new LifecycleRuntime({
    store,
    clock: () => new Date('2026-10-01T09:00:00Z'),
  });
  runtime.register(reviewLifecycle, { services: { log } });
  const tasks = (status?: string): LifecycleRecord[] =>
    store
      .records(TASKS)
      .filter((task) => status === undefined || task.status === status);
  return { store, runtime, log, tasks };
}

async function submitted(h: ReturnType<typeof setup>): Promise<string> {
  const { record } = await h.runtime.create(
    'reviews',
    { reviewers: ['ann', 'bob'] },
    { actor: { id: 'zoe' } },
  );
  await h.runtime.fire('reviews', record.id, 'submit', {
    actor: { id: 'zoe' },
  });
  return String(record.id);
}

/** One answer: written to its task alone, or the last one moving the review on. */
function answer(
  h: ReturnType<typeof setup>,
  reviewId: string,
  reviewer: string,
): Promise<'open' | 'concluded'> {
  return h.runtime.transaction(async (tx) => {
    const task = openTasks(tx, reviewId).find(
      (each) => each.reviewer === reviewer,
    );
    if (!task) throw new Error(`${reviewer} has nothing to answer.`);
    rows(tx).patchRecord(TASKS, task.id, { status: 'done' });
    if (openTasks(tx, reviewId).length) return 'open';
    await tx.fire('reviews', reviewId, 'concluded', {
      actor: { id: reviewer },
      expect: { version: Number(task.enteredVersion) },
    });
    return 'concluded';
  });
}

describe('the memory store takes back only what a transaction wrote', () => {
  it('a failed transaction undoes its writes and keeps a write made outside it meanwhile', async () => {
    const store = new MemoryLifecycleStore();
    const kept = store.insertRecord('rows', { value: 1 });
    let release: () => void = () => {};
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const failing = store.transaction(async (tx) => {
      const rowsInTx = tx.transactionHandle as MemoryRows;
      rowsInTx.insertRecord('rows', { value: 2 });
      rowsInTx.patchRecord('rows', kept.id, { value: 10 });
      await waiting;
      throw new Error('Rolled back.');
    });
    // Written outside the transaction while it runs, as an effect claim is.
    const outside = store.insertRecord('rows', { value: 3 });
    release();
    await expect(failing).rejects.toThrow('Rolled back.');
    expect(store.records('rows').map((row) => row.value)).toEqual([1, 3]);
    expect(store.record('rows', outside.id)).toBeDefined();
  });

  it('a transaction explicitly opened within another nests in it', async () => {
    const store = new MemoryLifecycleStore();
    await expect(
      store.transaction((outer) =>
        outer.transaction(
          async (inner) => {
            (inner.transactionHandle as MemoryRows).insertRecord('rows', {});
            throw new Error('Inner failure.');
          },
          { within: outer.transactionHandle },
        ),
      ),
    ).rejects.toThrow('Inner failure.');
    expect(store.records('rows')).toEqual([]);
  });
});

describe('runtime.transaction', () => {
  it('writes several records together and tells and dispatches only after the commit', async () => {
    const h = setup();
    const heard: string[] = [];
    h.runtime.on('completed', {}, (event) => {
      heard.push(`${event.transition}:${String(event.record.id)}`);
    });
    const first = await h.runtime.create(
      'reviews',
      { reviewers: ['ann'] },
      { actor: { id: 'zoe' } },
    );
    const second = await h.runtime.create(
      'reviews',
      { reviewers: ['bob'] },
      { actor: { id: 'zoe' } },
    );
    heard.length = 0;
    h.log.length = 0;
    await h.runtime.transaction(async (tx) => {
      await tx.fire('reviews', first.record.id, 'submit', {
        actor: { id: 'zoe' },
      });
      await tx.fire('reviews', second.record.id, 'submit', {
        actor: { id: 'zoe' },
      });
      tx.afterCommit(() => void h.log.push('afterCommit'));
      expect(heard).toEqual([]);
      expect(h.log).toEqual(['enter:reviewing', 'enter:reviewing']);
    });
    expect(heard).toEqual([
      `submit:${String(first.record.id)}`,
      `submit:${String(second.record.id)}`,
    ]);
    expect(h.log.slice(2)).toEqual([
      'effect:reviewing',
      'effect:reviewing',
      'afterCommit',
    ]);
  });

  it('runs afterCommit callbacks and each call’s events and effects in the order they were registered', async () => {
    const h = setup();
    h.runtime.on('completed', {}, (event) => {
      h.log.push(`completed:${event.transition}`);
    });
    const { record } = await h.runtime.create(
      'reviews',
      { reviewers: ['ann'] },
      { actor: { id: 'zoe' } },
    );
    h.log.length = 0;
    await h.runtime.transaction(async (tx) => {
      tx.afterCommit(() => void h.log.push('registered before'));
      await tx.fire('reviews', record.id, 'submit', {
        actor: { id: 'zoe' },
      });
      tx.afterCommit(() => void h.log.push('registered after'));
    });
    // A callback registered before tx.fire() runs before that transition's
    // event and effect; one registered after the call runs after them.
    expect(h.log).toEqual([
      'enter:reviewing',
      'registered before',
      'completed:submit',
      'effect:reviewing',
      'registered after',
    ]);
  });

  it('rolls every record back when the work fails, and runs nothing after it', async () => {
    const h = setup();
    const { record } = await h.runtime.create(
      'reviews',
      { reviewers: ['ann'] },
      { actor: { id: 'zoe' } },
    );
    h.log.length = 0;
    await expect(
      h.runtime.transaction(async (tx) => {
        await tx.fire('reviews', record.id, 'submit', {
          actor: { id: 'zoe' },
        });
        tx.afterCommit(() => void h.log.push('afterCommit'));
        throw new Error('Something else failed.');
      }),
    ).rejects.toThrow('Something else failed.');
    expect(h.store.record('reviews', record.id)).toMatchObject({
      status: 'draft',
      lifecycleVersion: 1,
    });
    expect(h.tasks()).toEqual([]);
    expect(h.log).toEqual(['enter:reviewing']);
    expect(await h.runtime.history('reviews', record.id)).toMatchObject({
      transitions: [{ transition: '$create' }],
      effectRuns: [],
    });
  });

  it('a refusal before anything is written leaves the transaction usable', async () => {
    const h = setup();
    const { record } = await h.runtime.create(
      'reviews',
      { reviewers: ['ann'] },
      { actor: { id: 'zoe' } },
    );
    const outcome = await h.runtime.transaction(async (tx) => {
      const refused = await tx
        .fire('reviews', record.id, 'withdraw', { actor: { id: 'zoe' } })
        .catch((error: unknown) => error);
      expect((refused as LifecycleError).code).toBe('INVALID_STATE');
      await tx.fire('reviews', record.id, 'submit', { actor: { id: 'zoe' } });
      return 'submitted';
    });
    expect(outcome).toBe('submitted');
    expect(h.store.record('reviews', record.id)).toMatchObject({
      status: 'reviewing',
    });
  });

  it('a caught hook failure rolls back its savepoint and leaves the outer transaction usable', async () => {
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store });
    runtime.register(
      defineLifecycle<ReviewTypes>(
        withReviewing(
          {
            name: 'reviewing',
            onEnterState: () => {
              throw new Error('No reviewer could be found.');
            },
          },
          { concluded: { from: 'reviewing', to: 'approved' } },
        ),
      ),
      { services: { log: [] } },
    );
    const { record } = await runtime.create(
      'reviews',
      { reviewers: [] },
      { actor: { id: 'zoe' } },
    );
    await expect(
      runtime.transaction(async (tx) => {
        await tx
          .fire('reviews', record.id, 'submit', { actor: { id: 'zoe' } })
          .catch(() => undefined);
        return 'carried on';
      }),
    ).resolves.toBe('carried on');
    expect(store.record('reviews', record.id)).toMatchObject({
      status: 'draft',
    });
  });

  it('creates a record in the transaction, running its initial enter hooks there', async () => {
    const h = setup();
    const created = await h.runtime.transaction((tx) =>
      tx.create('reviews', { reviewers: ['ann'] }, { actor: { id: 'zoe' } }),
    );
    expect(created.record).toMatchObject({ status: 'draft' });
    expect(await h.runtime.history('reviews', created.record.id)).toMatchObject(
      { transitions: [{ transition: '$create', from: null, to: 'draft' }] },
    );
  });
});

describe('state hooks', () => {
  it('enter sets the stay up and leave ends it, in the transition’s transaction', async () => {
    const h = setup();
    const id = await submitted(h);
    expect(h.tasks('open').map((task) => task.reviewer)).toEqual([
      'ann',
      'bob',
    ]);
    await h.runtime.fire('reviews', id, 'withdraw', { actor: { id: 'zoe' } });
    expect(h.tasks('open')).toEqual([]);
    expect(h.tasks('void')).toHaveLength(2);
    expect(h.log).toContain('leave:reviewing->draft');
  });

  it('a self-transition leaves and enters again: the old stay is voided and a new one set up', async () => {
    const h = setup();
    const id = await submitted(h);
    h.log.length = 0;
    await h.runtime.fire('reviews', id, 'restart', { actor: SYSTEM_ACTOR });
    expect(h.log).toEqual([
      'leave:reviewing->reviewing',
      'enter:reviewing',
      'effect:reviewing',
    ]);
    expect(h.tasks('void')).toHaveLength(2);
    expect(h.tasks('open').map((task) => task.enteredVersion)).toEqual([3, 3]);
  });

  it('runs the leave hooks, the transition’s own hook and the enter hooks in that order', async () => {
    const order: string[] = [];
    const record =
      (where: string) => (context: StateHookContext<ReviewTypes>) =>
        void order.push(
          `${where}:${context.previous?.status ?? '-'}>${context.record.status}`,
        );
    const lifecycle = defineLifecycle<ReviewTypes>({
      ...base,
      states: ['draft', 'reviewing', { name: 'approved', final: true }],
      transitions: {
        ...base.transitions,
        submit: {
          from: 'draft',
          to: 'reviewing',
          onTransition: () => void order.push('onTransition'),
        },
        concluded: { from: 'reviewing', to: 'approved' },
      },
      onEnterState: { draft: record('enter'), reviewing: record('enter') },
      onLeaveState: { draft: record('leave') },
    });
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(lifecycle, { services: { log: [] } });
    const { record: created } = await runtime.create(
      'reviews',
      { reviewers: [] },
      { actor: { id: 'zoe' } },
    );
    await runtime.fire('reviews', created.id, 'submit', {
      actor: { id: 'zoe' },
    });
    expect(order).toEqual([
      'enter:->draft',
      'leave:draft>reviewing',
      'onTransition',
      'enter:draft>reviewing',
    ]);
  });

  it('a hook may move its own record on through the transaction', async () => {
    const lifecycle = defineLifecycle<ReviewTypes>(
      withReviewing(
        {
          name: 'reviewing',
          // Nobody to ask: the stay ends as soon as it starts.
          onEnterState: async ({ record, tx }) => {
            if (record.reviewers.length === 0)
              await tx.fire('reviews', record.id, 'concluded', {
                actor: SYSTEM_ACTOR,
                input: { because: 'no reviewer is needed' },
              });
          },
        },
        { concluded: { from: 'reviewing', to: 'approved', manual: false } },
      ),
    );
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(lifecycle, { services: { log: [] } });
    const { record } = await runtime.create(
      'reviews',
      { reviewers: [] },
      { actor: { id: 'zoe' } },
    );
    await runtime.fire('reviews', record.id, 'submit', {
      actor: { id: 'zoe' },
    });
    expect(
      (await runtime.history('reviews', record.id)).transitions.map(
        (entry) => `${entry.transition}@${entry.version}`,
      ),
    ).toEqual(['$create@1', 'submit@2', 'concluded@3']);
  });
});

describe('a second layer concluding through runtime.transaction', () => {
  it('intermediate answers stay in the second layer: the record’s version and clock do not move', async () => {
    const h = setup();
    const id = await submitted(h);
    const before = h.store.record('reviews', id);
    expect(await answer(h, id, 'ann')).toBe('open');
    expect(h.store.record('reviews', id)).toBe(before);
    expect(await answer(h, id, 'bob')).toBe('concluded');
    expect(h.store.record('reviews', id)).toMatchObject({
      status: 'approved',
    });
  });

  it('a withdrawal that got there first voids the tasks, and the late answer writes nothing', async () => {
    const h = setup();
    const id = await submitted(h);
    await answer(h, id, 'ann');
    await h.runtime.fire('reviews', id, 'withdraw', { actor: { id: 'zoe' } });
    await expect(answer(h, id, 'bob')).rejects.toThrow(
      'bob has nothing to answer.',
    );
    expect(h.tasks('done').map((task) => task.reviewer)).toEqual(['ann']);
  });

  it('a conclusion delivered for an earlier stay is refused by the version, and its answer is not kept', async () => {
    const h = setup();
    const id = await submitted(h);
    const stale = h.tasks('open').find((task) => task.reviewer === 'bob');
    await h.runtime.fire('reviews', id, 'restart', { actor: SYSTEM_ACTOR });
    // As if bob's last answer had been read before the restart.
    await expect(
      h.runtime.transaction(async (tx) => {
        rows(tx).patchRecord(TASKS, stale?.id ?? '', { status: 'done' });
        await tx.fire('reviews', id, 'concluded', {
          actor: { id: 'bob' },
          expect: { version: Number(stale?.enteredVersion) },
        });
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(h.tasks('done')).toEqual([]);
    expect(h.store.record('reviews', id)).toMatchObject({
      status: 'reviewing',
    });
  });
});

describe('transitions only server code fires', () => {
  it('are left out of available(), refused by can(), and not announced', async () => {
    const h = setup();
    const announced: string[] = [];
    h.runtime.on('announce', {}, (event) => void announced.push(event.next));
    const id = await submitted(h);
    expect(
      (await h.runtime.available('reviews', id, { id: 'zoe' })).map(
        (transition) => transition.name,
      ),
    ).toEqual(['withdraw']);
    expect(
      await h.runtime.can('reviews', id, 'concluded', SYSTEM_ACTOR),
    ).toEqual({
      allowed: false,
      blockers: [
        expect.objectContaining({
          source: 'manual',
          kind: 'permission',
          code: 'NOT_MANUAL',
        }),
      ],
      problems: [],
    });
    // `submit` is announced by the creation; `concluded` never is.
    expect(announced).toEqual(['submit', 'withdraw']);
    expect(
      h.runtime
        .describe('reviews')
        .transitions.filter((transition) => !transition.manual)
        .map((transition) => transition.name),
    ).toEqual(['concluded', 'restart']);
  });

  it('are refused when the caller marks a human action', async () => {
    const h = setup();
    const id = await submitted(h);
    await expect(
      h.runtime.fire('reviews', id, 'concluded', {
        actor: { id: 'zoe' },
        manual: true,
      }),
    ).rejects.toMatchObject({ code: 'NOT_MANUAL' });
    expect(h.store.record('reviews', id)).toMatchObject({
      status: 'reviewing',
    });
  });
});

describe('a state with hooks of its own', () => {
  type Phase = 'draft' | 'waiting' | 'done';
  interface Job extends LifecycleRecord {
    readonly status: Phase;
  }
  interface JobTypes {
    record: Job;
    state: Phase;
  }

  /** What a module hands a business: a whole state, its hooks included. */
  function waiting(order: string[]): StateDefinition<Phase, JobTypes> {
    return {
      name: 'waiting',
      meta: { by: 'module' },
      onEnterState: ({ from }) => void order.push(`state enter from ${from}`),
      onLeaveState: [
        ({ to }) => void order.push(`state leave to ${to}`),
        () => void order.push('state leave again'),
      ],
    };
  }

  function setup(order: string[]) {
    const lifecycle = defineLifecycle<JobTypes>({
      name: 'jobs',
      initial: ['draft', 'waiting'],
      states: ['draft', waiting(order), { name: 'done', final: true }],
      transitions: {
        start: { from: 'draft', to: 'waiting' },
        finish: { from: 'waiting', to: 'done' },
      },
      onEnterState: { waiting: () => void order.push('lifecycle enter') },
      onLeaveState: { waiting: () => void order.push('lifecycle leave') },
    });
    const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
    runtime.register(lifecycle);
    return { lifecycle, runtime };
  }

  it('runs its own hooks before the lifecycle’s for the same state', async () => {
    const order: string[] = [];
    const { lifecycle, runtime } = setup(order);
    expect(lifecycle.onEnterState.get('waiting')).toHaveLength(2);
    expect(lifecycle.onLeaveState.get('waiting')).toHaveLength(3);
    expect(lifecycle.stateInfo.get('waiting')?.meta).toEqual({ by: 'module' });
    const { record } = await runtime.create(
      'jobs',
      {},
      { actor: { id: 'zoe' } },
    );
    await runtime.fire('jobs', record.id, 'start', { actor: { id: 'zoe' } });
    await runtime.fire('jobs', record.id, 'finish', { actor: { id: 'zoe' } });
    expect(order).toEqual([
      'state enter from draft',
      'lifecycle enter',
      'state leave to done',
      'state leave again',
      'lifecycle leave',
    ]);
  });

  it('runs on runtime.create() as the lifecycle’s hooks do', async () => {
    const order: string[] = [];
    const { runtime } = setup(order);
    await runtime.create(
      'jobs',
      {},
      { actor: { id: 'zoe' }, state: 'waiting' },
    );
    expect(order).toEqual(['state enter from null', 'lifecycle enter']);
  });

  it('refuses leave hooks on a final state', () => {
    expect(() =>
      defineLifecycle<JobTypes>({
        name: 'jobs',
        initial: 'draft',
        states: [
          'draft',
          { name: 'done', final: true, onLeaveState: () => undefined },
        ],
        transitions: { finish: { from: 'draft', to: 'done' } },
      }),
    ).toThrow('state "done" has leave hooks that can never run: it is final.');
  });
});
