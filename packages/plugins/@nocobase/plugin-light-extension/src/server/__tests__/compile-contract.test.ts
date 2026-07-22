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

import {
  aggregateLightExtensionCompileResults,
  assertStructuredClonePlainData,
  createLightExtensionCompileInfrastructureFailure,
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
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
});

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
