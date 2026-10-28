import { describe, it, expect } from 'vitest';
import {
  createConcurrentRuntime,
  ConcurrentAbortError,
  ConcurrentConfigurationError,
} from '@nocobase/concurrency';
import type { BackendContext } from '@nocobase/concurrency/backend';
import { ManualTime } from '@nocobase/concurrency/testing';
import { LocalConcurrentBackend } from '../src/index.ts';

async function flush(): Promise<void> {
  for (let i = 0; i < 50; i++) await Promise.resolve();
}

describe('Local ordinary waits', () => {
  for (const method of ['lock', 'run'] as const) {
    it.each(['grant', 'abort', 'close'] as const)(
      `${method} remains pending beyond 30 seconds until %s`,
      async (outcome) => {
        const time = new ManualTime();
        const backend = new LocalConcurrentBackend({ retryIntervalMs: 10000 });
        const options = {
          backend,
          namespace: 'long-wait',
          clock: time,
          scheduler: time,
        };
        const a = await createConcurrentRuntime(options);
        const b = await createConcurrentRuntime(options);
        const holder = await a.manager.createLock('r', { ttl: 120000 });
        const lock = await b.manager.createLock('r');
        const executor = await b.manager.createSynchronous('r');
        const lease = await holder.lock();
        const controller = new AbortController();
        let ran = false;
        let settled = false;
        const work =
          method === 'lock'
            ? lock
                .lock({ signal: controller.signal })
                .then((next) => next.release())
            : executor.run(
                () => {
                  ran = true;
                },
                { signal: controller.signal },
              );
        const observed = work.then(
          () => {
            settled = true;
            return { ok: true as const };
          },
          (error: unknown) => {
            settled = true;
            return { ok: false as const, error };
          },
        );
        await flush();
        time.advance(60000);
        time.flush();
        await flush();
        expect(settled).toBe(false);
        expect(ran).toBe(false);
        expect(await holder.tryLock()).toBeUndefined();
        if (outcome === 'grant') {
          await lease.release();
          time.advance(10000);
          time.flush();
        } else if (outcome === 'abort') controller.abort();
        else await b.close();
        const result = await observed;
        if (outcome === 'grant') {
          expect(result.ok).toBe(true);
          expect(ran).toBe(method === 'run');
        } else {
          expect(result.ok).toBe(false);
          if (result.ok) throw new Error('Expected cancellation');
          expect(result.error).toBeInstanceOf(ConcurrentAbortError);
          expect(ran).toBe(false);
          // Closing/cancelling the contender must not release another session's holder.
          expect(await holder.tryLock()).toBeUndefined();
          await lease.release();
        }
        await a.close();
        await b.close();
        await backend.close();
        expect(time.pendingTimers).toBe(0);
      },
    );
  }

  it('rejects an unsupported protocol version before opening a Local session', async () => {
    const time = new ManualTime();
    const context: BackendContext = {
      protocolVersion: 1,
      managerId: 'test',
      namespace: 'test',
      operationTimeoutMs: 5000,
      cleanupTimeoutMs: 5000,
      clock: time,
      scheduler: time,
    };
    // Deliberately simulate an incompatible JavaScript core.
    Object.defineProperty(context, 'protocolVersion', { value: 2 });
    const backend = new LocalConcurrentBackend();
    await expect(backend.openSession(context)).rejects.toBeInstanceOf(
      ConcurrentConfigurationError,
    );
    await backend.close();
    expect(time.pendingTimers).toBe(0);
  });
});
