/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRuntimeArtifact,
  LightExtensionKind,
} from '../../shared/types';

export const LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION = 1;
export const LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID = 'esbuild-wasm-0.27.7-portable-v1';

export interface BrowserPreviewFile {
  path: string;
  content: string;
  language?: string;
}

export type BrowserPreviewFileChange =
  | { operation: 'upsert'; file: BrowserPreviewFile }
  | { operation: 'delete'; path: string }
  | { operation: 'rename'; path: string; nextPath: string; file?: BrowserPreviewFile };

export interface BrowserPreviewEntryContract {
  entryPath: string;
  kind: LightExtensionKind;
  runtimeVersion: string;
  surfaceStyle: 'render' | 'action' | 'value';
}

export interface BrowserPreviewMetrics {
  wasmDownloadMs?: number;
  wasmInitializeMs?: number;
  firstBuildMs?: number;
  warmBuildMs?: number;
  workerRestartCount: number;
  inputFileCount: number;
  inputBytes: number;
  estimatedMemoryBytes: number;
  previewFailureCode?: string;
}

export interface ProvisionalCompileResult {
  provisional: true;
  accepted: boolean;
  artifact: LightExtensionEntryRuntimeArtifact & {
    metadata: Record<string, unknown> & {
      provisional: true;
      trust: 'client-advisory';
      compilerBuildId: string;
    };
  };
  diagnostics: LightExtensionDiagnostic[];
  metafile?: Record<string, unknown>;
  metrics: BrowserPreviewMetrics;
}

interface BrowserPreviewRequestBase {
  protocolVersion: number;
  requestId: string;
}

export type BrowserPreviewWorkerRequest =
  | (BrowserPreviewRequestBase & { type: 'initialize'; wasmURL: string })
  | (BrowserPreviewRequestBase & {
      type: 'replaceWorkspace';
      workspaceVersion: number;
      files: BrowserPreviewFile[];
    })
  | (BrowserPreviewRequestBase & {
      type: 'applyDelta';
      workspaceVersion: number;
      changes: BrowserPreviewFileChange[];
    })
  | (BrowserPreviewRequestBase & {
      type: 'build';
      workspaceVersion: number;
      entry: BrowserPreviewEntryContract;
    })
  | (BrowserPreviewRequestBase & { type: 'cancel'; targetRequestId: string })
  | (BrowserPreviewRequestBase & { type: 'dispose' });

interface BrowserPreviewResponseBase {
  protocolVersion: number;
  requestId: string;
}

export type BrowserPreviewWorkerResponse =
  | (BrowserPreviewResponseBase & {
      type: 'ready';
      initializationMs: number;
      metrics: Pick<BrowserPreviewMetrics, 'wasmDownloadMs' | 'wasmInitializeMs'>;
    })
  | (BrowserPreviewResponseBase & { type: 'workspaceUpdated'; workspaceVersion: number })
  | (BrowserPreviewResponseBase & {
      type: 'buildResult';
      workspaceVersion: number;
      result: ProvisionalCompileResult;
    })
  | (BrowserPreviewResponseBase & { type: 'cancelled'; targetRequestId: string })
  | (BrowserPreviewResponseBase & { type: 'disposed' })
  | (BrowserPreviewResponseBase & {
      type: 'error';
      code: BrowserPreviewFailureCode;
      message: string;
      recoverable: boolean;
      workspaceVersion?: number;
    });

export type BrowserPreviewFailureCode =
  | 'PREVIEW_PROTOCOL_MISMATCH'
  | 'PREVIEW_WASM_FETCH_FAILED'
  | 'PREVIEW_WASM_MIME_INVALID'
  | 'PREVIEW_WASM_COMPILE_FAILED'
  | 'PREVIEW_WASM_INITIALIZE_FAILED'
  | 'PREVIEW_WORKER_UNAVAILABLE'
  | 'PREVIEW_WORKER_CRASHED'
  | 'PREVIEW_WORKSPACE_VERSION_INVALID'
  | 'PREVIEW_BUILD_FAILED'
  | 'PREVIEW_CANCELLED';

export function isBrowserPreviewWorkerResponse(value: unknown): value is BrowserPreviewWorkerResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const message = value as Partial<BrowserPreviewWorkerResponse>;
  return (
    message.protocolVersion === LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION &&
    typeof message.requestId === 'string' &&
    typeof message.type === 'string'
  );
}
