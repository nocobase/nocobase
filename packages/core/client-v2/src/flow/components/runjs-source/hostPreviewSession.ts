/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSExecutionMetadataValue,
  RunJSRuntimeReporter,
  RunJSRuntimeReportingOptions,
} from '@nocobase/flow-engine';
import { parseRunJSLineMapV1 } from '@nocobase/runjs/compiler/line-map';

export const RUNJS_HOST_PREVIEW_SOURCE_REF_TYPE = 'runjs-host-preview' as const;
export const RUNJS_HOST_PREVIEW_SOURCE_REF_VERSION = 1 as const;

export interface RunJSHostPreviewSourceRef extends Record<string, unknown> {
  type: typeof RUNJS_HOST_PREVIEW_SOURCE_REF_TYPE;
  version: typeof RUNJS_HOST_PREVIEW_SOURCE_REF_VERSION;
  previewSessionId: string;
  executionId: string;
  artifactHash: string;
  snapshotId: string;
  sourceURL: string;
  sourceMap: string;
  metadata?: Readonly<Record<string, RunJSExecutionMetadataValue>>;
}

export interface CreateRunJSHostPreviewSessionInput {
  artifactHash: string;
  snapshotId: string;
  sourceMap: string;
  metadata?: Readonly<Record<string, RunJSExecutionMetadataValue>>;
  reporter: RunJSRuntimeReporter;
}

export interface RunJSHostPreviewSession {
  sourceRef: RunJSHostPreviewSourceRef;
  close(): void;
}

interface RegisteredRunJSHostPreviewSession {
  sourceRefSignature: string;
  reporting: RunJSRuntimeReportingOptions;
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const sessions = new Map<string, RegisteredRunJSHostPreviewSession>();
let fallbackIdSequence = 0;

export function createRunJSHostPreviewSession(input: CreateRunJSHostPreviewSessionInput): RunJSHostPreviewSession {
  const lineMap = parseRunJSLineMapV1(input.sourceMap);
  if (!lineMap) {
    throw new Error('RunJS host preview requires a valid source map');
  }
  if (!sha256Pattern.test(input.artifactHash)) {
    throw new Error('RunJS host preview requires a valid artifact hash');
  }
  if (!input.snapshotId) {
    throw new Error('RunJS host preview requires a workspace snapshot');
  }

  const previewSessionId = createSessionId('preview');
  const executionId = createSessionId('execution');
  const sourceRef: RunJSHostPreviewSourceRef = {
    type: RUNJS_HOST_PREVIEW_SOURCE_REF_TYPE,
    version: RUNJS_HOST_PREVIEW_SOURCE_REF_VERSION,
    previewSessionId,
    executionId,
    artifactHash: input.artifactHash,
    snapshotId: input.snapshotId,
    sourceURL: lineMap.sourceURL,
    sourceMap: input.sourceMap,
    ...(input.metadata ? { metadata: { ...input.metadata } } : {}),
  };
  const sourceRefSignature = stableSerialize(sourceRef);
  const registration: RegisteredRunJSHostPreviewSession = {
    sourceRefSignature,
    reporting: {
      identity: {
        executionId,
        artifactHash: input.artifactHash,
        sourceURL: lineMap.sourceURL,
        metadata: {
          previewSessionId,
          snapshotId: input.snapshotId,
          ...(input.metadata || {}),
        },
      },
      reporter: input.reporter,
    },
  };
  sessions.set(previewSessionId, registration);

  return {
    sourceRef,
    close() {
      if (sessions.get(previewSessionId) === registration) {
        sessions.delete(previewSessionId);
      }
    },
  };
}

export function resolveRunJSHostPreviewReporting(sourceRef: unknown): RunJSRuntimeReportingOptions | undefined {
  if (!isRunJSHostPreviewSourceRef(sourceRef)) {
    return undefined;
  }
  const registration = sessions.get(sourceRef.previewSessionId);
  if (!registration || registration.sourceRefSignature !== stableSerialize(sourceRef)) {
    return undefined;
  }
  return registration.reporting;
}

export function isRunJSHostPreviewSourceRef(value: unknown): value is RunJSHostPreviewSourceRef {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.type === RUNJS_HOST_PREVIEW_SOURCE_REF_TYPE &&
    value.version === RUNJS_HOST_PREVIEW_SOURCE_REF_VERSION &&
    isNonEmptyString(value.previewSessionId) &&
    isNonEmptyString(value.executionId) &&
    sha256Pattern.test(typeof value.artifactHash === 'string' ? value.artifactHash : '') &&
    isNonEmptyString(value.snapshotId) &&
    isNonEmptyString(value.sourceURL) &&
    typeof value.sourceMap === 'string' &&
    (!('metadata' in value) || typeof value.metadata === 'undefined' || isMetadata(value.metadata))
  );
}

export function getActiveRunJSHostPreviewSessionCount(): number {
  return sessions.size;
}

function createSessionId(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}:${cryptoApi.randomUUID()}`;
  }
  fallbackIdSequence += 1;
  return `${prefix}:${Date.now().toString(36)}:${fallbackIdSequence.toString(36)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function isMetadata(value: unknown): value is Readonly<Record<string, RunJSExecutionMetadataValue>> {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item));
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}
