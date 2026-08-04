/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { RemoteSyncError } from '../../../RemoteSyncAdapter';
import {
  assertGitSubdirectoryEntry,
  decodeGitBlob,
  normalizeGitSnapshotLimits,
  normalizePublishedGitFiles,
  selectGitSnapshotEntries,
  type GitTreeEntry,
} from '../gitSnapshotPolicy';

const oid = '1'.repeat(40);

function entry(path: string, overrides: Partial<GitTreeEntry> = {}): GitTreeEntry {
  return {
    path,
    mode: '100644',
    type: 'blob',
    oid,
    size: 3,
    ...overrides,
  };
}

function captureError(callback: () => unknown): RemoteSyncError {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(RemoteSyncError);
    return error as RemoteSyncError;
  }
  throw new Error('Expected callback to throw RemoteSyncError');
}

describe('git snapshot policy', () => {
  it('selects ordinary files, strips the configured subdirectory, and preserves executable mode', () => {
    expect(
      selectGitSnapshotEntries(
        [entry('packages/light/z.ts'), entry('packages/light/a.ts', { mode: '100755', oid: '2'.repeat(40) })],
        'packages/light',
      ),
    ).toEqual([
      { path: 'a.ts', fullPath: 'packages/light/a.ts', mode: '100755', oid: '2'.repeat(40), size: 3 },
      { path: 'z.ts', fullPath: 'packages/light/z.ts', mode: '100644', oid, size: 3 },
    ]);
  });

  it.each([
    ['symlink', entry('link', { mode: '120000' }), 'symlink-unsupported'],
    ['gitlink', entry('module', { mode: '160000', type: 'commit', size: null }), 'gitlink-unsupported'],
    ['unknown blob mode', entry('file', { mode: '100600' }), 'tree-entry-unsupported'],
    ['unknown object type', entry('file', { type: 'tag' }), 'tree-entry-unsupported'],
  ])('rejects %s entries', (_title, candidate, reasonCode) => {
    expect(captureError(() => selectGitSnapshotEntries([candidate], null))).toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { provider: 'git', reasonCode },
    });
  });

  it.each([
    ['invalid UTF-8', Buffer.from([0xff, 0xfe]), 'invalid-utf8'],
    ['binary controls', Buffer.from([0x61, 0x00, 0x62]), 'binary-content'],
    [
      'Git LFS pointer',
      Buffer.from('version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 1\n'),
      'lfs-unsupported',
    ],
  ])('rejects %s blob content', (_title, content, reasonCode) => {
    const selected = selectGitSnapshotEntries([entry('file', { size: content.byteLength })], null)[0];
    expect(captureError(() => decodeGitBlob(content, selected))).toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode },
    });
  });

  it('accepts empty and ordinary strict UTF-8 blobs and rejects size mismatches', () => {
    const empty = selectGitSnapshotEntries([entry('empty', { size: 0 })], null)[0];
    expect(decodeGitBlob(Buffer.alloc(0), empty)).toBe('');
    const text = Buffer.from('你好\n');
    const selected = selectGitSnapshotEntries([entry('text', { size: text.byteLength })], null)[0];
    expect(decodeGitBlob(text, selected)).toBe('你好\n');
    expect(captureError(() => decodeGitBlob(Buffer.from('bad'), empty))).toMatchObject({
      details: { reasonCode: 'blob-size-mismatch' },
    });
  });

  it.each([
    [[entry('.git/config')], 'reserved-snapshot-path'],
    [[entry('src/File.ts'), entry('src/file.ts', { oid: '2'.repeat(40) })], 'case-conflicting-path'],
    [[entry('src/file.ts'), entry('src/file.ts', { oid: '2'.repeat(40) })], 'duplicate-path'],
    [[entry('../escape.ts')], 'invalid-tree-path'],
    [[entry('src\\file.ts')], 'invalid-tree-path'],
  ] as const)('rejects unsafe or ambiguous paths', (entries, reasonCode) => {
    expect(captureError(() => selectGitSnapshotEntries(entries, null))).toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode },
    });
  });

  it('enforces file, total byte, and file count limits before blob reads', () => {
    expect(
      captureError(() => selectGitSnapshotEntries([entry('large', { size: 5 })], null, limits({ maxFileBytes: 4 }))),
    ).toMatchObject({ details: { reasonCode: 'file-size-limit' } });
    expect(
      captureError(() =>
        selectGitSnapshotEntries(
          [entry('a', { size: 3 }), entry('b', { size: 3 })],
          null,
          limits({ maxTotalBytes: 5 }),
        ),
      ),
    ).toMatchObject({ details: { reasonCode: 'total-size-limit' } });
    expect(
      captureError(() => selectGitSnapshotEntries([entry('a'), entry('b')], null, limits({ maxFiles: 1 }))),
    ).toMatchObject({ details: { reasonCode: 'file-count-limit' } });
  });

  it('validates the configured subdirectory entry separately while allowing an empty projection', () => {
    expect(() =>
      assertGitSubdirectoryEntry(
        entry('packages/light', { mode: '040000', type: 'tree', size: null }),
        'packages/light',
      ),
    ).not.toThrow();
    expect(() => assertGitSubdirectoryEntry(undefined, 'packages/light')).not.toThrow();
    expect(captureError(() => assertGitSubdirectoryEntry(entry('packages/light'), 'packages/light'))).toMatchObject({
      details: { reasonCode: 'subdirectory-not-directory' },
    });
  });

  it('normalizes published files with the same path, mode, content, and resource rules', () => {
    expect(
      normalizePublishedGitFiles([
        { path: 'z.ts', content: 'z' },
        { path: 'a.ts', content: 'a', mode: '100755', language: 'typescript' },
      ]),
    ).toEqual([
      { path: 'a.ts', content: 'a', mode: '100755', language: 'typescript' },
      { path: 'z.ts', content: 'z' },
    ]);
    expect(captureError(() => normalizePublishedGitFiles([{ path: '.GIT/config', content: 'x' }]))).toMatchObject({
      details: { reasonCode: 'reserved-snapshot-path' },
    });
    expect(
      captureError(() => normalizePublishedGitFiles([{ path: 'link', content: 'x', mode: '120000' }])),
    ).toMatchObject({ details: { reasonCode: 'file-mode-unsupported' } });
    expect(captureError(() => normalizePublishedGitFiles([{ path: 'binary', content: 'a\0b' }]))).toMatchObject({
      details: { reasonCode: 'binary-content' },
    });
    expect(captureError(() => normalizePublishedGitFiles([{ path: 'invalid.ts', content: '\ud800' }]))).toMatchObject({
      details: { reasonCode: 'invalid-utf8' },
    });
    expect(
      captureError(() =>
        normalizePublishedGitFiles([
          { path: 'src', content: 'file' },
          { path: 'src/index.ts', content: 'nested' },
        ]),
      ),
    ).toMatchObject({ details: { reasonCode: 'path-conflict' } });
  });
});

function limits(overrides: Partial<ReturnType<typeof normalizeGitSnapshotLimits>>) {
  return normalizeGitSnapshotLimits(overrides);
}
