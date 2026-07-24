/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSTypeLibraryPack,
  RunJSTypeLibraryRequest,
  RunJSTypeLibraryUsageDefinition,
} from '@nocobase/runjs/client-v2';

export const RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION = 2 as const;
export const RUNJS_TYPESCRIPT_WORKER_REVISION_MISMATCH = 'RUNJS_TYPESCRIPT_WORKER_REVISION_MISMATCH';

export type TypeScriptWorkerOperation = 'completion' | 'diagnostics' | 'hover';

export interface TypeScriptWorkerFile {
  content: string;
  path: string;
}

export interface TypeScriptWorkerProjectSnapshot {
  compilerOptions?: Record<string, unknown>;
  currentFilePath: string;
  declarationFiles: TypeScriptWorkerFile[];
  files: TypeScriptWorkerFile[];
  registryKey: string;
  runJSContext?: {
    globalContextType?: string;
    modelUse?: string;
  };
  typeLibraryIds: string[];
  typeLibraryUsageDefinitions: RunJSTypeLibraryUsageDefinition[];
  rewriteBuiltInAutoImports?: boolean;
}

export interface TypeScriptWorkerProjectUpdate
  extends Omit<TypeScriptWorkerProjectSnapshot, 'declarationFiles' | 'files'> {
  declarationFileRemovals: string[];
  declarationFileUpserts: TypeScriptWorkerFile[];
  fileRemovals: string[];
  fileUpserts: TypeScriptWorkerFile[];
}

export interface TypeScriptWorkerCompletionChange {
  from: number;
  insert: string;
  to: number;
}

export interface TypeScriptWorkerCompletionEntry {
  boost: number;
  changes: TypeScriptWorkerCompletionChange[];
  detail: string;
  info: string;
  label: string;
  unavailable?: boolean;
  type: string;
}

export interface TypeScriptWorkerCompletionResult {
  from: number;
  options: TypeScriptWorkerCompletionEntry[];
  to: number;
}

export interface TypeScriptWorkerDiagnostic {
  code: number;
  from: number;
  message: string;
  severity: 'error' | 'info' | 'warning';
  source: 'TypeScript';
  to: number;
}

export interface TypeScriptWorkerQuickInfo {
  detail: string;
  from: number;
  message: string;
  to: number;
}

export interface TypeScriptWorkerDebugState {
  actualLoadIds: string[];
  allFileNames: string[];
  cacheHitIds: string[];
  dependencyFileCount: number;
  disposed: boolean;
  fileVersions: Record<string, string>;
  immutableFileCount: number;
  immutableCacheCharacterCount: number;
  immutableSnapshotCreationCount: number;
  languageServiceCreationCount: number;
  packRequestIds: string[];
  peakDeclarationCharacterCount: number;
  programSourceFileCount: number;
  rootFileNames: string[];
  structureKey?: string;
}

type RequestBase = {
  documentVersion: number;
  projectId: string;
  protocolVersion: typeof RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION;
  requestId: number;
};

export type TypeScriptWorkerRequest =
  | (RequestBase & {
      baseRevision: number | null;
      kind: 'sync';
      snapshot?: TypeScriptWorkerProjectSnapshot;
      targetRevision: number;
      update?: TypeScriptWorkerProjectUpdate;
    })
  | (RequestBase & { explicit: boolean; kind: 'completion'; position: number })
  | (RequestBase & { kind: 'diagnostics' })
  | (RequestBase & { kind: 'hover'; position: number })
  | (RequestBase & { kind: 'debug' })
  | (RequestBase & { kind: 'dispose' });

export type TypeScriptWorkerResponse = RequestBase &
  (
    | { kind: 'synced'; result: null }
    | { kind: 'completion-result'; result: TypeScriptWorkerCompletionResult | null }
    | { kind: 'diagnostics-result'; result: TypeScriptWorkerDiagnostic[] }
    | { kind: 'hover-result'; result: TypeScriptWorkerQuickInfo | null }
    | { kind: 'debug-result'; result: TypeScriptWorkerDebugState }
    | { kind: 'disposed'; result: null }
    | { error: string; kind: 'error' }
  );

export interface TypeScriptWorkerLoadPackRequest {
  bridgeRequestId: number;
  documentVersion: number;
  kind: 'load-pack';
  projectId: string;
  protocolVersion: typeof RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION;
  request: RunJSTypeLibraryRequest;
}

export interface TypeScriptWorkerLoadPackResponse {
  bridgeRequestId: number;
  error?: string;
  kind: 'load-pack-result';
  pack?: RunJSTypeLibraryPack;
  projectId: string;
  protocolVersion: typeof RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION;
}

export type TypeScriptWorkerIncomingMessage = TypeScriptWorkerRequest | TypeScriptWorkerLoadPackResponse;
export type TypeScriptWorkerOutgoingMessage = TypeScriptWorkerResponse | TypeScriptWorkerLoadPackRequest;

export function getTypeScriptWorkerProtocolVersion(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || !('protocolVersion' in value)) return null;
  const version = (value as { protocolVersion?: unknown }).protocolVersion;
  return typeof version === 'number' ? version : null;
}

export function isTypeScriptWorkerProtocolMessage(value: unknown): value is { protocolVersion: number } {
  return getTypeScriptWorkerProtocolVersion(value) === RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION;
}

export function createTypeScriptWorkerProtocolMismatchResponse(value: unknown): Record<string, unknown> | null {
  const protocolVersion = getTypeScriptWorkerProtocolVersion(value);
  if (
    protocolVersion === null ||
    typeof value !== 'object' ||
    value === null ||
    !('requestId' in value) ||
    !('documentVersion' in value) ||
    !('projectId' in value)
  ) {
    return null;
  }
  return {
    documentVersion: value.documentVersion,
    error: `RunJS TypeScript worker protocol mismatch: client=${protocolVersion}, worker=${RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION}`,
    kind: 'error',
    projectId: value.projectId,
    protocolVersion,
    requestId: value.requestId,
  };
}
