import { describe, expect, it, vi } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  SYSTEM_ACTOR,
  type EffectRun,
  type LifecycleRecord,
  type LifecycleRecordChange,
} from '../src/index.js';

interface Task extends LifecycleRecord {
  readonly status: 'open' | 'working' | 'done';
}
interface TaskTypes {
  record: Task;
  state: Task['status'];
}

function setup(options: { continuation?: boolean; attempts?: number } = {}) {
  const store = new MemoryLifecycleStore();
  let now = new Date('2026-10-01T09:00:00Z');
  let broken = false;
  let continuationError: Error | undefined;
  const execute = vi
    .fn<() => Promise<unknown>>()
    .mockResolvedValue({ ok: true });
  const logger = { error: vi.fn(), warn: vi.fn() };
  const runtime = new LifecycleRuntime({
    store,
    logger,
    clock: () => now,
    dispatcher: { dispatch: async () => {} },
    continuations: { maxAttempts: 2 },
  });
  runtime.register(
    defineLifecycle<TaskTypes>({
      name: 'tasks',
      initial: 'open',
      states: ['open', 'working', { name: 'done', final: true }],
      transitions: {
        start: {
          from: 'open',
          to: 'working',
          effects: [
            defineEffect<TaskTypes>({
              name: 'tasks.work',
              retry: { attempts: options.attempts ?? 1, backoffMs: 1_000 },
              ...(options.continuation ? { onSuccess: 'finish' } : {}),
              run: () => execute(),
            }),
          ],
        },
        finish: {
          onTransition: () => {
            if (continuationError) throw continuationError;
          },
          from: 'working',
          to: 'done',
          set: () =>
            broken
              ? ({ lifecycleVersion: 99 } as unknown as Partial<Task>)
              : {},
        },
      },
    }),
  );
  const changes: LifecycleRecordChange[] = [];
  const snapshots: (EffectRun | undefined)[] = [];
  runtime.onChange({}, async (change) => {
    changes.push(change);
    if (change.runId) snapshots.push(await store.findEffectRun(change.runId));
  });
  const record = store.insertRecord('tasks', {
    status: 'open',
    lifecycleVersion: 0,
  });
  const start = async (): Promise<string> => {
    const result = await runtime.fire('tasks', record.id, 'start', {
      actor: SYSTEM_ACTOR,
      requestId: 'start',
    });
    return result.effectRuns[0]?.id ?? '';
  };
  return {
    store,
    runtime,
    record,
    execute,
    logger,
    changes,
    snapshots,
    start,
    advance: () => {
      now = new Date(now.getTime() + 360_000);
    },
    failContinuation: () => {
      continuationError = new Error('Database unavailable');
    },
    breakContinuation: (value: boolean) => {
      broken = value;
    },
  };
}

describe('committed record changes', () => {
  it('notifies about an effect outcome even when no transition follows', async () => {
    const { runtime, record, start, snapshots, changes } = setup();
    const runId = await start();
    await runtime.runEffect(runId);
    expect(changes).toEqual([
      { lifecycle: 'tasks', recordId: String(record.id), kind: 'transition' },
      {
        lifecycle: 'tasks',
        recordId: String(record.id),
        kind: 'effect',
        runId,
      },
      {
        lifecycle: 'tasks',
        recordId: String(record.id),
        kind: 'effect',
        runId,
      },
    ]);
    expect(snapshots.map((run) => run?.status)).toEqual([
      'running',
      'succeeded',
    ]);
    expect((await runtime.view('tasks', record.id, SYSTEM_ACTOR)).state).toBe(
      'working',
    );
  });

  it('waits for the outer commit, drops rollbacks and ignores idempotent replays', async () => {
    const { runtime, store, record, changes, start } = setup();
    await expect(
      store.transaction(async (tx) => {
        await runtime.fire('tasks', record.id, 'start', {
          actor: SYSTEM_ACTOR,
          transaction: tx.transactionHandle,
        });
        expect(changes).toEqual([]);
        throw new Error('Rollback');
      }),
    ).rejects.toThrow('Rollback');
    expect(changes).toEqual([]);
    await store.transaction(async (tx) => {
      await runtime.fire('tasks', record.id, 'start', {
        actor: SYSTEM_ACTOR,
        requestId: 'start',
        transaction: tx.transactionHandle,
      });
      expect(changes).toEqual([]);
    });
    expect(changes).toHaveLength(1);
    await start();
    expect(changes).toHaveLength(1);
  });

  it('filters, unsubscribes and isolates listener failures', async () => {
    const { runtime, record, start, logger } = setup();
    const selected = vi.fn();
    const unrelated = vi.fn();
    runtime.onChange({}, () => {
      throw new Error('Offline');
    });
    const stop = runtime.onChange(
      { lifecycle: 'tasks', recordId: record.id },
      selected,
    );
    runtime.onChange({ lifecycle: 'other' }, unrelated);
    runtime.onChange({ recordId: 'other' }, unrelated);
    const runId = await start();
    stop();
    stop();
    await runtime.runEffect(runId);
    expect(selected).toHaveBeenCalledTimes(1);
    expect(unrelated).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(3);
  });

  it('notifies about automatic retries, failures, manual retries and cancellation', async () => {
    const { runtime, execute, start, snapshots } = setup({ attempts: 2 });
    execute.mockRejectedValue(new Error('Offline'));
    const runId = await start();
    await runtime.runEffect(runId);
    await runtime.runEffect(runId);
    await runtime.retryRun(runId);
    await runtime.cancelRun(runId);
    expect(snapshots.map((run) => run?.status)).toEqual([
      'running',
      'queued',
      'running',
      'failed',
      'queued',
      'cancelled',
    ]);
  });

  it('discards a cancelled attempt without announcing its uncommitted result', async () => {
    const { runtime, execute, start, snapshots } = setup();
    let finish!: () => void;
    let began!: () => void;
    const started = new Promise<void>((resolve) => {
      began = resolve;
    });
    execute.mockImplementation(() => {
      began();
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
    const runId = await start();
    const running = runtime.runEffect(runId);
    await started;
    await runtime.cancelRun(runId);
    finish();
    await running;
    expect(snapshots.map((run) => run?.status)).toEqual([
      'running',
      'cancelled',
    ]);
  });

  it('announces a reclaimed lease and its exhausted attempt budget', async () => {
    const { runtime, store, start, snapshots, advance } = setup();
    const runId = await start();
    await store.updateEffectRun(
      runId,
      { status: 'queued' },
      {
        status: 'running',
        attempts: 1,
        claimedAt: '2026-10-01T09:00:00Z',
      },
    );
    advance();
    await runtime.reclaim();
    await runtime.runEffect(runId);
    expect(snapshots.map((run) => run?.status)).toEqual(['queued', 'dead']);
  });

  it('never announces an outcome rolled back with its continuation', async () => {
    const { runtime, start, snapshots, failContinuation } = setup({
      continuation: true,
    });
    failContinuation();
    const runId = await start();
    await runtime.runEffect(runId);
    expect(snapshots.map((run) => run?.status)).toEqual(['running', 'queued']);
    expect(snapshots.at(-1)?.error).toContain('Database unavailable');
  });

  it('announces pending, abandoned and manually resumed continuations after commit', async () => {
    const { runtime, start, snapshots, breakContinuation, advance } = setup({
      continuation: true,
    });
    breakContinuation(true);
    const runId = await start();
    await runtime.runEffect(runId);
    expect(snapshots.at(-1)).toMatchObject({
      status: 'succeeded',
      continuation: { attempts: 1 },
    });
    advance();
    await runtime.reclaim();
    expect(snapshots.at(-1)?.continuation?.abandonedAt).toBeTruthy();
    breakContinuation(false);
    await runtime.continueRun(runId);
    expect(snapshots.at(-1)).toMatchObject({
      status: 'succeeded',
      continuation: null,
    });
  });
});
