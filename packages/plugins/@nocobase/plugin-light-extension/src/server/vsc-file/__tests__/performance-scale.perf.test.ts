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

import { maxFilesPerRepo, maxRepoTextSize } from '../../../shared/vsc-file/constants';
import type { VscTreeEntryInput } from '../../../shared/vsc-file/types';
import { VscFileService } from '../services/VscFileService';

describe.runIf(process.env.RUN_VSC_SCALE_TESTS === '1')('vsc-file 200-file / 10-MiB scale smoke', () => {
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

  it('pulls and updates a repository at the configured file-count and text-size limits', async () => {
    const files = createFilesWithTotalSize(maxFilesPerRepo, maxRepoTextSize);
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-scale',
      name: 'main',
      initialFiles: files,
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    const metadata = await service.pull({ repoId: repository.id });
    expect(metadata.tree).toMatchObject({
      entryCount: maxFilesPerRepo,
      byteSize: maxRepoTextSize,
    });
    expect(metadata.files).toHaveLength(maxFilesPerRepo);
    expect(metadata.files?.every((file) => !Object.prototype.hasOwnProperty.call(file, 'content'))).toBe(true);

    const full = await service.pull({ repoId: repository.id, includeContent: 'all' });
    expect(full.files?.every((file) => typeof file.content === 'string')).toBe(true);

    const changedContent = contentOfSize(Buffer.byteLength(files[0].content as string, 'utf8'), 'scale-changed');
    const next = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'change one file',
      files: [{ path: files[0].path, content: changedContent }],
    });
    const diff = await service.diffCommits({
      repoId: repository.id,
      fromCommitId: initialCommit.id,
      toCommitId: next.commit.id,
    });

    expect(next.tree.byteSize).toBe(maxRepoTextSize);
    expect(diff.summary).toEqual({
      added: 0,
      modified: 1,
      deleted: 0,
      unchanged: maxFilesPerRepo - 1,
      renamed: 0,
    });
  });
});

function createFilesWithTotalSize(count: number, totalSize: number): VscTreeEntryInput[] {
  const baseSize = Math.floor(totalSize / count);
  const remainder = totalSize % count;

  return Array.from({ length: count }, (_, index) => ({
    path: `scale/file-${String(index).padStart(3, '0')}.txt`,
    content: contentOfSize(baseSize + (index < remainder ? 1 : 0), `scale-${index}`),
  }));
}

function contentOfSize(size: number, seed: string): string {
  const prefix = `${seed}\n`;
  return `${prefix}${'x'.repeat(size - Buffer.byteLength(prefix, 'utf8'))}`;
}
