/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex } from '@nocobase/runjs';
import { RUNJS_COMPILER_BUILD_IDENTITY } from '@nocobase/runjs/compiler';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { vi } from 'vitest';

import {
  aggregateLightExtensionCompileResults,
  assertStructuredClonePlainData,
  compileLightExtensionValidatedEntry,
  createLightExtensionCompileInfrastructureFailure,
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  validateLightExtensionWorkspace,
  type LightExtensionCompileJob,
} from '../services/LightExtensionCompileContract';
import { buildLightExtensionCompileKey } from '../services/LightExtensionCompileKey';

describe('LightExtensionCompileContract', () => {
  it('publishes only the five retained authoring surfaces while preserving the shared RunJS compiler identity', () => {
    expect(LIGHT_EXTENSION_AUTHORING_SURFACES).toEqual({
      'js-block': {
        kind: 'js-block',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
        modelUse: 'JSBlockModel',
        surface: 'js-model.render',
      },
      'js-page': {
        kind: 'js-page',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
        modelUse: 'JSPageModel',
        surface: 'js-model.render',
      },
      'js-field': {
        kind: 'js-field',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
        modelUse: 'JSEditableFieldModel',
        surface: 'js-model.render',
      },
      'js-action': {
        kind: 'js-action',
        surfaceStyle: 'action',
        compilerSurfaceStyle: 'action',
        modelUse: 'JSActionModel',
        surface: 'js-model.action',
      },
      'js-item': {
        kind: 'js-item',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
        modelUse: 'JSItemActionModel',
        surface: 'js-model.render',
      },
    });
    expect(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.runjs).toEqual(RUNJS_COMPILER_BUILD_IDENTITY);
    expect(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.components.runjsCompilerBuildId).toBe(
      RUNJS_COMPILER_BUILD_IDENTITY.compilerBuildId,
    );
  });

  it('freezes the compiler identity before SES lockdown changes the runtime type-library fingerprint', () => {
    const contractPath = path.resolve(__dirname, '../services/LightExtensionCompileContract.ts');
    const sesPath = path.resolve(__dirname, '../../../../../../core/utils/src/ses.ts');
    const baseline = readCompilerBuildId(
      `const contract = require(${JSON.stringify(
        contractPath,
      )}); console.log(contract.LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId);`,
    );
    const afterLockdown = readCompilerBuildId(
      `const contract = require(${JSON.stringify(contractPath)}); const { lockdownSes } = require(${JSON.stringify(
        sesPath,
      )}); lockdownSes({ consoleTaming: 'unsafe', errorTaming: 'unsafe', overrideTaming: 'moderate', stackFiltering: 'verbose' }); console.log(contract.LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId);`,
    );

    expect(afterLockdown).toBe(baseline);
  });

  it('orders a complete batch by ordinal and rejects process-local values', () => {
    const jobs = [createCompileJob(0), createCompileJob(1), createCompileJob(2)];
    const results = [jobs[2], jobs[0], jobs[1]].map((job) =>
      createLightExtensionCompileInfrastructureFailure({
        job,
        workerId: 1,
        threadId: 10,
        attempt: 1,
        queueDurationMs: 0,
        runDurationMs: 1,
        failureCode: `failure_${job.ordinal}`,
        message: `failed ${job.ordinal}`,
      }),
    );

    const aggregate = aggregateLightExtensionCompileResults(jobs, results);

    expect(aggregate.accepted).toBe(false);
    expect(aggregate.results.map((result) => result.ordinal)).toEqual([0, 1, 2]);
    expect(aggregate.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(['failed 0', 'failed 1', 'failed 2']);
    expect(() => assertStructuredClonePlainData({ transaction: new Map() })).toThrow(
      'Value.transaction must not contain class instances or process-local objects',
    );
  });

  it('validates a cloned workspace input without exposing a publish-capable object', () => {
    const files = [{ path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(<div />);' }];
    const validation = {
      accepted: true,
      diagnostics: [],
      entries: [],
      capabilities: {} as never,
    };
    const validateWorkspace = vi.fn().mockReturnValue(validation);

    const result = validateLightExtensionWorkspace({ validateWorkspace }, files);

    expect(result).toBe(validation);
    expect(validateWorkspace).toHaveBeenCalledWith({ files: [{ ...files[0] }] });
    expect(validateWorkspace.mock.calls[0][0].files).not.toBe(files);
    expect(validateWorkspace.mock.calls[0][0].files[0]).not.toBe(files[0]);
    expect(result).not.toHaveProperty('candidate');
    expect(result).not.toHaveProperty('workspace');
  });

  it('compiles only validated entry and shared files through the pure compile helper', async () => {
    const compileEntry = vi.fn().mockResolvedValue({ accepted: true, diagnostics: [] });
    const files = [
      { path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(<div />);' },
      { path: 'src/client/js-blocks/example/entry.json', content: '{"schemaVersion":1,"key":"example"}' },
      { path: 'src/shared/format.ts', content: 'export const format = String;' },
      { path: 'README.md', content: '# ignored' },
    ];

    await compileLightExtensionValidatedEntry(
      { compileEntry },
      {
        repoId: 'repo_example',
        entryId: 'entry_example',
        operation: 'compilePreview',
        entry: {
          kind: 'js-block',
          entryName: 'example',
          entryPath: 'src/client/js-blocks/example/index.tsx',
          descriptorPath: 'src/client/js-blocks/example/entry.json',
        },
        runtimeVersion: 'v2',
        files,
      },
      { requestId: 'request_example' },
    );

    expect(compileEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'repo_example',
        entryId: 'entry_example',
        operation: 'compilePreview',
        files: [files[0], files[2]],
      }),
      { requestId: 'request_example' },
    );
    expect(compileEntry.mock.calls[0][0].files[0]).not.toBe(files[0]);
  });
});

function readCompilerBuildId(script: string): string {
  return execFileSync(process.execPath, ['--require', 'tsx/cjs', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
}

function createCompileJob(ordinal: number): LightExtensionCompileJob {
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
    files,
  };
}
