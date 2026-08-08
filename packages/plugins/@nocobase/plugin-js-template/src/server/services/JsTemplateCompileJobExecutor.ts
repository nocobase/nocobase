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
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY,
  assertJsTemplateCompileJob,
  createJsTemplateCompileInfrastructureFailure,
  normalizeJsTemplateCompileResult,
  type JsTemplateCompileJob,
  type JsTemplateCompileResult,
} from './JsTemplateCompileContract';
import { JsTemplateWorkspaceCompilerBridge } from './JsTemplateWorkspaceCompilerBridge';

let sourceInspector: RunJSSourceWorkspaceInspector | undefined;
const workspaceCompiler = new JsTemplateWorkspaceCompilerBridge();

export async function executeJsTemplateCompileJob(input: {
  job: JsTemplateCompileJob;
  workerId: number;
  attempt: number;
  executingThreadId?: number;
}): Promise<JsTemplateCompileResult> {
  const startedAt = performance.now();
  const executingThreadId = input.executingThreadId ?? threadId;
  try {
    assertJsTemplateCompileJob(input.job);
    assertCurrentCompilerBuild(input.job);
    const compiler = await loadRunJSCompiler();
    sourceInspector ||= new compiler.RunJSSourceWorkspaceInspector();
    const compiled = await workspaceCompiler.compileEntry(
      {
        projectId: input.job.projectId,
        templateId: input.job.templateId,
        operation: 'runtimeCompile',
        kind: input.job.kind,
        templateName: input.job.templateName,
        entryPath: input.job.entryPath,
        runtimeVersion: input.job.runtimeVersion,
        files: input.job.files,
      },
      { sourceInspector },
    );
    return normalizeJsTemplateCompileResult(input.job, compiled, {
      workerId: input.workerId,
      threadId: executingThreadId,
      attempt: input.attempt,
      queueDurationMs: 0,
      runDurationMs: elapsedMs(startedAt),
    });
  } catch (error) {
    return createJsTemplateCompileInfrastructureFailure({
      job: input.job,
      workerId: input.workerId,
      threadId: executingThreadId,
      attempt: input.attempt,
      queueDurationMs: 0,
      runDurationMs: elapsedMs(startedAt),
      failureCode: 'JS_TEMPLATE_COMPILE_WORKER_FAILED',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function assertCurrentCompilerBuild(job: JsTemplateCompileJob): void {
  if (stableSerialize(job.compilerBuildIdentity) !== stableSerialize(JS_TEMPLATE_COMPILER_BUILD_IDENTITY)) {
    throw new TypeError(
      `Compile worker build identity mismatch: expected=${JS_TEMPLATE_COMPILER_BUILD_IDENTITY.compilerBuildId}, actual=${job.compilerBuildIdentity.compilerBuildId}`,
    );
  }
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, performance.now() - startedAt);
}
