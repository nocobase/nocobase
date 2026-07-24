/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TypeScriptWorkerRuntime } from './typescriptWorkerRuntime';
import {
  createTypeScriptWorkerProtocolMismatchResponse,
  isTypeScriptWorkerProtocolMessage,
  RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
  type TypeScriptWorkerIncomingMessage,
  type TypeScriptWorkerLoadPackRequest,
  type TypeScriptWorkerLoadPackResponse,
  type TypeScriptWorkerOutgoingMessage,
  type TypeScriptWorkerRequest,
  type TypeScriptWorkerResponse,
} from './typescriptWorkerProtocol';

const runtime = new TypeScriptWorkerRuntime();
const pendingPackLoads = new Map<
  number,
  { reject: (error: Error) => void; resolve: (pack: NonNullable<TypeScriptWorkerLoadPackResponse['pack']>) => void }
>();
let bridgeRequestId = 0;

function post(message: TypeScriptWorkerOutgoingMessage): void {
  self.postMessage(message);
}

function loadPack(projectId: string, documentVersion: number) {
  return async (request: TypeScriptWorkerLoadPackRequest['request']) => {
    const nextBridgeRequestId = ++bridgeRequestId;
    const promise = new Promise<NonNullable<TypeScriptWorkerLoadPackResponse['pack']>>((resolve, reject) => {
      pendingPackLoads.set(nextBridgeRequestId, { reject, resolve });
    });
    post({
      bridgeRequestId: nextBridgeRequestId,
      documentVersion,
      kind: 'load-pack',
      projectId,
      protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
      request,
    });
    return await promise;
  };
}

function responseFor(
  request: TypeScriptWorkerRequest,
  response: Omit<TypeScriptWorkerResponse, keyof TypeScriptWorkerRequest>,
): TypeScriptWorkerResponse {
  return {
    ...response,
    documentVersion: request.documentVersion,
    projectId: request.projectId,
    protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
    requestId: request.requestId,
  } as TypeScriptWorkerResponse;
}

async function handleRequest(request: TypeScriptWorkerRequest): Promise<void> {
  try {
    switch (request.kind) {
      case 'sync':
        if (request.snapshot) {
          runtime.sync(
            request.projectId,
            request.documentVersion,
            request.targetRevision,
            request.snapshot,
            loadPack(request.projectId, request.documentVersion),
          );
        } else if (request.update) {
          runtime.update(
            request.projectId,
            request.documentVersion,
            request.baseRevision as number,
            request.targetRevision,
            request.update,
            loadPack(request.projectId, request.documentVersion),
          );
        } else {
          throw new Error('TypeScript worker sync request contains no snapshot or update.');
        }
        post(responseFor(request, { kind: 'synced', result: null }));
        return;
      case 'completion':
        post(
          responseFor(request, {
            kind: 'completion-result',
            result: await runtime.completion(request.projectId, request.documentVersion, request.position),
          }),
        );
        return;
      case 'diagnostics':
        post(
          responseFor(request, {
            kind: 'diagnostics-result',
            result: await runtime.diagnostics(request.projectId, request.documentVersion),
          }),
        );
        return;
      case 'hover':
        post(
          responseFor(request, {
            kind: 'hover-result',
            result: await runtime.hover(request.projectId, request.documentVersion, request.position),
          }),
        );
        return;
      case 'debug':
        post(responseFor(request, { kind: 'debug-result', result: runtime.debug(request.projectId) }));
        return;
      case 'dispose':
        runtime.dispose(request.projectId);
        post(responseFor(request, { kind: 'disposed', result: null }));
        return;
    }
  } catch (error: unknown) {
    post(
      responseFor(request, {
        error: error instanceof Error ? error.message : String(error),
        kind: 'error',
      }),
    );
  }
}

self.addEventListener('message', (event: MessageEvent<TypeScriptWorkerIncomingMessage>) => {
  const message = event.data;
  if (!isTypeScriptWorkerProtocolMessage(message)) {
    const response = createTypeScriptWorkerProtocolMismatchResponse(message);
    if (response) self.postMessage(response);
    return;
  }
  if (message.kind === 'load-pack-result') {
    const pending = pendingPackLoads.get(message.bridgeRequestId);
    if (!pending) return;
    pendingPackLoads.delete(message.bridgeRequestId);
    if (message.error || !message.pack)
      pending.reject(new Error(message.error || 'TypeScript pack loader returned no pack.'));
    else pending.resolve(message.pack);
    return;
  }
  handleRequest(message);
});

self.addEventListener('close', () => {
  runtime.disposeAll();
  for (const pending of pendingPackLoads.values()) pending.reject(new Error('TypeScript worker closed.'));
  pendingPackLoads.clear();
});
