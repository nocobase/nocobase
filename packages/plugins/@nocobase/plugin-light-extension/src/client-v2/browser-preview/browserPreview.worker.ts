/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BrowserPreviewCompilerError, BrowserProvisionalCompiler } from './browserProvisionalCompiler';
import {
  LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
  type BrowserPreviewFailureCode,
  type BrowserPreviewWorkerRequest,
  type BrowserPreviewWorkerResponse,
} from './protocol';
import { BrowserPreviewVirtualFileSystem } from './virtualFileSystem';

const compiler = new BrowserProvisionalCompiler();
const vfs = new BrowserPreviewVirtualFileSystem();
const cancelledRequests = new Set<string>();
const workerRestartCount = 0;

function post(message: BrowserPreviewWorkerResponse): void {
  self.postMessage(message);
}

function responseBase(request: BrowserPreviewWorkerRequest) {
  return {
    protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
    requestId: request.requestId,
  };
}

async function handleRequest(request: BrowserPreviewWorkerRequest): Promise<void> {
  if (request.protocolVersion !== LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION) {
    postError(request, 'PREVIEW_PROTOCOL_MISMATCH', 'Provisional preview protocol version mismatch', false);
    return;
  }

  try {
    switch (request.type) {
      case 'initialize': {
        const startedAt = performance.now();
        const metrics = await compiler.initialize(request.wasmURL);
        post({ ...responseBase(request), type: 'ready', initializationMs: performance.now() - startedAt, metrics });
        return;
      }
      case 'replaceWorkspace':
        vfs.replace(request.workspaceVersion, request.files);
        post({ ...responseBase(request), type: 'workspaceUpdated', workspaceVersion: request.workspaceVersion });
        return;
      case 'applyDelta':
        vfs.applyDelta(request.workspaceVersion, request.changes);
        post({ ...responseBase(request), type: 'workspaceUpdated', workspaceVersion: request.workspaceVersion });
        return;
      case 'build': {
        const result = await compiler.build(
          vfs,
          request.entry,
          workerRestartCount,
          request.requestId,
          `browser-preview:${request.workspaceVersion}`,
        );
        if (cancelledRequests.delete(request.requestId)) {
          postError(
            request,
            'PREVIEW_CANCELLED',
            'Provisional preview build was cancelled',
            true,
            request.workspaceVersion,
          );
          return;
        }
        post({
          ...responseBase(request),
          type: 'buildResult',
          workspaceVersion: request.workspaceVersion,
          result,
        });
        return;
      }
      case 'cancel':
        cancelledRequests.add(request.targetRequestId);
        post({ ...responseBase(request), type: 'cancelled', targetRequestId: request.targetRequestId });
        return;
      case 'dispose':
        compiler.dispose();
        vfs.clear();
        cancelledRequests.clear();
        post({ ...responseBase(request), type: 'disposed' });
        return;
    }
  } catch (error) {
    const compilerError = error instanceof BrowserPreviewCompilerError ? error : null;
    postError(
      request,
      compilerError?.code || inferFailureCode(error),
      error instanceof Error ? error.message : String(error),
      compilerError?.recoverable ?? true,
      'workspaceVersion' in request ? request.workspaceVersion : undefined,
    );
  }
}

function postError(
  request: BrowserPreviewWorkerRequest,
  code: BrowserPreviewFailureCode,
  message: string,
  recoverable: boolean,
  workspaceVersion?: number,
): void {
  post({ ...responseBase(request), type: 'error', code, message, recoverable, workspaceVersion });
}

function inferFailureCode(error: unknown): BrowserPreviewFailureCode {
  if (error instanceof Error && error.message.includes('Workspace version')) {
    return 'PREVIEW_WORKSPACE_VERSION_INVALID';
  }
  return 'PREVIEW_BUILD_FAILED';
}

self.addEventListener('message', (event: MessageEvent<BrowserPreviewWorkerRequest>) => {
  handleRequest(event.data);
});

self.addEventListener('close', () => {
  compiler.dispose();
  vfs.clear();
  cancelledRequests.clear();
});
