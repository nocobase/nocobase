/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TextDecoder } from 'node:util';

import type { VscRemoteSnapshotFile } from '../../../../../shared/vsc-file/remote-sync-types';
import { normalizePath } from '../../../../../shared/vsc-file/path-normalize';
import { RemoteSyncError } from '../../RemoteSyncAdapter';
import { normalizeRemoteSnapshotFiles } from '../../snapshot';

export const defaultGitSnapshotLimits: GitSnapshotLimits = {
  maxFiles: 2_000,
  maxFileBytes: 1024 * 1024,
  maxTotalBytes: 10 * 1024 * 1024,
};

export interface GitSnapshotLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
}

export interface GitTreeEntry {
  path: string;
  mode: string;
  type: string;
  oid: string;
  size: number | null;
}

export interface SelectedGitBlob {
  path: string;
  fullPath: string;
  mode: '100644' | '100755';
  oid: string;
  size: number;
}

export function normalizeGitSnapshotLimits(input: Partial<GitSnapshotLimits> = {}): GitSnapshotLimits {
  const limits = { ...defaultGitSnapshotLimits, ...input };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new RemoteSyncError('CONFIG_INVALID', `Git snapshot ${name} must be a positive integer`, {
        details: { provider: 'git', reasonCode: 'invalid-snapshot-limit' },
      });
    }
  }
  return limits;
}

export function selectGitSnapshotEntries(
  entries: readonly GitTreeEntry[],
  subdirectory: string | null,
  limits: GitSnapshotLimits = defaultGitSnapshotLimits,
): SelectedGitBlob[] {
  if (!Array.isArray(entries)) {
    throw unsafeContent('Git tree response is invalid', 'invalid-tree-response');
  }

  const selected: SelectedGitBlob[] = [];
  const exactPaths = new Set<string>();
  const foldedPaths = new Map<string, string>();
  let totalBytes = 0;

  for (const entry of entries) {
    validateTreeEntry(entry);
    if (entry.type === 'tree' && entry.mode === '040000') {
      continue;
    }
    if (entry.type === 'commit' || entry.mode === '160000') {
      throw unsafeContent('Git submodules are unsupported', 'gitlink-unsupported');
    }
    if (entry.mode === '120000') {
      throw unsafeContent('Git symbolic links are unsupported', 'symlink-unsupported');
    }
    if (entry.type !== 'blob' || (entry.mode !== '100644' && entry.mode !== '100755')) {
      throw unsafeContent('Git tree entry type is unsupported', 'tree-entry-unsupported');
    }
    if (!Number.isSafeInteger(entry.size) || (entry.size as number) < 0) {
      throw unsafeContent('Git blob size is unavailable', 'blob-size-unavailable');
    }
    const size = entry.size as number;
    if (size > limits.maxFileBytes) {
      throw unsafeContent('Git blob exceeds the file size limit', 'file-size-limit');
    }
    totalBytes += size;
    if (totalBytes > limits.maxTotalBytes) {
      throw unsafeContent('Git snapshot exceeds the total size limit', 'total-size-limit');
    }

    const path = stripSubdirectory(entry.path, subdirectory);
    assertSafeSnapshotPath(path);
    assertUniquePath(path, exactPaths, foldedPaths);
    selected.push({ path, fullPath: entry.path, mode: entry.mode, oid: entry.oid, size });
    if (selected.length > limits.maxFiles) {
      throw unsafeContent('Git snapshot exceeds the file count limit', 'file-count-limit');
    }
  }

  return selected.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
}

export function decodeGitBlob(bytes: Buffer, entry: SelectedGitBlob): string {
  if (bytes.byteLength !== entry.size) {
    throw unsafeContent('Git blob size does not match its tree entry', 'blob-size-mismatch');
  }
  let content: string;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw unsafeContent('Git blob is not valid UTF-8 text', 'invalid-utf8');
  }
  validateTextContent(content);
  return content;
}

export function normalizePublishedGitFiles(
  input: readonly VscRemoteSnapshotFile[],
  limits: GitSnapshotLimits = defaultGitSnapshotLimits,
): VscRemoteSnapshotFile[] {
  const files = normalizeRemoteSnapshotFiles(input);
  if (files.length > limits.maxFiles) {
    throw unsafeContent('Remote snapshot exceeds the file count limit', 'file-count-limit');
  }

  let totalBytes = 0;
  return files.map((file) => {
    if (file.language !== undefined && typeof file.language !== 'string') {
      throw unsafeContent('Remote snapshot file language is invalid', 'invalid-snapshot-file');
    }
    validateTextContent(file.content);
    const bytes = Buffer.byteLength(file.content, 'utf8');
    if (bytes > limits.maxFileBytes) {
      throw unsafeContent('Remote snapshot file exceeds the size limit', 'file-size-limit');
    }
    totalBytes += bytes;
    if (totalBytes > limits.maxTotalBytes) {
      throw unsafeContent('Remote snapshot exceeds the total size limit', 'total-size-limit');
    }
    if (file.mode !== undefined && file.mode !== '100644' && file.mode !== '100755') {
      throw unsafeContent('Remote snapshot file mode is unsupported', 'file-mode-unsupported');
    }
    return file;
  });
}

export function assertGitSubdirectoryEntry(entry: GitTreeEntry | undefined, subdirectory: string): void {
  if (!entry) {
    return;
  }
  if (entry.path !== subdirectory) {
    throw unsafeContent('Git subdirectory response is invalid', 'invalid-tree-entry');
  }
  validateTreeEntry(entry);
  if (entry.type !== 'tree' || entry.mode !== '040000') {
    throw unsafeContent('Git subdirectory is not a directory', 'subdirectory-not-directory');
  }
}

function validateTreeEntry(entry: GitTreeEntry): void {
  if (
    !entry ||
    typeof entry !== 'object' ||
    typeof entry.path !== 'string' ||
    typeof entry.mode !== 'string' ||
    typeof entry.type !== 'string' ||
    typeof entry.oid !== 'string' ||
    !/^[0-9a-f]{40}$/u.test(entry.oid)
  ) {
    throw unsafeContent('Git tree entry is invalid', 'invalid-tree-entry');
  }
  assertSafeGitTreePath(entry.path);
}

function stripSubdirectory(path: string, subdirectory: string | null): string {
  if (subdirectory === null) {
    return path;
  }
  const prefix = `${subdirectory}/`;
  if (!path.startsWith(prefix) || path.length === prefix.length) {
    throw unsafeContent('Git tree path escaped the configured subdirectory', 'subdirectory-path-escape');
  }
  return path.slice(prefix.length);
}

function assertSafeSnapshotPath(path: string): void {
  if (!path || path.startsWith('/') || path.endsWith('/') || path.includes('\\') || path.includes('//')) {
    throw unsafeContent('Remote snapshot path is invalid', 'invalid-snapshot-path');
  }
  let normalizedPath: string;
  try {
    normalizedPath = normalizePath(path);
  } catch {
    throw unsafeContent('Remote snapshot path is invalid', 'invalid-snapshot-path');
  }
  if (normalizedPath !== path) {
    throw unsafeContent('Remote snapshot path is invalid', 'invalid-snapshot-path');
  }
  const segments = normalizedPath.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\0'))) {
    throw unsafeContent('Remote snapshot path is invalid', 'invalid-snapshot-path');
  }
  if (segments.some((segment) => segment.toLocaleLowerCase('en-US') === '.git')) {
    throw unsafeContent('Remote snapshot path contains a reserved segment', 'reserved-snapshot-path');
  }
}

function assertSafeGitTreePath(path: string): void {
  if (!path || path.startsWith('/') || path.endsWith('/') || path.includes('\\') || path.includes('//')) {
    throw unsafeContent('Git tree path is invalid', 'invalid-tree-path');
  }
  if (path.split('/').some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\0'))) {
    throw unsafeContent('Git tree path is invalid', 'invalid-tree-path');
  }
}

function assertUniquePath(path: string, exactPaths: Set<string>, foldedPaths: Map<string, string>): void {
  if (exactPaths.has(path)) {
    throw unsafeContent('Remote snapshot contains a duplicate path', 'duplicate-path');
  }
  exactPaths.add(path);
  const folded = path.toLocaleLowerCase('en-US');
  const existing = foldedPaths.get(folded);
  if (existing && existing !== path) {
    throw unsafeContent('Remote snapshot contains a case-conflicting path', 'case-conflicting-path');
  }
  foldedPaths.set(folded, path);
}

function validateTextContent(content: string): void {
  const bytes = Buffer.from(content, 'utf8');
  let decoded: string;
  try {
    decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw unsafeContent('Git blob is not valid UTF-8 text', 'invalid-utf8');
  }
  if (decoded !== content) {
    throw unsafeContent('Git blob is not valid UTF-8 text', 'invalid-utf8');
  }
  for (const character of content) {
    const code = character.charCodeAt(0);
    if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0c && code !== 0x0d) || code === 0x7f) {
      throw unsafeContent('Binary snapshot files are unsupported', 'binary-content');
    }
  }
  if (content.startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    throw unsafeContent('Git LFS pointer files are unsupported', 'lfs-unsupported');
  }
}

function unsafeContent(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('UNSAFE_CONTENT', message, {
    details: { provider: 'git', reasonCode },
  });
}
