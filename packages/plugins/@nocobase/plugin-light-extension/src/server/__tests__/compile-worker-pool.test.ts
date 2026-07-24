/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex } from '@nocobase/runjs';
import { serialize } from 'node:v8';
import { threadId as mainThreadId } from 'node:worker_threads';
import { vi } from 'vitest';

import {
  createLightExtensionCompileInfrastructureFailure,
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
} from '../services/LightExtensionCompileContract';
import { executeLightExtensionCompileJob } from '../services/LightExtensionCompileJobExecutor';
import { buildLightExtensionCompileKey } from '../services/LightExtensionCompileKey';
import {
  LightExtensionCompilePoolError,
  LightExtensionCompileWorkerPool,
  type LightExtensionCompileWorkerFactory,
  type LightExtensionCompileWorkerHandle,
} from '../services/LightExtensionCompileWorkerPool';
import {
  type LightExtensionCompileWorkerRequest,
  type LightExtensionCompileWorkerResponse,
} from '../services/LightExtensionCompileWorkerProtocol';

describe('LightExtensionCompileWorkerPool', () => {
  it('runs actual compilation outside the main thread', async () => {
    const pool = new LightExtensionCompileWorkerPool({ jobTimeoutMs: 30_000 });
    const job = createCompileJob(0);
    try {
      const result = await pool.submit(job);

      expect(result.accepted).toBe(true);
      expect(result.observation.workerId).toBe(1);
      expect(result.observation.threadId).toBeGreaterThan(0);
      expect(result.observation.threadId).not.toBe(mainThreadId);
      if (!result.accepted) {
        throw new Error('Expected the real worker compile to be accepted');
      }
      expect(result.artifact.code).toContain('ctx.render');
      const updated = await pool.submit(createCompileJob(0, '-updated'));
      expect(updated.accepted).toBe(true);
      if (updated.accepted) {
        expect(updated.artifact.code).toContain('0-updated');
      }
      expect(pool.getMetrics()).toMatchObject({ active: 0, completed: 2, maxActive: 1 });
    } finally {
      await pool.shutdown();
    }
  }, 60_000);

  it('rewrites generated settings type imports in compile jobs', async () => {
    const result = await executeLightExtensionCompileJob({
      job: createCompileJob(0, '', {
        kind: 'js-page',
        entryName: 'hello-page',
        entryPath: 'src/client/js-pages/hello-page/index.tsx',
        content:
          "import type { Settings } from 'light-extension:settings/client/js-page/hello-page';\nctx.render(String((ctx.settings as Settings).title || 'Hello'));\n",
      }),
      workerId: 1,
      attempt: 1,
      executingThreadId: 1,
    });

    expect(result.accepted).toBe(true);
  });

  it('uses one isolated worker and preserves bounded FIFO execution', async () => {
    const harness = createWorkerHarness();
    const pool = new LightExtensionCompileWorkerPool({
      maxQueueLength: 2,
      workerFactory: harness.factory,
    });
    expect(harness.workers).toHaveLength(0);
    expect(pool.getMetrics().workerCount).toBe(0);
    const jobs = [createCompileJob(0), createCompileJob(1), createCompileJob(2), createCompileJob(3)];
    const promises = jobs.slice(0, 3).map((job) => pool.submit(job));

    expect(harness.workers).toHaveLength(1);
    expect(harness.startedJobIds).toEqual([jobs[0].jobId]);
    await expect(pool.submit(jobs[3])).rejects.toMatchObject<Partial<LightExtensionCompilePoolError>>({
      code: 'LIGHT_EXTENSION_COMPILE_QUEUE_CAPACITY_EXCEEDED',
    });
    harness.workers[0].completeCurrent();
    expect(harness.startedJobIds).toEqual([jobs[0].jobId, jobs[1].jobId]);
    harness.workers[0].completeCurrent();
    expect(harness.startedJobIds).toEqual([jobs[0].jobId, jobs[1].jobId, jobs[2].jobId]);
    harness.workers[0].completeCurrent();

    await expect(Promise.all(promises)).resolves.toHaveLength(3);
    expect(pool.getMetrics()).toMatchObject({ workerCount: 1, maxActive: 1, completed: 3, rejected: 1 });
    await pool.shutdown();
  });

  it('does not create a worker when an unused pool shuts down', async () => {
    const harness = createWorkerHarness();
    const pool = new LightExtensionCompileWorkerPool({ workerFactory: harness.factory });

    await pool.shutdown();

    expect(harness.workers).toHaveLength(0);
    expect(pool.getMetrics()).toMatchObject({ workerCount: 0, active: 0, queueDepth: 0, inflightBytes: 0 });
  });

  it('rejects oversized jobs and bounded in-flight bytes, then exposes capacity backpressure', async () => {
    const harness = createWorkerHarness();
    const job = createCompileJob(0);
    const byteSize = serialize(job).byteLength;
    const pool = new LightExtensionCompileWorkerPool({
      maxQueueLength: 1,
      maxJobBytes: byteSize + 32,
      maxInFlightBytes: byteSize * 2 - 1,
      workerFactory: harness.factory,
    });
    const active = pool.submit(job);
    const waitingForCapacity = pool.waitForCapacity(byteSize);

    await expect(pool.submit(createCompileJob(1))).rejects.toMatchObject<Partial<LightExtensionCompilePoolError>>({
      code: 'LIGHT_EXTENSION_COMPILE_INFLIGHT_BYTES_EXCEEDED',
    });
    expect(pool.getMetrics().inflightBytes).toBe(byteSize);
    harness.workers[0].completeCurrent();
    await active;
    await expect(waitingForCapacity).resolves.toBeUndefined();
    await pool.shutdown();

    const smallPool = new LightExtensionCompileWorkerPool({
      maxJobBytes: byteSize,
      maxInFlightBytes: byteSize,
      workerFactory: createWorkerHarness().factory,
    });
    await expect(smallPool.submit(createCompileJob(2, ' '.repeat(128)))).rejects.toMatchObject<
      Partial<LightExtensionCompilePoolError>
    >({ code: 'LIGHT_EXTENSION_COMPILE_JOB_TOO_LARGE' });
    await smallPool.shutdown();
  });

  it('rejects functions and process-local objects at the structured-clone boundary', async () => {
    const harness = createWorkerHarness();
    const pool = new LightExtensionCompileWorkerPool({ workerFactory: harness.factory });
    const invalid = {
      ...createCompileJob(0),
      transaction: { commit: () => undefined },
    } as unknown as LightExtensionCompileJob;

    await expect(pool.submit(invalid)).rejects.toThrow(/structured-clone plain data/u);
    expect(harness.startedJobIds).toEqual([]);
    await pool.shutdown();
  });

  it('bounds capacity waiters and removes an aborted waiter', async () => {
    const harness = createWorkerHarness();
    const job = createCompileJob(0);
    const byteSize = serialize(job).byteLength;
    const pool = new LightExtensionCompileWorkerPool({
      maxJobBytes: byteSize,
      maxInFlightBytes: byteSize,
      maxCapacityWaiters: 1,
      workerFactory: harness.factory,
    });
    const active = pool.submit(job);
    const controller = new AbortController();
    const waiting = pool.waitForCapacity(byteSize, controller.signal);

    await expect(pool.waitForCapacity(byteSize)).rejects.toMatchObject<Partial<LightExtensionCompilePoolError>>({
      code: 'LIGHT_EXTENSION_COMPILE_CAPACITY_WAITERS_EXCEEDED',
    });
    const reason = new Error('request aborted');
    controller.abort(reason);
    await expect(waiting).rejects.toBe(reason);

    harness.workers[0].completeCurrent();
    await active;
    await pool.shutdown();
  });

  it('prepares a backpressured job once before the caller can mutate it', async () => {
    const harness = createWorkerHarness();
    const activeJob = createCompileJob(0);
    const waitingJob = createCompileJob(1);
    const maxJobBytes = Math.max(serialize(activeJob).byteLength, serialize(waitingJob).byteLength) + 32;
    const pool = new LightExtensionCompileWorkerPool({
      maxJobBytes,
      maxInFlightBytes: maxJobBytes,
      workerFactory: harness.factory,
    });
    const active = pool.submit(activeJob);
    const waiting = pool.submitWithBackpressure(waitingJob);
    const originalJobId = waitingJob.jobId;
    const originalContent = waitingJob.files[0].content;

    waitingJob.jobId = 'mutated-after-submit';
    waitingJob.files[0].content = 'mutated-after-submit';
    harness.workers[0].completeCurrent();
    await active;
    await vi.waitFor(() => expect(harness.startedJobs).toHaveLength(2));
    expect(harness.startedJobs[1]).toMatchObject({ jobId: originalJobId });
    expect(harness.startedJobs[1].files[0].content).toBe(originalContent);
    harness.workers[0].completeCurrent();
    await waiting;
    await pool.shutdown();

    const oversizedHarness = createWorkerHarness();
    const oversized = createCompileJob(2, ' '.repeat(128));
    const oversizedPool = new LightExtensionCompileWorkerPool({
      maxJobBytes: serialize(oversized).byteLength - 1,
      maxInFlightBytes: serialize(oversized).byteLength,
      workerFactory: oversizedHarness.factory,
    });
    const rejected = oversizedPool.submitWithBackpressure(oversized);
    oversized.files[0].content = '';
    await expect(rejected).rejects.toMatchObject<Partial<LightExtensionCompilePoolError>>({
      code: 'LIGHT_EXTENSION_COMPILE_JOB_TOO_LARGE',
    });
    expect(oversizedHarness.workers).toHaveLength(0);
    await oversizedPool.shutdown();
  });

  it('leaves no worker or accounting behind when the first worker factory throws', async () => {
    const pool = new LightExtensionCompileWorkerPool({
      workerFactory: () => {
        throw new Error('worker factory failed');
      },
    });

    await expect(pool.submit(createCompileJob(0))).rejects.toThrow('worker factory failed');
    expect(pool.getMetrics()).toMatchObject({ workerCount: 0, active: 0, queueDepth: 0, inflightBytes: 0 });
    await pool.shutdown();
  });

  it.each(['error', 'exit'] as const)(
    'rejects all pending jobs when the first worker emits %s before ready',
    async (failureEvent) => {
      const harness = createWorkerHarness({ ready: false });
      const pool = new LightExtensionCompileWorkerPool({ workerFactory: harness.factory });
      const first = pool.submit(createCompileJob(0));
      const second = pool.submit(createCompileJob(1));

      if (failureEvent === 'error') {
        harness.workers[0].emitError(new Error('worker failed before ready'));
      } else {
        harness.workers[0].emitExit(1);
      }

      await expect(first).rejects.toThrow(/before ready|exited with code 1/u);
      await expect(second).rejects.toThrow(/before ready|exited with code 1/u);
      await vi.waitFor(() =>
        expect(pool.getMetrics()).toMatchObject({ workerCount: 0, active: 0, queueDepth: 0, inflightBytes: 0 }),
      );
      await pool.shutdown();
    },
  );

  it('restarts a crashed worker and retries the unfinished job exactly once', async () => {
    const workers: FakeCompileWorker[] = [];
    const factory: LightExtensionCompileWorkerFactory = (workerId) => {
      const worker = new FakeCompileWorker(workerId, (request, current) => {
        if (workers.length === 1) {
          queueMicrotask(() => current.emitError(new Error('simulated crash')));
          return;
        }
        queueMicrotask(() => current.emitResult(createFakeResult(request)));
      });
      workers.push(worker);
      return worker;
    };
    const pool = new LightExtensionCompileWorkerPool({ workerFactory: factory });

    const result = await pool.submit(createCompileJob(0));

    expect(result.observation.attempt).toBe(2);
    expect(workers).toHaveLength(2);
    expect(workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(pool.getMetrics()).toMatchObject({ restarts: 1, completed: 1 });
    await pool.shutdown();
  });

  it('returns a deterministic failure after timeout retry is exhausted and keeps a replacement worker', async () => {
    const workers: FakeCompileWorker[] = [];
    const factory: LightExtensionCompileWorkerFactory = (workerId) => {
      const worker = new FakeCompileWorker(workerId, () => undefined);
      workers.push(worker);
      return worker;
    };
    const pool = new LightExtensionCompileWorkerPool({
      jobTimeoutMs: 10,
      workerFactory: factory,
    });

    const result = await pool.submit(createCompileJob(0));

    expect(result).toMatchObject({
      accepted: false,
      failureCode: 'LIGHT_EXTENSION_COMPILE_JOB_TIMEOUT',
      observation: { attempt: 2 },
    });
    expect(pool.getMetrics()).toMatchObject({ timeouts: 2, restarts: 2, completed: 1, workerCount: 1 });
    expect(workers).toHaveLength(3);
    await pool.shutdown();
  });

  it('stops admission and settles active and queued jobs when shutdown grace expires', async () => {
    const harness = createWorkerHarness({ autoComplete: false });
    const pool = new LightExtensionCompileWorkerPool({
      maxQueueLength: 1,
      workerFactory: harness.factory,
    });
    const active = pool.submit(createCompileJob(0));
    const queued = pool.submit(createCompileJob(1));
    const shutdown = pool.shutdown(5);

    await expect(pool.submit(createCompileJob(2))).rejects.toMatchObject<Partial<LightExtensionCompilePoolError>>({
      code: 'LIGHT_EXTENSION_COMPILE_POOL_CLOSED',
    });
    await shutdown;
    await expect(active).resolves.toMatchObject({
      accepted: false,
      failureCode: 'LIGHT_EXTENSION_COMPILE_POOL_SHUTDOWN',
    });
    await expect(queued).resolves.toMatchObject({
      accepted: false,
      failureCode: 'LIGHT_EXTENSION_COMPILE_POOL_SHUTDOWN',
    });
    expect(harness.workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(pool.getMetrics()).toMatchObject({ active: 0, queueDepth: 0, inflightBytes: 0, shuttingDown: true });
  });
});

function createCompileJob(
  ordinal: number,
  suffix = '',
  source: {
    kind: LightExtensionCompileJob['kind'];
    entryName: string;
    entryPath: string;
    content: string;
  } = {
    kind: 'js-block',
    entryName: `entry-${ordinal}`,
    entryPath: `src/client/js-blocks/entry-${ordinal}/index.tsx`,
    content: `ctx.render(<div>${ordinal}${suffix}</div>);\n`,
  },
): LightExtensionCompileJob {
  const { content, entryName, entryPath, kind } = source;
  const sourceFiles = [
    {
      path: entryPath,
      content,
      blobHash: sha256Hex(content),
      language: 'tsx',
      mode: '100644',
    },
  ];
  const key = buildLightExtensionCompileKey({
    entry: {
      target: 'client',
      kind,
      entryPath,
      descriptorPath: `${entryPath.slice(0, entryPath.lastIndexOf('/'))}/entry.json`,
    },
    files: sourceFiles,
  });
  return {
    jobId: `job-${ordinal}`,
    requestId: `request-${ordinal}`,
    correlationId: 'batch-1',
    repoId: 'repo-1',
    entryId: `entry-id-${ordinal}`,
    entryName,
    ordinal,
    compileKey: key.compileKey,
    filesHash: key.filesHash,
    kind,
    entryPath,
    runtimeVersion: 'v2',
    surface: structuredClone(LIGHT_EXTENSION_AUTHORING_SURFACES[kind]),
    compilerBuildIdentity: structuredClone(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY),
    inputManifest: key.inputManifest,
    files: sourceFiles,
  };
}

function createFakeResult(request: LightExtensionCompileWorkerRequest): LightExtensionCompileResult {
  return createLightExtensionCompileInfrastructureFailure({
    job: request.job,
    workerId: request.workerId,
    threadId: request.workerId + 100,
    attempt: request.attempt,
    queueDurationMs: 0,
    runDurationMs: 1,
    failureCode: 'FAKE_COMPILE_RESULT',
    message: 'Fake worker result',
  });
}

function createWorkerHarness(options: { autoComplete?: boolean; ready?: boolean } = {}) {
  const workers: FakeCompileWorker[] = [];
  const startedJobIds: string[] = [];
  const startedJobs: LightExtensionCompileJob[] = [];
  const factory: LightExtensionCompileWorkerFactory = (workerId) => {
    const worker = new FakeCompileWorker(
      workerId,
      (request, current) => {
        startedJobIds.push(request.job.jobId);
        startedJobs.push(request.job);
        if (options.autoComplete) {
          queueMicrotask(() => current.emitResult(createFakeResult(request)));
        }
      },
      options.ready !== false,
    );
    workers.push(worker);
    return worker;
  };
  return { factory, workers, startedJobIds, startedJobs };
}

class FakeCompileWorker implements LightExtensionCompileWorkerHandle {
  readonly threadId: number;

  readonly terminate = vi.fn(async () => 0);

  private readonly messageListeners = new Set<(message: LightExtensionCompileWorkerResponse) => void>();

  private readonly errorListeners = new Set<(error: Error) => void>();

  private readonly exitListeners = new Set<(code: number) => void>();

  private current?: LightExtensionCompileWorkerRequest;

  private readyEmitted = false;

  constructor(
    workerId: number,
    private readonly onRequest: (request: LightExtensionCompileWorkerRequest, worker: FakeCompileWorker) => void,
    private readonly ready = true,
  ) {
    this.threadId = workerId + 100;
  }

  on(event: 'message', listener: (message: LightExtensionCompileWorkerResponse) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'exit', listener: (code: number) => void): this;
  on(
    event: 'message' | 'error' | 'exit',
    listener:
      | ((message: LightExtensionCompileWorkerResponse) => void)
      | ((error: Error) => void)
      | ((code: number) => void),
  ): this {
    this.listenersFor(event).add(listener as never);
    if (event === 'message' && this.ready && !this.readyEmitted) {
      this.readyEmitted = true;
      (listener as (message: LightExtensionCompileWorkerResponse) => void)({
        type: 'ready',
        threadId: this.threadId,
      });
    }
    return this;
  }

  off(event: 'message', listener: (message: LightExtensionCompileWorkerResponse) => void): this;
  off(event: 'error', listener: (error: Error) => void): this;
  off(event: 'exit', listener: (code: number) => void): this;
  off(
    event: 'message' | 'error' | 'exit',
    listener:
      | ((message: LightExtensionCompileWorkerResponse) => void)
      | ((error: Error) => void)
      | ((code: number) => void),
  ): this {
    this.listenersFor(event).delete(listener as never);
    return this;
  }

  postMessage(value: LightExtensionCompileWorkerRequest): void {
    this.current = value;
    this.onRequest(value, this);
  }

  completeCurrent(): void {
    if (!this.current) {
      throw new Error('Fake worker has no current request');
    }
    this.emitResult(createFakeResult(this.current));
  }

  emitResult(result: LightExtensionCompileResult): void {
    this.current = undefined;
    for (const listener of this.messageListeners) {
      listener({ type: 'result', result });
    }
  }

  emitError(error: Error): void {
    for (const listener of this.errorListeners) {
      listener(error);
    }
  }

  emitExit(code: number): void {
    for (const listener of this.exitListeners) {
      listener(code);
    }
  }

  private listenersFor(event: 'message' | 'error' | 'exit'): Set<never> {
    if (event === 'message') {
      return this.messageListeners as Set<never>;
    }
    if (event === 'error') {
      return this.errorListeners as Set<never>;
    }
    return this.exitListeners as Set<never>;
  }
}
