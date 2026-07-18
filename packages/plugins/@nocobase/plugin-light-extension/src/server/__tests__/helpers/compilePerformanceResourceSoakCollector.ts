/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex } from '@nocobase/runjs';
import type { CompileRunJSSourceWorkspaceInput, RunJSCompilerSessionContract } from '@nocobase/runjs/compiler';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { arch, cpus, platform } from 'node:os';
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { threadId as mainThreadId } from 'node:worker_threads';

import { buildLightExtensionCompileKey } from '../../services/LightExtensionCompileKey';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
} from '../../services/LightExtensionCompileContract';
import {
  LightExtensionCompilerSessionManager,
  type LightExtensionCompilerSessionMetric,
} from '../../services/LightExtensionCompilerSessionManager';
import { LightExtensionCompileWorkerPool } from '../../services/LightExtensionCompileWorkerPool';
import type { LightExtensionCompileJob } from '../../services/LightExtensionCompileWorkerProtocol';
import {
  createCompilePerformanceResourceSoakEvidence,
  type CompilePerformanceMemorySoakEvidence,
  type CompilePerformanceResourceMemorySample,
  type CompilePerformanceResourceSoakConfig,
  type CompilePerformanceResourceSoakEvidence,
} from './compilePerformanceResourceEvidence';

export async function collectCompilePerformanceResourceSoakEvidence(
  config: CompilePerformanceResourceSoakConfig,
): Promise<CompilePerformanceResourceSoakEvidence> {
  await warmUpResourceSoak();
  const start = await settledMemorySample();
  let peak = { ...start };
  const samplePeak = () => {
    peak = maxMemory(peak, memorySample());
  };
  const session = await collectSessionEvidence(config, samplePeak);
  const worker = await collectWorkerEvidence(config, samplePeak);
  const afterShutdown = await settledMemorySample();
  const memory: CompilePerformanceMemorySoakEvidence = {
    start,
    peak,
    afterShutdown,
    configuredMaxRssGrowthBytes: config.maxRssGrowthBytes,
    configuredMaxHeapGrowthBytes: config.maxHeapGrowthBytes,
  };
  return createCompilePerformanceResourceSoakEvidence({
    collectedAt: new Date().toISOString(),
    sourceCommit: config.sourceCommit,
    harnessCommit: config.harnessCommit,
    nodeVersion: process.version,
    machineFingerprint: machineFingerprint(),
    dependencyFingerprint: await dependencyFingerprint(),
    iterations: config.iterations,
    session,
    worker,
    memory,
    reproducibleCommand: reproducibleCommand(config),
  });
}

async function collectSessionEvidence(config: CompilePerformanceResourceSoakConfig, samplePeak: () => void) {
  let now = 1_000;
  const metrics: LightExtensionCompilerSessionMetric[] = [];
  const manager = new LightExtensionCompilerSessionManager({
    maxRepos: config.sessionMaxRepos,
    maxEntries: config.sessionMaxEntries,
    maxEstimatedFileBytes: config.sessionMaxEstimatedFileBytes,
    idleTtlMs: config.sessionIdleTtlMs,
    sweepIntervalMs: 0,
    now: () => now,
    metricObserver: (metric) => {
      metrics.push(metric);
    },
  });
  const disabled = new LightExtensionCompilerSessionManager({
    maxRepos: 0,
    maxEntries: 0,
    maxEstimatedFileBytes: 0,
    sweepIntervalMs: 0,
  });
  let peakState = manager.getDebugState();
  let afterTtl = manager.getDebugState();
  let disabledResult: Awaited<ReturnType<typeof disabled.compile>> | undefined;
  let disabledState = disabled.getDebugState();
  try {
    const compileCount = Math.max(config.sessionMaxEntries + 2, config.sessionMaxRepos + 2);
    for (let index = 0; index < compileCount; index += 1) {
      const sessionContract = createSessionContract(
        `resource-repo-${index % (config.sessionMaxRepos + 1)}`,
        `resource-entry-${index}`,
      );
      await manager.compile({
        contract: sessionContract,
        input: createSessionCompileInput(sessionContract, `return ${index};`),
      });
      now += 1;
      peakState = maxSessionState(peakState, manager.getDebugState());
      samplePeak();
    }
    now += config.sessionIdleTtlMs + 1;
    await manager.sweepExpired();
    afterTtl = manager.getDebugState();

    const shutdownContract = createSessionContract('resource-shutdown-repo', 'resource-shutdown-entry');
    await manager.compile({
      contract: shutdownContract,
      input: createSessionCompileInput(shutdownContract, 'return 99;'),
    });

    const disabledContract = createSessionContract('resource-disabled-repo', 'resource-disabled-entry');
    disabledResult = await disabled.compile({
      contract: disabledContract,
      input: createSessionCompileInput(disabledContract, 'return 0;'),
    });
    disabledState = disabled.getDebugState();
  } finally {
    await disabled.dispose();
    await manager.dispose();
  }
  if (!disabledResult) {
    throw new Error('Disabled Session evidence was not collected');
  }
  const afterShutdown = manager.getDebugState();
  samplePeak();
  return {
    configured: {
      maxRepos: config.sessionMaxRepos,
      maxEntries: config.sessionMaxEntries,
      maxEstimatedFileBytes: config.sessionMaxEstimatedFileBytes,
      idleTtlMs: config.sessionIdleTtlMs,
    },
    peak: {
      activeRepos: peakState.activeRepos,
      activeEntries: peakState.activeEntries,
      estimatedFileBytes: peakState.estimatedFileBytes,
    },
    afterTtl: {
      activeRepos: afterTtl.activeRepos,
      activeEntries: afterTtl.activeEntries,
      estimatedFileBytes: afterTtl.estimatedFileBytes,
    },
    disabled: {
      execution: disabledResult.execution,
      activeRepos: disabledState.activeRepos,
      activeEntries: disabledState.activeEntries,
      estimatedFileBytes: disabledState.estimatedFileBytes,
    },
    afterShutdown: {
      disposed: afterShutdown.disposed,
      activeRepos: afterShutdown.activeRepos,
      activeEntries: afterShutdown.activeEntries,
      estimatedFileBytes: afterShutdown.estimatedFileBytes,
    },
    ttlEvictionCount: evictionCount(metrics, 'ttl'),
    lruEvictionCount: evictionCount(metrics, 'lru'),
    shutdownEvictionCount: evictionCount(metrics, 'shutdown'),
  };
}

async function collectWorkerEvidence(config: CompilePerformanceResourceSoakConfig, samplePeak: () => void) {
  const pool = new LightExtensionCompileWorkerPool({
    workerCount: config.workerCount,
    maxQueueLength: config.maxQueueLength,
    maxInFlightBytes: config.maxInflightBytes,
  });
  const jobs = Array.from({ length: config.iterations }, (_, index) => createCompileJob(index));
  let results: Awaited<ReturnType<typeof pool.submit>>[] = [];
  let observed = pool.getMetrics();
  try {
    results = await submitWorkerJobs(pool, jobs, config.workerCount + config.maxQueueLength, samplePeak);
    observed = pool.getMetrics();
  } finally {
    await pool.shutdown();
  }
  const workerThreadIds = [...new Set(results.map((result) => result.observation.threadId))].sort(
    (left, right) => left - right,
  );
  const acceptedCount = results.filter((result) => result.accepted).length;
  const afterShutdown = pool.getMetrics();
  samplePeak();
  return {
    productionWorkerPath: true,
    mainThreadId,
    workerThreadIds,
    configured: {
      workerCount: config.workerCount,
      maxQueueLength: config.maxQueueLength,
      maxInflightBytes: config.maxInflightBytes,
    },
    observed: {
      maxActive: observed.maxActive,
      maxQueueDepth: observed.maxQueueDepth,
      maxInflightBytes: observed.maxInflightBytes,
      completed: observed.completed,
      accepted: acceptedCount,
      rejected: observed.rejected,
      restarts: observed.restarts,
      timeouts: observed.timeouts,
    },
    afterShutdown: {
      workerCount: afterShutdown.workerCount,
      active: afterShutdown.active,
      queueDepth: afterShutdown.queueDepth,
      inflightBytes: afterShutdown.inflightBytes,
      shuttingDown: afterShutdown.shuttingDown,
    },
  };
}

async function submitWorkerJobs(
  pool: LightExtensionCompileWorkerPool,
  jobs: LightExtensionCompileJob[],
  concurrency: number,
  samplePeak: () => void,
): Promise<Awaited<ReturnType<LightExtensionCompileWorkerPool['submit']>>[]> {
  const results: Awaited<ReturnType<LightExtensionCompileWorkerPool['submit']>>[] = new Array(jobs.length);
  let nextIndex = 0;
  const runLane = async () => {
    while (nextIndex < jobs.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await pool.submit(jobs[index]);
      samplePeak();
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, runLane));
  return results;
}

async function warmUpResourceSoak(): Promise<void> {
  const manager = new LightExtensionCompilerSessionManager({ maxRepos: 1, maxEntries: 1, sweepIntervalMs: 0 });
  const contract = createSessionContract('resource-warmup-repo', 'resource-warmup-entry');
  const pool = new LightExtensionCompileWorkerPool({ workerCount: 1, maxQueueLength: 1 });
  try {
    await manager.compile({ contract, input: createSessionCompileInput(contract, 'return 1;') });
    await pool.submit(createCompileJob(10_000));
  } finally {
    await manager.dispose();
    await pool.shutdown();
  }
}

function createSessionContract(repoId: string, entryIdentity: string): RunJSCompilerSessionContract {
  return {
    repoId,
    entryIdentity,
    entryPath: `src/entries/${entryIdentity}/index.ts`,
    runtimeVersion: 'v2',
    surfaceStyle: 'value',
    modelUse: 'RunJSValue',
    runtimeContract: 'resource-soak-runtime-v1',
    compilerBuildId: 'resource-soak-build-v1',
    securityPolicyFingerprint: 'resource-soak-security-v1',
    typeLibraryFingerprint: 'resource-soak-types-v1',
  };
}

function createSessionCompileInput(
  contract: RunJSCompilerSessionContract,
  content: string,
): CompileRunJSSourceWorkspaceInput {
  return {
    files: [{ path: contract.entryPath, content }],
    entry: contract.entryPath,
    runtimeVersion: contract.runtimeVersion,
    surfaceStyle: contract.surfaceStyle,
    legacy: {
      version: contract.runtimeVersion,
      surfaceStyle: contract.surfaceStyle,
      language: 'typescript',
      metadata: { kind: 'runjs', modelUse: contract.modelUse },
    },
  };
}

function createCompileJob(index: number): LightExtensionCompileJob {
  const entryOrdinal = index % 4;
  const entryName = `resource-entry-${entryOrdinal}`;
  const entryPath = `src/client/js-blocks/${entryName}/index.tsx`;
  const content = `ctx.render(<div>${index}</div>);\n`;
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
    jobId: `resource-job-${index}`,
    requestId: `resource-request-${index}`,
    correlationId: 'resource-soak',
    repoId: 'resource-soak-repo',
    entryId: `resource-entry-id-${entryOrdinal}`,
    entryName,
    ordinal: index,
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

function maxSessionState<T extends { activeRepos: number; activeEntries: number; estimatedFileBytes: number }>(
  current: T,
  next: T,
): T {
  return {
    ...next,
    activeRepos: Math.max(current.activeRepos, next.activeRepos),
    activeEntries: Math.max(current.activeEntries, next.activeEntries),
    estimatedFileBytes: Math.max(current.estimatedFileBytes, next.estimatedFileBytes),
  };
}

function evictionCount(metrics: LightExtensionCompilerSessionMetric[], reason: string): number {
  return metrics.filter((metric) => metric.name === 'compile.session.eviction' && metric.reason === reason).length;
}

function memorySample(): CompilePerformanceResourceMemorySample {
  const usage = process.memoryUsage();
  return { rssBytes: usage.rss, heapUsedBytes: usage.heapUsed };
}

async function settledMemorySample(): Promise<CompilePerformanceResourceMemorySample> {
  forceGarbageCollection();
  let settled = memorySample();
  for (let index = 0; index < 4; index += 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
    forceGarbageCollection();
    const sample = memorySample();
    settled = {
      rssBytes: Math.min(settled.rssBytes, sample.rssBytes),
      heapUsedBytes: Math.min(settled.heapUsedBytes, sample.heapUsedBytes),
    };
  }
  return settled;
}

let garbageCollector: (() => void) | undefined;

function forceGarbageCollection(): void {
  if (!garbageCollector) {
    const globalWithGc = globalThis as typeof globalThis & { gc?: () => void };
    if (typeof globalWithGc.gc === 'function') {
      garbageCollector = globalWithGc.gc;
    } else {
      setFlagsFromString('--expose_gc');
      const exposedGc: unknown = runInNewContext('gc');
      if (typeof exposedGc === 'function') {
        garbageCollector = exposedGc as () => void;
      }
    }
  }
  garbageCollector?.();
}

function maxMemory(
  current: CompilePerformanceResourceMemorySample,
  next: CompilePerformanceResourceMemorySample,
): CompilePerformanceResourceMemorySample {
  return {
    rssBytes: Math.max(current.rssBytes, next.rssBytes),
    heapUsedBytes: Math.max(current.heapUsedBytes, next.heapUsedBytes),
  };
}

async function dependencyFingerprint(): Promise<string> {
  return sha256(await readFile('yarn.lock'));
}

function machineFingerprint(): string {
  return sha256(Buffer.from(JSON.stringify([platform(), arch(), cpus()[0]?.model || 'unknown'])));
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function reproducibleCommand(config: CompilePerformanceResourceSoakConfig): string {
  return [
    'LIGHT_EXTENSION_RESOURCE_SOAK=true',
    `LIGHT_EXTENSION_RESOURCE_SOAK_SOURCE_COMMIT=${config.sourceCommit}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_HARNESS_COMMIT=${config.harnessCommit}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_OUTPUT=${config.outputPath}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_ITERATIONS=${config.iterations}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_WORKERS=${config.workerCount}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_MAX_QUEUE=${config.maxQueueLength}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_MAX_INFLIGHT_BYTES=${config.maxInflightBytes}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_MAX_REPOS=${config.sessionMaxRepos}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_MAX_ENTRIES=${config.sessionMaxEntries}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_MAX_SESSION_BYTES=${config.sessionMaxEstimatedFileBytes}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_IDLE_TTL_MS=${config.sessionIdleTtlMs}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_MAX_RSS_GROWTH=${config.maxRssGrowthBytes}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_MAX_HEAP_GROWTH=${config.maxHeapGrowthBytes}`,
    `LIGHT_EXTENSION_RESOURCE_SOAK_REQUIRE_ACCEPTANCE=${config.requireAcceptanceIterations}`,
    'yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/compile-performance-resource-soak.test.ts --run --reporter=verbose',
  ].join(' ');
}
