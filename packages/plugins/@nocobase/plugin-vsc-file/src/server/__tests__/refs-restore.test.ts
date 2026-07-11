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
import { CommitService } from '../services/CommitService';
import { VscFileService } from '../services/VscFileService';

describe('vsc-file refs and restore service', () => {
  let db: Database;
  let service: VscFileService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();

    service = new VscFileService(db);
  });

  afterEach(async () => {
    await db?.close();
  });

  it('lists the built-in head ref', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: baseFiles(),
    });
    const refs = await service.listRefs({ repoId: repository.id });

    expect(refs.map((ref) => ref.name)).toEqual(['head']);
    expect(refs.find((ref) => ref.name === 'head')).toMatchObject({
      repoId: repository.id,
      commitId: initialCommit?.id,
    });
  });

  it('rejects unsupported ref names', async () => {
    const history = await createHistory();

    await expect(
      service.updateRef({
        repoId: history.repository.id,
        name: 'release',
        targetCommitId: history.second.commit.id,
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'PATH_INVALID',
    });
  });

  it('supports head ref updates without allowing reset-style jumps', async () => {
    const history = await createHistory();
    const currentHead = await service.updateRef({
      repoId: history.repository.id,
      name: 'head',
      targetCommitId: history.second.commit.id,
    });

    expect(currentHead.repository.headCommitId).toBe(history.second.commit.id);
    expect(currentHead.ref.commitId).toBe(history.second.commit.id);

    await expect(
      service.updateRef({
        repoId: history.repository.id,
        name: 'head',
        targetCommitId: history.first.commit.id,
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'BASE_COMMIT_OUTDATED',
    });
  });

  it('advances head to an existing next linear commit', async () => {
    const history = await createHistory();
    const commitService = new CommitService(db);
    const preparedCommit = await commitService.createCommit({
      repoId: history.repository.id,
      seq: 3,
      parentCommitId: history.second.commit.id,
      treeHash: history.second.commit.treeHash,
      message: 'prepared linear child',
    });

    const updated = await service.updateRef({
      repoId: history.repository.id,
      name: 'head',
      targetCommitId: preparedCommit.id,
    });

    expect(updated.repository).toMatchObject({
      headCommitId: preparedCommit.id,
      headSeq: 3,
    });
    expect(updated.ref.commitId).toBe(preparedCommit.id);
  });

  it('rejects cross-repository commit IDs for refs and restore operations', async () => {
    const history = await createHistory('demo');
    const otherHistory = await createHistory('other');

    await expect(
      service.updateRef({
        repoId: history.repository.id,
        name: 'head',
        targetCommitId: otherHistory.first.commit.id,
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'COMMIT_NOT_FOUND',
    });
    await expect(
      service.restoreCommit({
        repoId: history.repository.id,
        sourceCommitId: otherHistory.first.commit.id,
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'COMMIT_NOT_FOUND',
    });
  });

  it('restores one file by creating a new commit on top of head', async () => {
    const history = await createHistory();
    const restored = await service.restoreFile({
      repoId: history.repository.id,
      sourceCommitId: history.first.commit.id,
      path: 'README.md',
      message: 'restore readme',
    });
    const pull = await service.pull({
      repoId: history.repository.id,
      includeContent: 'all',
    });

    expect(restored.commit).toMatchObject({
      seq: 3,
      parentCommitId: history.second.commit.id,
      message: 'restore readme',
    });
    expect(restored.repository.headCommitId).toBe(restored.commit.id);
    expect(fileContent(pull.files, 'README.md')).toBe('# Demo\n');
    expect(fileContent(pull.files, 'src/index.ts')).toBe('export const value = 2;\n');
    expect(fileContent(pull.files, 'src/extra.ts')).toBe('export const extra = true;\n');
  });

  it('restores a file missing from the source commit by deleting the current file', async () => {
    const history = await createHistory();
    const restored = await service.restoreFile({
      repoId: history.repository.id,
      sourceCommitId: history.first.commit.id,
      path: 'src/extra.ts',
    });
    const pull = await service.pull({
      repoId: history.repository.id,
      includeContent: 'all',
    });

    expect(restored.commit.parentCommitId).toBe(history.second.commit.id);
    expect(pull.files?.find((entry) => entry.path === 'src/extra.ts')).toBeUndefined();
    expect(fileContent(pull.files, 'README.md')).toBe('# Demo updated\n');
    expect(fileContent(pull.files, 'src/index.ts')).toBe('export const value = 2;\n');
  });

  it('restores a commit tree without rewriting earlier commits', async () => {
    const history = await createHistory();
    const restored = await service.restoreCommit({
      repoId: history.repository.id,
      sourceCommitId: history.first.commit.id,
      message: 'restore first commit',
    });
    const pull = await service.pull({
      repoId: history.repository.id,
      includeContent: 'all',
    });
    const commitCount = await db.getRepository('vscFileCommits').count({
      filter: {
        repoId: history.repository.id,
      },
    });
    const firstStillExists = await db.getRepository('vscFileCommits').findOne({
      filterByTk: history.first.commit.id,
    });
    const secondStillExists = await db.getRepository('vscFileCommits').findOne({
      filterByTk: history.second.commit.id,
    });

    expect(restored.commit).toMatchObject({
      seq: 3,
      parentCommitId: history.second.commit.id,
      treeHash: history.first.commit.treeHash,
      message: 'restore first commit',
    });
    expect(restored.tree.hash).toBe(history.first.commit.treeHash);
    expect(restored.repository.headCommitId).toBe(restored.commit.id);
    expect(pull.commit?.id).toBe(restored.commit.id);
    expect(fileContent(pull.files, 'README.md')).toBe('# Demo\n');
    expect(fileContent(pull.files, 'src/index.ts')).toBe('export const value = 1;\n');
    expect(pull.files?.find((entry) => entry.path === 'src/extra.ts')).toBeUndefined();
    expect(commitCount).toBe(3);
    expect(firstStillExists).toBeTruthy();
    expect(secondStillExists).toBeTruthy();
  });

  async function createHistory(ownerId = 'demo') {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId,
      name: 'main',
      initialFiles: baseFiles(),
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }
    const second = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'second commit',
      files: [
        { path: 'README.md', content: '# Demo updated\n' },
        { path: 'src/index.ts', content: 'export const value = 2;\n' },
        { path: 'src/extra.ts', content: 'export const extra = true;\n' },
      ],
    });

    return {
      repository,
      first: {
        commit: initialCommit,
      },
      second,
    };
  }
});

function baseFiles() {
  return [
    { path: 'README.md', content: '# Demo\n' },
    { path: 'src/index.ts', content: 'export const value = 1;\n' },
  ];
}

function fileContent(
  files: Array<{ path: string; content?: string }> | undefined,
  filePath: string,
): string | undefined {
  return files?.find((entry) => entry.path === filePath)?.content;
}
