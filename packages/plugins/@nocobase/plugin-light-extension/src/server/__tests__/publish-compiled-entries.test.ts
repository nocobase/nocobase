/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, sha256Hex } from '@nocobase/runjs';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT } from '../../constants';
import {
  createLightExtensionCompileInfrastructureFailure,
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompileJob,
  type LightExtensionCompileSuccessResult,
} from '../services/LightExtensionCompileContract';
import { buildLightExtensionCompileKey } from '../services/LightExtensionCompileKey';
import {
  PublishCompiledEntriesService,
  type CompiledEntriesPublishStore,
} from '../services/PublishCompiledEntriesService';

describe('PublishCompiledEntriesService', () => {
  const compiledAt = new Date('2026-07-18T00:00:00.000Z');

  it('performs no transaction or writes when any compiled entry failed', async () => {
    const job = createCompileJob(0);
    const failure = createLightExtensionCompileInfrastructureFailure({
      job,
      workerId: 1,
      threadId: 10,
      attempt: 2,
      queueDurationMs: 1,
      runDurationMs: 5,
      failureCode: 'RUNJS_COMPILE_FAILED',
      message: 'Compile failed',
    });
    const store = new MockPublishStore([createStoredEntry(job)]);
    const service = new PublishCompiledEntriesService(store, () => compiledAt);

    await expect(service.publishCompiledEntries({ commitId: 'commit-1', results: [failure] })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      status: 422,
      details: {
        diagnostics: [expect.objectContaining({ message: 'Compile failed' })],
      },
    });
    expect(store.runInTransactionCalls).toBe(0);
    expect(store.loadEntries).not.toHaveBeenCalled();
    expect(store.bulkUpsertArtifacts).not.toHaveBeenCalled();
    expect(store.bulkUpsertCompileCache).not.toHaveBeenCalled();
    expect(store.bulkUpsertEntries).not.toHaveBeenCalled();
  });

  it('deduplicates artifacts and cache mappings before three bounded bulk writes', async () => {
    const firstJob = createCompileJob(0);
    const secondJob = {
      ...firstJob,
      jobId: 'job-1',
      requestId: 'request-1',
      entryId: 'entry-id-1',
      ordinal: 1,
    };
    const first = createSuccessResult(firstJob);
    const second = createSuccessResult(secondJob);
    const store = new MockPublishStore([createStoredEntry(firstJob), createStoredEntry(secondJob)]);
    const service = new PublishCompiledEntriesService(store, () => compiledAt);

    const result = await service.publishCompiledEntries({ commitId: 'commit-1', results: [second, first] });

    expect(result).toEqual({
      artifactCount: 1,
      compileCacheCount: 1,
      entryCount: 2,
      compiledAt,
      entryIds: ['entry-id-0', 'entry-id-1'],
    });
    expect(store.runInTransactionCalls).toBe(1);
    expect(store.loadEntries).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertArtifacts).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertArtifacts.mock.calls[0][0]).toHaveLength(1);
    expect(store.bulkUpsertCompileCache).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertCompileCache.mock.calls[0][0]).toHaveLength(1);
    expect(store.bulkUpsertEntries).toHaveBeenCalledTimes(1);
    const entryRows = store.bulkUpsertEntries.mock.calls[0][0];
    expect(entryRows).toHaveLength(2);
    expect(entryRows.map((row) => row.id)).toEqual(['entry-id-0', 'entry-id-1']);
    expect(entryRows.map((row) => (row.runtimeArtifact as { metadata: { entryId: string } }).metadata.entryId)).toEqual(
      ['entry-id-0', 'entry-id-1'],
    );
  });

  it('keeps database calls constant for twenty entries and publishes planner order', async () => {
    const jobs = Array.from({ length: 20 }, (_, ordinal) => createCompileJob(ordinal));
    const results = jobs.map(createSuccessResult).reverse();
    const store = new MockPublishStore(jobs.map(createStoredEntry));
    const service = new PublishCompiledEntriesService(store, () => compiledAt);

    const published = await service.publishCompiledEntries({ commitId: 'commit-20', results });

    expect(published.entryCount).toBe(20);
    expect(published.entryIds).toEqual(jobs.map((job) => job.entryId));
    expect(store.loadEntries).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertArtifacts).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertCompileCache).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertEntries).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertEntries.mock.calls[0][0]).toHaveLength(20);
  });

  it('reuses an explicit transaction without opening another transaction', async () => {
    const job = createCompileJob(0);
    const store = new MockPublishStore([createStoredEntry(job)]);
    const service = new PublishCompiledEntriesService(store, () => compiledAt);
    const transaction = { id: 'phase-b-transaction' } as unknown as Transaction;

    await service.publishCompiledEntries({ commitId: 'commit-1', results: [createSuccessResult(job)] }, transaction);

    expect(store.runInTransactionCalls).toBe(0);
    expect(store.loadEntries).toHaveBeenCalledWith([job.entryId], transaction);
    expect(store.bulkUpsertArtifacts).toHaveBeenCalledWith(expect.any(Array), transaction);
    expect(store.bulkUpsertCompileCache).toHaveBeenCalledWith(expect.any(Array), transaction);
    expect(store.bulkUpsertEntries).toHaveBeenCalledWith(expect.any(Array), transaction);
  });

  it('reasserts reused Artifact and cache rows in Phase B while preserving the original compiledAt', async () => {
    const job = createCompileJob(0);
    const reusedAt = new Date('2026-07-17T12:00:00.000Z');
    const result: LightExtensionCompileSuccessResult = {
      ...createSuccessResult(job),
      execution: 'reused',
      compiledAt: reusedAt.toISOString(),
    };
    const store = new MockPublishStore([createStoredEntry(job)]);
    const service = new PublishCompiledEntriesService(store, () => compiledAt);

    await service.publishCompiledEntries({ commitId: 'commit-reused', results: [result] });

    expect(store.bulkUpsertArtifacts.mock.calls[0][0]).toHaveLength(1);
    expect(store.bulkUpsertCompileCache.mock.calls[0][0]).toEqual([
      expect.objectContaining({ compileKey: job.compileKey, artifactHash: result.artifactHash, compiledAt: reusedAt }),
    ]);
    expect(store.bulkUpsertEntries.mock.calls[0][0]).toEqual([
      expect.objectContaining({ id: job.entryId, compiledCommitId: 'commit-reused', compiledAt: reusedAt }),
    ]);
  });

  it('validates all hashes before opening the publish transaction', async () => {
    const job = createCompileJob(0);
    const result = { ...createSuccessResult(job), artifactHash: 'f'.repeat(64) };
    const store = new MockPublishStore([createStoredEntry(job)]);
    const service = new PublishCompiledEntriesService(store, () => compiledAt);

    await expect(service.publishCompiledEntries({ commitId: 'commit-1', results: [result] })).rejects.toThrow(
      /artifact hash mismatch/u,
    );
    expect(store.runInTransactionCalls).toBe(0);
    expect(store.loadEntries).not.toHaveBeenCalled();
  });

  it('does not perform persistence work for an empty batch', async () => {
    const store = new MockPublishStore([]);
    const service = new PublishCompiledEntriesService(store, () => compiledAt);

    await expect(service.publishCompiledEntries({ commitId: 'commit-empty', results: [] })).resolves.toEqual({
      artifactCount: 0,
      compileCacheCount: 0,
      entryCount: 0,
      compiledAt,
      entryIds: [],
    });
    expect(store.runInTransactionCalls).toBe(0);
  });
});

class MockPublishStore implements CompiledEntriesPublishStore {
  runInTransactionCalls = 0;

  readonly loadEntries = vi.fn(async (entryIds: string[], _transaction: Transaction) =>
    this.entries.filter((entry) => entryIds.includes(String(entry.id))),
  );

  readonly bulkUpsertArtifacts = vi.fn(
    async (_rows: Array<Record<string, unknown>>, _transaction: Transaction) => undefined,
  );

  readonly bulkUpsertCompileCache = vi.fn(
    async (_rows: Array<Record<string, unknown>>, _transaction: Transaction) => undefined,
  );

  readonly bulkUpsertEntries = vi.fn(
    async (_rows: Array<Record<string, unknown>>, _transaction: Transaction) => undefined,
  );

  private readonly transaction = { id: 'mock-transaction' } as unknown as Transaction;

  constructor(private readonly entries: Array<Record<string, unknown>>) {}

  async runInTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    this.runInTransactionCalls += 1;
    return callback(this.transaction);
  }
}

function createCompileJob(ordinal: number): LightExtensionCompileJob {
  const entryName = `entry-${ordinal}`;
  const entryPath = `src/client/js-blocks/${entryName}/index.tsx`;
  const content = `ctx.render(<div>${ordinal}</div>);\n`;
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

function createSuccessResult(job: LightExtensionCompileJob): LightExtensionCompileSuccessResult {
  const code = 'return "compiled";';
  const runtimeCodeHash = buildRunJSRuntimeCodeHash(code);
  const artifact = {
    code,
    sourceMap: '{}',
    version: job.runtimeVersion,
    diagnostics: [],
    filesHash: sha256Hex(`artifact-files:${job.entryPath}`),
    entryPath: job.entryPath,
    metadata: { target: 'client' },
  };
  const artifactHash = buildRunJSArtifactHash({
    code,
    sourceMap: artifact.sourceMap,
    version: artifact.version,
    entryPath: job.entryPath,
    runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
  });
  return {
    accepted: true,
    jobId: job.jobId,
    requestId: job.requestId,
    correlationId: job.correlationId,
    repoId: job.repoId,
    entryId: job.entryId,
    entryName: job.entryName,
    ordinal: job.ordinal,
    compileKey: job.compileKey,
    filesHash: job.filesHash,
    kind: job.kind,
    entryPath: job.entryPath,
    compilerBuildId: job.compilerBuildIdentity.compilerBuildId,
    inputManifest: job.inputManifest,
    diagnostics: [],
    observation: {
      workerId: 1,
      threadId: 10,
      attempt: 1,
      queueDurationMs: 1,
      runDurationMs: 2,
    },
    artifact,
    artifactHash,
    runtimeCodeHash,
  };
}

function createStoredEntry(job: LightExtensionCompileJob): Record<string, unknown> {
  return {
    id: job.entryId,
    repoId: job.repoId,
    target: 'client',
    kind: job.kind,
    entryName: job.entryName,
    entryPath: job.entryPath,
    descriptorPath: job.entryPath.replace(/index\.tsx$/u, 'entry.json'),
    healthStatus: 'ready',
    diagnostics: [],
  };
}
