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
import { vi } from 'vitest';

import {
  commitHistoryDefaultLimit,
  diffMaxFileSize,
  maxCommitMessageLength,
  maxFileSize,
  maxFilesPerRepo,
  maxPathLength,
  maxRepoTextSize,
} from '../../shared/constants';
import { VscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import type { VscCommitRecord, VscTreeEntryInput } from '../../shared/types';
import { defaultVscFileLimits, vscFileServerDefaults } from '../config';
import { DiffService } from '../services/DiffService';
import type { VscFileMetricCounterName, VscFileMetricsCollector } from '../services/VscFileMetrics';
import { VscFileService } from '../services/VscFileService';

const smallRepoFileCount = 10;
const smallRepoFileSize = 5 * 1024;
const mediumRepoFileCount = 200;
const mediumRepoFileSize = 10 * 1024;

describe('vsc-file performance smoke tests', () => {
  let db: Database;
  let service: VscFileService;
  let diffService: DiffService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    service = new VscFileService(db);
    diffService = new DiffService(db);
  });

  afterEach(async () => {
    await db?.close();
  });

  it('exports Phase 1 server defaults from the shared constants', () => {
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

  it('pulls a medium repository as metadata only by default', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-medium',
      name: 'main',
      initialFiles: createFiles(mediumRepoFileCount, mediumRepoFileSize, 'medium'),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    const pull = await service.pull({ repoId: repository.id });

    expect(pull).toMatchObject({
      unchanged: false,
      commit: {
        id: initialCommit.id,
      },
      tree: {
        entryCount: mediumRepoFileCount,
        byteSize: mediumRepoFileCount * mediumRepoFileSize,
      },
    });
    expect(pull.files).toHaveLength(mediumRepoFileCount);
    expect(pull.files?.every((file) => !Object.prototype.hasOwnProperty.call(file, 'content'))).toBe(true);
  });

  it('loads all, selected, and no blob content with constant collection queries', async () => {
    const metrics = createMetricsCollector();
    const { repository, initialCommit } = await service.createRepository(
      {
        ownerType: 'plugin',
        ownerId: 'performance-content-query-baseline',
        name: 'main',
        initialFiles: createFiles(mediumRepoFileCount, mediumRepoFileSize, 'content-query'),
      },
      { metricsCollector: metrics.collector },
    );
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    expect(metrics.counters).toEqual({
      blobContentQueryCount: 0,
      blobContentRowCount: 0,
      treeNormalizationCount: 1,
    });

    const smallRepository = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-content-query-small',
      name: 'main',
      initialFiles: createFiles(smallRepoFileCount, smallRepoFileSize, 'content-query-small'),
    });
    const blobRepository = db.getRepository('vscFileBlobs');
    const blobFind = vi.spyOn(blobRepository, 'find');
    const blobFindOne = vi.spyOn(blobRepository, 'findOne');
    metrics.reset();

    const metadataOnly = await service.pull(
      { repoId: repository.id, includeContent: 'none' },
      { metricsCollector: metrics.collector },
    );

    expect(metadataOnly.files).toHaveLength(mediumRepoFileCount);
    expect(metadataOnly.files?.every((file) => !Object.prototype.hasOwnProperty.call(file, 'content'))).toBe(true);
    expect(blobFind).toHaveBeenCalledTimes(0);
    expect(blobFindOne).toHaveBeenCalledTimes(0);
    expect(metrics.counters).toEqual({
      blobContentQueryCount: 0,
      blobContentRowCount: 0,
      treeNormalizationCount: 0,
    });

    blobFind.mockClear();
    blobFindOne.mockClear();
    metrics.reset();
    const selectedPaths = ['content-query/file-003.txt', 'content-query/file-042.txt', 'content-query/missing.txt'];
    const selected = await service.pull(
      {
        repoId: repository.id,
        includeContent: 'selected',
        selectedPaths,
      },
      { metricsCollector: metrics.collector },
    );

    expect(selected.files?.filter((file) => Object.prototype.hasOwnProperty.call(file, 'content'))).toHaveLength(2);
    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFind).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          hash: {
            $in: expect.arrayContaining([
              selected.files?.find((file) => file.path === selectedPaths[0])?.blobHash,
              selected.files?.find((file) => file.path === selectedPaths[1])?.blobHash,
            ]),
          },
        },
        fields: ['hash', 'size', 'content'],
      }),
    );
    expect(blobFindOne).toHaveBeenCalledTimes(0);
    expect(metrics.counters).toEqual({
      blobContentQueryCount: 1,
      blobContentRowCount: 2,
      treeNormalizationCount: 0,
    });

    blobFind.mockClear();
    blobFindOne.mockClear();
    metrics.reset();
    const withAllContent = await service.pull(
      { repoId: repository.id, includeContent: 'all' },
      { metricsCollector: metrics.collector },
    );

    expect(withAllContent.files).toHaveLength(mediumRepoFileCount);
    expect(withAllContent.files?.every((file) => typeof file.content === 'string')).toBe(true);
    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFindOne).toHaveBeenCalledTimes(0);
    expect(metrics.counters).toEqual({
      blobContentQueryCount: 1,
      blobContentRowCount: mediumRepoFileCount,
      treeNormalizationCount: 0,
    });

    blobFind.mockClear();
    blobFindOne.mockClear();
    const smallWithAllContent = await service.pull({
      repoId: smallRepository.repository.id,
      includeContent: 'all',
    });
    expect(smallWithAllContent.files).toHaveLength(smallRepoFileCount);
    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFindOne).toHaveBeenCalledTimes(0);

    blobFind.mockClear();
    const selectedMiss = await service.pull({
      repoId: repository.id,
      includeContent: 'selected',
      selectedPaths: ['content-query/missing.txt'],
    });
    expect(selectedMiss.files?.every((file) => !Object.prototype.hasOwnProperty.call(file, 'content'))).toBe(true);
    expect(blobFind).toHaveBeenCalledTimes(0);
    expect(blobFindOne).toHaveBeenCalledTimes(0);
  });

  it('deduplicates shared hashes and restores pullCommit files in tree order', async () => {
    const sharedContent = '\ufeff共享\r\nline 2\rline 3';
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-shared-blob',
      name: 'main',
      initialFiles: [
        { path: 'z-last.txt', content: sharedContent },
        { path: 'a-first.txt', content: sharedContent },
      ],
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    const blobRepository = db.getRepository('vscFileBlobs');
    const blobFind = vi.spyOn(blobRepository, 'find');
    const blobFindOne = vi.spyOn(blobRepository, 'findOne');
    const metrics = createMetricsCollector();
    const transaction = await db.sequelize.transaction();
    const pull = await service.pullCommit(
      {
        repoId: repository.id,
        commitId: initialCommit.id,
        includeContent: 'all',
      },
      { transaction, metricsCollector: metrics.collector },
    );

    expect(pull.files?.map((file) => file.path)).toEqual(['a-first.txt', 'z-last.txt']);
    expect(pull.files?.map((file) => file.content)).toEqual(['共享\nline 2\nline 3', '共享\nline 2\nline 3']);
    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFind.mock.calls[0]?.[0]).toMatchObject({
      filter: {
        hash: { $in: [pull.files?.[0].blobHash] },
      },
      fields: ['hash', 'size', 'content'],
      transaction,
    });
    expect(blobFindOne).toHaveBeenCalledTimes(0);
    expect(metrics.counters).toEqual({
      blobContentQueryCount: 1,
      blobContentRowCount: 1,
      treeNormalizationCount: 0,
    });

    blobFind.mockClear();
    metrics.reset();
    const selected = await service.pullCommit(
      {
        repoId: repository.id,
        commitId: initialCommit.id,
        includeContent: 'selected',
        selectedPaths: ['z-last.txt', 'missing.txt'],
      },
      { transaction, metricsCollector: metrics.collector },
    );
    expect(selected.files?.filter((file) => typeof file.content === 'string')).toHaveLength(1);
    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFindOne).toHaveBeenCalledTimes(0);
    expect(metrics.counters).toEqual({
      blobContentQueryCount: 1,
      blobContentRowCount: 1,
      treeNormalizationCount: 0,
    });

    await transaction.rollback();
  });

  it('prepares a one-file delta in a medium repository once with one metadata query', async () => {
    const metrics = createMetricsCollector();
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-prepared-tree',
      name: 'main',
      initialFiles: createFiles(mediumRepoFileCount, mediumRepoFileSize, 'prepared-tree'),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    const blobRepository = db.getRepository('vscFileBlobs');
    const blobFind = vi.spyOn(blobRepository, 'find');
    const blobFindOne = vi.spyOn(blobRepository, 'findOne');
    const changedContent = contentOfSize(mediumRepoFileSize, 'prepared-tree-changed');
    const pushed = await service.push(
      {
        repoId: repository.id,
        baseCommitId: initialCommit.id,
        message: 'change one file',
        files: [{ path: 'prepared-tree/file-042.txt', content: changedContent }],
      },
      { metricsCollector: metrics.collector },
    );

    expect(pushed.tree).toMatchObject({
      entryCount: mediumRepoFileCount,
      byteSize: mediumRepoFileCount * mediumRepoFileSize,
    });
    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFind.mock.calls[0]?.[0]).toMatchObject({
      filter: {
        hash: { $in: expect.any(Array) },
      },
      fields: ['hash', 'size'],
    });
    expect((blobFind.mock.calls[0]?.[0] as { filter: { hash: { $in: string[] } } }).filter.hash.$in).toHaveLength(
      mediumRepoFileCount - 1,
    );
    expect(blobFindOne).toHaveBeenCalledTimes(0);
    expect(metrics.counters).toEqual({
      blobContentQueryCount: 0,
      blobContentRowCount: 0,
      treeNormalizationCount: 1,
    });
  });

  it('rejects a pull before exposing files when any referenced blob is missing', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-missing-blob',
      name: 'main',
      initialFiles: [
        { path: 'present.txt', content: 'present\n' },
        { path: 'missing.txt', content: 'missing\n' },
      ],
    });
    const metadata = await service.pull({ repoId: repository.id });
    const missingEntry = metadata.files?.find((file) => file.path === 'missing.txt');
    if (!missingEntry) {
      throw new Error('Expected missing.txt metadata');
    }
    await db.getRepository('vscFileBlobs').destroy({ filterByTk: missingEntry.blobHash });

    await expect(
      service.pull({
        repoId: repository.id,
        includeContent: 'all',
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'BLOB_NOT_FOUND',
      message: `Blob "${missingEntry.blobHash}" was not found`,
    });
  });

  it('ignores collector failures without changing pull results', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-failing-collector',
      name: 'main',
      initialFiles: createFiles(smallRepoFileCount, smallRepoFileSize, 'failing-collector'),
    });
    const failingCollector: VscFileMetricsCollector = {
      increment() {
        throw new Error('collector failed');
      },
    };

    const pull = await service.pull(
      { repoId: repository.id, includeContent: 'all' },
      { metricsCollector: failingCollector },
    );

    expect(pull.files).toHaveLength(smallRepoFileCount);
    expect(pull.files?.every((file) => typeof file.content === 'string')).toBe(true);
  });

  it('fetches getFile content by blob hash after locating the tree entry', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-small',
      name: 'main',
      initialFiles: createFiles(smallRepoFileCount, smallRepoFileSize, 'small'),
    });
    const pull = await service.pull({ repoId: repository.id });
    const targetEntry = pull.files?.find((file) => file.path === 'small/file-003.txt');
    if (!targetEntry) {
      throw new Error('Expected small/file-003.txt metadata');
    }

    const treeEntryFindOne = vi.spyOn(db.getRepository('vscFileTreeEntries'), 'findOne');
    const blobFindOne = vi.spyOn(db.getRepository('vscFileBlobs'), 'findOne');

    const file = await service.getFile({
      repoId: repository.id,
      path: targetEntry.path,
    });

    expect(file).toMatchObject({
      path: targetEntry.path,
      blobHash: targetEntry.blobHash,
      content: contentOfSize(smallRepoFileSize, 'small-3'),
    });
    expect(treeEntryFindOne).toHaveBeenCalledTimes(1);
    expect(blobFindOne).toHaveBeenCalledTimes(1);
    expect(blobFindOne.mock.calls[0]?.[0]).toMatchObject({
      filterByTk: targetEntry.blobHash,
    });
    expect(firstInvocationOrder(treeEntryFindOne)).toBeLessThan(firstInvocationOrder(blobFindOne));
  });

  it('pages commit history with seq cursors and repository limits', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-history',
      name: 'main',
    });
    const commits = await createSequentialCommits(service, repository.id, 4);
    const commitFind = vi.spyOn(db.getRepository('vscFileCommits'), 'find');

    const firstPage = await service.listCommits({
      repoId: repository.id,
      limit: 2,
    });
    const secondPage = await service.listCommits({
      repoId: repository.id,
      beforeSeq: firstPage[firstPage.length - 1].seq,
      limit: 2,
    });

    expect(commits.map((commit) => commit.seq)).toEqual([1, 2, 3, 4]);
    expect(firstPage.map((commit) => commit.seq)).toEqual([4, 3]);
    expect(secondPage.map((commit) => commit.seq)).toEqual([2, 1]);
    expect(commitFind.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        filter: {
          repoId: repository.id,
        },
        sort: expect.arrayContaining(['-seq']),
        limit: 2,
      }),
    );
    expect(commitFind.mock.calls[0]?.[0]).not.toHaveProperty('offset');
    expect(commitFind.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        filter: {
          repoId: repository.id,
          seq: {
            $lt: 3,
          },
        },
        sort: expect.arrayContaining(['-seq']),
        limit: 2,
      }),
    );
    expect(commitFind.mock.calls[1]?.[0]).not.toHaveProperty('offset');
    expect(firstPage[0].seq).toBeGreaterThan(firstPage[1].seq);
    expect(secondPage[0].seq).toBeGreaterThan(secondPage[1].seq);
    expect(firstPage[1].seq).toBeGreaterThan(secondPage[0].seq);
  });

  it('uses the default commit history page size when no limit is provided', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-history-default',
      name: 'main',
    });
    await createSequentialCommits(service, repository.id, 4);
    const commitFind = vi.spyOn(db.getRepository('vscFileCommits'), 'find');

    await service.listCommits({
      repoId: repository.id,
    });

    expect(commitFind.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        filter: {
          repoId: repository.id,
        },
        sort: expect.arrayContaining(['-seq']),
        limit: commitHistoryDefaultLimit,
      }),
    );
    expect(commitFind.mock.calls[0]?.[0]).not.toHaveProperty('offset');
  });

  it('rejects invalid commit history cursors and limits', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-history-invalid',
      name: 'main',
    });

    await expect(
      service.listCommits({
        repoId: repository.id,
        limit: 0,
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
    await expect(
      service.listCommits({
        repoId: repository.id,
        beforeSeq: 0,
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
  });

  it('does not compute text diffs for unchanged files in a medium repository summary', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-diff-summary',
      name: 'main',
      initialFiles: createFiles(mediumRepoFileCount, mediumRepoFileSize, 'diff'),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const next = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'change one file',
      files: [{ path: 'diff/file-042.txt', content: contentOfSize(mediumRepoFileSize, 'diff-changed') }],
    });
    const blobFindOne = vi.spyOn(db.getRepository('vscFileBlobs'), 'findOne');

    const diff = await service.diffCommits({
      repoId: repository.id,
      fromCommitId: initialCommit.id,
      toCommitId: next.commit.id,
    });

    expect(diff.summary).toEqual({
      added: 0,
      modified: 1,
      deleted: 0,
      unchanged: mediumRepoFileCount - 1,
      renamed: 0,
    });
    expect(blobFindOne).toHaveBeenCalledTimes(2);
  });

  it('returns a cutoff response for over-limit blob diffs', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-large-diff',
      name: 'main',
    });
    const largeContent = 'x'.repeat(diffMaxFileSize + 1);
    const largeHash = sha256Hex(largeContent);
    await db.getRepository('vscFileBlobs').create({
      values: {
        hash: largeHash,
        size: Buffer.byteLength(largeContent, 'utf8'),
        content: largeContent,
      },
    });

    const diff = await diffService.diffFile({
      repoId: repository.id,
      from: { type: 'blob', blobHash: largeHash },
      to: null,
    });

    expect(diff).toEqual({
      tooLarge: true,
      hunks: [],
    });
  });

  it('rejects oversized content, unauthorized hash-only files, and oversized repositories before writing commits', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-limits',
      name: 'main',
    });

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'oversized file',
        files: [{ path: 'large.txt', content: 'x'.repeat(maxFileSize + 1) }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'FILE_TOO_LARGE',
    });

    const oversizedContent = 'y'.repeat(maxFileSize + 1);
    const oversizedBlobHash = sha256Hex(oversizedContent);
    await db.getRepository('vscFileBlobs').create({
      values: {
        hash: oversizedBlobHash,
        size: Buffer.byteLength(oversizedContent, 'utf8'),
        content: oversizedContent,
      },
    });
    const commitCountBeforeHashOnlyPush = await db.getRepository('vscFileCommits').count({
      filter: {
        repoId: repository.id,
      },
    });
    const treeCountBeforeHashOnlyPush = await db.getRepository('vscFileTrees').count();

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'oversized hash-only file',
        files: [{ path: 'large-hash-only.txt', blobHash: oversizedBlobHash }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'PERMISSION_DENIED',
    });
    expect(
      await db.getRepository('vscFileCommits').count({
        filter: {
          repoId: repository.id,
        },
      }),
    ).toBe(commitCountBeforeHashOnlyPush);
    expect(await db.getRepository('vscFileTrees').count()).toBe(treeCountBeforeHashOnlyPush);

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'too many files',
        files: createFiles(maxFilesPerRepo + 1, 32, 'too-many'),
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'REPO_LIMIT_EXCEEDED',
    });

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'repo too large',
        files: createFiles(Math.floor(maxRepoTextSize / maxFileSize) + 1, maxFileSize, 'too-large'),
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'REPO_LIMIT_EXCEEDED',
    });
  });

  it('rejects oversized commit messages and paths', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'performance-field-limits',
      name: 'main',
    });

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'x'.repeat(maxCommitMessageLength + 1),
        files: [{ path: 'README.md', content: '# Demo\n' }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
      details: {
        maxCommitMessageLength,
      },
    });

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'path too long',
        files: [{ path: `${'a'.repeat(maxPathLength + 1)}.txt`, content: '# Demo\n' }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
  });
});

async function createSequentialCommits(
  vscFileService: VscFileService,
  repoId: string,
  count: number,
): Promise<VscCommitRecord[]> {
  const commits: VscCommitRecord[] = [];
  let baseCommitId: string | null = null;

  for (let index = 0; index < count; index += 1) {
    const pushed = await vscFileService.push({
      repoId,
      baseCommitId,
      message: `commit ${index + 1}`,
      files: [{ path: 'README.md', content: `# Revision ${index + 1}\n` }],
    });
    commits.push(pushed.commit);
    baseCommitId = pushed.commit.id;
  }

  return commits;
}

function createFiles(count: number, size: number, prefix: string): VscTreeEntryInput[] {
  return Array.from({ length: count }, (_, index) => ({
    path: `${prefix}/file-${String(index).padStart(3, '0')}.txt`,
    content: contentOfSize(size, `${prefix}-${index}`),
  }));
}

function contentOfSize(size: number, seed: string): string {
  const prefix = `${seed}\n`;
  const prefixSize = Buffer.byteLength(prefix, 'utf8');
  if (prefixSize > size) {
    throw new Error(`Seed "${seed}" exceeds requested fixture size`);
  }

  return `${prefix}${'x'.repeat(size - prefixSize)}`;
}

function firstInvocationOrder(spy: { mock: { invocationCallOrder: number[] } }): number {
  const order = spy.mock.invocationCallOrder[0];
  if (typeof order !== 'number') {
    throw new Error('Expected spy to be invoked');
  }

  return order;
}

function createMetricsCollector() {
  const counters: Record<VscFileMetricCounterName, number> = {
    blobContentQueryCount: 0,
    blobContentRowCount: 0,
    treeNormalizationCount: 0,
  };
  const collector: VscFileMetricsCollector = {
    increment(counter, value = 1) {
      counters[counter] += value;
    },
  };

  return {
    collector,
    counters,
    reset() {
      for (const counter of Object.keys(counters) as VscFileMetricCounterName[]) {
        counters[counter] = 0;
      }
    },
  };
}
