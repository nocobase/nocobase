/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import type { VscRemoteSnapshot } from '../../../shared/remote-sync-types';
import { RemoteSyncError } from '../RemoteSyncAdapter';
import { computeRemoteSnapshotContentHash } from '../snapshot';
import { DeterministicRemoteAdapter } from '../testing/DeterministicRemoteAdapter';

const target = {
  config: {
    owner: 'nocobase',
    repository: 'nocobase',
    branch: 'main',
    subdirectory: null,
  },
  authRef: '{{ $env.GITHUB_SYNC_SECRET }}',
};

function createSnapshot(path: string, content: string): VscRemoteSnapshot {
  const files = [{ path, content }];
  return {
    revision: null,
    contentHash: computeRemoteSnapshotContentHash(files),
    files,
    metadata: { source: 'test' },
  };
}

describe('DeterministicRemoteAdapter', () => {
  it('produces the same initial snapshot and revision for the same input', async () => {
    const options = {
      initialFiles: [{ path: 'index.ts', content: 'export const value = 1;\n' }],
      initialMetadata: { branch: 'main' },
    };
    const first = new DeterministicRemoteAdapter(options);
    const second = new DeterministicRemoteAdapter(options);

    expect(await first.fetchSnapshot(target)).toEqual(await second.fetchSnapshot(target));
    expect(await first.probe(target)).toEqual(await second.probe(target));
  });

  it('rejects a non-empty initial snapshot without a revision', () => {
    expect(
      () =>
        new DeterministicRemoteAdapter({
          initialFiles: [{ path: 'index.ts', content: 'content\n' }],
          initialRevision: null,
        }),
    ).toThrowError(
      expect.objectContaining({
        code: 'CONFIG_INVALID',
        details: expect.objectContaining({ reasonCode: 'non-empty-snapshot-without-revision' }),
      }),
    );
  });

  it('returns detached snapshots and performs no-op publish without advancing revision', async () => {
    const adapter = new DeterministicRemoteAdapter({
      initialFiles: [{ path: 'index.ts', content: 'export const value = 1;\n' }],
    });
    const first = await adapter.fetchSnapshot(target);
    first.files[0].content = 'mutated caller copy';
    const current = await adapter.fetchSnapshot(target);
    const result = await adapter.publishSnapshot(target, current, current.revision);

    expect((await adapter.fetchSnapshot(target)).files[0].content).toBe('export const value = 1;\n');
    expect(result.revision).toBe(current.revision);
    expect(adapter.getPublishCount()).toBe(0);
  });

  it('publishes with compare-and-set and rejects stale revisions without force semantics', async () => {
    const adapter = new DeterministicRemoteAdapter();
    const published = await adapter.publishSnapshot(target, createSnapshot('index.ts', 'first\n'), null);

    expect(published.revision).toMatch(/^deterministic:1:/u);
    expect(adapter.getPublishCount()).toBe(1);
    await expect(adapter.publishSnapshot(target, createSnapshot('index.ts', 'stale\n'), null)).rejects.toMatchObject({
      code: 'REMOTE_CHANGED',
      details: {
        expectedRemoteRevision: null,
        currentRemoteRevision: published.revision,
      },
    });
    expect((await adapter.fetchSnapshot(target)).contentHash).toBe(published.contentHash);
  });

  it('supports deterministic external remote advances and CAS conflicts', async () => {
    const adapter = new DeterministicRemoteAdapter({
      initialFiles: [{ path: 'index.ts', content: 'base\n' }],
    });
    const beforeAdvance = await adapter.fetchSnapshot(target);
    const advanced = adapter.advanceRemote([{ path: 'index.ts', content: 'remote advance\n' }], {
      actor: 'external',
    });

    expect(advanced.revision).not.toBe(beforeAdvance.revision);
    expect(advanced.metadata).toEqual({ actor: 'external' });
    await expect(
      adapter.publishSnapshot(target, createSnapshot('index.ts', 'local publish\n'), beforeAdvance.revision),
    ).rejects.toMatchObject({ code: 'REMOTE_CHANGED' });
  });

  it('enforces read-only capability at publish time', async () => {
    const adapter = new DeterministicRemoteAdapter({ readOnly: true });

    expect(adapter.capabilities).toMatchObject({ publish: false, readOnly: true });
    await expect(adapter.publishSnapshot(target, createSnapshot('index.ts', 'content\n'), null)).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      details: { reasonCode: 'read-only' },
    });
  });

  it('supports persistent and one-shot safe provider errors', async () => {
    const adapter = new DeterministicRemoteAdapter();
    const unavailable = new RemoteSyncError('REMOTE_UNAVAILABLE', 'deterministic unavailable');
    adapter.setFailure('fetch', unavailable);

    await expect(adapter.fetchSnapshot(target)).rejects.toBe(unavailable);
    await expect(adapter.fetchSnapshot(target)).rejects.toBe(unavailable);

    adapter.setFailure('fetch', null);
    const rateLimited = new RemoteSyncError('RATE_LIMITED', 'deterministic rate limited');
    adapter.failNext('probe', rateLimited);
    await expect(adapter.probe(target)).rejects.toBe(rateLimited);
    await expect(adapter.probe(target)).resolves.toMatchObject({ revision: null });
  });

  it('keeps remote success observable when caller finalization fails', async () => {
    const adapter = new DeterministicRemoteAdapter();
    const published = await adapter.publishSnapshot(target, createSnapshot('index.ts', 'remote succeeded\n'), null);

    const finalize = async () => {
      throw new Error('local finalize failed');
    };
    await expect(finalize()).rejects.toThrow('local finalize failed');

    await expect(adapter.fetchSnapshot(target)).resolves.toMatchObject({
      revision: published.revision,
      contentHash: published.contentHash,
      files: [{ path: 'index.ts', content: 'remote succeeded\n' }],
    });
    expect(adapter.getPublishCount()).toBe(1);
  });

  it('rejects unknown config fields before every operation', async () => {
    const adapter = new DeterministicRemoteAdapter();
    const unsafeTarget = {
      ...target,
      config: { ...target.config, accessToken: 'raw-secret' },
    };

    await expect(adapter.probe(unsafeTarget)).rejects.toMatchObject({ code: 'CONFIG_INVALID' });
    await expect(adapter.fetchSnapshot(unsafeTarget)).rejects.toMatchObject({ code: 'CONFIG_INVALID' });
  });
});
