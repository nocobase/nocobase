/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { describe, expect, it } from 'vitest';

import { createRemoteSyncAuditAction, sanitizeRemoteSyncAuditMetadata } from '../audit';

describe('remote sync audit sanitizer', () => {
  it('rebuilds params, query, body, and response from explicit safe fields', async () => {
    const token = 'github_pat_012345678901234567890123456789';
    const ctx = {
      action: {
        params: {
          values: {
            remoteId: 'remote-1',
            provider: 'github',
            authRef: token,
            arbitrary: { nestedToken: token },
          },
        },
      },
      request: {
        headers: {
          'x-request-source': token,
          authorization: token,
        },
        params: {
          repoId: 'repo-1',
          token,
        },
        query: {
          operation: 'push',
          authorization: token,
          reasonCode: token,
        },
        body: {
          remoteId: 'remote-1',
          expectedLocalCommitId: 'commit-before',
          expectedRemoteRevision: 'revision-before',
          files: [{ path: 'src/index.ts', content: token }],
          source: token,
        },
      },
      body: {
        data: {
          jobId: 'job-1',
          resultLocalCommitId: 'commit-after',
          resultRemoteRevision: 'revision-after',
          contentHash: 'sha256:safe',
          result: 'succeeded',
          reasonCode: null,
          providerError: { response: token },
        },
      },
    } as unknown as Context;

    const metadata = sanitizeRemoteSyncAuditMetadata(ctx);
    expect(metadata).toMatchObject({
      remoteId: 'remote-1',
      repoId: 'repo-1',
      operation: 'push',
      jobId: 'job-1',
      resultLocalCommitId: 'commit-after',
      resultRemoteRevision: 'revision-after',
      contentHash: 'sha256:safe',
      result: 'succeeded',
      request: {
        params: { repoId: 'repo-1' },
        query: { operation: 'push' },
        body: {
          remoteId: 'remote-1',
          expectedLocalCommitId: 'commit-before',
          expectedRemoteRevision: 'revision-before',
          fileCount: 1,
        },
        headers: {},
      },
      response: {
        body: {
          jobId: 'job-1',
          resultLocalCommitId: 'commit-after',
          resultRemoteRevision: 'revision-after',
          contentHash: 'sha256:safe',
          result: 'succeeded',
          reasonCode: null,
        },
      },
    });
    expect(JSON.stringify(metadata)).not.toContain(token);
    expect(JSON.stringify(metadata)).not.toContain('src/index.ts');
    expect(JSON.stringify(metadata)).not.toContain('providerError');

    const actionOnlyMetadata = sanitizeRemoteSyncAuditMetadata({
      action: {
        params: {
          values: {
            remoteId: 'remote-from-action',
            operation: 'probe',
          },
        },
      },
      request: { params: {}, query: {}, body: {} },
    } as unknown as Context);
    expect(actionOnlyMetadata).toMatchObject({
      remoteId: 'remote-from-action',
      operation: 'probe',
      request: { body: { remoteId: 'remote-from-action', operation: 'probe' }, headers: {} },
    });

    const action = createRemoteSyncAuditAction('vscRemote:push');
    await expect(action.getMetaData(ctx)).resolves.toEqual(metadata);
  });
});
