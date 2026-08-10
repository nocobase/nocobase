/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stableSerialize, type RunJSRuntimeArtifact, type RunJSSurfaceStyle } from '@nocobase/runjs';
import { isClientSettingsTypegenDescriptorPath } from '@nocobase/runjs/js-template/typegen';
import {
  RUNJS_COMPILER_BUILD_IDENTITY,
  type RunJSCompilerBuildIdentity,
} from '@nocobase/runjs/compiler/build-identity';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, sha256Hex } from '@nocobase/runjs/server';
import sdkPackageJson from '@nocobase/runjs/package.json';
import { posix as pathPosix } from 'path';

import {
  JS_TEMPLATE_ARTIFACT_CONTRACT,
  JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT,
  JS_TEMPLATE_SCHEMA_VERSION,
  type JsTemplateKind,
} from '../../constants';
import type { JsTemplateDiagnostic } from '../../shared/types';
import { jsTemplateV1SchemaSha256 } from '../jsTemplateSchema';
import type { CompileInputManifest } from './JsTemplateCompileKey';
import type {
  JsTemplateWorkspaceCompileFileInput,
  JsTemplateWorkspaceCompileResult,
  JsTemplateWorkspaceCompilerBridge,
} from './JsTemplateWorkspaceCompilerBridge';
import {
  JsTemplateValidator,
  sortDiagnostics,
  type JsTemplateSourceFileInput,
  type JsTemplateWorkspaceValidationResult,
} from './JsTemplateValidator';
import { JS_TEMPLATE_SDK_TEMPLATE_VERSION, JS_TEMPLATE_VALIDATOR_VERSION } from './JsTemplateValidator';

export type JsTemplateSurfaceStyle = 'render' | 'value' | 'action';

export interface JsTemplateAuthoringSurfaceSpec {
  kind: JsTemplateKind;
  surfaceStyle: JsTemplateSurfaceStyle;
  compilerSurfaceStyle: RunJSSurfaceStyle;
  modelUse: string;
  surface: string;
}

export const JS_TEMPLATE_AUTHORING_SURFACES: Record<JsTemplateKind, JsTemplateAuthoringSurfaceSpec> = {
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
};

export const JS_TEMPLATE_COMPILER_BRIDGE_CONTRACT_VERSION = 'js-template.compiler-bridge.v1';
export const JS_TEMPLATE_IMPORT_REWRITE_POLICY_VERSION = 'js-template.import-rewrite.v3';
export const JS_TEMPLATE_IMPORT_SECURITY_POLICY_VERSION = 'js-template.import-security.v2';
export const JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT_VERSION = JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT;

export interface JsTemplateCompilerBuildIdentityComponents {
  runjsCompilerBuildId: string;
  compilerBridgeContract: string;
  importRewritePolicy: string;
  importSecurityPolicy: string;
  runtimeArtifactContract: string;
  runtimeSurfaceContract: string;
  authoringSurfaceFingerprint: string;
  validatorVersion: string;
  sdkVersion: string;
  entrySchemaVersion: number;
  entrySchemaHash: string;
  sdkTemplateVersion: string;
}

export interface JsTemplateCompilerBuildIdentity {
  compilerBuildId: string;
  components: JsTemplateCompilerBuildIdentityComponents;
  runjs: RunJSCompilerBuildIdentity;
}

export const JS_TEMPLATE_COMPILER_BUILD_IDENTITY_COMPONENTS: Readonly<JsTemplateCompilerBuildIdentityComponents> =
  Object.freeze({
    runjsCompilerBuildId: RUNJS_COMPILER_BUILD_IDENTITY.compilerBuildId,
    compilerBridgeContract: JS_TEMPLATE_COMPILER_BRIDGE_CONTRACT_VERSION,
    importRewritePolicy: JS_TEMPLATE_IMPORT_REWRITE_POLICY_VERSION,
    importSecurityPolicy: JS_TEMPLATE_IMPORT_SECURITY_POLICY_VERSION,
    runtimeArtifactContract: JS_TEMPLATE_ARTIFACT_CONTRACT,
    runtimeSurfaceContract: JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT_VERSION,
    authoringSurfaceFingerprint: sha256Hex(stableSerialize(JS_TEMPLATE_AUTHORING_SURFACES)),
    validatorVersion: JS_TEMPLATE_VALIDATOR_VERSION,
    sdkVersion: sdkPackageJson.version,
    entrySchemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
    entrySchemaHash: jsTemplateV1SchemaSha256,
    sdkTemplateVersion: JS_TEMPLATE_SDK_TEMPLATE_VERSION,
  });

export function buildJsTemplateCompilerBuildIdentity(
  components: JsTemplateCompilerBuildIdentityComponents = JS_TEMPLATE_COMPILER_BUILD_IDENTITY_COMPONENTS,
  runjs: RunJSCompilerBuildIdentity = RUNJS_COMPILER_BUILD_IDENTITY,
): JsTemplateCompilerBuildIdentity {
  const normalizedComponents = { ...components };
  return {
    compilerBuildId: sha256Hex(stableSerialize(normalizedComponents)),
    components: normalizedComponents,
    runjs,
  };
}

export const JS_TEMPLATE_COMPILER_BUILD_IDENTITY: Readonly<JsTemplateCompilerBuildIdentity> = Object.freeze(
  buildJsTemplateCompilerBuildIdentity(),
);

export function validateJsTemplateWorkspace(
  validator: Pick<JsTemplateValidator, 'validateWorkspace'>,
  files: readonly JsTemplateSourceFileInput[],
): JsTemplateWorkspaceValidationResult {
  return validator.validateWorkspace({
    files: files.map((file) => ({ ...file })),
  });
}

export interface JsTemplateValidatedCompileTemplate {
  kind: JsTemplateKind;
  templateName: string;
  entryPath: string;
  descriptorPath: string;
}

export interface JsTemplateValidatedCompileInput {
  projectId: string;
  templateId?: string | null;
  operation: 'compilePreview' | 'runtimeCompile';
  template: JsTemplateValidatedCompileTemplate;
  runtimeVersion?: string;
  files: readonly JsTemplateWorkspaceCompileFileInput[];
}

export function compileJsTemplateValidatedTemplate(
  compiler: Pick<JsTemplateWorkspaceCompilerBridge, 'compileEntry'>,
  input: JsTemplateValidatedCompileInput,
): Promise<JsTemplateWorkspaceCompileResult> {
  const files = selectJsTemplateCompileFiles(input.files, input.template);

  return compiler.compileEntry({
    projectId: input.projectId,
    templateId: input.templateId,
    operation: input.operation,
    kind: input.template.kind,
    templateName: input.template.templateName,
    entryPath: input.template.entryPath,
    runtimeVersion: input.runtimeVersion,
    files,
  });
}

export function selectJsTemplateCompileFiles<T extends JsTemplateWorkspaceCompileFileInput>(
  files: readonly T[],
  template: Pick<JsTemplateValidatedCompileTemplate, 'entryPath' | 'descriptorPath'>,
): T[] {
  const rootPath = getEntryRootPath(template.entryPath);

  return files
    .filter(
      (file) =>
        file.path === rootPath ||
        file.path.startsWith(`${rootPath}/`) ||
        file.path.startsWith('src/shared/') ||
        isClientSettingsTypegenDescriptorPath(file.path),
    )
    .map((file) => ({ ...file }));
}

function getEntryRootPath(entryPath: string): string {
  const normalized = pathPosix.normalize(entryPath.trim()).replace(/^\.\/+/, '');
  return pathPosix.extname(normalized) ? pathPosix.dirname(normalized) : normalized;
}

const sha256Pattern = /^[a-f0-9]{64}$/u;

export interface JsTemplateCompileJobFile {
  path: string;
  content: string;
  blobHash: string;
  language: string;
  mode: string;
}

export interface JsTemplateCompileJob {
  jobId: string;
  requestId: string;
  correlationId: string;
  projectId: string;
  templateId: string;
  templateName: string;
  ordinal: number;
  compileKey: string;
  filesHash: string;
  kind: JsTemplateKind;
  entryPath: string;
  runtimeVersion: string;
  surface: JsTemplateAuthoringSurfaceSpec;
  compilerBuildIdentity: JsTemplateCompilerBuildIdentity;
  inputManifest: CompileInputManifest;
  files: JsTemplateCompileJobFile[];
}

export interface JsTemplateCompileObservation {
  workerId: number;
  threadId: number;
  attempt: number;
  queueDurationMs: number;
  runDurationMs: number;
}

interface JsTemplateCompileResultBase {
  jobId: string;
  requestId: string;
  correlationId: string;
  projectId: string;
  templateId: string;
  templateName: string;
  ordinal: number;
  compileKey: string;
  filesHash: string;
  kind: JsTemplateKind;
  entryPath: string;
  compilerBuildId: string;
  inputManifest: CompileInputManifest;
  diagnostics: JsTemplateDiagnostic[];
  observation: JsTemplateCompileObservation;
}

export interface JsTemplateCompileSuccessResult extends JsTemplateCompileResultBase {
  accepted: true;
  artifact: RunJSRuntimeArtifact;
  artifactHash: string;
  runtimeCodeHash: string;
}

export interface JsTemplateCompileFailureResult extends JsTemplateCompileResultBase {
  accepted: false;
  failureCode: string;
}

export type JsTemplateCompileResult = JsTemplateCompileSuccessResult | JsTemplateCompileFailureResult;

export interface JsTemplateCompileBatchAggregate {
  accepted: boolean;
  results: JsTemplateCompileResult[];
  diagnostics: JsTemplateDiagnostic[];
}

export interface JsTemplateCompileExecutor {
  submitWithBackpressure(job: JsTemplateCompileJob): Promise<JsTemplateCompileResult>;
}

export function normalizeJsTemplateCompileResult(
  job: JsTemplateCompileJob,
  compiled: JsTemplateWorkspaceCompileResult,
  observation: JsTemplateCompileObservation,
): JsTemplateCompileResult {
  const identity = {
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
    diagnostics: compiled.diagnostics,
    observation,
  };
  if (!compiled.accepted) {
    return {
      ...identity,
      accepted: false,
      failureCode: compiled.failureCode || 'RUNJS_COMPILE_FAILED',
    };
  }

  const artifact = {
    ...compiled.artifact,
    metadata: {
      ...compiled.artifact.metadata,
      compilerBuildId: job.compilerBuildIdentity.compilerBuildId,
    },
  };
  return {
    ...identity,
    accepted: true,
    artifact,
    artifactHash: buildRunJSArtifactHash({
      code: artifact.code,
      sourceMap: artifact.sourceMap,
      version: artifact.version,
      entryPath: artifact.entryPath || job.entryPath,
      runtimeContract: job.inputManifest.runtimeContract,
    }),
    runtimeCodeHash: buildRunJSRuntimeCodeHash(artifact.code),
  };
}

export function assertJsTemplateCompileJob(job: JsTemplateCompileJob): void {
  assertStructuredClonePlainData(job, 'Compile job');
  for (const [label, value] of [
    ['jobId', job.jobId],
    ['requestId', job.requestId],
    ['correlationId', job.correlationId],
    ['projectId', job.projectId],
    ['templateId', job.templateId],
    ['templateName', job.templateName],
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
  const expectedSurface = JS_TEMPLATE_AUTHORING_SURFACES[job.kind];
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

export function aggregateJsTemplateCompileResults(
  jobs: readonly JsTemplateCompileJob[],
  results: readonly JsTemplateCompileResult[],
): JsTemplateCompileBatchAggregate {
  const jobsById = new Map<string, JsTemplateCompileJob>();
  const ordinals = new Set<number>();
  for (const job of jobs) {
    assertJsTemplateCompileJob(job);
    if (jobsById.has(job.jobId)) {
      throw new TypeError(`Duplicate compile job ID "${job.jobId}"`);
    }
    if (ordinals.has(job.ordinal)) {
      throw new TypeError(`Duplicate compile job ordinal "${job.ordinal}"`);
    }
    jobsById.set(job.jobId, job);
    ordinals.add(job.ordinal);
  }

  const resultsById = new Map<string, JsTemplateCompileResult>();
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
    .map((job) => resultsById.get(job.jobId) as JsTemplateCompileResult);
  return {
    accepted: ordered.every((result) => result.accepted),
    results: ordered,
    diagnostics: ordered.flatMap((result) => sortDiagnostics(result.diagnostics)),
  };
}

export function createJsTemplateCompileInfrastructureFailure(input: {
  job: JsTemplateCompileJob;
  workerId: number;
  threadId: number;
  attempt: number;
  queueDurationMs: number;
  runDurationMs: number;
  failureCode: string;
  message: string;
}): JsTemplateCompileFailureResult {
  const { job } = input;
  return {
    accepted: false,
    failureCode: input.failureCode,
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
    diagnostics: [
      {
        code: input.failureCode,
        severity: 'error',
        message: input.message,
        path: job.entryPath,
        kind: job.kind,
        templateName: job.templateName,
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

function assertResultMatchesJob(result: JsTemplateCompileResult, job: JsTemplateCompileJob): void {
  const matches =
    result.requestId === job.requestId &&
    result.correlationId === job.correlationId &&
    result.projectId === job.projectId &&
    result.templateId === job.templateId &&
    result.templateName === job.templateName &&
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
