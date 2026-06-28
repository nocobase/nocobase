/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VscError } from './errors';
import { sha256Hex } from './hash';
import type { VscCommitRecord, VscFileChange, VscRefRecord, VscRepositoryIdentity, VscRepositoryRecord } from './types';

export type RunJSSourceLocator =
  | {
      kind: 'flowModel.step';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      paramPath: string[];
      versionPath?: string[];
    }
  | {
      kind: 'flowModel.nestedRunJS';
      modelUid: string;
      containerFlowKey: string;
      containerStepKey: string;
      valuePath: Array<string | number>;
      scene: string;
    }
  | {
      kind: 'workflow.javascript';
      nodeId: string | number;
    }
  | {
      kind: 'chart.option';
      modelUid: string;
    }
  | {
      kind: 'chart.events';
      modelUid: string;
    };

export type RunJSSourceKind = RunJSSourceLocator['kind'];

export type RunJSSurfaceStyle = 'render' | 'action' | 'value' | 'workflow';

export type RunJSLanguage = 'typescript' | 'javascript' | 'tsx' | 'jsx';

export interface RunJSSourcePermissionCheck {
  resource: string;
  action: string;
  rawResourceName?: string;
}

export interface RunJSSourcePermissionResult {
  params?: {
    filter?: unknown;
    whitelist?: string[];
    blacklist?: string[];
    fields?: string[];
    [key: string]: unknown;
  };
}

export interface RunJSSourceAdapterContext {
  userId?: string | null;
  request?: Record<string, unknown>;
  state?: Record<string, unknown>;
  currentUser?: unknown;
  timezone?: string;
  transaction?: unknown;
  can?: (input: RunJSSourcePermissionCheck) => RunJSSourcePermissionResult | null;
}

export interface RunJSLegacySource {
  code: string;
  version: string;
  label: string;
  surfaceStyle: RunJSSurfaceStyle;
  language: RunJSLanguage;
  entryPath?: string;
  entry?: string;
  ownerFingerprint: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSCompileDiagnostic {
  message: string;
  severity?: 'error' | 'warning' | 'info';
  code?: string;
  ruleId?: string;
  path?: string;
  line?: number;
  column?: number;
  details?: Record<string, unknown>;
}

export interface RunJSSourceAuthoringLegacyInfo {
  version: string;
  surfaceStyle: RunJSSurfaceStyle;
  language: RunJSLanguage;
  metadata?: Record<string, unknown>;
}

export interface RunJSRuntimeArtifact {
  code: string;
  version: string;
  sourceMap?: string;
  diagnostics: RunJSCompileDiagnostic[];
  filesHash: string;
  entryPath?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSPublishedWriteResult {
  ownerFingerprint?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSSourceAdapter<TLocator extends RunJSSourceLocator = RunJSSourceLocator> {
  kind: TLocator['kind'];
  readLegacy(input: {
    locator: TLocator;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSLegacySource> | RunJSLegacySource;
  writePublished(input: {
    locator: TLocator;
    artifact: RunJSRuntimeArtifact;
    commitId: string;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSPublishedWriteResult> | RunJSPublishedWriteResult;
  getFingerprint(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<string> | string;
  assertCanRead(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
  assertCanWrite(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
}

export interface RunJSSourceAuthoringInspectionInput {
  code: string;
  path: string;
  runtimeVersion: string;
  surfaceStyle: Exclude<RunJSSurfaceStyle, 'workflow'>;
  locator?: RunJSSourceLocator;
  legacy?: RunJSSourceAuthoringLegacyInfo;
}

export type RunJSSourceAuthoringInspector = (input: RunJSSourceAuthoringInspectionInput) => RunJSCompileDiagnostic[];

export interface RunJSSourceOpenResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repositoryIdentity: VscRepositoryIdentity;
  legacy: RunJSLegacySource;
  ownerFingerprint: string;
}

export interface RunJSSourcePublishResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  publishedRef: VscRefRecord;
  artifact: {
    entryPath: string | null;
    filesHash: string;
    runtimeCodeHash: string;
    diagnostics: RunJSCompileDiagnostic[];
  };
  ownerFingerprint: string;
  writeResult: RunJSPublishedWriteResult;
}

export interface RunJSSourcePublishInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  baseCommitId: string | null;
  basePublishedCommitId: string | null;
  baseOwnerFingerprint: string;
  message: string;
  files: VscFileChange[];
  artifact?: Partial<RunJSRuntimeArtifact>;
  draftId?: string;
  entryPath?: string;
  version?: string;
}

export function normalizeRunJSSourceLocator(value: unknown): RunJSSourceLocator {
  const input = toRecord(value);
  const kind = input.kind;

  if (kind === 'flowModel.step') {
    return {
      kind,
      modelUid: requireString(input.modelUid, 'modelUid'),
      flowKey: requireString(input.flowKey, 'flowKey'),
      stepKey: requireString(input.stepKey, 'stepKey'),
      paramPath: requireStringArray(input.paramPath, 'paramPath'),
      versionPath: optionalStringArray(input.versionPath, 'versionPath'),
    };
  }

  if (kind === 'flowModel.nestedRunJS') {
    return {
      kind,
      modelUid: requireString(input.modelUid, 'modelUid'),
      containerFlowKey: requireString(input.containerFlowKey, 'containerFlowKey'),
      containerStepKey: requireString(input.containerStepKey, 'containerStepKey'),
      valuePath: requirePathArray(input.valuePath, 'valuePath'),
      scene: requireString(input.scene, 'scene'),
    };
  }

  if (kind === 'workflow.javascript') {
    return {
      kind,
      nodeId: requireStringOrNumber(input.nodeId, 'nodeId'),
    };
  }

  if (kind === 'chart.option' || kind === 'chart.events') {
    return {
      kind,
      modelUid: requireString(input.modelUid, 'modelUid'),
    };
  }

  if (typeof kind === 'string' && kind.trim()) {
    const unsupportedKind = kind.trim();
    throw new VscError('RUNJS_SOURCE_KIND_UNSUPPORTED', `RunJS source kind "${unsupportedKind}" is not supported`, {
      details: {
        kind: unsupportedKind,
      },
    });
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', 'RunJS source locator kind is invalid', {
    details: {
      kind,
    },
  });
}

export function buildRunJSSourceRepositoryIdentity(locator: RunJSSourceLocator): VscRepositoryIdentity {
  const ownerId = getRunJSSourceOwnerId(locator);

  return {
    ownerType: 'runjs-source',
    ownerId,
    name: 'source',
  };
}

export function getRunJSSourceOwnerId(locator: RunJSSourceLocator): string {
  const stableOwnerId = getStableOwnerId(locator);
  const sourcePathHash = sha256Hex(JSON.stringify(getSourcePathSegments(locator))).slice(0, 16);

  return `runjs:${locator.kind}:${stableOwnerId}:${sourcePathHash}`;
}

export function buildRunJSOwnerFingerprint(input: {
  locator: RunJSSourceLocator;
  ownerUpdatedAt?: unknown;
  selectedLegacyValue: unknown;
  selectedVersion: unknown;
}): string {
  return sha256Hex(
    stableSerialize({
      locator: input.locator,
      ownerUpdatedAt: input.ownerUpdatedAt ?? null,
      selectedLegacyValue: input.selectedLegacyValue ?? null,
      selectedVersion: input.selectedVersion ?? null,
    }),
  );
}

export function buildRunJSFilesHash(files: VscFileChange[]): string {
  return sha256Hex(stableSerialize(files));
}

export function buildRunJSRuntimeCodeHash(code: string): string {
  return sha256Hex(code);
}

function getStableOwnerId(locator: RunJSSourceLocator): string {
  if (locator.kind === 'workflow.javascript') {
    return `node_${locator.nodeId}`;
  }

  return locator.modelUid;
}

function getSourcePathSegments(
  locator: RunJSSourceLocator,
): Array<{ type: 'string' | 'number'; value: string | number }> {
  if (locator.kind === 'flowModel.step') {
    return toTypedPathSegments([locator.flowKey, locator.stepKey, ...locator.paramPath]);
  }

  if (locator.kind === 'flowModel.nestedRunJS') {
    return toTypedPathSegments([
      locator.containerFlowKey,
      locator.containerStepKey,
      ...locator.valuePath,
      locator.scene,
    ]);
  }

  if (locator.kind === 'workflow.javascript') {
    return toTypedPathSegments(['content']);
  }

  return toTypedPathSegments([locator.kind]);
}

function toTypedPathSegments(
  segments: Array<string | number>,
): Array<{ type: 'string' | 'number'; value: string | number }> {
  return segments.map((value) => ({
    type: typeof value === 'number' ? 'number' : 'string',
    value,
  }));
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source locator field "${field}" is invalid`);
}

function requireStringOrNumber(value: unknown, field: string): string | number {
  if ((typeof value === 'string' && value.trim()) || typeof value === 'number') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source locator field "${field}" is invalid`);
}

function requireStringArray(value: unknown, field: string): string[] {
  if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim())) {
    return [...value] as string[];
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source locator field "${field}" is invalid`);
}

function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireStringArray(value, field);
}

function requirePathArray(value: unknown, field: string): Array<string | number> {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => (typeof item === 'string' && item.trim()) || typeof item === 'number')
  ) {
    return [...value] as Array<string | number>;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source locator field "${field}" is invalid`);
}
