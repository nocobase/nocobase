/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, sha256Hex } from '@nocobase/runjs/server';
import { vi } from 'vitest';

import { JS_TEMPLATE_ARTIFACT_CONTRACT } from '../../constants';
import { createCompileJob } from './helpers/compilerTestHarness';
import {
  createJsTemplateCompileInfrastructureFailure,
  type JsTemplateCompileJob,
  type JsTemplateCompileSuccessResult,
} from '../services/JsTemplateCompileContract';
import { ApplyCompiledTemplatesService, type CompiledTemplatesStore } from '../services/ApplyCompiledTemplatesService';

describe('ApplyCompiledTemplatesService', () => {
  const compiledAt = new Date('2026-07-18T00:00:00.000Z');

  it('performs no transaction or writes when any compiled template failed', async () => {
    const job = createCompileJob(0);
    const failure = createJsTemplateCompileInfrastructureFailure({
      job,
      workerId: 1,
      threadId: 10,
      attempt: 2,
      queueDurationMs: 1,
      runDurationMs: 5,
      failureCode: 'RUNJS_COMPILE_FAILED',
      message: 'Compile failed',
    });
    const store = new MockPublishStore([createStoredTemplate(job)]);
    const service = new ApplyCompiledTemplatesService(store, () => compiledAt);

    await expect(service.applyCompiledTemplates({ commitId: 'commit-1', results: [failure] })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      status: 422,
      details: {
        diagnostics: [expect.objectContaining({ message: 'Compile failed' })],
      },
    });
    expect(store.runInTransactionCalls).toBe(0);
    expect(store.loadTemplates).not.toHaveBeenCalled();
    expect(store.bulkUpsertArtifacts).not.toHaveBeenCalled();
    expect(store.bulkUpsertTemplates).not.toHaveBeenCalled();
  });

  it('deduplicates artifacts before two bounded bulk writes', async () => {
    const firstJob = createCompileJob(0);
    const secondJob = {
      ...firstJob,
      jobId: 'job-1',
      requestId: 'request-1',
      templateId: 'template-id-1',
      ordinal: 1,
    };
    const first = createSuccessResult(firstJob);
    const second = createSuccessResult(secondJob);
    const store = new MockPublishStore([createStoredTemplate(firstJob), createStoredTemplate(secondJob)]);
    const service = new ApplyCompiledTemplatesService(store, () => compiledAt);

    const result = await service.applyCompiledTemplates({ commitId: 'commit-1', results: [second, first] });

    expect(result).toEqual({
      artifactCount: 1,
      templateCount: 2,
      compiledAt,
      templateIds: ['template-id-0', 'template-id-1'],
    });
    expect(store.runInTransactionCalls).toBe(1);
    expect(store.loadTemplates).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertArtifacts).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertArtifacts.mock.calls[0][0]).toHaveLength(1);
    expect(store.bulkUpsertTemplates).toHaveBeenCalledTimes(1);
    const templateRows = store.bulkUpsertTemplates.mock.calls[0][0];
    expect(templateRows).toHaveLength(2);
    expect(templateRows.map((row) => row.id)).toEqual(['template-id-0', 'template-id-1']);
    expect(
      templateRows.map((row) => (row.runtimeArtifact as { metadata: { templateId: string } }).metadata.templateId),
    ).toEqual(['template-id-0', 'template-id-1']);
  });

  it('keeps database calls constant for twenty templates and publishes ordinal order', async () => {
    const jobs = Array.from({ length: 20 }, (_, ordinal) => createCompileJob(ordinal));
    const results = jobs.map(createSuccessResult).reverse();
    const store = new MockPublishStore(jobs.map(createStoredTemplate));
    const service = new ApplyCompiledTemplatesService(store, () => compiledAt);

    const published = await service.applyCompiledTemplates({ commitId: 'commit-20', results });

    expect(published.templateCount).toBe(20);
    expect(published.templateIds).toEqual(jobs.map((job) => job.templateId));
    expect(store.loadTemplates).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertArtifacts).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertTemplates).toHaveBeenCalledTimes(1);
    expect(store.bulkUpsertTemplates.mock.calls[0][0]).toHaveLength(20);
  });

  it('reuses an explicit transaction without opening another transaction', async () => {
    const job = createCompileJob(0);
    const store = new MockPublishStore([createStoredTemplate(job)]);
    const service = new ApplyCompiledTemplatesService(store, () => compiledAt);
    const transaction = { id: 'phase-b-transaction' } as unknown as Transaction;

    await service.applyCompiledTemplates({ commitId: 'commit-1', results: [createSuccessResult(job)] }, transaction);

    expect(store.runInTransactionCalls).toBe(0);
    expect(store.loadTemplates).toHaveBeenCalledWith([job.templateId], transaction);
    expect(store.bulkUpsertArtifacts).toHaveBeenCalledWith(expect.any(Array), transaction);
    expect(store.bulkUpsertTemplates).toHaveBeenCalledWith(expect.any(Array), transaction);
  });

  it('validates all hashes before opening the publish transaction', async () => {
    const job = createCompileJob(0);
    const result = { ...createSuccessResult(job), artifactHash: 'f'.repeat(64) };
    const store = new MockPublishStore([createStoredTemplate(job)]);
    const service = new ApplyCompiledTemplatesService(store, () => compiledAt);

    await expect(service.applyCompiledTemplates({ commitId: 'commit-1', results: [result] })).rejects.toThrow(
      /artifact hash mismatch/u,
    );
    expect(store.runInTransactionCalls).toBe(0);
    expect(store.loadTemplates).not.toHaveBeenCalled();
  });

  it('does not perform persistence work for an empty batch', async () => {
    const store = new MockPublishStore([]);
    const service = new ApplyCompiledTemplatesService(store, () => compiledAt);

    await expect(service.applyCompiledTemplates({ commitId: 'commit-empty', results: [] })).resolves.toEqual({
      artifactCount: 0,
      templateCount: 0,
      compiledAt,
      templateIds: [],
    });
    expect(store.runInTransactionCalls).toBe(0);
  });
});

class MockPublishStore implements CompiledTemplatesStore {
  runInTransactionCalls = 0;

  readonly loadTemplates = vi.fn(async (templateIds: string[], _transaction: Transaction) =>
    this.templates.filter((template) => templateIds.includes(String(template.id))),
  );

  readonly bulkUpsertArtifacts = vi.fn(
    async (_rows: Array<Record<string, unknown>>, _transaction: Transaction) => undefined,
  );

  readonly bulkUpsertTemplates = vi.fn(
    async (_rows: Array<Record<string, unknown>>, _transaction: Transaction) => undefined,
  );

  private readonly transaction = { id: 'mock-transaction' } as unknown as Transaction;

  constructor(private readonly templates: Array<Record<string, unknown>>) {}

  async runInTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    this.runInTransactionCalls += 1;
    return callback(this.transaction);
  }
}

function createSuccessResult(job: JsTemplateCompileJob): JsTemplateCompileSuccessResult {
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
    runtimeContract: JS_TEMPLATE_ARTIFACT_CONTRACT,
  });
  return {
    accepted: true,
    jobId: job.jobId,
    requestId: job.requestId,
    correlationId: job.correlationId,
    projectId: job.projectId,
    templateId: job.templateId,
    templateName: job.templateName,
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

function createStoredTemplate(job: JsTemplateCompileJob): Record<string, unknown> {
  return {
    id: job.templateId,
    projectId: job.projectId,
    target: 'client',
    kind: job.kind,
    templateName: job.templateName,
    entryPath: job.entryPath,
    descriptorPath: job.entryPath.replace(/index\.tsx$/u, 'entry.json'),
    healthStatus: 'ready',
    diagnostics: [],
  };
}
