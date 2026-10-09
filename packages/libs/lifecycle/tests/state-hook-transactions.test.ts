import { describe, expect, it } from 'vitest';
import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  LifecycleRuntime,
  MemoryLifecycleStore,
  type LifecycleRecord,
  type MemoryRows,
} from '../src/index.js';

describe('state hooks on savepoints and continuations', () => {
  it('rolls back a refused continuation and its state hooks while retaining the effect outcome', async () => {
    const store = new MemoryLifecycleStore();
    const told: string[] = [];
    const runtime = new LifecycleRuntime({ store });
    const effect = defineEffect({
      name: 'complete',
      onSuccess: 'finish',
      run: () => ({ ok: true }),
    });
    runtime.register(
      defineLifecycle<{
        record: LifecycleRecord;
        state: 'draft' | 'waiting' | 'done';
      }>({
        name: 'work',
        initial: 'draft',
        states: ['draft', 'waiting', { name: 'done', final: true }],
        transitions: {
          start: { from: 'draft', to: 'waiting', effects: [effect] },
          finish: { from: 'waiting', to: 'done' },
        },
        onEnterState: {
          done: ({ tx }) => {
            (tx.handle as MemoryRows).insertRecord('tasks', {
              id: 'rolled-back',
            });
            tx.afterCommit(() => void told.push('hook'));
            throw new LifecycleError(
              'INVALID_STATE',
              'The parent is not ready.',
            );
          },
        },
      }),
    );
    runtime.on('completed', {}, (e) => void told.push(e.transition));
    const { record } = await runtime.create(
      'work',
      {},
      { actor: { id: 'person' } },
    );
    await runtime.fire('work', record.id, 'start', { actor: { id: 'person' } });
    expect(store.record('work', record.id)?.status).toBe('waiting');
    expect(store.records('tasks')).toEqual([]);
    const history = await runtime.history('work', record.id);
    expect(history.transitions.map((e) => e.transition)).toEqual([
      '$create',
      'start',
    ]);
    expect(history.effectRuns).toMatchObject([
      { status: 'succeeded', attempts: 1 },
    ]);
    expect(told).toEqual(['$create', 'start']);
  });

  it('does not run hooks again on replay or on a rejected human action', async () => {
    const store = new MemoryLifecycleStore();
    let entered = 0;
    const runtime = new LifecycleRuntime({ store });
    runtime.register(
      defineLifecycle<{ record: LifecycleRecord; state: 'open' | 'done' }>({
        name: 'work',
        initial: 'open',
        states: ['open', { name: 'done', final: true }],
        transitions: {
          again: { from: 'open', to: 'open' },
          finish: { from: 'open', to: 'done', manual: false },
        },
        onEnterState: {
          open: () => void entered++,
          done: () => void entered++,
        },
      }),
    );
    const { record } = await runtime.create(
      'work',
      {},
      { actor: { id: 'person' } },
    );
    await runtime.fire('work', record.id, 'again', {
      actor: { id: 'person' },
      requestId: 'click',
    });
    await runtime.fire('work', record.id, 'again', {
      actor: { id: 'person' },
      requestId: 'click',
    });
    await expect(
      runtime.fire('work', record.id, 'finish', {
        actor: { id: 'person' },
        manual: true,
      }),
    ).rejects.toMatchObject({ code: 'NOT_MANUAL' });
    expect(entered).toBe(2);
  });
});
