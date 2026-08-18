/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { RemoteSyncError } from '../remotes/RemoteSyncAdapter';
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

  it('creates safe provider errors without retaining the original error chain', () => {
    const error = new RemoteSyncError('AUTH_FAILED', 'Provider authentication failed', {
      details: { provider: 'git', reasonCode: 'authentication-failed' },
    });
    expect(error).toMatchObject({ code: 'AUTH_FAILED', status: 422 });
    expect(Object.hasOwn(error, 'cause')).toBe(false);
    expect(JSON.stringify(error.toResponseBody())).not.toMatch(/authorization|request|response|headers/i);
  });
});
