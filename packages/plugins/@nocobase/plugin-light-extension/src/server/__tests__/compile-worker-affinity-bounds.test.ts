/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex } from '@nocobase/runjs';
import { availableParallelism } from 'node:os';
import { vi } from 'vitest';

import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
} from '../services/LightExtensionCompileContract';
import { buildLightExtensionCompileKey } from '../services/LightExtensionCompileKey';
import {
  LightExtensionCompileWorkerPool,
  resolveLightExtensionCompileWorkerId,
  type LightExtensionCompileWorkerFactory,
  type LightExtensionCompileWorkerHandle,
} from '../services/LightExtensionCompileWorkerPool';
import {
  createLightExtensionCompileInfrastructureFailure,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
  type LightExtensionCompileWorkerRequest,
  type LightExtensionCompileWorkerResponse,
} from '../services/LightExtensionCompileWorkerProtocol';

describe('LightExtensionCompileWorkerPool session affinity and bounds', () => {
  it('keeps the production default at a small CPU-derived cap', async () => {
    const harness = createHarness();
    const pool = new LightExtensionCompileWorkerPool({ workerFactory: harness.factory });

    expect(pool.getMetrics().workerCount).toBe(Math.min(2, Math.max(1, availableParallelism())));
    expect(harness.workers).toHaveLength(pool.getMetrics().workerCount);
    await pool.shutdown();
  });

  it('routes consecutive versions of the same Entry to one worker while unrelated Entries can progress', async () => {
    const harness = createHarness();
    const pool = new LightExtensionCompileWorkerPool({
      workerCount: 2,
      maxQueueLength: 2,
      workerFactory: harness.factory,
    });
    const first = createJob(0);
    const sameEntry = {
      ...createJob(100),
      repoId: first.repoId,
      entryId: first.entryId,
      entryName: first.entryName,
    };
    const affinityWorkerId = resolveLightExtensionCompileWorkerId(first, 2);
    const unrelated = findJobForWorker(affinityWorkerId === 1 ? 2 : 1);

    const firstResult = pool.submit(first);
    const sameEntryResult = pool.submit(sameEntry);
    const unrelatedResult = pool.submit(unrelated);

    expect(resolveLightExtensionCompileWorkerId(sameEntry, 2)).toBe(affinityWorkerId);
    expect(harness.started.map(({ workerId, jobId }) => ({ workerId, jobId }))).toEqual(
      expect.arrayContaining([
        { workerId: affinityWorkerId, jobId: first.jobId },
        { workerId: resolveLightExtensionCompileWorkerId(unrelated, 2), jobId: unrelated.jobId },
      ]),
    );
    expect(harness.started.some(({ jobId }) => jobId === sameEntry.jobId)).toBe(false);

    harness.worker(resolveLightExtensionCompileWorkerId(unrelated, 2)).completeCurrent();
    await unrelatedResult;
    expect(harness.started.some(({ jobId }) => jobId === sameEntry.jobId)).toBe(false);

    harness.worker(affinityWorkerId).completeCurrent();
    await firstResult;
    expect(harness.started.at(-1)).toEqual({ workerId: affinityWorkerId, jobId: sameEntry.jobId });
    harness.worker(affinityWorkerId).completeCurrent();
    await sameEntryResult;
    await pool.shutdown();
  });

  it('never exceeds maxQueueLength when affinity leaves another worker idle', async () => {
    const harness = createHarness();
    const pool = new LightExtensionCompileWorkerPool({
      workerCount: 2,
      maxQueueLength: 1,
      workerFactory: harness.factory,
    });
    const first = createJob(0);
    const queued = { ...createJob(1), repoId: first.repoId, entryId: first.entryId };
    const rejected = { ...createJob(2), repoId: first.repoId, entryId: first.entryId };
    const workerId = resolveLightExtensionCompileWorkerId(first, 2);
    const firstResult = pool.submit(first);
    const queuedResult = pool.submit(queued);

    await expect(pool.submit(rejected)).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_COMPILE_QUEUE_CAPACITY_EXCEEDED',
    });
    expect(pool.getMetrics()).toMatchObject({ active: 1, queueDepth: 1, maxQueueDepth: 1 });
    expect(harness.workers.filter((worker) => worker.current).map((worker) => worker.workerId)).toEqual([workerId]);

    harness.worker(workerId).completeCurrent();
    await firstResult;
    harness.worker(workerId).completeCurrent();
    await queuedResult;
    await pool.shutdown();
  });
});

function createJob(ordinal: number): LightExtensionCompileJob {
  const entryName = `entry-${ordinal}`;
  const entryPath = `src/client/js-blocks/${entryName}/index.tsx`;
  const content = `ctx.render(<div>${ordinal}</div>);\n`;
  const files = [
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
    files,
  });
  return {
    jobId: `job-${ordinal}`,
    requestId: `request-${ordinal}`,
    correlationId: 'affinity-batch',
    repoId: 'repo-affinity',
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
    files,
  };
}

function findJobForWorker(workerId: number): LightExtensionCompileJob {
  for (let ordinal = 200; ordinal < 300; ordinal += 1) {
    const job = createJob(ordinal);
    if (resolveLightExtensionCompileWorkerId(job, 2) === workerId) {
      return job;
    }
  }
  throw new Error(`Unable to create a test job for worker ${workerId}`);
}

function createHarness() {
  const workers: AffinityFakeWorker[] = [];
  const started: Array<{ workerId: number; jobId: string }> = [];
  const factory: LightExtensionCompileWorkerFactory = (workerId) => {
    const worker = new AffinityFakeWorker(workerId, (request) => {
      started.push({ workerId, jobId: request.job.jobId });
    });
    workers.push(worker);
    return worker;
  };
  return {
    factory,
    workers,
    started,
    worker(workerId: number) {
      const worker = workers.find((candidate) => candidate.workerId === workerId);
      if (!worker) {
        throw new Error(`Worker ${workerId} does not exist`);
      }
      return worker;
    },
  };
}

class AffinityFakeWorker implements LightExtensionCompileWorkerHandle {
  readonly threadId: number;

  readonly terminate = vi.fn(async () => 0);

  readonly messageListeners = new Set<(message: LightExtensionCompileWorkerResponse) => void>();

  readonly errorListeners = new Set<(error: Error) => void>();

  readonly exitListeners = new Set<(code: number) => void>();

  current?: LightExtensionCompileWorkerRequest;

  constructor(
    readonly workerId: number,
    private readonly onRequest: (request: LightExtensionCompileWorkerRequest) => void,
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
    this.listeners(event).add(listener as never);
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
    this.listeners(event).delete(listener as never);
    return this;
  }

  postMessage(request: LightExtensionCompileWorkerRequest): void {
    this.current = request;
    this.onRequest(request);
  }

  completeCurrent(): void {
    const request = this.current;
    if (!request) {
      throw new Error(`Worker ${this.workerId} has no current request`);
    }
    this.current = undefined;
    const result: LightExtensionCompileResult = createLightExtensionCompileInfrastructureFailure({
      job: request.job,
      workerId: this.workerId,
      threadId: this.threadId,
      attempt: request.attempt,
      queueDurationMs: 0,
      runDurationMs: 1,
      failureCode: 'AFFINITY_TEST_RESULT',
      message: 'Affinity test result',
    });
    for (const listener of this.messageListeners) {
      listener({ type: 'result', result });
    }
  }

  private listeners(event: 'message' | 'error' | 'exit'): Set<never> {
    if (event === 'message') {
      return this.messageListeners as Set<never>;
    }
    if (event === 'error') {
      return this.errorListeners as Set<never>;
    }
    return this.exitListeners as Set<never>;
  }
}
