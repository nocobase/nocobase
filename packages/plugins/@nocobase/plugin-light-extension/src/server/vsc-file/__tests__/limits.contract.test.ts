/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, type Database } from '@nocobase/database';
import path from 'path';

import {
  commitHistoryDefaultLimit,
  diffMaxFileSize,
  maxCommitMessageLength,
  maxFileSize,
  maxFilesPerRepo,
  maxPathLength,
  maxRepoTextSize,
} from '../../../shared/vsc-file/constants';
import type { VscErrorCode } from '../../../shared/vsc-file/errors';
import { sha256Hex } from '../../../shared/vsc-file/hash';
import { defaultVscFileLimits, vscFileServerDefaults } from '../config';
import { VscFileService, type PushInput } from '../services/VscFileService';

describe('vsc-file server defaults', () => {
  it('exports the shared Phase 1 limits without a database', () => {
    expect(vscFileServerDefaults.limits).toBe(defaultVscFileLimits);
    expect(vscFileServerDefaults.limits).toMatchObject({
      maxFileSize,
      maxFilesPerRepo,
      maxRepoTextSize,
      diffMaxFileSize,
      maxCommitMessageLength,
      maxPathLength,
      commitHistoryDefaultLimit,
    });
  });
});

describe('vsc-file blocking limit contracts', () => {
  let db: Database;
  let service: VscFileService;

  beforeAll(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    service = new VscFileService(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('rejects oversized content, unauthorized hashes, file counts, and repository size without writes', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'limits',
      name: 'main',
    });

    await expectPushRejectedWithoutWrites(
      db,
      service,
      {
        repoId: repository.id,
        baseCommitId: null,
        message: 'oversized file',
        files: [{ path: 'large.txt', content: 'x'.repeat(maxFileSize + 1) }],
      },
      'FILE_TOO_LARGE',
    );

    const oversizedContent = 'y'.repeat(maxFileSize + 1);
    const oversizedBlobHash = sha256Hex(oversizedContent);
    await db.getRepository('vscFileBlobs').create({
      values: {
        hash: oversizedBlobHash,
        size: Buffer.byteLength(oversizedContent, 'utf8'),
        content: oversizedContent,
      },
    });
    await expectPushRejectedWithoutWrites(
      db,
      service,
      {
        repoId: repository.id,
        baseCommitId: null,
        message: 'unauthorized hash-only file',
        files: [{ path: 'large-hash-only.txt', blobHash: oversizedBlobHash }],
      },
      'PERMISSION_DENIED',
    );

    await expectPushRejectedWithoutWrites(
      db,
      service,
      {
        repoId: repository.id,
        baseCommitId: null,
        message: 'too many files',
        files: Array.from({ length: maxFilesPerRepo + 1 }, (_, index) => ({
          path: `too-many/file-${index}.txt`,
          content: `${index}\n`,
        })),
      },
      'REPO_LIMIT_EXCEEDED',
    );

    const maxSizedContent = contentOfSize(maxFileSize, 'shared-large-blob');
    const largeRepository = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'limits-repository-size',
      name: 'main',
      initialFiles: [{ path: 'large/file-000.txt', content: maxSizedContent }],
    });
    if (!largeRepository.initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const metadata = await service.pull({ repoId: largeRepository.repository.id });
    const sharedBlobHash = metadata.files?.[0]?.blobHash;
    if (!sharedBlobHash) {
      throw new Error('Expected shared blob metadata');
    }

    await expectPushRejectedWithoutWrites(
      db,
      service,
      {
        repoId: largeRepository.repository.id,
        baseCommitId: largeRepository.initialCommit.id,
        message: 'repo too large',
        files: Array.from({ length: Math.floor(maxRepoTextSize / maxFileSize) }, (_, index) => ({
          path: `large/file-${String(index + 1).padStart(3, '0')}.txt`,
          blobHash: sharedBlobHash,
        })),
      },
      'REPO_LIMIT_EXCEEDED',
    );
  });

  it('rejects oversized commit messages and paths without writes', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'field-limits',
      name: 'main',
    });

    await expectPushRejectedWithoutWrites(
      db,
      service,
      {
        repoId: repository.id,
        baseCommitId: null,
        message: 'x'.repeat(maxCommitMessageLength + 1),
        files: [{ path: 'README.md', content: '# Demo\n' }],
      },
      'PATH_INVALID',
    );
    await expectPushRejectedWithoutWrites(
      db,
      service,
      {
        repoId: repository.id,
        baseCommitId: null,
        message: 'path too long',
        files: [{ path: `${'a'.repeat(maxPathLength + 1)}.txt`, content: '# Demo\n' }],
      },
      'PATH_INVALID',
    );
  });
});

async function expectPushRejectedWithoutWrites(
  db: Database,
  service: VscFileService,
  input: PushInput,
  code: VscErrorCode,
): Promise<void> {
  const before = await countStoredRows(db, input.repoId);

  await expect(service.push(input)).rejects.toMatchObject({ code });

  expect(await countStoredRows(db, input.repoId)).toEqual(before);
}

async function countStoredRows(db: Database, repoId: string) {
  return {
    blobs: await db.getRepository('vscFileBlobs').count(),
    trees: await db.getRepository('vscFileTrees').count(),
    commits: await db.getRepository('vscFileCommits').count({ filter: { repoId } }),
  };
}

function contentOfSize(size: number, seed: string): string {
  const prefix = `${seed}\n`;
  return `${prefix}${'x'.repeat(size - Buffer.byteLength(prefix, 'utf8'))}`;
}
