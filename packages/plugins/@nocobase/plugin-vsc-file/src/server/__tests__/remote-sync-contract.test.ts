/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import type {
  RemoteSyncAdapter,
  VscFileConflictRecord,
  VscFileExternalCommitMapRecord,
  VscFileRemoteRecord,
  VscFileSyncJobRecord,
  VscRemoteSnapshot,
} from '../index';
import { normalizeGitHubRemoteConfig, RemoteSyncError } from '../remotes/RemoteSyncAdapter';
import { parseVscRemoteAuthRef, validateVscRemoteAuthRef } from '../remotes/credentialRef';
import { computeRemoteSnapshotContentHash } from '../remotes/snapshot';

const snapshotFiles = [
  { path: 'src/a.ts', content: 'export const a = 1;\n', language: 'typescript' },
  { path: 'README.md', content: '# Demo\n', mode: '100644' },
];

describe('remote sync contract', () => {
  it('uses a stable path-sorted, length-prefixed snapshot hash vector', () => {
    expect(computeRemoteSnapshotContentHash(snapshotFiles)).toBe(
      'sha256:a5481d179aacdc99194dfefe260975ce406299ab817485fa3546b03a048ffe22',
    );
    expect(computeRemoteSnapshotContentHash([...snapshotFiles].reverse())).toBe(
      computeRemoteSnapshotContentHash(snapshotFiles),
    );
    expect(computeRemoteSnapshotContentHash([{ ...snapshotFiles[0], path: 'src/b.ts' }, snapshotFiles[1]])).not.toBe(
      computeRemoteSnapshotContentHash(snapshotFiles),
    );
    expect(
      computeRemoteSnapshotContentHash([{ ...snapshotFiles[0], content: 'export const a = 2;\n' }, snapshotFiles[1]]),
    ).not.toBe(computeRemoteSnapshotContentHash(snapshotFiles));
    expect(computeRemoteSnapshotContentHash(snapshotFiles.map((file) => ({ ...file, language: 'text' })))).toBe(
      computeRemoteSnapshotContentHash(snapshotFiles),
    );
  });

  it('accepts only complete secret expressions', async () => {
    expect(parseVscRemoteAuthRef('{{ $env.GITHUB_SYNC }}')).toEqual({
      expression: '{{ $env.GITHUB_SYNC }}',
      name: 'GITHUB_SYNC',
    });
    await expect(
      validateVscRemoteAuthRef('{{ $env.GITHUB_SYNC }}', async (name) => ({ name, type: 'secret' })),
    ).resolves.toMatchObject({ name: 'GITHUB_SYNC' });
    await expect(
      validateVscRemoteAuthRef('{{ $env.PUBLIC_VALUE }}', async (name) => ({ name, type: 'string' })),
    ).rejects.toMatchObject({ code: 'AUTH_REF_INVALID' });
    expect(() => parseVscRemoteAuthRef('github_pat_test_direct_123')).toThrowError(RemoteSyncError);
    expect(() => parseVscRemoteAuthRef('prefix {{ $env.GITHUB_SYNC }}')).toThrowError(RemoteSyncError);
    expect(() => parseVscRemoteAuthRef('')).toThrowError(RemoteSyncError);
  });

  it('normalizes provider config from unknown and rejects extra fields', () => {
    expect(
      normalizeGitHubRemoteConfig({
        owner: 'nocobase',
        repository: 'extensions',
        branch: 'main',
      }),
    ).toEqual({ owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null });
    expect(() =>
      normalizeGitHubRemoteConfig({
        owner: 'nocobase',
        repository: 'extensions',
        branch: 'main',
        subdirectory: null,
        credential: 'unexpected',
      }),
    ).toThrowError(RemoteSyncError);
  });

  it('keeps revision null as the empty remote branch representation', () => {
    const snapshot: VscRemoteSnapshot = {
      revision: null,
      contentHash: computeRemoteSnapshotContentHash([]),
      files: [],
      metadata: {},
    };
    expect(snapshot.revision).toBeNull();
  });

  it('keeps credential values, database objects, and domain services out of adapter capabilities', () => {
    const adapter = {
      provider: 'github',
      title: 'GitHub',
      capabilities: { probe: true, fetch: true, publish: true, readOnly: false },
      normalizeConfig: normalizeGitHubRemoteConfig,
      async probe() {
        return { revision: null, metadata: {} };
      },
      async fetchSnapshot() {
        return { revision: null, contentHash: computeRemoteSnapshotContentHash([]), files: [], metadata: {} };
      },
      async publishSnapshot(_target, snapshot) {
        return { revision: 'revision-1', contentHash: snapshot.contentHash, metadata: {} };
      },
    } satisfies RemoteSyncAdapter;

    expect(adapter.provider).toBe('github');
    expect(JSON.stringify(adapter.capabilities)).not.toMatch(/credential|database|transaction/i);
  });

  it('creates safe provider errors without retaining the original error chain', () => {
    const error = new RemoteSyncError('AUTH_FAILED', 'Provider authentication failed', {
      details: { provider: 'github', reasonCode: 'authentication-failed' },
    });
    expect(error).toMatchObject({ code: 'AUTH_FAILED', status: 422 });
    expect(Object.hasOwn(error, 'cause')).toBe(false);
    expect(JSON.stringify(error.toResponseBody())).not.toMatch(/authorization|request|response|headers/i);
  });

  it('exports one safe persistence DTO contract without source content', () => {
    const remote: VscFileRemoteRecord = {
      id: 'remote-1',
      repoId: 'repo-1',
      name: 'origin',
      provider: 'github',
      config: { owner: 'nocobase', repository: 'extensions', branch: 'main', subdirectory: null },
      authRef: '{{ $env.GITHUB_SYNC }}',
      status: 'active',
      version: 1,
      lastCheckedAt: null,
      lastSyncedAt: null,
      lastErrorCode: null,
    };
    const job: VscFileSyncJobRecord = {
      id: 'job-1',
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      operation: 'push',
      status: 'pending',
      phase: 'prepared',
      idempotencyKey: 'push-1',
      planFingerprint: 'sha256:plan',
      expectedLocalCommitId: 'local-1',
      expectedRemoteRevision: null,
      resultLocalCommitId: null,
      resultRemoteRevision: null,
      contentHash: null,
      claimToken: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      attempt: 0,
      maxAttempts: 3,
      startedAt: null,
      finishedAt: null,
      lastErrorCode: null,
    };
    const mapping: VscFileExternalCommitMapRecord = {
      id: 'map-1',
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      localCommitId: 'local-1',
      remoteRevision: 'revision-1',
      contentHash: 'sha256:content',
    };
    const conflict: VscFileConflictRecord = {
      id: 'conflict-1',
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      status: 'open',
      baseLocalCommitId: 'local-1',
      baseRemoteRevision: 'revision-1',
      currentLocalCommitId: 'local-2',
      currentRemoteRevision: 'revision-2',
      localContentHash: 'sha256:local',
      remoteContentHash: 'sha256:remote',
      reasonCode: 'diverged',
    };
    const serialized = JSON.stringify({ remote, job, mapping, conflict });

    expect(serialized).not.toMatch(/accessToken|encryptedToken|"token"|sourceContent/i);
  });
});
