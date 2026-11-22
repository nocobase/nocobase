import { describe, expect, it, vi } from 'vitest';
import {
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  type LifecycleTypes,
  type ManagementAuthorization,
  type ManagementPolicy,
  type ManagementResumeContext,
} from '../src/index.js';
import { InstanceLockConflict } from '../src/management.js';

const actor = { id: 'operator' };
const authorize: ManagementAuthorization = ({ actor, record }) =>
  actor.id === 'operator' && record.scope === 'desk';
const denied: ManagementAuthorization = () => false;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function fixture(
  hooks: Pick<ManagementPolicy<LifecycleTypes>, 'onResume' | 'onReenter'> = {},
  perform = vi.fn(async () => ({ delivered: true }) as object),
  beforeEffect?: () => Promise<void>,
  resetWhileActive = false,
) {
  const store = new MemoryLifecycleStore();
  const dispatch = vi.fn(async () => {});
  const notify = defineEffect({
    name: 'notify',
    run: perform,
    onSuccess: 'finish',
  });
  const oldEntry = vi.fn();
  let now = Date.parse('2026-11-19T09:00:00Z');
  const runtime = new LifecycleRuntime({
    store,
    dispatcher: { dispatch },
    beforeEffect,
    clock: () => new Date(now),
  });
  runtime.register(
    defineLifecycle({
      name: 'oldDesk',
      key: 'desk',
      version: 1,
      collection: 'records',
      definitionField: 'definition',
      initial: 'open',
      states: ['open', 'waiting', { name: 'closed', final: true }],
      dueAtField: 'dueAt',
      management: {
        field: 'management',
        suspend: true,
        reset: true,
        resetWhileActive,
        restartAt: ['waiting'],
        canEnter: ({ previous, to }) =>
          to !== 'waiting' || previous.assignee === 'support',
        ...hooks,
        onEnter: { waiting: [notify] },
      },
      onEnterState: { waiting: oldEntry },
      onEnter: { waiting: [notify] },
      transitions: {
        wait: { from: 'open', to: 'waiting' },
        finish: { from: 'waiting', to: 'closed' },
      },
      triggers: {
        expire: { when: 'waiting', after: () => 1_000, transition: 'finish' },
      },
    }),
  );
  runtime.register(
    defineLifecycle({
      name: 'newDesk',
      key: 'desk',
      version: 2,
      collection: 'records',
      definitionField: 'definition',
      initial: 'fresh',
      states: [{ name: 'fresh', final: true }],
      transitions: {},
    }),
  );
  const { record } = await runtime.create(
    'oldDesk',
    { scope: 'desk', assignee: 'support', note: 'previous message' },
    { actor },
  );
  const id = record.id;
  const detail = () =>
    runtime
      .managementDetails('desk', id, actor, authorize)
      .then((result) => result!);
  let request = 0;
  const options = async () => ({
    actor,
    authorize,
    reason: 'Incident 42',
    requestId: String(++request),
    expectedVersion: (await detail()).version,
  });
  const wait = () => runtime.fire('oldDesk', id, 'wait', { actor });
  return {
    store,
    runtime,
    id,
    detail,
    options,
    wait,
    dispatch,
    oldEntry,
    notify,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('management of a bound lifecycle instance', () => {
  it('checks authorization before replay, rejects stale and reused requests, and audits the original result', async () => {
    const { runtime, id, options, detail } = await fixture();
    const command = await options();
    await expect(
      runtime.suspend('desk', id, { ...command, authorize: denied }),
    ).rejects.toMatchObject({ code: 'MANAGEMENT_FORBIDDEN' });
    await expect(
      runtime.suspend('desk', id, { ...command, reason: ' ' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const [first, duplicate] = await Promise.all([
      runtime.suspend('desk', id, command),
      runtime.suspend('desk', id, command),
    ]);
    expect(duplicate).toEqual(first);
    expect(first).toMatchObject({
      lifecycle: 'oldDesk',
      definitionVersion: 1,
      state: 'open',
      round: 1,
      suspended: true,
    });
    await expect(
      runtime.resume('desk', id, { ...command, authorize: denied }),
    ).rejects.toMatchObject({ code: 'MANAGEMENT_FORBIDDEN' });
    await expect(
      runtime.suspend('desk', id, { ...command, authorize: denied }),
    ).rejects.toMatchObject({ code: 'MANAGEMENT_FORBIDDEN' });
    await expect(runtime.resume('desk', id, command)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    await expect(
      runtime.resume('desk', id, { ...command, requestId: 'stale' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await runtime.resume('desk', id, await options());
    expect(await runtime.suspend('desk', id, command)).toEqual(first);
    expect(
      (await detail()).history.map(({ actorId, event }) => [
        actorId,
        event.command,
        event.reason,
      ]),
    ).toEqual([
      ['operator', 'suspend', 'Incident 42'],
      ['operator', 'resume', 'Incident 42'],
    ]);
    expect(
      (await runtime.history('oldDesk', id)).transitions.map(
        ({ transition }) => transition,
      ),
    ).toEqual(['$create']);
  });

  it('prevents domain and lifecycle writes while paused and preserves the remaining trigger time', async () => {
    const { runtime, id, options, wait, advance, dispatch, oldEntry } =
      await fixture();
    const command = await options();
    await wait();
    await expect(runtime.suspend('desk', id, command)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    advance(300);
    const before = await runtime.view('oldDesk', id, actor);
    await runtime.suspend('desk', id, await options());
    expect(await runtime.can('oldDesk', id, 'finish', actor)).toMatchObject({
      allowed: false,
      blockers: [{ code: 'SUSPENDED' }],
    });
    await expect(
      runtime.fire('oldDesk', id, 'finish', { actor }),
    ).rejects.toMatchObject({ code: 'SUSPENDED' });
    await expect(
      runtime.transaction((tx) => tx.requireActive('oldDesk', id)),
    ).rejects.toMatchObject({ code: 'SUSPENDED' });
    advance(10_000);
    expect(await runtime.runTriggers()).toBe(0);
    await runtime.resume('desk', id, await options());
    const after = await runtime.view('oldDesk', id, actor);
    expect(after.version).toBe(before.version);
    expect(after.record.statusChangedAt).toBe(before.record.statusChangedAt);
    expect(oldEntry).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledTimes(2);
    advance(699);
    expect(await runtime.runTriggers()).toBe(0);
    advance(1);
    expect(await runtime.runTriggers()).toBe(1);
  });

  it('passes each suspension and its record snapshots to the resume hook only once', async () => {
    const onResume =
      vi.fn<(context: ManagementResumeContext<LifecycleTypes>) => void>();
    const { store, runtime, id, options, wait, advance } = await fixture({
      onResume,
    });
    await wait();
    let pausedMs = 0;
    for (const pausedForMs of [300, 700]) {
      await runtime.suspend('desk', id, await options());
      const previous = store.record('records', id)!;
      advance(pausedForMs);
      const command = await options();
      const result = await runtime.resume('desk', id, command);
      const record = store.record('records', id)!;
      const entry = await store.findTransitionByRequest(
        'oldDesk',
        String(id),
        command.requestId,
      );
      expect(onResume).toHaveBeenLastCalledWith(
        expect.objectContaining({
          previous,
          record,
          suspendedAt: expect.any(String),
          now: new Date(entry!.at),
          pausedForMs,
          actor,
          event: entry!.management,
          entry,
        }),
      );
      const [context] = onResume.mock.lastCall!;
      expect(previous.management).toMatchObject({
        suspendedAt: context.suspendedAt,
        pausedMs,
      });
      pausedMs += pausedForMs;
      expect(record.management).toMatchObject({ suspendedAt: null, pausedMs });
      expect(
        Date.parse(String(record.dueAt)) - Date.parse(String(previous.dueAt)),
      ).toBe(pausedForMs);
      expect(await runtime.resume('desk', id, command)).toEqual(result);
    }

    await runtime.suspend('desk', id, await options());
    await runtime.reset('desk', id, await options());
    await runtime.suspend('desk', id, await options());
    await runtime.restartAt('desk', id, 'waiting', await options());
    expect(onResume.mock.calls.map(([context]) => context.pausedForMs)).toEqual(
      [300, 700],
    );
  });

  it('runs the resume hook with zero pause and no due date or parameter resolution', async () => {
    interface Types extends LifecycleTypes {
      services: { readonly handle: unknown };
    }
    const onResume = vi.fn<(context: ManagementResumeContext<Types>) => void>();
    const parameterProvider = vi.fn(async () => ({}));
    const clock = () => new Date('2026-11-19T09:00:00.000Z');
    const store = new MemoryLifecycleStore();
    const runtime = new LifecycleRuntime({ store, clock });
    runtime.register(
      defineLifecycle<Types>({
        name: 'desk',
        key: 'desk',
        version: 1,
        collection: 'records',
        initial: 'open',
        states: [{ name: 'open', final: true }],
        transitions: {},
        management: { field: 'management', suspend: true, onResume },
      }),
      { parameterProvider, services: (handle) => ({ handle }) },
    );
    const {
      record: { id },
    } = await runtime.create('desk', { scope: 'desk' }, { actor });
    const suspended = await runtime.suspend('desk', id, {
      actor,
      authorize,
      reason: 'Review',
      requestId: 'suspend',
      expectedVersion: (await runtime.managementDetails(
        'desk',
        id,
        actor,
        authorize,
      ))!.version,
    });
    parameterProvider.mockClear();
    await runtime.resume('desk', id, {
      actor,
      authorize,
      reason: 'Review',
      requestId: 'resume',
      expectedVersion: suspended.version,
    });

    expect(onResume).toHaveBeenCalledOnce();
    const [context] = onResume.mock.lastCall!;
    expect(context.pausedForMs).toBe(0);
    expect(context).not.toHaveProperty('parameters');
    expect(parameterProvider).not.toHaveBeenCalled();
    expect(context.services.handle).toBeInstanceOf(MemoryLifecycleStore);
    expect(context.services.handle).toBe(context.tx.handle);
    expect(context.tx.now).toBe(context.now);
  });

  it('rolls back a failed resume and its business writes before dispatch, then accepts the same request', async () => {
    const afterCommit = vi.fn();
    const conflict = new InstanceLockConflict();
    let refuse = true;
    const onResume = vi.fn(
      async ({
        record,
        entry,
        tx,
      }: ManagementResumeContext<LifecycleTypes>) => {
        const scoped = tx.handle as MemoryLifecycleStore;
        expect(await tx.read('oldDesk', record.id)).toEqual(record);
        expect(
          await scoped.findTransitionByRequest(
            entry.lifecycle,
            entry.recordId,
            entry.requestId!,
          ),
        ).toEqual(entry);
        scoped.insertRecord('notes', { id: 'resumed', recordId: record.id });
        tx.afterCommit(afterCommit);
        if (refuse) throw conflict;
      },
    );
    const { store, runtime, id, options, wait, advance, dispatch, detail } =
      await fixture({ onResume });
    await wait();
    await runtime.suspend('desk', id, await options());
    const previous = store.record('records', id);
    const before = await detail();
    const queued = await runtime.listEffectRuns({ status: 'queued' });
    advance(300);
    const command = await options();
    dispatch.mockClear();

    await expect(runtime.resume('desk', id, command)).rejects.toBe(conflict);
    expect(onResume).toHaveBeenCalledOnce();
    expect(store.record('records', id)).toEqual(previous);
    expect(await detail()).toEqual(before);
    expect(
      await store.findTransitionByRequest(
        'oldDesk',
        String(id),
        command.requestId,
      ),
    ).toBeUndefined();
    expect(store.record('notes', 'resumed')).toBeUndefined();
    expect(await runtime.listEffectRuns({ status: 'queued' })).toEqual(queued);
    expect(dispatch).not.toHaveBeenCalled();
    expect(afterCommit).not.toHaveBeenCalled();

    refuse = false;
    await expect(runtime.resume('desk', id, command)).resolves.toMatchObject({
      suspended: false,
    });
    expect(onResume).toHaveBeenCalledTimes(2);
    expect(store.record('notes', 'resumed')).toMatchObject({ recordId: id });
    expect(dispatch).toHaveBeenCalledOnce();
    expect(afterCommit).toHaveBeenCalledOnce();
  });

  it('rejects firing the resuming instance, rolls back, and lets the same request be retried', async () => {
    const afterCommit = vi.fn();
    const otherId = 'another-desk';
    let advanceCurrent = true;
    const onResume = async ({
      record,
      tx,
    }: ManagementResumeContext<LifecycleTypes>) => {
      const scoped = tx.handle as MemoryLifecycleStore;
      scoped.insertRecord('notes', { id: 'resumed', recordId: record.id });
      tx.afterCommit(afterCommit);
      if (advanceCurrent) {
        // Catching the refusal inside the hook must still abort the resume.
        await expect(
          tx.fire('oldDesk', String(record.id), 'finish', { actor }),
        ).rejects.toMatchObject({ code: 'INVALID_SET' });
      } else {
        await tx.requireActive('oldDesk', record.id);
        await tx.fire('oldDesk', otherId, 'finish', { actor });
      }
    };
    const { store, runtime, id, options, wait, advance, dispatch, detail } =
      await fixture({ onResume });
    await runtime.create('oldDesk', { id: otherId, scope: 'desk' }, { actor });
    await runtime.fire('oldDesk', otherId, 'wait', { actor });
    await wait();
    await runtime.suspend('desk', id, await options());
    const previous = store.record('records', id);
    const history = await store.listTransitions('oldDesk', String(id));
    advance(300);
    const command = await options();
    dispatch.mockClear();

    await expect(runtime.resume('desk', id, command)).rejects.toMatchObject({
      code: 'INVALID_SET',
    });
    expect(store.record('records', id)).toEqual(previous);
    expect(await store.listTransitions('oldDesk', String(id))).toEqual(history);
    expect(store.record('notes', 'resumed')).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
    expect(afterCommit).not.toHaveBeenCalled();

    advanceCurrent = false;
    const result = await runtime.resume('desk', id, command);
    expect(result).toMatchObject({ state: 'waiting', suspended: false });
    expect(await detail()).toMatchObject({ version: result.version });
    expect(await runtime.resume('desk', id, command)).toEqual(result);
    expect(store.record('records', otherId)).toMatchObject({
      status: 'closed',
    });
    expect(dispatch).toHaveBeenCalledOnce();
    expect(afterCommit).toHaveBeenCalledOnce();
  });

  it('blocks an already delivered queue job and preserves the result of a running effect until resume', async () => {
    const started = deferred<void>();
    const done = deferred<object>();
    const perform = vi.fn(() => {
      started.resolve();
      return done.promise;
    });
    const { runtime, id, options, wait } = await fixture(undefined, perform);
    const {
      effectRuns: [run],
    } = await wait();
    await runtime.suspend('desk', id, await options());
    expect(await runtime.runEffect(run.id)).toMatchObject({
      status: 'queued',
      attempts: 0,
    });
    expect(perform).not.toHaveBeenCalled();
    await runtime.resume('desk', id, await options());
    const running = runtime.runEffect(run.id);
    await started.promise;
    await runtime.suspend('desk', id, await options());
    done.resolve({ delivered: true });
    expect(await running).toMatchObject({
      status: 'succeeded',
      continuation: { attempts: 0 },
    });
    await expect(runtime.continueRun(run.id)).rejects.toMatchObject({
      code: 'SUSPENDED',
    });
    await runtime.reclaim();
    expect((await runtime.listEffectRuns())[0].continuation?.attempts).toBe(0);
    await runtime.resume('desk', id, await options());
    expect((await runtime.view('oldDesk', id, actor)).state).toBe('closed');
    expect((await runtime.listEffectRuns())[0].continuation).toBeNull();
    expect(perform).toHaveBeenCalledOnce();
  });

  it('starts a new round in the same state, fences late outcomes, and passes an explicit management event to reentry effects', async () => {
    const started = deferred<void>();
    const done = deferred<object>();
    const perform = vi.fn(() => {
      started.resolve();
      return done.promise;
    });
    const hook = vi.fn(async () => {});
    const { runtime, id, options, wait, detail, oldEntry } = await fixture(
      { onReenter: hook },
      perform,
    );
    const {
      effectRuns: [run],
    } = await wait();
    const running = runtime.runEffect(run.id);
    await started.promise;
    await runtime.suspend('desk', id, await options());
    expect((await detail()).work).toEqual([
      { id: run.id, effect: 'notify', status: 'running' },
    ]);
    await expect(
      runtime.restartAt('desk', id, 'closed', await options()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE' });
    const command = await options();
    const next = await runtime.restartAt('desk', id, 'waiting', command);
    expect(next).toMatchObject({
      state: 'waiting',
      round: 2,
      suspended: false,
    });
    await expect(
      runtime.restartAt('desk', id, 'closed', command),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(hook).toHaveBeenCalledOnce();
    expect(oldEntry).toHaveBeenCalledOnce();
    done.resolve({ delivered: true });
    expect(await running).toMatchObject({
      status: 'succeeded',
      continuation: null,
    });
    expect((await runtime.view('oldDesk', id, actor)).state).toBe('waiting');
    const queued = (await runtime.listEffectRuns({ status: 'queued' }))[0];
    await runtime.runEffect(queued.id);
    expect(perform).toHaveBeenLastCalledWith(
      expect.objectContaining({
        management: expect.objectContaining({ command: 'restartAt' }),
      }),
    );
    expect((await runtime.view('oldDesk', id, actor)).state).toBe('closed');
  });

  it('rolls back reentry and pending work together, then resets to the bound initial state', async () => {
    const hook = vi
      .fn(async () => {})
      .mockRejectedValueOnce(new Error('Could not create tasks'));
    const { runtime, id, wait, detail, options } = await fixture({
      onReenter: hook,
    });
    const {
      effectRuns: [run],
    } = await wait();
    await runtime.suspend('desk', id, await options());
    const command = await options();
    await expect(runtime.reset('desk', id, command)).rejects.toThrow(
      'Could not create tasks',
    );
    expect((await detail()).history).toHaveLength(1);
    expect((await detail()).suspended).toBe(true);
    expect((await runtime.listEffectRuns())[0]).toMatchObject({
      id: run.id,
      status: 'queued',
    });
    expect(await runtime.reset('desk', id, command)).toMatchObject({
      recordId: String(id),
      state: 'open',
      lifecycle: 'oldDesk',
      round: 2,
    });
    expect((await runtime.listEffectRuns())[0]).toMatchObject({
      status: 'cancelled',
    });
    await expect(
      runtime.retryRun(run.id, { force: true }),
    ).rejects.toMatchObject({ code: 'RUN_SETTLED' });
    expect((await runtime.view('oldDesk', id, actor)).record.note).toBe(
      'previous message',
    );
  });

  it('applies record scope and target preconditions at execution time', async () => {
    const { store, runtime, id, options, detail } = await fixture();
    const first = await options();
    const record = store.record('records', id)!;
    store.insertRecord('records', { ...record, scope: 'another desk' });
    expect(
      await runtime.managementDetails('desk', id, actor, authorize),
    ).toBeUndefined();
    await expect(runtime.suspend('desk', id, first)).rejects.toMatchObject({
      code: 'MANAGEMENT_FORBIDDEN',
    });
    store.insertRecord('records', { ...record, assignee: null });
    await runtime.suspend('desk', id, first);
    expect((await detail()).targets).toEqual([]);
    await expect(
      runtime.restartAt('desk', id, 'waiting', await options()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE' });
  });
  it('pauses an effect that had been claimed but had not started its external call', async () => {
    const preparing = deferred<void>();
    const allowSend = deferred<void>();
    const perform = vi.fn(async () => ({ delivered: true }));
    const { runtime, id, options, wait } = await fixture(
      undefined,
      perform,
      () => {
        preparing.resolve();
        return allowSend.promise;
      },
    );
    const {
      effectRuns: [queued],
    } = await wait();
    const execution = runtime.runEffect(queued.id);
    await preparing.promise;
    await runtime.suspend('desk', id, await options());
    allowSend.resolve();
    expect(await execution).toMatchObject({ status: 'queued', attempts: 0 });
    expect(perform).not.toHaveBeenCalled();
    await runtime.resume('desk', id, await options());
    expect(await runtime.runEffect(queued.id)).toMatchObject({
      status: 'succeeded',
      attempts: 1,
    });
    expect(perform).toHaveBeenCalledOnce();
  });
  it('serializes suspension and a normal transition against the same business version', async () => {
    const first = await fixture();
    const firstOptions = await first.options();
    const [pauseFirst, blockedFire] = await Promise.allSettled([
      first.runtime.suspend('desk', first.id, firstOptions),
      first.wait(),
    ]);
    expect(pauseFirst).toMatchObject({
      status: 'fulfilled',
      value: { state: 'open', suspended: true },
    });
    expect(blockedFire).toMatchObject({
      status: 'rejected',
      reason: { code: 'SUSPENDED' },
    });

    const second = await fixture();
    const secondOptions = await second.options();
    const [fireFirst, stalePause] = await Promise.allSettled([
      second.wait(),
      second.runtime.suspend('desk', second.id, secondOptions),
    ]);
    expect(fireFirst).toMatchObject({
      status: 'fulfilled',
      value: { record: { status: 'waiting' } },
    });
    expect(stalePause).toMatchObject({
      status: 'rejected',
      reason: { code: 'CONFLICT' },
    });
  });
  it('can opt in to resetting an active round without a separate suspension', async () => {
    const active = await fixture(undefined, undefined, undefined, true);
    const {
      effectRuns: [queued],
    } = await active.wait();
    expect((await active.detail()).actions).toEqual(['suspend', 'reset']);
    const result = await active.runtime.reset(
      'desk',
      active.id,
      await active.options(),
    );
    expect(result).toMatchObject({ state: 'open', round: 2, suspended: false });
    const view = await active.runtime.view('oldDesk', active.id, actor);
    expect(view.roundStartedVersion).toBe(view.version);
    expect(
      view.history.transitions.map(({ transition }) => transition),
    ).toEqual(['$create', 'wait']);
    expect(await active.runtime.runEffect(queued.id)).toMatchObject({
      status: 'cancelled',
      attempts: 0,
    });

    const guarded = await fixture();
    await expect(
      guarded.runtime.reset('desk', guarded.id, await guarded.options()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE' });
  });
});
