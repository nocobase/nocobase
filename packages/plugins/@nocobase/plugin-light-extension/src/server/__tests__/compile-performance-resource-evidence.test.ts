/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createCompilePerformanceResourceSoakEvidence,
  parseCompilePerformanceResourceSoakConfig,
  serializeCompilePerformanceResourceSoakEvidence,
} from './helpers/compilePerformanceResourceEvidence';

describe('compile performance supplemental resource evidence', () => {
  it('parses bounded Session, Worker, iteration, and memory configuration', () => {
    const config = parseCompilePerformanceResourceSoakConfig({
      LIGHT_EXTENSION_RESOURCE_SOAK_SOURCE_COMMIT: 'source-commit',
      LIGHT_EXTENSION_RESOURCE_SOAK_HARNESS_COMMIT: 'harness-commit',
      LIGHT_EXTENSION_RESOURCE_SOAK_OUTPUT: '/tmp/resource.json',
      LIGHT_EXTENSION_RESOURCE_SOAK_ITERATIONS: '4',
      LIGHT_EXTENSION_RESOURCE_SOAK_WORKERS: '1',
      LIGHT_EXTENSION_RESOURCE_SOAK_MAX_QUEUE: '2',
      LIGHT_EXTENSION_RESOURCE_SOAK_MAX_INFLIGHT_BYTES: '8192',
      LIGHT_EXTENSION_RESOURCE_SOAK_MAX_REPOS: '2',
      LIGHT_EXTENSION_RESOURCE_SOAK_MAX_ENTRIES: '3',
      LIGHT_EXTENSION_RESOURCE_SOAK_MAX_SESSION_BYTES: '4096',
      LIGHT_EXTENSION_RESOURCE_SOAK_IDLE_TTL_MS: '10',
      LIGHT_EXTENSION_RESOURCE_SOAK_MAX_RSS_GROWTH: '8192',
      LIGHT_EXTENSION_RESOURCE_SOAK_MAX_HEAP_GROWTH: '4096',
      LIGHT_EXTENSION_RESOURCE_SOAK_REQUIRE_ACCEPTANCE: 'false',
    });

    expect(config).toMatchObject({
      sourceCommit: 'source-commit',
      harnessCommit: 'harness-commit',
      iterations: 4,
      workerCount: 1,
      maxQueueLength: 2,
      maxInflightBytes: 8192,
      sessionMaxRepos: 2,
      sessionMaxEntries: 3,
      sessionMaxEstimatedFileBytes: 4096,
      sessionIdleTtlMs: 10,
      maxRssGrowthBytes: 8192,
      maxHeapGrowthBytes: 4096,
      requireAcceptanceIterations: false,
    });
  });

  it('accepts bounded production Worker and fully released Session/memory evidence', () => {
    const evidence = validEvidence(20);

    expect(evidence.gate).toEqual({
      passed: true,
      acceptanceReady: true,
      failures: [],
      jqAcceptanceExpression: '.gate.passed == true and .gate.acceptanceReady == true',
    });
    expect(JSON.parse(serializeCompilePerformanceResourceSoakEvidence(evidence))).toEqual(evidence);
  });

  it('keeps short resource smoke evidence non-acceptance and rejects leaks or main-thread execution', () => {
    const smoke = validEvidence(2);
    expect(smoke.gate).toMatchObject({ passed: true, acceptanceReady: false });

    const invalidInput = { ...validEvidence(20) };
    invalidInput.worker.workerThreadIds = [invalidInput.worker.mainThreadId];
    invalidInput.worker.observed.maxInflightBytes = invalidInput.worker.configured.maxInflightBytes + 1;
    invalidInput.worker.observed.restarts = 1;
    invalidInput.session.afterShutdown.activeEntries = 1;
    invalidInput.memory.afterShutdown.rssBytes = invalidInput.memory.start.rssBytes + 10_001;
    const invalid = createCompilePerformanceResourceSoakEvidence({
      collectedAt: invalidInput.collectedAt,
      sourceCommit: invalidInput.sourceCommit,
      harnessCommit: invalidInput.harnessCommit,
      nodeVersion: invalidInput.nodeVersion,
      machineFingerprint: invalidInput.machineFingerprint,
      dependencyFingerprint: invalidInput.dependencyFingerprint,
      iterations: invalidInput.iterations,
      session: invalidInput.session,
      worker: invalidInput.worker,
      memory: invalidInput.memory,
      reproducibleCommand: invalidInput.reproducibleCommand,
    });
    expect(invalid.gate.passed).toBe(false);
    expect(invalid.gate.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Session shutdown'),
        expect.stringContaining('main thread'),
        expect.stringContaining('in-flight bytes'),
        expect.stringContaining('restart or timeout'),
        expect.stringContaining('RSS growth'),
      ]),
    );
  });
});

function validEvidence(iterations: number) {
  return createCompilePerformanceResourceSoakEvidence({
    collectedAt: '2026-07-18T00:00:00.000Z',
    sourceCommit: 'source-commit',
    harnessCommit: 'harness-commit',
    nodeVersion: 'v20.16.0',
    machineFingerprint: 'machine',
    dependencyFingerprint: 'dependency',
    iterations,
    session: {
      configured: { maxRepos: 2, maxEntries: 4, maxEstimatedFileBytes: 4096, idleTtlMs: 10 },
      peak: { activeRepos: 2, activeEntries: 4, estimatedFileBytes: 2048 },
      afterTtl: { activeRepos: 0, activeEntries: 0, estimatedFileBytes: 0 },
      disabled: { execution: 'cold', activeRepos: 0, activeEntries: 0, estimatedFileBytes: 0 },
      afterShutdown: { disposed: true, activeRepos: 0, activeEntries: 0, estimatedFileBytes: 0 },
      ttlEvictionCount: 4,
      lruEvictionCount: 2,
      shutdownEvictionCount: 1,
    },
    worker: {
      productionWorkerPath: true,
      mainThreadId: 0,
      workerThreadIds: [1, 2],
      configured: { workerCount: 2, maxQueueLength: 4, maxInflightBytes: 4096 },
      observed: {
        maxActive: 2,
        maxQueueDepth: 4,
        maxInflightBytes: 2048,
        completed: iterations,
        accepted: iterations,
        rejected: 0,
        restarts: 0,
        timeouts: 0,
      },
      afterShutdown: { workerCount: 0, active: 0, queueDepth: 0, inflightBytes: 0, shuttingDown: true },
    },
    memory: {
      start: { rssBytes: 1000, heapUsedBytes: 500 },
      peak: { rssBytes: 2000, heapUsedBytes: 1000 },
      afterShutdown: { rssBytes: 1500, heapUsedBytes: 750 },
      configuredMaxRssGrowthBytes: 10_000,
      configuredMaxHeapGrowthBytes: 5_000,
    },
    reproducibleCommand: 'LIGHT_EXTENSION_RESOURCE_SOAK=true yarn test resource-soak',
  });
}
