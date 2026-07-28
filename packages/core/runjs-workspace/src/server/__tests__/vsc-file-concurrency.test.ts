/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import path from 'path';
import { vi } from 'vitest';

import { VscError } from '../../shared/errors';
import { BlobService } from '../services/BlobService';
import { CommitService } from '../services/CommitService';
import { RepositoryService } from '../services/RepositoryService';
import { TreeService } from '../services/TreeService';
import type { PushResult } from '../services/VscFileService';
import { VscFileService } from '../services/VscFileService';

describe('vsc-file concurrency behavior', () => {
  let db: Database;
  let service: VscFileService;
  let blobService: BlobService;
  let treeService: TreeService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    service = new VscFileService(db);
    blobService = new BlobService(db);
    treeService = new TreeService(db, blobService);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db?.close();
  });

  it('allows exactly one of two pushes from the same base commit to advance head', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# Demo\n' }],
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    const results = await Promise.allSettled([
      service.push({
        repoId: repository.id,
        baseCommitId: initialCommit.id,
        message: 'writer one',
        files: [{ path: 'src/one.ts', content: 'export const one = 1;\n' }],
      }),
      service.push({
        repoId: repository.id,
        baseCommitId: initialCommit.id,
        message: 'writer two',
        files: [{ path: 'src/two.ts', content: 'export const two = 2;\n' }],
      }),
    ]);
    const fulfilled = results.filter(isFulfilled<PushResult>);
    const rejected = results.filter(isRejected);
    const head = await service.pull({ repoId: repository.id });

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject<VscError>({
      code: 'BASE_COMMIT_OUTDATED',
    });
    expect(head.commit?.id).toBe(fulfilled[0].value.commit.id);
    expect(
      await db.getRepository('vscFileCommits').count({
        filter: {
          repoId: repository.id,
        },
      }),
    ).toBe(2);
  });

  it('rolls back a push when the repository is archived after the writer reads head', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'archive-push',
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# Demo\n' }],
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    const staleRepository = await service.getRepository({ repoId: repository.id });
    await service.archiveRepository({ repoId: repository.id });
    const commitCountBefore = await db.getRepository('vscFileCommits').count({
      filter: {
        repoId: repository.id,
      },
    });

    const getRepositorySpy = vi
      .spyOn(RepositoryService.prototype, 'getRepository')
      .mockResolvedValueOnce(staleRepository);
    const getRepositoryForUpdateSpy = vi.spyOn(RepositoryService.prototype, 'getRepositoryForUpdate');
    const createCommitSpy = vi.spyOn(CommitService.prototype, 'createCommit');

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: initialCommit.id,
        message: 'must not commit after archive',
        files: [{ path: 'src/index.ts', content: 'export const value = 1;\n' }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'REPO_ARCHIVED',
    });

    expect(getRepositorySpy).toHaveBeenCalledTimes(1);
    expect(getRepositoryForUpdateSpy).toHaveBeenCalledTimes(1);
    expect(createCommitSpy).toHaveBeenCalledTimes(1);
    getRepositorySpy.mockRestore();
    getRepositoryForUpdateSpy.mockRestore();
    createCommitSpy.mockRestore();

    expect(await service.getRepository({ repoId: repository.id })).toMatchObject({
      status: 'archived',
      headCommitId: initialCommit.id,
      headSeq: 1,
    });
    expect((await service.listRefs({ repoId: repository.id }))[0]?.commitId).toBe(initialCommit.id);
    expect(
      await db.getRepository('vscFileCommits').count({
        filter: {
          repoId: repository.id,
        },
      }),
    ).toBe(commitCountBefore);
  });

  it('rolls back a restore when the repository is archived after the writer reads head', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'archive-restore',
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# Version 1\n' }],
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const second = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'version 2',
      files: [{ path: 'README.md', content: '# Version 2\n' }],
    });
    const staleRepository = await service.getRepository({ repoId: repository.id });
    await service.archiveRepository({ repoId: repository.id });
    const commitCountBefore = await db.getRepository('vscFileCommits').count({
      filter: {
        repoId: repository.id,
      },
    });

    const getRepositorySpy = vi
      .spyOn(RepositoryService.prototype, 'getRepository')
      .mockResolvedValueOnce(staleRepository)
      .mockResolvedValueOnce(staleRepository);
    const getRepositoryForUpdateSpy = vi.spyOn(RepositoryService.prototype, 'getRepositoryForUpdate');
    const createCommitSpy = vi.spyOn(CommitService.prototype, 'createCommit');

    await expect(
      service.restoreCommit({
        repoId: repository.id,
        sourceCommitId: initialCommit.id,
        message: 'must not restore after archive',
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'REPO_ARCHIVED',
    });

    expect(getRepositorySpy).toHaveBeenCalledTimes(2);
    expect(getRepositoryForUpdateSpy).toHaveBeenCalledTimes(1);
    expect(createCommitSpy).toHaveBeenCalledTimes(1);
    getRepositorySpy.mockRestore();
    getRepositoryForUpdateSpy.mockRestore();
    createCommitSpy.mockRestore();

    expect(await service.getRepository({ repoId: repository.id })).toMatchObject({
      status: 'archived',
      headCommitId: second.commit.id,
      headSeq: 2,
    });
    expect((await service.listRefs({ repoId: repository.id }))[0]?.commitId).toBe(second.commit.id);
    expect(
      await db.getRepository('vscFileCommits').count({
        filter: {
          repoId: repository.id,
        },
      }),
    ).toBe(commitCountBefore);
  });

  it('returns existing immutable blobs and trees during duplicate insertion races', async () => {
    const [firstBlob, secondBlob] = await Promise.all([
      blobService.ensureBlob('shared content\n'),
      blobService.ensureBlob('shared content\n'),
    ]);
    const readmeBlob = await blobService.ensureBlob('# Demo\n');
    const indexBlob = await blobService.ensureBlob('export const value = 1;\n');
    const firstPreparedTree = await treeService.prepareTree([
      { path: 'README.md', blobHash: readmeBlob.hash },
      { path: 'src/index.ts', blobHash: indexBlob.hash },
    ]);
    const secondPreparedTree = await treeService.prepareTree([
      { path: 'src/index.ts', blobHash: indexBlob.hash },
      { path: 'README.md', blobHash: readmeBlob.hash },
    ]);
    const [firstTree, secondTree] = await Promise.all([
      treeService.ensurePreparedTree(firstPreparedTree),
      treeService.ensurePreparedTree(secondPreparedTree),
    ]);

    expect(secondBlob).toEqual(firstBlob);
    expect(secondTree).toEqual(firstTree);
    expect(await db.getRepository('vscFileBlobs').count()).toBe(3);
    expect(await db.getRepository('vscFileTrees').count()).toBe(1);
    expect(
      await db.getRepository('vscFileTreeEntries').count({
        filter: {
          treeHash: firstTree.hash,
        },
      }),
    ).toBe(2);
  });

  function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
    return result.status === 'fulfilled';
  }

  function isRejected<T>(result: PromiseSettledResult<T>): result is PromiseRejectedResult {
    return result.status === 'rejected';
  }
});
