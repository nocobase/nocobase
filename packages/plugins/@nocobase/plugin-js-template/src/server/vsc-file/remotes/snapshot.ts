/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import type { VscRemoteSnapshotFile } from '../../../shared/vsc-file/remote-sync-types';
import { normalizePath } from '@nocobase/runjs-workspace/shared';
import { RemoteSyncError } from './RemoteSyncAdapter';

function lengthPrefix(byteLength: number): Buffer {
  const result = Buffer.alloc(8);
  result.writeBigUInt64BE(BigInt(byteLength));
  return result;
}

export function normalizeRemoteSnapshotFiles(files: readonly VscRemoteSnapshotFile[]): VscRemoteSnapshotFile[] {
  if (!Array.isArray(files)) {
    throw unsafeSnapshot('Remote snapshot files must be an array', 'invalid-snapshot');
  }
  const exactPaths = new Set<string>();
  const foldedPaths = new Map<string, string>();
  const normalized = files.map((file) => {
    if (!file || typeof file !== 'object' || typeof file.path !== 'string' || typeof file.content !== 'string') {
      throw unsafeSnapshot('Remote snapshot file is invalid', 'invalid-snapshot-file');
    }
    if (file.path.includes('\\')) {
      throw unsafeSnapshot('Remote snapshot path is invalid', 'invalid-snapshot-path');
    }
    let path: string;
    try {
      path = normalizePath(file.path);
    } catch {
      throw unsafeSnapshot('Remote snapshot path is invalid', 'invalid-snapshot-path');
    }
    if (path.split('/').some((segment) => segment.toLocaleLowerCase('en-US') === '.git')) {
      throw unsafeSnapshot('Remote snapshot path contains a reserved segment', 'reserved-snapshot-path');
    }
    if (exactPaths.has(path)) {
      throw unsafeSnapshot('Remote snapshot contains a duplicate path', 'duplicate-path');
    }
    exactPaths.add(path);
    const foldedPath = path.toLocaleLowerCase('en-US');
    const existingPath = foldedPaths.get(foldedPath);
    if (existingPath && existingPath !== path) {
      throw unsafeSnapshot('Remote snapshot contains a case-conflicting path', 'case-conflicting-path');
    }
    foldedPaths.set(foldedPath, path);
    return { ...file, path };
  });
  for (const file of normalized) {
    const segments = file.path.split('/');
    for (let index = 1; index < segments.length; index += 1) {
      if (exactPaths.has(segments.slice(0, index).join('/'))) {
        throw unsafeSnapshot('Remote snapshot contains a file and directory path conflict', 'path-conflict');
      }
    }
  }
  return normalized.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, 'utf8'), Buffer.from(right.path, 'utf8')),
  );
}

export function computeRemoteSnapshotContentHash(files: readonly VscRemoteSnapshotFile[]): string {
  const hash = createHash('sha256');
  for (const file of normalizeRemoteSnapshotFiles(files)) {
    const path = Buffer.from(file.path, 'utf8');
    const content = Buffer.from(file.content, 'utf8');
    hash.update(lengthPrefix(path.byteLength));
    hash.update(path);
    hash.update(lengthPrefix(content.byteLength));
    hash.update(content);
  }
  return `sha256:${hash.digest('hex')}`;
}

function unsafeSnapshot(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('UNSAFE_CONTENT', message, {
    details: { reasonCode },
  });
}
