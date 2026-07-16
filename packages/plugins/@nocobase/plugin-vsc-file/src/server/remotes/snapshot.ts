/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import type { VscRemoteSnapshotFile } from '../../shared/remote-sync-types';
import { normalizePath } from '../../shared/path-normalize';
import { RemoteSyncError } from './RemoteSyncAdapter';

function lengthPrefix(byteLength: number): Buffer {
  const result = Buffer.alloc(8);
  result.writeBigUInt64BE(BigInt(byteLength));
  return result;
}

export function normalizeRemoteSnapshotFiles(files: readonly VscRemoteSnapshotFile[]): VscRemoteSnapshotFile[] {
  const normalized = files
    .map((file) => ({ ...file, path: normalizePath(file.path) }))
    .sort((left, right) => Buffer.compare(Buffer.from(left.path, 'utf8'), Buffer.from(right.path, 'utf8')));

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1].path === normalized[index].path) {
      throw new RemoteSyncError('UNSAFE_CONTENT', 'Remote snapshot contains a duplicate path', {
        details: { reasonCode: 'duplicate-path' },
      });
    }
  }
  return normalized;
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
