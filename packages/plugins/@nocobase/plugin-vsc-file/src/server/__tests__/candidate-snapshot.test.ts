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

import { sha256Hex } from '../../shared/hash';
import { VscFileService } from '../services/VscFileService';

describe('vsc-file canonical candidate snapshot', () => {
  let db: Database;
  let service: VscFileService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({ directory: path.resolve(__dirname, '../collections') });
    await db.sync();
    service = new VscFileService(db);
  });

  afterEach(async () => {
    await db?.close();
  });

  it('materializes one canonical snapshot from the prepared tree', async () => {
    const created = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'candidate-test',
      name: 'main',
      initialFiles: [
        { path: 'README.md', content: 'remove me\n' },
        { path: 'src/keep.ts', content: 'export const keep = "保留";\n' },
        { path: 'src/update.ts', content: 'export const oldValue = true;\n' },
      ],
    });
    const initialCommit = created.initialCommit;
    if (!initialCommit) {
      throw new Error('Expected the fixture repository to have an initial commit');
    }
    const counters = new Map<string, number>();
    const result = await service.pushWithCandidate(
      {
        repoId: created.repository.id,
        baseCommitId: initialCommit.id,
        message: 'canonical candidate',
        files: [
          { path: 'src\\update.ts', content: '\uFEFFexport const value = "多字节";\r\n' },
          { path: 'README.md', operation: 'delete' },
          { path: 'src/new.ts', content: 'export const first = 1;\rexport const second = 2;\r\n' },
        ],
      },
      {
        metricsCollector: {
          increment(counter, amount = 1) {
            counters.set(counter, (counters.get(counter) || 0) + amount);
          },
        },
      },
    );

    const expectedContents = new Map([
      ['src/keep.ts', 'export const keep = "保留";\n'],
      ['src/new.ts', 'export const first = 1;\nexport const second = 2;\n'],
      ['src/update.ts', 'export const value = "多字节";\n'],
    ]);
    expect(result.candidate).toMatchObject({
      baseCommitId: initialCommit.id,
      baseTreeHash: initialCommit.treeHash,
      commitId: result.commit.id,
      treeHash: result.tree.hash,
      changedPaths: ['README.md', 'src/new.ts', 'src/update.ts'],
      changes: [
        { path: 'README.md', operation: 'delete', kind: 'deleted' },
        { path: 'src/new.ts', operation: 'upsert', kind: 'added' },
        { path: 'src/update.ts', operation: 'upsert', kind: 'modified' },
      ],
    });
    expect(result.candidate.files.map((file) => file.path)).toEqual([...expectedContents.keys()]);
    for (const file of result.candidate.files) {
      const content = expectedContents.get(file.path);
      if (content === undefined) {
        throw new Error(`Unexpected candidate path: ${file.path}`);
      }
      expect(file.content).toBe(content);
      expect(file.size).toBe(Buffer.byteLength(content, 'utf8'));
      expect(file.blobHash).toBe(sha256Hex(content));
    }
    expect(result.commit.treeHash).toBe(result.candidate.treeHash);
    expect(counters.get('blobContentQueryCount')).toBe(1);
    expect(counters.get('blobContentRowCount')).toBe(1);
  });

  it('keeps the ordinary push result free of source snapshots', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'candidate-test',
      name: 'main',
    });
    const result = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'ordinary push',
      files: [{ path: 'README.md', content: '# Public\n' }],
    });

    expect(Object.keys(result).sort()).toEqual(['commit', 'repository', 'tree']);
    expect(result).not.toHaveProperty('candidate');
  });

  it('loads unchanged content with one batch query for a 200-file candidate', async () => {
    const initialFiles = Array.from({ length: 200 }, (_, index) => ({
      path: `src/file-${String(index).padStart(3, '0')}.ts`,
      content: `export const value${index} = ${index};\n`,
    }));
    const created = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'candidate-performance-test',
      name: 'main',
      initialFiles,
    });
    const initialCommit = created.initialCommit;
    if (!initialCommit) {
      throw new Error('Expected the fixture repository to have an initial commit');
    }
    const counters = new Map<string, number>();

    const result = await service.pushWithCandidate(
      {
        repoId: created.repository.id,
        baseCommitId: initialCommit.id,
        message: 'change one file',
        files: [{ path: 'src/file-107.ts', content: 'export const value107 = "changed";\r\n' }],
      },
      {
        metricsCollector: {
          increment(counter, amount = 1) {
            counters.set(counter, (counters.get(counter) || 0) + amount);
          },
        },
      },
    );

    expect(result.candidate.files).toHaveLength(200);
    expect(result.candidate.changedPaths).toEqual(['src/file-107.ts']);
    expect(result.candidate.files[107]).toMatchObject({
      path: 'src/file-107.ts',
      content: 'export const value107 = "changed";\n',
    });
    expect(counters.get('blobContentQueryCount')).toBe(1);
    expect(counters.get('blobContentRowCount')).toBe(199);
  });

  it('validates against the already loaded base tree and rolls back failures', async () => {
    const created = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'candidate-test',
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# Base\n' }],
    });
    const initialCommit = created.initialCommit;
    if (!initialCommit) {
      throw new Error('Expected the fixture repository to have an initial commit');
    }
    const validationError = new Error('base tree rejected');

    await expect(
      service.pushWithCandidate(
        {
          repoId: created.repository.id,
          baseCommitId: initialCommit.id,
          message: 'rejected push',
          files: [{ path: 'README.md', content: '# Changed\n' }],
        },
        {},
        {
          validateBaseEntries(entries) {
            expect(entries.map((entry) => entry.path)).toEqual(['README.md']);
            throw validationError;
          },
        },
      ),
    ).rejects.toBe(validationError);

    const repository = await service.getRepository({ repoId: created.repository.id });
    expect(repository.headCommitId).toBe(initialCommit.id);
    expect(await db.getRepository('vscFileCommits').count({ filter: { repoId: repository.id } })).toBe(1);
  });
});
