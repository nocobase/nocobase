/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildRunJSArtifactHash,
  buildRunJSRuntimeCodeHash,
  stableSerialize,
  type RunJSCompileDiagnostic,
  type RunJSRuntimeArtifact,
} from '@nocobase/runjs';
import { compileRunJSSourceWorkspace, RunJSSourceWorkspaceInspector } from '@nocobase/runjs/compiler';
import { performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { posix as pathPosix } from 'path';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT } from '../../constants';
import { createLightExtensionProblem, sortLightExtensionProblems } from '../../shared/problems';
import type { LightExtensionProblem } from '../../shared/types';
import {
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  assertLightExtensionCompileJob,
  createLightExtensionCompileInfrastructureFailure,
  type LightExtensionAuthoringSurfaceSpec,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
} from './LightExtensionCompileContract';
import { hasErrorProblem } from './LightExtensionValidator';
import {
  rewriteLightExtensionSdkRuntimeImports,
  rewriteLightExtensionSettingsTypeImports,
} from './LightExtensionWorkspaceCompilerBridge';

const sourceInspector = new RunJSSourceWorkspaceInspector();

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
    const compileInput = {
      files: input.job.files.map((file) => ({
        path: file.path,
        content: isCompileCodeFile(file.path)
          ? rewriteLightExtensionSettingsTypeImports(
              file.path,
              rewriteLightExtensionSdkRuntimeImports(file.path, file.content),
              input.job.kind,
            )
          : file.content,
        language: file.language,
      })),
      entry: input.job.entryPath,
      runtimeVersion: input.job.runtimeVersion,
      surfaceStyle: input.job.surface.compilerSurfaceStyle,
      legacy: {
        version: input.job.runtimeVersion,
        surfaceStyle: input.job.surface.compilerSurfaceStyle,
        language: inferRunJSLanguage(input.job.entryPath),
        metadata: buildLegacyMetadata(input.job.surface, input.job),
      },
      sourceInspector,
    };
    const compiled = await compileRunJSSourceWorkspace(compileInput);
    const problems = sortLightExtensionProblems(
      compiled.artifact.diagnostics.map((item) => toLightExtensionProblem(item, input.job)),
    );
    if (hasErrorProblem(problems)) {
      return {
        ...buildResultIdentity(input.job, input.workerId, executingThreadId, input.attempt, startedAt, problems),
        accepted: false,
        failureCode: compiled.failureCode || 'RUNJS_COMPILE_FAILED',
      };
    }

    const artifact: RunJSRuntimeArtifact = {
      ...compiled.artifact,
      diagnostics: [],
      metadata: {
        ...compiled.artifact.metadata,
        target: 'client',
        repoId: input.job.repoId,
        entryId: input.job.entryId,
        kind: input.job.kind,
        entryName: input.job.entryName,
        modelUse: input.job.surface.modelUse,
        surface: input.job.surface.surface,
        surfaceStyle: input.job.surface.surfaceStyle,
        compilerSurfaceStyle: input.job.surface.compilerSurfaceStyle,
        compilerBuildId: input.job.compilerBuildIdentity.compilerBuildId,
      },
    };
    const entryPath = artifact.entryPath || input.job.entryPath;
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(artifact.code);
    const artifactHash = buildRunJSArtifactHash({
      code: artifact.code,
      sourceMap: artifact.sourceMap,
      version: artifact.version,
      entryPath,
      runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    });
    return {
      ...buildResultIdentity(input.job, input.workerId, executingThreadId, input.attempt, startedAt, problems),
      accepted: true,
      artifact,
      artifactHash,
      runtimeCodeHash,
    };
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

function buildResultIdentity(
  job: LightExtensionCompileJob,
  workerId: number,
  executingThreadId: number,
  attempt: number,
  startedAt: number,
  problems: LightExtensionProblem[],
) {
  return {
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
    problems,
    observation: {
      workerId,
      threadId: executingThreadId,
      attempt,
      queueDurationMs: 0,
      runDurationMs: elapsedMs(startedAt),
    },
  };
}

function assertCurrentCompilerBuild(job: LightExtensionCompileJob): void {
  if (stableSerialize(job.compilerBuildIdentity) !== stableSerialize(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY)) {
    throw new TypeError(
      `Compile worker build identity mismatch: expected=${LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId}, actual=${job.compilerBuildIdentity.compilerBuildId}`,
    );
  }
}

function buildLegacyMetadata(surface: LightExtensionAuthoringSurfaceSpec, job: LightExtensionCompileJob) {
  return {
    target: 'client',
    repoId: job.repoId,
    entryId: job.entryId,
    kind: job.kind,
    entryName: job.entryName,
    modelUse: surface.modelUse,
    surface: surface.surface,
  };
}

function toLightExtensionProblem(input: RunJSCompileDiagnostic, job: LightExtensionCompileJob): LightExtensionProblem {
  const details: Record<string, unknown> = { ...(input.details || {}) };
  if (input.ruleId) {
    details.ruleId = input.ruleId;
  }
  return createLightExtensionProblem({
    phase: 'compile',
    source: 'runjs-compiler',
    code: input.code || input.ruleId || 'RUNJS_COMPILE_FAILED',
    severity: input.severity === 'error' ? 'error' : 'warning',
    message: input.message,
    ...(input.path ? { path: input.path } : {}),
    ...(typeof input.line === 'number'
      ? {
          range: {
            start: {
              line: input.line,
              column: typeof input.column === 'number' ? input.column : 1,
            },
          },
        }
      : {}),
    snapshotId: job.problemSnapshotId || job.filesHash,
    requestId: job.requestId,
    kind: job.kind,
    entryName: job.entryName,
    ...(Object.keys(details).length > 0 ? { details } : {}),
  });
}

function inferRunJSLanguage(path: string): 'typescript' | 'javascript' | 'tsx' | 'jsx' {
  const extension = pathPosix.extname(path);
  if (extension === '.tsx') {
    return 'tsx';
  }
  if (extension === '.jsx') {
    return 'jsx';
  }
  if (extension === '.js') {
    return 'javascript';
  }
  return 'typescript';
}

function isCompileCodeFile(path: string): boolean {
  return ['.js', '.jsx', '.ts', '.tsx'].includes(pathPosix.extname(path).toLowerCase());
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, performance.now() - startedAt);
}
