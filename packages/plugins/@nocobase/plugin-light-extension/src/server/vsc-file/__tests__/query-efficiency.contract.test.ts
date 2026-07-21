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

import type { VscTreeEntryInput } from '../../../shared/vsc-file/types';
import type { VscFileMetricCounterName, VscFileMetricsCollector } from '../services/VscFileMetrics';
import { VscFileService } from '../services/VscFileService';

const largeFixtureSize = 10;
const smallFixtureSize = 5;

describe('vsc-file query efficiency contracts', () => {
  let db: Database;
  let service: VscFileService;
  let largeRepoId: string;
  let smallRepoId: string;

  beforeAll(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    service = new VscFileService(db);
    largeRepoId = (
      await service.createRepository({
        ownerType: 'plugin',
        ownerId: 'query-large',
        name: 'main',
        initialFiles: createFiles(largeFixtureSize, 'large'),
      })
    ).repository.id;
    smallRepoId = (
      await service.createRepository({
        ownerType: 'plugin',
        ownerId: 'query-small',
        name: 'main',
        initialFiles: createFiles(smallFixtureSize, 'small'),
      })
    ).repository.id;
  });

  afterAll(async () => {
    await db.close();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps omitted and explicit none pulls metadata-only without blob queries', async () => {
    const blobFind = vi.spyOn(db.getRepository('vscFileBlobs'), 'find');
    const blobFindOne = vi.spyOn(db.getRepository('vscFileBlobs'), 'findOne');

    for (const input of [{ repoId: largeRepoId }, { repoId: largeRepoId, includeContent: 'none' as const }]) {
      blobFind.mockClear();
      blobFindOne.mockClear();

      const pull = await service.pull(input);

      expect(pull.files).toHaveLength(largeFixtureSize);
      expect(pull.files?.every((file) => !Object.prototype.hasOwnProperty.call(file, 'content'))).toBe(true);
      expect(blobFind).toHaveBeenCalledTimes(0);
      expect(blobFindOne).toHaveBeenCalledTimes(0);
    }
  });

  it('loads selected and all content with one batch query independent of fixture size', async () => {
    const blobFind = vi.spyOn(db.getRepository('vscFileBlobs'), 'find');
    const blobFindOne = vi.spyOn(db.getRepository('vscFileBlobs'), 'findOne');
    const selectedPaths = ['large/file-001.txt', 'large/file-008.txt', 'large/missing.txt'];

    const selected = await service.pull({
      repoId: largeRepoId,
      includeContent: 'selected',
      selectedPaths,
    });

    expect(selected.files?.filter((file) => typeof file.content === 'string')).toHaveLength(2);
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

    for (const [repoId, fileCount] of [
      [largeRepoId, largeFixtureSize],
      [smallRepoId, smallFixtureSize],
    ] as const) {
      blobFind.mockClear();
      blobFindOne.mockClear();

      const pull = await service.pull({ repoId, includeContent: 'all' });

      expect(pull.files).toHaveLength(fileCount);
      expect(pull.files?.every((file) => typeof file.content === 'string')).toBe(true);
      expect(blobFind).toHaveBeenCalledTimes(1);
      expect(blobFindOne).toHaveBeenCalledTimes(0);
    }

    blobFind.mockClear();
    blobFindOne.mockClear();
    const selectedMiss = await service.pull({
      repoId: largeRepoId,
      includeContent: 'selected',
      selectedPaths: ['large/missing.txt'],
    });
    expect(selectedMiss.files?.every((file) => !Object.prototype.hasOwnProperty.call(file, 'content'))).toBe(true);
    expect(blobFind).toHaveBeenCalledTimes(0);
    expect(blobFindOne).toHaveBeenCalledTimes(0);
  });

  it('prepares a one-file delta with one metadata query and one normalization', async () => {
    const metrics = createMetricsCollector();
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'query-delta',
      name: 'main',
      initialFiles: createFiles(largeFixtureSize, 'delta'),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const blobFind = vi.spyOn(db.getRepository('vscFileBlobs'), 'find');
    const blobFindOne = vi.spyOn(db.getRepository('vscFileBlobs'), 'findOne');

    await service.push(
      {
        repoId: repository.id,
        baseCommitId: initialCommit.id,
        message: 'change one file',
        files: [{ path: 'delta/file-004.txt', content: 'changed\n' }],
      },
      { metricsCollector: metrics.collector },
    );

    expect(blobFind).toHaveBeenCalledTimes(1);
    expect(blobFind.mock.calls[0]?.[0]).toMatchObject({
      filter: {
        hash: { $in: expect.any(Array) },
      },
      fields: ['hash', 'size'],
    });
    expect((blobFind.mock.calls[0]?.[0] as { filter: { hash: { $in: string[] } } }).filter.hash.$in).toHaveLength(
      largeFixtureSize - 1,
    );
    expect(blobFindOne).toHaveBeenCalledTimes(0);
    expect(metrics.counters).toEqual({
      blobContentQueryCount: 0,
      blobContentRowCount: 0,
      treeNormalizationCount: 1,
    });
  });
});

function createFiles(count: number, prefix: string): VscTreeEntryInput[] {
  return Array.from({ length: count }, (_, index) => ({
    path: `${prefix}/file-${String(index).padStart(3, '0')}.txt`,
    content: `${prefix}-${index}\n`,
  }));
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

  return { collector, counters };
}
