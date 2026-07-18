/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { availableParallelism } from 'node:os';

export interface CompilePerformanceResourceSoakConfig {
  sourceCommit: string;
  harnessCommit: string;
  outputPath: string;
  iterations: number;
  workerCount: number;
  maxQueueLength: number;
  maxInflightBytes: number;
  sessionMaxRepos: number;
  sessionMaxEntries: number;
  sessionMaxEstimatedFileBytes: number;
  sessionIdleTtlMs: number;
  maxRssGrowthBytes: number;
  maxHeapGrowthBytes: number;
  requireAcceptanceIterations: boolean;
}

export interface CompilePerformanceResourceMemorySample {
  rssBytes: number;
  heapUsedBytes: number;
}

export interface CompilePerformanceSessionSoakEvidence {
  configured: {
    maxRepos: number;
    maxEntries: number;
    maxEstimatedFileBytes: number;
    idleTtlMs: number;
  };
  peak: {
    activeRepos: number;
    activeEntries: number;
    estimatedFileBytes: number;
  };
  afterTtl: {
    activeRepos: number;
    activeEntries: number;
    estimatedFileBytes: number;
  };
  disabled: {
    execution: string;
    activeRepos: number;
    activeEntries: number;
    estimatedFileBytes: number;
  };
  afterShutdown: {
    disposed: boolean;
    activeRepos: number;
    activeEntries: number;
    estimatedFileBytes: number;
  };
  ttlEvictionCount: number;
  lruEvictionCount: number;
  shutdownEvictionCount: number;
}

export interface CompilePerformanceWorkerSoakEvidence {
  productionWorkerPath: boolean;
  mainThreadId: number;
  workerThreadIds: number[];
  configured: {
    workerCount: number;
    maxQueueLength: number;
    maxInflightBytes: number;
  };
  observed: {
    maxActive: number;
    maxQueueDepth: number;
    maxInflightBytes: number;
    completed: number;
    accepted: number;
    rejected: number;
    restarts: number;
    timeouts: number;
  };
  afterShutdown: {
    workerCount: number;
    active: number;
    queueDepth: number;
    inflightBytes: number;
    shuttingDown: boolean;
  };
}

export interface CompilePerformanceMemorySoakEvidence {
  start: CompilePerformanceResourceMemorySample;
  peak: CompilePerformanceResourceMemorySample;
  afterShutdown: CompilePerformanceResourceMemorySample;
  configuredMaxRssGrowthBytes: number;
  configuredMaxHeapGrowthBytes: number;
}

export interface CompilePerformanceResourceSoakGate {
  passed: boolean;
  acceptanceReady: boolean;
  failures: string[];
  jqAcceptanceExpression: string;
}

export interface CompilePerformanceResourceSoakEvidence {
  schemaVersion: 1;
  collectedAt: string;
  sourceCommit: string;
  harnessCommit: string;
  nodeVersion: string;
  machineFingerprint: string;
  dependencyFingerprint: string;
  iterations: number;
  session: CompilePerformanceSessionSoakEvidence;
  worker: CompilePerformanceWorkerSoakEvidence;
  memory: CompilePerformanceMemorySoakEvidence;
  reproducibleCommand: string;
  gate: CompilePerformanceResourceSoakGate;
}

export function parseCompilePerformanceResourceSoakConfig(
  env: NodeJS.ProcessEnv,
): CompilePerformanceResourceSoakConfig {
  const defaultWorkers = Math.min(2, Math.max(1, availableParallelism()));
  const workerCount = positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_WORKERS, defaultWorkers);
  return {
    sourceCommit: requiredText(env.LIGHT_EXTENSION_RESOURCE_SOAK_SOURCE_COMMIT, 'SOURCE_COMMIT'),
    harnessCommit: requiredText(env.LIGHT_EXTENSION_RESOURCE_SOAK_HARNESS_COMMIT, 'HARNESS_COMMIT'),
    outputPath: requiredText(env.LIGHT_EXTENSION_RESOURCE_SOAK_OUTPUT, 'OUTPUT'),
    iterations: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_ITERATIONS, 20),
    workerCount,
    maxQueueLength: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_MAX_QUEUE, workerCount * 2),
    maxInflightBytes: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_MAX_INFLIGHT_BYTES, 256 * 1024 * 1024),
    sessionMaxRepos: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_MAX_REPOS, 2),
    sessionMaxEntries: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_MAX_ENTRIES, 4),
    sessionMaxEstimatedFileBytes: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_MAX_SESSION_BYTES, 8 * 1024 * 1024),
    sessionIdleTtlMs: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_IDLE_TTL_MS, 100),
    maxRssGrowthBytes: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_MAX_RSS_GROWTH, 256 * 1024 * 1024),
    maxHeapGrowthBytes: positiveInteger(env.LIGHT_EXTENSION_RESOURCE_SOAK_MAX_HEAP_GROWTH, 128 * 1024 * 1024),
    requireAcceptanceIterations: env.LIGHT_EXTENSION_RESOURCE_SOAK_REQUIRE_ACCEPTANCE !== 'false',
  };
}

export function createCompilePerformanceResourceSoakEvidence(
  input: Omit<CompilePerformanceResourceSoakEvidence, 'schemaVersion' | 'gate'>,
): CompilePerformanceResourceSoakEvidence {
  const evidence = { schemaVersion: 1 as const, ...input };
  return { ...evidence, gate: evaluateCompilePerformanceResourceSoakEvidence(evidence) };
}

export function evaluateCompilePerformanceResourceSoakEvidence(
  evidence: Omit<CompilePerformanceResourceSoakEvidence, 'gate'>,
): CompilePerformanceResourceSoakGate {
  const failures: string[] = [];
  const session = evidence.session;
  const worker = evidence.worker;
  const memory = evidence.memory;
  if (!evidence.sourceCommit.trim() || !evidence.harnessCommit.trim()) {
    failures.push('sourceCommit and harnessCommit are required');
  }
  if (session.peak.activeRepos > session.configured.maxRepos) {
    failures.push('Session active Repo peak exceeded the configured limit');
  }
  if (session.peak.activeEntries > session.configured.maxEntries) {
    failures.push('Session active Entry peak exceeded the configured limit');
  }
  if (session.peak.estimatedFileBytes > session.configured.maxEstimatedFileBytes) {
    failures.push('Session estimated file bytes exceeded the configured limit');
  }
  if (session.lruEvictionCount < 1) {
    failures.push('Session capacity soak did not exercise deterministic LRU eviction');
  }
  if (
    session.afterTtl.activeRepos !== 0 ||
    session.afterTtl.activeEntries !== 0 ||
    session.afterTtl.estimatedFileBytes !== 0 ||
    session.ttlEvictionCount < 1
  ) {
    failures.push('Session TTL did not release all idle resources');
  }
  if (
    session.disabled.execution !== 'cold' ||
    session.disabled.activeRepos !== 0 ||
    session.disabled.activeEntries !== 0 ||
    session.disabled.estimatedFileBytes !== 0
  ) {
    failures.push('Disabled Session mode retained process-local state');
  }
  if (
    !session.afterShutdown.disposed ||
    session.afterShutdown.activeRepos !== 0 ||
    session.afterShutdown.activeEntries !== 0 ||
    session.afterShutdown.estimatedFileBytes !== 0
  ) {
    failures.push('Session shutdown did not release all resources');
  }
  if (session.shutdownEvictionCount < 1) {
    failures.push('Session shutdown did not dispose an active Entry session');
  }
  if (!worker.productionWorkerPath || worker.workerThreadIds.length === 0) {
    failures.push('Production worker_threads path was not observed');
  }
  if (worker.workerThreadIds.some((threadId) => threadId <= 0 || threadId === worker.mainThreadId)) {
    failures.push('Compile jobs did not remain isolated from the main thread');
  }
  if (worker.observed.maxActive > worker.configured.workerCount) {
    failures.push('Worker active peak exceeded the configured worker count');
  }
  if (worker.observed.maxQueueDepth > worker.configured.maxQueueLength) {
    failures.push('Worker queue depth exceeded the configured limit');
  }
  if (worker.observed.maxInflightBytes > worker.configured.maxInflightBytes) {
    failures.push('Worker in-flight bytes exceeded the configured limit');
  }
  if (
    worker.observed.completed !== evidence.iterations ||
    worker.observed.accepted !== evidence.iterations ||
    worker.observed.rejected !== 0
  ) {
    failures.push('Worker soak did not complete every admitted job without rejection');
  }
  if (worker.observed.restarts !== 0 || worker.observed.timeouts !== 0) {
    failures.push('Worker soak observed an unexpected restart or timeout');
  }
  if (
    worker.afterShutdown.workerCount !== 0 ||
    worker.afterShutdown.active !== 0 ||
    worker.afterShutdown.queueDepth !== 0 ||
    worker.afterShutdown.inflightBytes !== 0 ||
    !worker.afterShutdown.shuttingDown
  ) {
    failures.push('Worker shutdown did not release threads, queue, and in-flight bytes');
  }
  const rssGrowth = memory.afterShutdown.rssBytes - memory.start.rssBytes;
  const heapGrowth = memory.afterShutdown.heapUsedBytes - memory.start.heapUsedBytes;
  if (rssGrowth > memory.configuredMaxRssGrowthBytes) {
    failures.push(`RSS growth ${rssGrowth} exceeded the configured budget`);
  }
  if (heapGrowth > memory.configuredMaxHeapGrowthBytes) {
    failures.push(`Heap growth ${heapGrowth} exceeded the configured budget`);
  }
  const acceptanceReady = failures.length === 0 && evidence.iterations >= 20;
  return {
    passed: failures.length === 0,
    acceptanceReady,
    failures,
    jqAcceptanceExpression: '.gate.passed == true and .gate.acceptanceReady == true',
  };
}

export function serializeCompilePerformanceResourceSoakEvidence(
  evidence: CompilePerformanceResourceSoakEvidence,
): string {
  return `${JSON.stringify(evidence, null, 2)}\n`;
}

function requiredText(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`LIGHT_EXTENSION_RESOURCE_SOAK_${name} is required`);
  }
  return normalized;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (typeof value === 'undefined' || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`Resource soak limit must be a positive integer, received "${value}"`);
  }
  return parsed;
}
