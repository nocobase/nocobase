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
  isRunJSEntryDependencyManifestPersistable,
  stableSerialize,
  type RunJSCompileDiagnostic,
  type RunJSRuntimeArtifact,
} from '@nocobase/runjs';
import { buildRunJSEntryDependencyManifestFromGraph } from '@nocobase/runjs/compiler';
import { performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { posix as pathPosix } from 'path';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT } from '../../constants';
import type { LightExtensionDiagnostic } from '../../shared/types';
import {
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  assertLightExtensionCompileJob,
  createLightExtensionCompileInfrastructureFailure,
  type LightExtensionAuthoringSurfaceSpec,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
} from './LightExtensionCompileContract';
import { hasErrorDiagnostic, sortDiagnostics } from './LightExtensionValidator';
import { rewriteLightExtensionSdkRuntimeImports } from './LightExtensionWorkspaceCompilerBridge';
import {
  buildLightExtensionCompilerSessionContract,
  LightExtensionCompilerSessionManager,
} from './LightExtensionCompilerSessionManager';

const compilerSessions = new LightExtensionCompilerSessionManager();

export async function disposeLightExtensionCompileJobExecutor(): Promise<void> {
  await compilerSessions.dispose();
}

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
          ? rewriteLightExtensionSdkRuntimeImports(file.path, file.content)
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
    };
    const compiled = (
      await compilerSessions.compile({
        contract: buildLightExtensionCompilerSessionContract({
          repoId: input.job.repoId,
          entryIdentity: `${input.job.kind}:${input.job.entryName}`,
          inputManifest: input.job.inputManifest,
        }),
        input: compileInput,
        workspaceUpdate: 'replace',
      })
    ).result;
    const diagnostics = sortDiagnostics(compiled.artifact.diagnostics.map(toLightExtensionDiagnostic));
    if (hasErrorDiagnostic(diagnostics)) {
      return {
        ...buildResultIdentity(input.job, input.workerId, executingThreadId, input.attempt, startedAt, diagnostics),
        accepted: false,
        failureCode: compiled.failureCode || 'RUNJS_COMPILE_FAILED',
      };
    }

    const artifact: RunJSRuntimeArtifact = {
      ...compiled.artifact,
      diagnostics,
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
    if (!compiled.dependencyGraph) {
      throw new Error('RunJS compiler did not return a dependency graph for an accepted compile');
    }
    const dependency = buildRunJSEntryDependencyManifestFromGraph({
      compilerBuildId: input.job.compilerBuildIdentity.compilerBuildId,
      entryPath: input.job.entryPath,
      files: input.job.files.map((file) => ({
        path: file.path,
        content: file.content,
        blobHash: file.blobHash,
      })),
      graph: compiled.dependencyGraph,
    });
    const persistDependencyManifest = isRunJSEntryDependencyManifestPersistable(dependency.manifest);
    return {
      ...buildResultIdentity(input.job, input.workerId, executingThreadId, input.attempt, startedAt, diagnostics),
      accepted: true,
      artifact,
      artifactHash,
      runtimeCodeHash,
      ...(persistDependencyManifest
        ? {
            dependencyManifest: dependency.manifest,
            dependencyManifestHash: dependency.manifestHash,
          }
        : {}),
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
  diagnostics: LightExtensionDiagnostic[],
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
    diagnostics,
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

function toLightExtensionDiagnostic(input: RunJSCompileDiagnostic): LightExtensionDiagnostic {
  const details: Record<string, unknown> = { ...(input.details || {}) };
  if (input.ruleId) {
    details.ruleId = input.ruleId;
  }
  return {
    code: input.code || input.ruleId || 'RUNJS_COMPILE_FAILED',
    severity: input.severity === 'warning' ? 'warning' : 'error',
    message: input.message,
    ...(input.path ? { path: input.path } : {}),
    ...(typeof input.line === 'number' ? { line: input.line } : {}),
    ...(typeof input.column === 'number' ? { column: input.column } : {}),
    ...(Object.keys(details).length > 0 ? { details } : {}),
  };
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
