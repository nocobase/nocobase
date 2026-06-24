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

import { VscError } from '../../shared/errors';
import { BlobService } from '../services/BlobService';
import type { ActiveDraftResult } from '../services/DraftService';
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

  it('keeps one active draft when two saves race for the same repo and user', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });

    const results = await Promise.allSettled([
      service.saveDraft({
        repoId: repository.id,
        userId: 'user-1',
        baseCommitId: null,
        files: [{ path: 'src/one.ts', operation: 'upsert', content: 'export const one = 1;\n' }],
      }),
      service.saveDraft({
        repoId: repository.id,
        userId: 'user-1',
        baseCommitId: null,
        files: [{ path: 'src/two.ts', operation: 'upsert', content: 'export const two = 2;\n' }],
      }),
    ]);
    const fulfilled = results.filter(isFulfilled<ActiveDraftResult>);
    const loaded = await service.getDraft({
      repoId: repository.id,
      userId: 'user-1',
    });

    expect(fulfilled).toHaveLength(2);
    expect(new Set(fulfilled.map((result) => result.value.draft.id)).size).toBe(1);
    expect(
      await db.getRepository('vscFileDrafts').count({
        filter: {
          repoId: repository.id,
          userId: 'user-1',
          status: 'active',
        },
      }),
    ).toBe(1);
    expect(loaded?.files.map((file) => file.path).sort()).toEqual(['src/one.ts', 'src/two.ts']);
  });

  it('returns existing immutable blobs and trees during duplicate insertion races', async () => {
    const [firstBlob, secondBlob] = await Promise.all([
      blobService.ensureBlob('shared content\n'),
      blobService.ensureBlob('shared content\n'),
    ]);
    const readmeBlob = await blobService.ensureBlob('# Demo\n');
    const indexBlob = await blobService.ensureBlob('export const value = 1;\n');
    const [firstTree, secondTree] = await Promise.all([
      treeService.ensureTree([
        { path: 'README.md', blobHash: readmeBlob.hash },
        { path: 'src/index.ts', blobHash: indexBlob.hash },
      ]),
      treeService.ensureTree([
        { path: 'src/index.ts', blobHash: indexBlob.hash },
        { path: 'README.md', blobHash: readmeBlob.hash },
      ]),
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
