import assert from 'node:assert/strict';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
  ConcurrentAbortError,
} from '@nocobase/concurrency';
import { defaultScheduler } from '@nocobase/concurrency/backend';
import { LocalConcurrentBackend } from '@nocobase/concurrency-mutex';
const watchdog = setTimeout(() => process.exit(2), 1500);
const mode = process.argv[2];
const cause = new Error('Retry cancellation failed');
const controller = new AbortController();
let calls = 0;
const scheduler = {
  setTimer(notify, delay) {
    const count = ++calls;
    if (mode === 'deadline') {
      if (count === 5) throw cause;
      return defaultScheduler.setTimer(
        notify,
        count === 3 ? 1 : count === 4 ? 1000 : delay,
      );
    }
    const cancel = defaultScheduler.setTimer(
      notify,
      count === 3 && mode === 'abort' ? 1000 : delay,
    );
    if (count !== 3) return cancel;
    if (mode === 'abort') queueMicrotask(() => controller.abort());
    return () => {
      cancel();
      throw cause;
    };
  },
};
const runtime = await createConcurrentRuntime({
  backend: new LocalConcurrentBackend({ retryIntervalMs: 1 }),
  namespace: 'child-retry',
  scheduler,
});
const lock = await runtime.manager.createLock('r', { ttl: 10000 });
const held = await lock.lock();
const error = await (
  mode === 'deadline'
    ? lock.tryLock(10000)
    : lock.lock({ signal: controller.signal })
).then(
  () => null,
  (error) => error,
);
assert.ok(
  error instanceof
    (mode === 'abort' ? ConcurrentAbortError : ConcurrentAcquireError),
);
if (mode !== 'abort') assert.equal(error.cause, cause);
if (mode === 'deadline')
  assert.equal(error.message, 'Acquisition deadline monitoring failed');
await held.release();
await runtime.close();
clearTimeout(watchdog);
console.log(JSON.stringify({ mode, settled: true }));
