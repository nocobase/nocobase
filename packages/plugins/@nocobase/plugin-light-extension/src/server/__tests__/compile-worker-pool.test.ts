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
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
} from '../services/LightExtensionCompileContract';
import { buildLightExtensionCompileKey } from '../services/LightExtensionCompileKey';
import {
  LightExtensionCompilePoolError,
  LightExtensionCompileWorkerPool,
  resolveLightExtensionCompileWorkerId,
  type LightExtensionCompileWorkerFactory,
  type LightExtensionCompileWorkerHandle,
} from '../services/LightExtensionCompileWorkerPool';
import {
  aggregateLightExtensionCompileResults,
  createLightExtensionCompileInfrastructureFailure,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
  type LightExtensionCompileWorkerRequest,
  type LightExtensionCompileWorkerResponse,
} from '../services/LightExtensionCompileWorkerProtocol';

describe('LightExtensionCompileWorkerPool', () => {
  it('runs actual compilation outside the main thread', async () => {
    const pool = new LightExtensionCompileWorkerPool({ workerCount: 1, jobTimeoutMs: 30_000 });
    try {
      const result = await pool.submit(createCompileJob(0));

      expect(result.accepted).toBe(true);
      expect(result.observation.workerId).toBe(1);
      expect(result.observation.threadId).toBeGreaterThan(0);
      expect(result.observation.threadId).not.toBe(mainThreadId);
      expect(pool.getMetrics()).toMatchObject({ active: 0, completed: 1, maxActive: 1 });
    } finally {
      await pool.shutdown();
    }
  }, 60_000);

  it('enforces maximum concurrency and preserves FIFO order within each worker affinity', async () => {
    const harness = createWorkerHarness();
    const pool = new LightExtensionCompileWorkerPool({
      workerCount: 2,
      maxQueueLength: 2,
      workerFactory: harness.factory,
    });
    const jobs = [
      createCompileJobForWorker(1, 0),
      createCompileJobForWorker(2, 100),
      createCompileJobForWorker(1, 200),
      createCompileJobForWorker(2, 300),
      createCompileJobForWorker(1, 400),
    ];
    const promises = jobs.slice(0, 4).map((job) => pool.submit(job));

    expect(harness.startedJobIds).toEqual([jobs[0].jobId, jobs[1].jobId]);
    await expect(pool.submit(jobs[4])).rejects.toMatchObject<Partial<LightExtensionCompilePoolError>>({
      code: 'LIGHT_EXTENSION_COMPILE_QUEUE_CAPACITY_EXCEEDED',
    });
    harness.workers[1].completeCurrent();
    expect(harness.startedJobIds).toEqual([jobs[0].jobId, jobs[1].jobId, jobs[3].jobId]);
    harness.workers[0].completeCurrent();
    expect(harness.startedJobIds).toEqual([jobs[0].jobId, jobs[1].jobId, jobs[3].jobId, jobs[2].jobId]);
    harness.workers[0].completeCurrent();
    harness.workers[1].completeCurrent();

    await expect(Promise.all(promises)).resolves.toHaveLength(4);
    expect(pool.getMetrics()).toMatchObject({ maxActive: 2, completed: 4, rejected: 1 });
    await pool.shutdown();
  });

  it('rejects oversized jobs and bounded in-flight bytes, then exposes capacity backpressure', async () => {
    const harness = createWorkerHarness();
    const job = createCompileJob(0);
    const byteSize = serialize(job).byteLength;
    const pool = new LightExtensionCompileWorkerPool({
      workerCount: 1,
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
      workerCount: 1,
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
    const pool = new LightExtensionCompileWorkerPool({ workerCount: 1, workerFactory: harness.factory });
    const invalid = {
      ...createCompileJob(0),
      transaction: { commit: () => undefined },
    } as unknown as LightExtensionCompileJob;

    await expect(pool.submit(invalid)).rejects.toThrow(/structured-clone plain data/u);
    expect(harness.startedJobIds).toEqual([]);
    await pool.shutdown();
  });

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
    const pool = new LightExtensionCompileWorkerPool({ workerCount: 1, workerFactory: factory });

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
      workerCount: 1,
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
      workerCount: 1,
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

  it('aggregates results in planner order independent of worker completion order', () => {
    const jobs = [createCompileJob(0), createCompileJob(1), createCompileJob(2)];
    const results = [jobs[2], jobs[0], jobs[1]].map((job, index) =>
      createLightExtensionCompileInfrastructureFailure({
        job,
        workerId: index + 1,
        threadId: index + 10,
        attempt: 1,
        queueDurationMs: 0,
        runDurationMs: 1,
        failureCode: `failure_${job.ordinal}`,
        message: `failed ${job.ordinal}`,
      }),
    );

    const aggregate = aggregateLightExtensionCompileResults(jobs, results);

    expect(aggregate.results.map((result) => result.ordinal)).toEqual([0, 1, 2]);
    expect(aggregate.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(['failed 0', 'failed 1', 'failed 2']);
    expect(aggregate.accepted).toBe(false);
  });
});

function createCompileJob(ordinal: number, suffix = ''): LightExtensionCompileJob {
  const entryName = `entry-${ordinal}`;
  const entryPath = `src/client/js-blocks/${entryName}/index.tsx`;
  const content = `ctx.render(<div>${ordinal}${suffix}</div>);\n`;
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
      kind: 'js-block',
      entryPath,
      descriptorPath: `src/client/js-blocks/${entryName}/entry.json`,
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
    kind: 'js-block',
    entryPath,
    runtimeVersion: 'v2',
    surface: structuredClone(LIGHT_EXTENSION_AUTHORING_SURFACES['js-block']),
    compilerBuildIdentity: structuredClone(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY),
    inputManifest: key.inputManifest,
    files: sourceFiles,
  };
}

function createCompileJobForWorker(workerId: number, startOrdinal: number): LightExtensionCompileJob {
  for (let ordinal = startOrdinal; ordinal < startOrdinal + 100; ordinal += 1) {
    const job = createCompileJob(ordinal);
    if (resolveLightExtensionCompileWorkerId(job, 2) === workerId) {
      return job;
    }
  }
  throw new Error(`Unable to create compile job for worker ${workerId}`);
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

function createWorkerHarness(options: { autoComplete?: boolean } = {}) {
  const workers: FakeCompileWorker[] = [];
  const startedJobIds: string[] = [];
  const factory: LightExtensionCompileWorkerFactory = (workerId) => {
    const worker = new FakeCompileWorker(workerId, (request, current) => {
      startedJobIds.push(request.job.jobId);
      if (options.autoComplete) {
        queueMicrotask(() => current.emitResult(createFakeResult(request)));
      }
    });
    workers.push(worker);
    return worker;
  };
  return { factory, workers, startedJobIds };
}

class FakeCompileWorker implements LightExtensionCompileWorkerHandle {
  readonly threadId: number;

  readonly terminate = vi.fn(async () => 0);

  private readonly messageListeners = new Set<(message: LightExtensionCompileWorkerResponse) => void>();

  private readonly errorListeners = new Set<(error: Error) => void>();

  private readonly exitListeners = new Set<(code: number) => void>();

  private current?: LightExtensionCompileWorkerRequest;

  constructor(
    workerId: number,
    private readonly onRequest: (request: LightExtensionCompileWorkerRequest, worker: FakeCompileWorker) => void,
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
