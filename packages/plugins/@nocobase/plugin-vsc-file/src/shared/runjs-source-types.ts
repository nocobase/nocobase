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
import type { VscRepositoryIdentity, VscTreeEntryInput } from './types';

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
      kind: 'flowModel.flowRegistry.runjs';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      sourcePath: string[];
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

export type RunJSSurfaceStyle = 'render' | 'action' | 'value' | 'workflow' | 'chartOption' | 'chartEvents';

export interface RunJSSourceAdapterContext {
  userId?: string | null;
  request?: Record<string, unknown>;
  transaction?: unknown;
}

export interface RunJSLegacySourceSnapshot {
  label?: string;
  code?: string;
  version?: string;
  files?: VscTreeEntryInput[];
  entry?: string;
  ownerFingerprint?: string;
  surfaceStyle?: RunJSSurfaceStyle;
  metadata?: Record<string, unknown>;
}

export interface RunJSPublishedArtifact {
  code: string;
  version?: string;
  files?: VscTreeEntryInput[];
  entry?: string;
  artifactHash?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSSourceAdapter {
  kind: RunJSSourceKind;
  readLegacy: (
    locator: RunJSSourceLocator,
    ctx: RunJSSourceAdapterContext,
  ) => Promise<RunJSLegacySourceSnapshot> | RunJSLegacySourceSnapshot;
  writePublished?: (
    locator: RunJSSourceLocator,
    artifact: RunJSPublishedArtifact,
    ctx: RunJSSourceAdapterContext,
  ) => Promise<void> | void;
}

export interface RunJSSourceOpenResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repositoryIdentity: VscRepositoryIdentity;
  legacy: RunJSLegacySourceSnapshot;
  ownerFingerprint: string | null;
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

  if (kind === 'flowModel.flowRegistry.runjs') {
    return {
      kind,
      modelUid: requireString(input.modelUid, 'modelUid'),
      flowKey: requireString(input.flowKey, 'flowKey'),
      stepKey: requireString(input.stepKey, 'stepKey'),
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
