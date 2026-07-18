/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  sha256Hex,
  stableSerialize,
  type RunJSEntryDependencyManifestV1,
  type RunJSRuntimeArtifact,
} from '@nocobase/runjs';

import type { LightExtensionKind } from '../../constants';
import type { LightExtensionDiagnostic } from '../../shared/types';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  type LightExtensionAuthoringSurfaceSpec,
  type LightExtensionCompilerBuildIdentity,
} from './LightExtensionCompileContract';
import type { CompileInputManifest } from './LightExtensionCompileKey';
import { sortDiagnostics } from './LightExtensionValidator';

const sha256Pattern = /^[a-f0-9]{64}$/u;

export interface LightExtensionCompileJobFile {
  path: string;
  content: string;
  blobHash: string;
  language: string;
  mode: string;
}

/**
 * The worker boundary intentionally contains only structured-clone plain data. Database models, transactions, request
 * contexts, loggers, callbacks, and other process-local objects must never be added to this contract.
 */
export interface LightExtensionCompileJob {
  jobId: string;
  requestId: string;
  correlationId: string;
  repoId: string;
  entryId: string;
  entryName: string;
  ordinal: number;
  compileKey: string;
  filesHash: string;
  kind: LightExtensionKind;
  entryPath: string;
  runtimeVersion: string;
  surface: LightExtensionAuthoringSurfaceSpec;
  compilerBuildIdentity: LightExtensionCompilerBuildIdentity;
  inputManifest: CompileInputManifest;
  files: LightExtensionCompileJobFile[];
}

export interface LightExtensionCompileWorkerObservation {
  workerId: number;
  threadId: number;
  attempt: number;
  queueDurationMs: number;
  runDurationMs: number;
}

interface LightExtensionCompileResultBase {
  jobId: string;
  requestId: string;
  correlationId: string;
  repoId: string;
  entryId: string;
  entryName: string;
  ordinal: number;
  compileKey: string;
  filesHash: string;
  kind: LightExtensionKind;
  entryPath: string;
  compilerBuildId: string;
  inputManifest: CompileInputManifest;
  diagnostics: LightExtensionDiagnostic[];
  observation: LightExtensionCompileWorkerObservation;
}

export interface LightExtensionCompileSuccessResult extends LightExtensionCompileResultBase {
  accepted: true;
  execution?: 'compiled' | 'reused';
  compiledAt?: string;
  artifact: RunJSRuntimeArtifact;
  artifactHash: string;
  runtimeCodeHash: string;
  dependencyManifest?: RunJSEntryDependencyManifestV1;
  dependencyManifestHash?: string;
}

export interface LightExtensionCompileFailureResult extends LightExtensionCompileResultBase {
  accepted: false;
  failureCode: string;
}

export type LightExtensionCompileResult = LightExtensionCompileSuccessResult | LightExtensionCompileFailureResult;

export interface LightExtensionCompileBatchAggregate {
  accepted: boolean;
  results: LightExtensionCompileResult[];
  diagnostics: LightExtensionDiagnostic[];
}

export interface LightExtensionCompileWorkerRequest {
  type: 'compile';
  workerId: number;
  attempt: number;
  job: LightExtensionCompileJob;
}

export interface LightExtensionCompileWorkerShutdownRequest {
  type: 'shutdown';
}

export type LightExtensionCompileWorkerMessage =
  | LightExtensionCompileWorkerRequest
  | LightExtensionCompileWorkerShutdownRequest;

export type LightExtensionCompileWorkerResponse =
  | {
      type: 'result';
      result: LightExtensionCompileResult;
    }
  | {
      type: 'ready';
      threadId: number;
    }
  | {
      type: 'shutdown-complete';
    };

export function assertLightExtensionCompileJob(job: LightExtensionCompileJob): void {
  assertStructuredClonePlainData(job, 'Compile job');
  for (const [label, value] of [
    ['jobId', job.jobId],
    ['requestId', job.requestId],
    ['correlationId', job.correlationId],
    ['repoId', job.repoId],
    ['entryId', job.entryId],
    ['entryName', job.entryName],
    ['entryPath', job.entryPath],
    ['runtimeVersion', job.runtimeVersion],
  ] as const) {
    assertNonEmptyString(value, label);
  }
  if (!Number.isSafeInteger(job.ordinal) || job.ordinal < 0) {
    throw new TypeError('Compile job ordinal must be a non-negative safe integer');
  }
  assertSha256(job.compileKey, 'compileKey');
  assertSha256(job.filesHash, 'filesHash');
  assertSha256(job.compilerBuildIdentity.compilerBuildId, 'compilerBuildIdentity.compilerBuildId');
  if (job.inputManifest.compilerBuildId !== job.compilerBuildIdentity.compilerBuildId) {
    throw new TypeError('Compile job build identity does not match its input manifest');
  }
  if (job.inputManifest.kind !== job.kind || job.inputManifest.entryPath !== job.entryPath) {
    throw new TypeError('Compile job identity does not match its input manifest');
  }
  if (job.inputManifest.runtimeVersion !== job.runtimeVersion) {
    throw new TypeError('Compile job runtime version does not match its input manifest');
  }
  const expectedSurface = LIGHT_EXTENSION_AUTHORING_SURFACES[job.kind];
  if (!expectedSurface || stableSerialize(job.surface) !== stableSerialize(expectedSurface)) {
    throw new TypeError(`Compile job contains an invalid surface contract for kind "${job.kind}"`);
  }
  if (
    job.inputManifest.surfaceStyle !== job.surface.surfaceStyle ||
    job.inputManifest.compilerSurfaceStyle !== job.surface.compilerSurfaceStyle ||
    job.inputManifest.modelUse !== job.surface.modelUse
  ) {
    throw new TypeError('Compile job surface does not match its input manifest');
  }
  if (job.compileKey !== sha256Hex(stableSerialize(job.inputManifest))) {
    throw new TypeError('Compile job compileKey does not match its canonical input manifest');
  }
  if (!Array.isArray(job.files) || job.files.length === 0) {
    throw new TypeError('Compile job must include at least one source file');
  }
  const canonicalFiles = job.files.map(({ path, blobHash, language, mode }) => ({ path, blobHash, language, mode }));
  if (stableSerialize(canonicalFiles) !== stableSerialize(job.inputManifest.files)) {
    throw new TypeError('Compile job file payload does not match its canonical input manifest');
  }
  if (job.filesHash !== sha256Hex(stableSerialize(job.inputManifest.files))) {
    throw new TypeError('Compile job filesHash does not match its canonical input manifest');
  }
  const paths = new Set<string>();
  for (const file of job.files) {
    assertNonEmptyString(file.path, 'Compile job file path');
    assertNonEmptyString(file.blobHash, `Compile job blobHash for ${file.path}`);
    assertNonEmptyString(file.language, `Compile job language for ${file.path}`);
    assertNonEmptyString(file.mode, `Compile job mode for ${file.path}`);
    if (typeof file.content !== 'string') {
      throw new TypeError(`Compile job content for "${file.path}" must be a string`);
    }
    if (paths.has(file.path)) {
      throw new TypeError(`Compile job contains duplicate path "${file.path}"`);
    }
    paths.add(file.path);
  }
}

export function assertStructuredClonePlainData(value: unknown, label = 'Value'): void {
  const visiting = new WeakSet<object>();
  const visit = (current: unknown, path: string): void => {
    if (
      current === null ||
      typeof current === 'string' ||
      typeof current === 'number' ||
      typeof current === 'boolean'
    ) {
      return;
    }
    if (typeof current !== 'object') {
      throw new TypeError(`${path} must contain only structured-clone plain data`);
    }
    if (visiting.has(current)) {
      throw new TypeError(`${path} must not contain circular references`);
    }
    const prototype = Object.getPrototypeOf(current);
    if (!Array.isArray(current) && prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${path} must not contain class instances or process-local objects`);
    }
    visiting.add(current);
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
    } else {
      for (const [key, item] of Object.entries(current)) {
        visit(item, `${path}.${key}`);
      }
    }
    visiting.delete(current);
  };

  visit(value, label);
  structuredClone(value);
}

export function aggregateLightExtensionCompileResults(
  jobs: readonly LightExtensionCompileJob[],
  results: readonly LightExtensionCompileResult[],
): LightExtensionCompileBatchAggregate {
  const jobsById = new Map<string, LightExtensionCompileJob>();
  const ordinals = new Set<number>();
  for (const job of jobs) {
    assertLightExtensionCompileJob(job);
    if (jobsById.has(job.jobId)) {
      throw new TypeError(`Duplicate compile job ID "${job.jobId}"`);
    }
    if (ordinals.has(job.ordinal)) {
      throw new TypeError(`Duplicate compile job ordinal "${job.ordinal}"`);
    }
    jobsById.set(job.jobId, job);
    ordinals.add(job.ordinal);
  }

  const resultsById = new Map<string, LightExtensionCompileResult>();
  for (const result of results) {
    assertStructuredClonePlainData(result, 'Compile result');
    const job = jobsById.get(result.jobId);
    if (!job) {
      throw new TypeError(`Compile result references unknown job "${result.jobId}"`);
    }
    if (resultsById.has(result.jobId)) {
      throw new TypeError(`Duplicate compile result for job "${result.jobId}"`);
    }
    assertResultMatchesJob(result, job);
    resultsById.set(result.jobId, result);
  }
  if (resultsById.size !== jobsById.size) {
    const missing = jobs.filter((job) => !resultsById.has(job.jobId)).map((job) => job.jobId);
    throw new TypeError(`Missing compile results for jobs: ${missing.join(', ')}`);
  }

  const ordered = jobs
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal || left.jobId.localeCompare(right.jobId))
    .map((job) => resultsById.get(job.jobId) as LightExtensionCompileResult);
  return {
    accepted: ordered.every((result) => result.accepted),
    results: ordered,
    diagnostics: ordered.flatMap((result) => sortDiagnostics(result.diagnostics)),
  };
}

export function createLightExtensionCompileInfrastructureFailure(input: {
  job: LightExtensionCompileJob;
  workerId: number;
  threadId: number;
  attempt: number;
  queueDurationMs: number;
  runDurationMs: number;
  failureCode: string;
  message: string;
}): LightExtensionCompileFailureResult {
  const { job } = input;
  return {
    accepted: false,
    failureCode: input.failureCode,
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
    diagnostics: [
      {
        code: input.failureCode,
        severity: 'error',
        message: input.message,
        path: job.entryPath,
        kind: job.kind,
        entryName: job.entryName,
      },
    ],
    observation: {
      workerId: input.workerId,
      threadId: input.threadId,
      attempt: input.attempt,
      queueDurationMs: input.queueDurationMs,
      runDurationMs: input.runDurationMs,
    },
  };
}

function assertResultMatchesJob(result: LightExtensionCompileResult, job: LightExtensionCompileJob): void {
  const matches =
    result.requestId === job.requestId &&
    result.correlationId === job.correlationId &&
    result.repoId === job.repoId &&
    result.entryId === job.entryId &&
    result.entryName === job.entryName &&
    result.ordinal === job.ordinal &&
    result.compileKey === job.compileKey &&
    result.filesHash === job.filesHash &&
    result.kind === job.kind &&
    result.entryPath === job.entryPath &&
    result.compilerBuildId === job.compilerBuildIdentity.compilerBuildId &&
    stableSerialize(result.inputManifest) === stableSerialize(job.inputManifest);
  if (!matches) {
    throw new TypeError(`Compile result identity does not match job "${job.jobId}"`);
  }
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function assertSha256(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !sha256Pattern.test(value)) {
    throw new TypeError(`${label} must be a SHA-256 hash`);
  }
}
