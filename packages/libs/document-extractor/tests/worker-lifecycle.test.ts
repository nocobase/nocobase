import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const workers = vi.hoisted(() => ({ instances: [] as WorkerFixture[] }));
class WorkerFixture extends EventEmitter {
  readonly ended = Promise.withResolvers<number>();
  readonly postMessage = vi.fn();
  readonly terminate = vi.fn(() => this.ended.promise);
  constructor() {
    super();
    workers.instances.push(this);
  }
}
vi.mock('node:worker_threads', () => ({ Worker: WorkerFixture }));
const { workerExtractor } = await import('../src/extractor.js');
const input = { bytes: new Uint8Array([1, 2, 3]), ext: 'docx' };
beforeEach(() => {
  vi.useFakeTimers();
  workers.instances.length = 0;
});
afterEach(() => {
  vi.useRealTimers();
});

it('does not start an already aborted request', async () => {
  expect(
    await workerExtractor()(input, { signal: AbortSignal.abort() }),
  ).toMatchObject({ code: 'aborted' });
  expect(workers.instances).toHaveLength(0);
});
it('bounds the queue, removes cancelled waiters and waits for running termination', async () => {
  const extract = workerExtractor({ concurrency: 1, maxQueue: 1 });
  const running = new AbortController();
  const waiting = new AbortController();
  const first = extract(input, { signal: running.signal });
  const second = extract(input, { signal: waiting.signal });
  expect(await extract(input)).toMatchObject({ status: 'failed' });
  waiting.abort();
  expect(await second).toMatchObject({ code: 'aborted' });
  const third = extract(input);
  let returned = false;
  void first.then(() => {
    returned = true;
  });
  running.abort();
  await Promise.resolve();
  expect(returned).toBe(false);
  expect(workers.instances).toHaveLength(1);
  workers.instances[0].ended.resolve(1);
  expect(await first).toMatchObject({ code: 'aborted' });
  expect(workers.instances).toHaveLength(2);
  workers.instances[1].emit('message', { status: 'ready', markdown: 'done' });
  workers.instances[1].ended.resolve(1);
  expect(await third).toEqual({ status: 'ready', markdown: 'done' });
});
it('counts queue time against the deadline and settles only once', async () => {
  const extract = workerExtractor({ timeoutMs: 20, concurrency: 1 });
  const first = extract(input);
  const second = extract(input);
  await vi.advanceTimersByTimeAsync(20);
  expect(await second).toMatchObject({ code: 'timeout' });
  workers.instances[0].emit('message', { status: 'ready', markdown: 'late' });
  workers.instances[0].emit('exit', 0);
  workers.instances[0].ended.resolve(0);
  expect(await first).toMatchObject({ code: 'timeout' });
  expect(workers.instances[0].terminate).toHaveBeenCalledTimes(1);
  expect(workers.instances).toHaveLength(1);
});
it.each(['error', 'exit'])(
  'reclaims the slot after Worker %s',
  async (event) => {
    const extract = workerExtractor({ concurrency: 1 });
    const first = extract(input);
    const second = extract(input);
    workers.instances[0].emit(
      event,
      event === 'error' ? new Error('private') : 0,
    );
    workers.instances[0].ended.resolve(0);
    expect(await first).toMatchObject({ status: 'failed' });
    expect(workers.instances).toHaveLength(2);
    workers.instances[1].emit('message', {
      status: 'ready',
      markdown: 'recovered',
    });
    workers.instances[1].ended.resolve(0);
    expect(await second).toMatchObject({ markdown: 'recovered' });
  },
);
