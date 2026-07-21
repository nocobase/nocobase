/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionProblem } from '../../shared/problems';
import type { LightExtensionPreviewProblemSessionResult } from '../../shared/types';
import {
  LightExtensionPreviewProblemClient,
  openLightExtensionPreviewProblemSession,
} from '../problems/previewProblemClient';

describe('LightExtensionPreviewProblemClient', () => {
  it('uses only the scoped resource actions and carries server-issued session identity', async () => {
    const requests: Array<{ url: string; method: string; data: unknown; skipNotify?: boolean }> = [];
    const result = createResult();
    const api = {
      request: vi.fn(async (options: { url: string; method: string; data: unknown; skipNotify?: boolean }) => {
        requests.push(options);
        const state = options.url.endsWith(':close') ? 'stale' : 'active';
        return { data: { data: { ...result, state } } };
      }),
    };
    const client = new LightExtensionPreviewProblemClient(api);
    const session = await openLightExtensionPreviewProblemSession(client, {
      repoId: result.repoId,
      entryId: result.entryId,
      ownerLocator: result.ownerLocator,
      snapshotId: result.snapshotId,
      artifactHash: result.artifactHash,
    });
    const problem = createLightExtensionProblem({
      phase: 'api',
      source: 'api',
      severity: 'error',
      code: 'api_failed',
      message: 'failed',
      snapshotId: result.snapshotId,
      requestId: result.executionId,
      details: { method: 'POST', resource: 'posts', action: 'list', status: 403 },
    });

    await session.append([problem]);
    await session.close('stale');

    expect(requests.map((request) => request.url)).toEqual([
      'lightExtensionPreviewProblems:open',
      'lightExtensionPreviewProblems:append',
      'lightExtensionPreviewProblems:close',
    ]);
    expect(requests.every((request) => request.method === 'post' && request.skipNotify === true)).toBe(true);
    expect(requests[1].data).toMatchObject({
      sessionId: result.sessionId,
      executionId: result.executionId,
      problems: [{ code: 'api_failed' }],
    });
    expect(requests[2].data).toMatchObject({ state: 'stale' });
  });

  it('stops appending after the session has been closed', async () => {
    const result = createResult();
    const api = {
      request: vi.fn(async (options: { url: string }) => ({
        data: { data: { ...result, state: options.url.endsWith(':close') ? 'completed' : 'active' } },
      })),
    };
    const client = new LightExtensionPreviewProblemClient(api as never);
    const session = await openLightExtensionPreviewProblemSession(client, {
      repoId: result.repoId,
      entryId: result.entryId,
      ownerLocator: result.ownerLocator,
      snapshotId: result.snapshotId,
      artifactHash: result.artifactHash,
    });

    await session.close('completed');
    await session.append([]);

    expect(api.request).toHaveBeenCalledTimes(2);
  });
});

function createResult(): LightExtensionPreviewProblemSessionResult {
  return {
    schemaVersion: 1,
    sessionId: 'preview:server',
    repoId: 'repo_1',
    entryId: 'entry_1',
    ownerLocator: {
      kind: 'flowModel.pageSettings',
      modelUid: 'page_1',
      use: 'JSPageModel',
      stepPath: ['stepParams', 'jsSettings', 'runJs'],
    },
    snapshotId: 'snapshot_1',
    artifactHash: 'a'.repeat(64),
    executionId: 'execution:server',
    state: 'active',
    cursor: 0,
    nextCursor: 0,
    expiresAt: '2026-07-21T00:02:00.000Z',
    droppedCount: 0,
    items: [],
  };
}
