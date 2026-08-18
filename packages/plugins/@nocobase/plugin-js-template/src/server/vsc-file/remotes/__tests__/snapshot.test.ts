/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { RemoteSyncError } from '../RemoteSyncAdapter';
import { computeRemoteSnapshotContentHash, normalizeRemoteSnapshotFiles } from '../snapshot';

function captureError(callback: () => unknown): RemoteSyncError {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(RemoteSyncError);
    return error as RemoteSyncError;
  }
  throw new Error('Expected callback to throw RemoteSyncError');
}

describe('remote snapshot normalization', () => {
  it('sorts files bytewise and keeps content metadata intact', () => {
    expect(
      normalizeRemoteSnapshotFiles([
        { path: 'z.ts', content: 'z', mode: '100644' },
        { path: 'a.ts', content: 'a', mode: '100755', language: 'typescript' },
      ]),
    ).toEqual([
      { path: 'a.ts', content: 'a', mode: '100755', language: 'typescript' },
      { path: 'z.ts', content: 'z', mode: '100644' },
    ]);
  });

  it('computes an order-independent, length-framed content hash', () => {
    const files = [
      { path: 'a', content: 'bc' },
      { path: 'ab', content: 'c' },
    ];
    expect(computeRemoteSnapshotContentHash(files)).toBe(computeRemoteSnapshotContentHash([...files].reverse()));
    expect(computeRemoteSnapshotContentHash(files)).not.toBe(
      computeRemoteSnapshotContentHash([
        { path: 'a', content: 'b' },
        { path: 'cab', content: 'c' },
      ]),
    );
  });

  it.each([
    [[{ path: '../escape', content: 'x' }], 'invalid-snapshot-path'],
    [[{ path: 'src\\file.ts', content: 'x' }], 'invalid-snapshot-path'],
    [[{ path: '.git/config', content: 'x' }], 'reserved-snapshot-path'],
    [
      [
        { path: 'src/file.ts', content: 'x' },
        { path: 'src/file.ts', content: 'y' },
      ],
      'duplicate-path',
    ],
    [
      [
        { path: 'src/File.ts', content: 'x' },
        { path: 'src/file.ts', content: 'y' },
      ],
      'case-conflicting-path',
    ],
    [
      [
        { path: 'src', content: 'x' },
        { path: 'src/file.ts', content: 'y' },
      ],
      'path-conflict',
    ],
  ] as const)('rejects unsafe provider-neutral snapshots', (files, reasonCode) => {
    expect(captureError(() => normalizeRemoteSnapshotFiles(files))).toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode },
    });
  });
});
