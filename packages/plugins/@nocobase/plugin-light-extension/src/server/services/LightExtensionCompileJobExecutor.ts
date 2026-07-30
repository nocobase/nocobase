/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stableSerialize } from '@nocobase/runjs';
import type { RunJSSourceWorkspaceInspector } from '@nocobase/runjs/compiler';
import { loadRunJSCompiler } from '@nocobase/runjs/compiler/loader';
import { performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';

import {
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  assertLightExtensionCompileJob,
  createLightExtensionCompileInfrastructureFailure,
  normalizeLightExtensionCompileResult,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
} from './LightExtensionCompileContract';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';

let sourceInspector: RunJSSourceWorkspaceInspector | undefined;
const workspaceCompiler = new LightExtensionWorkspaceCompilerBridge();

export async function executeLightExtensionCompileJob(input: {
  job: LightExtensionCompileJob;
  workerId: number;
  attempt: number;
  executingThreadId?: number;
}): Promise<LightExtensionCompileResult> {
  const startedAt = performance.now();
  const executingThreadId = input.executingThreadId ?? threadId;
  try {
    assertLightExtensionCompileJob(input.job);
    assertCurrentCompilerBuild(input.job);
    const compiler = await loadRunJSCompiler();
    sourceInspector ||= new compiler.RunJSSourceWorkspaceInspector();
    const compiled = await workspaceCompiler.compileEntry(
      {
        repoId: input.job.repoId,
        entryId: input.job.entryId,
        operation: 'runtimeCompile',
        kind: input.job.kind,
        entryName: input.job.entryName,
        entryPath: input.job.entryPath,
        runtimeVersion: input.job.runtimeVersion,
        files: input.job.files,
      },
      { sourceInspector },
    );
    return normalizeLightExtensionCompileResult(input.job, compiled, {
      workerId: input.workerId,
      threadId: executingThreadId,
      attempt: input.attempt,
      queueDurationMs: 0,
      runDurationMs: elapsedMs(startedAt),
    });
  } catch (error) {
    return createLightExtensionCompileInfrastructureFailure({
      job: input.job,
      workerId: input.workerId,
      threadId: executingThreadId,
      attempt: input.attempt,
      queueDurationMs: 0,
      runDurationMs: elapsedMs(startedAt),
      failureCode: 'LIGHT_EXTENSION_COMPILE_WORKER_FAILED',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function assertCurrentCompilerBuild(job: LightExtensionCompileJob): void {
  if (stableSerialize(job.compilerBuildIdentity) !== stableSerialize(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY)) {
    throw new TypeError(
      `Compile worker build identity mismatch: expected=${LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId}, actual=${job.compilerBuildIdentity.compilerBuildId}`,
    );
  }
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, performance.now() - startedAt);
}
