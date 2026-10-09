// Which outcomes a record's later transitions take away. An effect a state's
// `onEnter` queued serves that stay: once the record has left the state —
// even to enter it again, as a self-transition does — its outcome no longer
// moves the record; the runs the new stay queued carry it on. An
// effect the transition itself declares serves the transition, not the stay:
// its continuation is checked only against the state the record is in then.
import { describe, expect, it, vi } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  type EffectDispatcher,
  type EffectRun,
  type Lifecycle,
  type LifecycleLogger,
  type LifecycleRecord,
} from '../src/index.js';

type JobState = 'idle' | 'busy' | 'review' | 'done';

interface Job extends LifecycleRecord {
  readonly status: JobState;
  /** Whether entering `busy` hands the job straight on to review. */
  readonly autoReview?: boolean;
}

interface JobTypes {
  record: Job;
  state: JobState;
  services: { readonly flags: { broken: boolean } };
}

/** The work of a stay in `busy`: once done, the job is complete. */
const crunch = defineEffect<JobTypes>({
  name: 'jobs.crunch',
  onSuccess: 'complete',
  run: () => ({ crunched: true }),
});

/** A sibling of `crunch` whose outcome is a self-transition. */
const heartbeat = defineEffect<JobTypes>({
  name: 'jobs.heartbeat',
  onSuccess: 'touch',
  run: () => ({}),
});

/** What `handOff` itself owes, whichever state the job is in by then. */
const deliver = defineEffect<JobTypes>({
  name: 'jobs.deliver',
  onSuccess: 'approve',
  run: () => ({}),
});

const jobs: Lifecycle<JobTypes> = defineLifecycle<JobTypes>({
  name: 'jobs',
  initial: 'idle',
  states: [
    'idle',
    {
      name: 'busy',
      onEnterState: async ({ tx, lifecycle, record }) => {
        if (record.autoReview)
          await tx.fire(lifecycle, record.id, 'toReview', {
            actor: SYSTEM_ACTOR,
          });
      },
    },
    'review',
    { name: 'done', final: true },
  ],
  transitions: {
    begin: { from: 'idle', to: 'busy' },
    handOff: { from: 'idle', to: 'busy', effects: [deliver] },
    // Leaves `busy` and enters it again: a new stay, with new runs.
    touch: { from: 'busy', to: 'busy' },
    pause: { from: 'busy', to: 'idle' },
    toReview: { from: 'busy', to: 'review' },
    approve: { from: 'review', to: 'done' },
    complete: {
      from: 'busy',
      to: 'done',
      // A bug the next deploy fixes: it writes a field the lifecycle owns.
      set: ({ services }) =>
        services.flags.broken ? { status: 'done' as const } : {},
    },
  },
  onEnter: { busy: [crunch, heartbeat] },
});

/** Keeps every run it is handed, so a test runs each one when it chooses. */
class HeldDispatcher implements EffectDispatcher {
  public dispatch(): Promise<void> {
    return Promise.resolve();
  }
}

function setup() {
  const store = new MemoryLifecycleStore();
  const clock = { now: new Date('2026-10-01T09:00:00.000Z') };
  const logger = {
    warn: vi.fn<LifecycleLogger['warn']>(),
    error: vi.fn<LifecycleLogger['error']>(),
  };
  const flags = { broken: false };
  const runtime = new LifecycleRuntime({
    store,
    dispatcher: new HeldDispatcher(),
    logger,
    clock: () => clock.now,
  });
  runtime.register(jobs, { services: { flags } });
  const job = store.insertRecord('jobs', {
    status: 'idle',
    lifecycleVersion: 0,
  });
  const fire = (transition: string) =>
    runtime.fire('jobs', job.id, transition, { actor: SYSTEM_ACTOR });
  /** The run of `effect` that `transition` queued. */
  const runOf = (runs: readonly EffectRun[], effect: string): string => {
    const run = runs.find((each) => each.effect === effect);
    if (!run) throw new Error(`No ${effect} run.`);
    return run.id;
  };
  return {
    store,
    runtime,
    logger,
    flags,
    job,
    fire,
    runOf,
    status: (): unknown => store.record('jobs', job.id)?.status,
    advance: (ms: number): void => {
      clock.now = new Date(clock.now.getTime() + ms);
    },
  };
}

describe('an onEnter effect’s continuation', () => {
  it('is dropped after a self-transition while the effect ran, and the new stay carries on', async () => {
    const context = setup();
    const begun = await context.fire('begin');
    const touched = await context.fire('touch');
    await context.runtime.runEffect(
      context.runOf(begun.effectRuns, 'jobs.crunch'),
    );
    expect(context.status()).toBe('busy');
    await context.runtime.runEffect(
      context.runOf(touched.effectRuns, 'jobs.crunch'),
    );
    expect(context.status()).toBe('done');
  });

  it('is dropped once a sibling effect’s self-transition began a new stay', async () => {
    const context = setup();
    const begun = await context.fire('begin');
    await context.runtime.runEffect(
      context.runOf(begun.effectRuns, 'jobs.heartbeat'),
    );
    expect(context.status()).toBe('busy');
    await context.runtime.runEffect(
      context.runOf(begun.effectRuns, 'jobs.crunch'),
    );
    expect(context.status()).toBe('busy');
    // The self-transition queued its own runs of busy's effects, which do
    // continue: the job completes once the new stay's crunch runs.
    const queued = await context.store.listEffectRuns({ status: 'queued' });
    const next = queued.find((run) => run.effect === 'jobs.crunch');
    expect(next).toBeDefined();
    await context.runtime.runEffect(next!.id);
    expect(context.status()).toBe('done');
  });

  it('is dropped by the sweep after a self-transition while it waited', async () => {
    const context = setup();
    context.flags.broken = true;
    const begun = await context.fire('begin');
    const runId = context.runOf(begun.effectRuns, 'jobs.crunch');
    await context.runtime.runEffect(runId);
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      continuation: { transition: 'complete', code: 'INVALID_SET' },
    });

    await context.fire('touch');
    context.flags.broken = false;
    context.advance(60_000);
    await expect(context.runtime.reclaim()).resolves.toBe(0);
    expect(context.status()).toBe('busy');
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      continuation: null,
    });
  });

  it('is dropped once the record left the state and came back while the effect ran', async () => {
    const context = setup();
    const first = await context.fire('begin');
    await context.fire('pause');
    const second = await context.fire('begin');

    await context.runtime.runEffect(
      context.runOf(first.effectRuns, 'jobs.crunch'),
    );
    expect(context.status()).toBe('busy');
    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('could not continue with "complete"'),
      expect.objectContaining({ code: 'INVALID_STATE' }),
    );
    // The new stay's own run moves it on.
    await context.runtime.runEffect(
      context.runOf(second.effectRuns, 'jobs.crunch'),
    );
    expect(context.status()).toBe('done');
  });

  it('is dropped by the sweep once the record left the state and came back while it waited', async () => {
    const context = setup();
    context.flags.broken = true;
    const first = await context.fire('begin');
    const runId = context.runOf(first.effectRuns, 'jobs.crunch');
    await context.runtime.runEffect(runId);
    await context.fire('pause');
    await context.fire('begin');

    context.flags.broken = false;
    context.advance(60_000);
    await expect(context.runtime.reclaim()).resolves.toBe(0);
    expect(context.status()).toBe('busy');
    expect(await context.store.findEffectRun(runId)).toMatchObject({
      continuation: null,
    });
    await expect(context.runtime.continueRun(runId)).rejects.toMatchObject({
      code: 'NO_CONTINUATION',
    });
  });
});

describe('a transition’s own effect’s continuation', () => {
  it('goes on from the state a hook moved the record on to, when that state allows it', async () => {
    const context = setup();
    context.store.patchRecord('jobs', context.job.id, { autoReview: true });
    const handed = await context.fire('handOff');
    expect(context.status()).toBe('review');
    // The stay in `busy` ended at once, so it owed only the transition's own effect.
    expect(handed.effectRuns.map((run) => run.effect)).toEqual([
      'jobs.deliver',
    ]);

    await context.runtime.runEffect(handed.effectRuns[0].id);
    expect(context.status()).toBe('done');
  });

  it('is refused, as any transition is, by a state that does not allow it', async () => {
    const context = setup();
    const handed = await context.fire('handOff');
    expect(context.status()).toBe('busy');

    const runId = context.runOf(handed.effectRuns, 'jobs.deliver');
    await expect(context.runtime.runEffect(runId)).resolves.toMatchObject({
      status: 'succeeded',
      continuation: null,
    });
    expect(context.status()).toBe('busy');
    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('could not continue with "approve"'),
      expect.objectContaining({ code: 'INVALID_STATE' }),
    );
  });

  it('goes on with a store that ignores `after` and returns the whole log', async () => {
    class WholeLogStore extends MemoryLifecycleStore {
      public override listTransitions(
        lifecycle: string,
        recordId: string,
      ): ReturnType<MemoryLifecycleStore['listTransitions']> {
        return super.listTransitions(lifecycle, recordId);
      }
    }
    const store = new WholeLogStore();
    const runtime = new LifecycleRuntime({
      store,
      dispatcher: new HeldDispatcher(),
    });
    runtime.register(jobs, { services: { flags: { broken: false } } });
    const job = store.insertRecord('jobs', {
      status: 'idle',
      lifecycleVersion: 0,
    });
    const begun = await runtime.fire('jobs', job.id, 'begin', {
      actor: SYSTEM_ACTOR,
    });
    const crunchRun = begun.effectRuns.find(
      (run) => run.effect === 'jobs.crunch',
    );
    await runtime.runEffect(crunchRun!.id);
    expect(store.record('jobs', job.id)?.status).toBe('done');
  });
});
