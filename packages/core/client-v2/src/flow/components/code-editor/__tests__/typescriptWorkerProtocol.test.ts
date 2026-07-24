/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { TypeScriptWorkerRuntime } from '../typescriptWorkerRuntime';
import {
  createTypeScriptWorkerProtocolMismatchResponse,
  getTypeScriptWorkerProtocolVersion,
  isTypeScriptWorkerProtocolMessage,
  RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
  RUNJS_TYPESCRIPT_WORKER_REVISION_MISMATCH,
  type TypeScriptWorkerProjectSnapshot,
} from '../typescriptWorkerProtocol';

const snapshot: TypeScriptWorkerProjectSnapshot = {
  currentFilePath: 'main.ts',
  declarationFiles: [],
  files: [{ content: 'export const value = 1;', path: 'main.ts' }],
  registryKey: 'registry:1',
  typeLibraryIds: [],
  typeLibraryUsageDefinitions: [],
};

describe('TypeScript worker protocol', () => {
  it('rejects a new-client request in an old worker before applying project data', () => {
    const oldWorkerVersion = RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION - 1;
    const message = {
      documentVersion: 1,
      kind: 'sync',
      projectId: 'project-a',
      protocolVersion: oldWorkerVersion,
      requestId: 7,
    };

    expect(isTypeScriptWorkerProtocolMessage(message)).toBe(false);
    expect(getTypeScriptWorkerProtocolVersion(message)).toBe(oldWorkerVersion);
  });

  it('returns an old-client-readable error from a new worker', () => {
    const oldClientVersion = RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION - 1;
    expect(
      createTypeScriptWorkerProtocolMismatchResponse({
        documentVersion: 3,
        kind: 'sync',
        projectId: 'project-a',
        protocolVersion: oldClientVersion,
        requestId: 9,
      }),
    ).toEqual({
      documentVersion: 3,
      error: `RunJS TypeScript worker protocol mismatch: client=${oldClientVersion}, worker=${RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION}`,
      kind: 'error',
      projectId: 'project-a',
      protocolVersion: oldClientVersion,
      requestId: 9,
    });
  });

  it('rejects a delta whose base revision is not acknowledged', () => {
    const runtime = new TypeScriptWorkerRuntime();
    const loadPack = async () => {
      throw new Error('No type packs expected.');
    };
    runtime.sync('project-a', 1, 1, snapshot, loadPack);

    expect(() =>
      runtime.update(
        'project-a',
        2,
        0,
        2,
        {
          currentFilePath: 'main.ts',
          declarationFileRemovals: [],
          declarationFileUpserts: [],
          fileRemovals: [],
          fileUpserts: [{ content: 'export const value = 2;', path: 'main.ts' }],
          registryKey: 'registry:1',
          typeLibraryIds: [],
          typeLibraryUsageDefinitions: [],
        },
        loadPack,
      ),
    ).toThrow(RUNJS_TYPESCRIPT_WORKER_REVISION_MISMATCH);
    expect(runtime.debug('project-a').fileVersions).toEqual({});
  });
});
