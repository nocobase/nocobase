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
export { buildRunJSOwnerFingerprint } from '@nocobase/server';
import type { RunJSSourceLocator } from './runjs-source-contracts';
import type { VscFileChange, VscRepositoryIdentity } from './types';

const unsafePathSegments = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_RUNJS_PATH_ARRAY_INDEX = 100_000;

export type {
  RunJSCompileDiagnostic,
  RunJSLanguage,
  RunJSLegacySource,
  RunJSRuntimeWriteResult,
  RunJSRuntimeArtifact,
  RunJSSourceAdapter,
  RunJSSourceAdapterContext,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
  RunJSSourceAuthoringLegacyInfo,
  RunJSSourceKind,
  RunJSSourceInitialSource,
  RunJSSourceLocator,
  RunJSSourceOpenResult,
  RunJSSourcePermissionCheck,
  RunJSSourcePermissionResult,
  RunJSSourceSaveInput,
  RunJSSourceSaveResult,
  RunJSSurfaceStyle,
} from './runjs-source-contracts';

export function normalizeRunJSSourceLocator(value: unknown): RunJSSourceLocator {
  const input = toRecord(value);
  const kind = input.kind;

  if (kind === 'flowModel.step') {
    return {
      kind,
      modelUid: requireString(input.modelUid, 'modelUid'),
      flowKey: requirePathSegment(input.flowKey, 'flowKey'),
      stepKey: requirePathSegment(input.stepKey, 'stepKey'),
      paramPath: requireStringArray(input.paramPath, 'paramPath'),
      versionPath: optionalStringArray(input.versionPath, 'versionPath'),
    };
  }

  if (kind === 'flowModel.nestedRunJS') {
    return {
      kind,
      modelUid: requireString(input.modelUid, 'modelUid'),
      containerFlowKey: requirePathSegment(input.containerFlowKey, 'containerFlowKey'),
      containerStepKey: requirePathSegment(input.containerStepKey, 'containerStepKey'),
      valuePath: requirePathArray(input.valuePath, 'valuePath'),
      scene: requireString(input.scene, 'scene'),
    };
  }

  if (kind === 'flowModel.flowRegistry.runjs') {
    return {
      kind,
      modelUid: requireString(input.modelUid, 'modelUid'),
      flowKey: requirePathSegment(input.flowKey, 'flowKey'),
      stepKey: requirePathSegment(input.stepKey, 'stepKey'),
      sourcePath: requireStringArray(input.sourcePath, 'sourcePath'),
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

  if (locator.kind === 'flowModel.flowRegistry.runjs') {
    return toTypedPathSegments([locator.flowKey, locator.stepKey, ...locator.sourcePath]);
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

function requirePathSegment(value: unknown, field: string): string {
  const segment = requireString(value, field);
  assertSafePathSegment(segment, field);
  return segment;
}

function requireStringOrNumber(value: unknown, field: string): string | number {
  if ((typeof value === 'string' && value.trim()) || isNonNegativeSafeInteger(value)) {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source locator field "${field}" is invalid`);
}

function requireStringArray(value: unknown, field: string): string[] {
  if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim())) {
    const path = [...value] as string[];
    path.forEach((segment, index) => assertSafePathSegment(segment, `${field}[${index}]`));
    return path;
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
    value.every(
      (item) =>
        (typeof item === 'string' && item.trim()) ||
        (isNonNegativeSafeInteger(item) && item <= MAX_RUNJS_PATH_ARRAY_INDEX),
    )
  ) {
    const path = [...value] as Array<string | number>;
    path.forEach((segment, index) => {
      if (typeof segment === 'string') {
        assertSafePathSegment(segment, `${field}[${index}]`);
      }
    });
    return path;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source locator field "${field}" is invalid`);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function assertSafePathSegment(segment: string, field: string): void {
  if (!unsafePathSegments.has(segment)) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source locator field "${field}" is unsafe`, {
    details: {
      field,
      segment,
    },
  });
}
