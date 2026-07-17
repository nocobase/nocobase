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
import { UniqueConstraintError } from 'sequelize';

import { VscError } from '../../shared/errors';
import { pathHash, pathLowerHash } from '../../shared/path';
import { BlobService } from '../services/BlobService';
import { RepositoryService } from '../services/RepositoryService';
import { VscFileService } from '../services/VscFileService';

// Cross-dialect checks can be repeated by changing DB_DIALECT and DB_* connection variables before this yarn test command.
describe('vsc-file database compatibility', () => {
  let db: Database;
  let service: VscFileService;
  let blobService: BlobService;
  let repositoryService: RepositoryService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    service = new VscFileService(db);
    blobService = new BlobService(db);
    repositoryService = new RepositoryService(db);
  });

  afterEach(async () => {
    await db?.close();
  });

  it('enforces compound unique indexes while allowing different scopes', async () => {
    const repositories = db.getRepository('vscFileRepositories');
    const refs = db.getRepository('vscFileRefs');

    await repositories.create({
      values: {
        ownerType: 'plugin',
        ownerId: 'demo',
        name: 'main',
      },
    });
    await repositories.create({
      values: {
        ownerType: 'plugin',
        ownerId: 'other',
        name: 'main',
      },
    });
    await refs.create({
      values: {
        repoId: 'repo-1',
        name: 'head',
        type: 'branch',
        commitId: null,
      },
    });
    await refs.create({
      values: {
        repoId: 'repo-2',
        name: 'head',
        type: 'branch',
        commitId: null,
      },
    });

    await expect(
      repositories.create({
        values: {
          ownerType: 'plugin',
          ownerId: 'demo',
          name: 'main',
        },
      }),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
    await expect(
      refs.create({
        values: {
          repoId: 'repo-1',
          name: 'head',
          type: 'branch',
          commitId: null,
        },
      }),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  it('enforces case-only path conflicts through pathLowerHash', async () => {
    const treeEntries = db.getRepository('vscFileTreeEntries');
    const treeHash = 'a'.repeat(64);

    await treeEntries.create({
      values: {
        treeHash,
        path: 'Foo.ts',
        pathHash: pathHash('Foo.ts'),
        pathLowerHash: pathLowerHash('Foo.ts'),
        blobHash: 'b'.repeat(64),
        size: 1,
      },
    });

    await expect(
      treeEntries.create({
        values: {
          treeHash,
          path: 'foo.ts',
          pathHash: pathHash('foo.ts'),
          pathLowerHash: pathLowerHash('foo.ts'),
          blobHash: 'c'.repeat(64),
          size: 1,
        },
      }),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  it('stores long text blobs without truncation', async () => {
    const longContent = `\ufeff${'多字节-text\r\n'.repeat(8192)}tail\r`;
    const blob = await blobService.ensureBlob(longContent);
    const loaded = await blobService.loadBlobs([blob.hash, blob.hash]);
    const metadata = await blobService.loadBlobMetadata([blob.hash]);
    const normalizedContent = `${'多字节-text\n'.repeat(8192)}tail\n`;

    expect(loaded.get(blob.hash)).toEqual(blob);
    expect(loaded.get(blob.hash)?.content).toBe(normalizedContent);
    expect(loaded.get(blob.hash)?.size).toBe(Buffer.byteLength(normalizedContent, 'utf8'));
    expect(metadata.get(blob.hash)).toEqual({ hash: blob.hash, size: blob.size });
  });

  it('rolls back repository, ref, tree, commit, and blob writes in one transaction', async () => {
    const transaction = await db.sequelize.transaction();

    await service.createRepository(
      {
        ownerType: 'plugin',
        ownerId: 'rollback',
        name: 'main',
        initialFiles: [{ path: 'README.md', content: '# Rollback\n' }],
      },
      { transaction },
    );
    await transaction.rollback();

    expect(
      await db.getRepository('vscFileRepositories').count({
        filter: {
          ownerId: 'rollback',
        },
      }),
    ).toBe(0);
    expect(await db.getRepository('vscFileRefs').count()).toBe(0);
    expect(await db.getRepository('vscFileCommits').count()).toBe(0);
    expect(await db.getRepository('vscFileTrees').count()).toBe(0);
    expect(await db.getRepository('vscFileBlobs').count()).toBe(0);
  });

  it('rejects conditional head updates when the stored head has changed', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const first = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'first commit',
      files: [{ path: 'README.md', content: '# Demo\n' }],
    });

    await expect(
      repositoryService.updateHead(repository, first.commit.id, first.commit.seq),
    ).rejects.toMatchObject<VscError>({
      code: 'BASE_COMMIT_OUTDATED',
    });
  });

  it('round-trips JSON metadata on commits', async () => {
    const metadata = {
      source: 'db-compatibility',
      nested: {
        enabled: true,
      },
      tags: ['json', 'metadata'],
      count: 2,
    };
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const pushed = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'metadata commit',
      files: [{ path: 'README.md', content: '# Demo\n' }],
      metadata,
    });
    const loaded = await service.getCommit({
      repoId: repository.id,
      commitId: pushed.commit.id,
    });

    expect(loaded.metadata).toEqual(metadata);
  });
});
