import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createQueueService,
  type QueueConfigEntry,
  type QueueService,
} from '../../src/index.js';
import { memoryStateFilePath } from '../../src/memory/state-file.js';
import {
  deferred,
  silentLogger,
  sleep,
  waitFor,
} from '../contract/queue-contract.js';

const services: QueueService[] = [];

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((s) => s.shutdown()));
});

function memoryService(
  storagePath: string,
  entry: Partial<QueueConfigEntry> = {},
  namespace = 'memory-test',
): QueueService {
  const created = createQueueService(
    {
      default: 'memory',
      memory: {
        adapter: 'inMemory',
        namespace,
        persistence: { path: storagePath },
        ...entry,
      },
    },
    {
      appName: 'memory-app',
      storagePath: '/nonexistent',
      logger: silentLogger,
    },
  );
  services.push(created);
  return created;
}

function statePath(
  storagePath: string,
  queue: string,
  namespace = 'memory-test',
): string {
  return memoryStateFilePath({
    persistencePath: storagePath,
    namespace,
    queue,
  });
}

describe('in-memory state file', () => {
  it('names the file by namespace and queue, not by configuration key', () => {
    const file = statePath('/storage', 'email', 'crm');
    expect(path.basename(file)).toBe(
      `queue.${Buffer.from(JSON.stringify(['crm', 'email'])).toString('base64url')}.state.json`,
    );
  });

  it('writes waiting and delayed jobs at shutdown and runs them after a restart', async () => {
    const storage = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-memory-'));
    const first = memoryService(storage);
    first.producer('restart');
    await first.setup();
    await first.producer('restart').publish('x', 'waiting');
    await first.producer('restart').publish('x', 'delayed', { delay: 300 });
    await first.shutdown();
    const document = JSON.parse(
      readFileSync(statePath(storage, 'restart'), 'utf8'),
    ) as {
      version: number;
      queue: string;
      jobs: Array<{ message: string; delayedUntil?: number }>;
    };
    expect(document.version).toBe(1);
    expect(document.queue).toBe('restart');
    expect(document.jobs.map((job) => job.message)).toEqual([
      '"waiting"',
      '"delayed"',
    ]);
    expect(document.jobs[1].delayedUntil).toBeGreaterThan(Date.now());

    // Another key with the same namespace reads the same file.
    const second = createQueueService(
      {
        default: 'renamed',
        renamed: {
          adapter: 'inMemory',
          namespace: 'memory-test',
          persistence: { path: storage },
        },
      },
      {
        appName: 'memory-app',
        storagePath: '/nonexistent',
        logger: silentLogger,
      },
    );
    services.push(second);
    const received: unknown[] = [];
    second.consumer('restart').consume(async (_c, message) => {
      received.push(message);
    });
    await second.setup();
    await waitFor(() => received.length === 2);
    expect(received).toEqual(['waiting', 'delayed']);
  });

  it('does not count an interrupted job as a failure', async () => {
    const storage = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-memory-'));
    const first = memoryService(storage, {
      attempts: 1,
      shutdownTimeoutMs: 50,
    });
    const started = deferred();
    first.consumer('interrupt').consume(
      (_c, _m, signal) =>
        new Promise<void>((_resolve, reject) => {
          started.resolve();
          signal.addEventListener('abort', () =>
            reject(signal.reason as Error),
          );
        }),
    );
    await first.setup();
    await first.producer('interrupt').publish('x', 'work');
    await started.promise;
    await first.shutdown();
    const [job] = (
      JSON.parse(readFileSync(statePath(storage, 'interrupt'), 'utf8')) as {
        jobs: Array<{ failures: number; started: number }>;
      }
    ).jobs;
    expect(job).toMatchObject({ failures: 0, started: 0 });
  });

  it('refuses a corrupt file and leaves it as it was', async () => {
    const storage = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-memory-'));
    const file = statePath(storage, 'corrupt');
    writeFileSync(file, '{"version":2}');
    const queue = memoryService(storage);
    queue.producer('corrupt');
    queue.producer('healthy');
    await expect(queue.setup()).rejects.toThrow(/Invalid queue state file/u);
    await queue.shutdown();
    expect(readFileSync(file, 'utf8')).toBe('{"version":2}');
    expect(existsSync(statePath(storage, 'healthy'))).toBe(true);
  });

  it('keeps initialization failures local once the service runs', async () => {
    const storage = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-memory-'));
    writeFileSync(statePath(storage, 'broken'), 'not json');
    const queue = memoryService(storage);
    const received: unknown[] = [];
    queue.consumer('healthy').consume(async (_c, message) => {
      received.push(message);
    });
    await queue.setup();
    await expect(queue.producer('broken').publish('x', {})).rejects.toThrow(
      /Invalid queue state file/u,
    );
    await queue.producer('healthy').publish('x', 'ok');
    await waitFor(() => received.length === 1);
  });

  it('does not share queues between services, even with the same namespace', async () => {
    const storage = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-memory-'));
    const namespace = `isolated-${randomUUID()}`;
    const a = memoryService(storage, {}, namespace);
    const b = memoryService(
      mkdtempSync(path.join(tmpdir(), 'nocobase-queue-memory-')),
      {},
      namespace,
    );
    const receivedByB: unknown[] = [];
    b.consumer('isolated').consume(async (_c, message) => {
      receivedByB.push(message);
    });
    await a.setup();
    await b.setup();
    await a.producer('isolated').publish('x', 'only a');
    await sleep(100);
    expect(receivedByB).toEqual([]);
  });

  it('keeps finished IDs in history, so they are skipped until trimmed', async () => {
    const storage = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-memory-'));
    const queue = memoryService(storage, { removeOnComplete: 1 });
    const received: unknown[] = [];
    queue.consumer('history').consume(async (_c, message) => {
      received.push(message);
    });
    await queue.setup();
    const producer = queue.producer('history');
    const options = {
      jobIdProducer: (_q: string, _c: string, m: unknown) => `job-${String(m)}`,
    };
    await producer.publish('x', 'a', options);
    await waitFor(() => received.length === 1);
    await producer.publish('x', 'a', options);
    await sleep(50);
    expect(received).toEqual(['a']);
    // Completing "b" trims "a" out of a history that keeps one job.
    await producer.publish('x', 'b', options);
    await waitFor(() => received.length === 2);
    await producer.publish('x', 'a', options);
    await waitFor(() => received.length === 3);
    expect(received).toEqual(['a', 'b', 'a']);
  });
});
