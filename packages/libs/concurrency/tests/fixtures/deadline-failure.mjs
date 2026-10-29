import assert from 'node:assert/strict';
import {
  createConcurrentRuntime,
  ConcurrentAcquireError,
} from '@nocobase/concurrency';
import { defaultScheduler } from '@nocobase/concurrency/backend';
import { ControlledBackend } from '@nocobase/concurrency/testing';
const watchdog = setTimeout(() => process.exit(2), 1500);
const cause = new Error('Deadline rearm failed');
let calls = 0;
let aborted = false;
const outcome = process.argv[2] ?? 'busy';
let releases = 0;
const scheduler = {
  setTimer(notify, delay) {
    if (++calls === 2) throw cause;
    return defaultScheduler.setTimer(notify, calls === 1 ? 1 : delay);
  },
};
const backend = new ControlledBackend({
  acquire: async (request, context) => {
    await new Promise((resolve) => {
      request.signal.addEventListener('abort', resolve, { once: true });
      if (request.signal.aborted) resolve();
    });
    aborted = request.signal.aborted;
    if (outcome === 'busy') return undefined;
    return {
      notAfter: context.clock.now() + 1000,
      release: async () => {
        releases++;
        if (outcome === 'release-retry' && releases === 1)
          throw new Error('Retry release');
      },
    };
  },
});
const runtime = await createConcurrentRuntime({
  backend,
  namespace: 'child-deadline',
  scheduler,
});
const error = await (await runtime.manager.createLock('r')).tryLock(10000).then(
  () => null,
  (error) => error,
);
assert.ok(error instanceof ConcurrentAcquireError);
assert.equal(error.cause, cause);
assert.equal(aborted, true);
await runtime.close();
clearTimeout(watchdog);
assert.equal(
  releases,
  outcome === 'busy' ? 0 : outcome === 'release-retry' ? 2 : 1,
);
console.log(JSON.stringify({ aborted, releases }));
