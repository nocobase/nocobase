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
import { sha256Hex } from '../../shared/hash';
import { VscFileService } from '../services/VscFileService';

describe('vsc-file repository and commit services', () => {
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

  it('creates and pulls an empty repository', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const pull = await service.pull({ repoId: repository.id });

    expect(repository).toMatchObject({
      status: 'active',
      defaultRef: 'head',
      headCommitId: null,
      publishedCommitId: null,
      headSeq: 0,
    });
    expect(pull).toMatchObject({
      repository: {
        id: repository.id,
      },
      commit: null,
      tree: null,
      unchanged: false,
      files: [],
    });
  });

  it('creates the first commit with baseCommitId null', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const push = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'first commit',
      files: [{ path: 'README.md', content: '# Demo\n' }],
    });

    expect(push.commit).toMatchObject({
      seq: 1,
      parentCommitId: null,
      message: 'first commit',
    });
    expect(push.repository).toMatchObject({
      headCommitId: push.commit.id,
      headSeq: 1,
    });
  });

  it('computes deterministic commit hashes from persisted commit fields', async () => {
    const metadata = {
      reason: 'unit-test',
    };
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# Demo\n' }],
      message: 'seed',
      authorId: 'author-1',
      metadata,
    });
    if (!initialCommit) {
      throw new Error('Expected an initial commit');
    }

    const expectedHash = sha256Hex(
      [
        repository.id,
        String(initialCommit.seq),
        '',
        initialCommit.treeHash,
        initialCommit.message,
        initialCommit.authorId || '',
        JSON.stringify(metadata),
      ].join('\0'),
    );

    expect(initialCommit).toMatchObject({
      seq: 1,
      parentCommitId: null,
      message: 'seed',
      authorId: 'author-1',
      metadata,
      hash: expectedHash,
    });

    const followUpMetadata = {
      reason: 'follow-up',
    };
    const followUp = await service.push({
      repoId: repository.id,
      baseCommitId: initialCommit.id,
      message: 'second',
      authorId: 'author-2',
      metadata: followUpMetadata,
      files: [{ path: 'src/index.ts', content: 'export const value = 1;\n' }],
    });
    const expectedFollowUpHash = sha256Hex(
      [
        repository.id,
        String(followUp.commit.seq),
        initialCommit.id,
        followUp.commit.treeHash,
        followUp.commit.message,
        followUp.commit.authorId || '',
        JSON.stringify(followUpMetadata),
      ].join('\0'),
    );

    expect(followUp.commit).toMatchObject({
      seq: 2,
      parentCommitId: initialCommit.id,
      message: 'second',
      authorId: 'author-2',
      metadata: followUpMetadata,
      hash: expectedFollowUpHash,
    });
  });

  it('creates an initial commit when createRepository receives initial files', async () => {
    const { repository, initialCommit } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: [
        { path: 'README.md', content: '# Demo\n' },
        { path: 'src/index.ts', content: 'export const value = 1;\n' },
      ],
    });
    const pull = await service.pull({
      repoId: repository.id,
      includeContent: 'all',
    });

    expect(initialCommit).toMatchObject({
      seq: 1,
      parentCommitId: null,
    });
    expect(repository).toMatchObject({
      headCommitId: initialCommit?.id,
      headSeq: 1,
    });
    expect(pull.files?.find((entry) => entry.path === 'README.md')).toMatchObject({
      content: '# Demo\n',
    });
    expect(pull.files?.find((entry) => entry.path === 'src/index.ts')).toMatchObject({
      content: 'export const value = 1;\n',
    });
  });

  it('creates initial files only when ensureRepository creates a missing repository', async () => {
    const first = await service.ensureRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: [{ path: 'README.md', content: '# Demo\n' }],
    });
    const second = await service.ensureRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
      initialFiles: [{ path: 'src/index.ts', content: 'export const value = 1;\n' }],
    });
    const pull = await service.pull({
      repoId: first.repository.id,
      includeContent: 'all',
    });

    expect(first.initialCommit).toMatchObject({
      seq: 1,
    });
    expect(second).toMatchObject({
      repository: {
        id: first.repository.id,
      },
      initialCommit: null,
    });
    expect(pull.files).toHaveLength(1);
    expect(pull.files?.[0]).toMatchObject({
      path: 'README.md',
      content: '# Demo\n',
    });
  });

  it('increments seq and updates repository head plus refs/head on normal push', async () => {
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
    const second = await service.push({
      repoId: repository.id,
      baseCommitId: first.commit.id,
      message: 'second commit',
      files: [{ path: 'src/index.ts', content: 'export const value = 1;\n' }],
    });
    const headRef = await db.getRepository('vscFileRefs').findOne({
      filter: {
        repoId: repository.id,
        name: 'head',
      },
    });

    expect(second.commit).toMatchObject({
      seq: 2,
      parentCommitId: first.commit.id,
    });
    expect(second.repository).toMatchObject({
      headCommitId: second.commit.id,
      headSeq: 2,
    });
    expect(headRef?.get('commitId')).toBe(second.commit.id);
  });

  it('applies deletes and allows explicit empty commits', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const first = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'first commit',
      files: [
        { path: 'README.md', content: '# Demo\n' },
        { path: 'src/index.ts', content: 'export const value = 1;\n' },
      ],
    });
    const removed = await service.push({
      repoId: repository.id,
      baseCommitId: first.commit.id,
      message: 'remove index',
      files: [{ path: 'src/index.ts', operation: 'delete' }],
    });
    const empty = await service.push({
      repoId: repository.id,
      baseCommitId: removed.commit.id,
      message: 'checkpoint',
      files: [],
      allowEmptyCommit: true,
    });
    const pull = await service.pull({
      repoId: repository.id,
      includeContent: 'all',
    });

    expect(empty.commit).toMatchObject({
      seq: 3,
      parentCommitId: removed.commit.id,
    });
    expect(empty.tree.hash).toBe(removed.tree.hash);
    expect(pull.files).toHaveLength(1);
    expect(pull.files?.[0]).toMatchObject({
      path: 'README.md',
      content: '# Demo\n',
    });
  });

  it('rejects unchanged tree pushes unless empty commits are allowed', async () => {
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
      service.push({
        repoId: repository.id,
        baseCommitId: first.commit.id,
        message: 'same tree',
        files: [],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'NO_CHANGES',
    });
  });

  it('rejects pushes to archived repositories', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });

    await db.getRepository('vscFileRepositories').update({
      filterByTk: repository.id,
      values: {
        status: 'archived',
      },
    });

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'first commit',
        files: [{ path: 'README.md', content: '# Demo\n' }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'REPO_ARCHIVED',
    });
  });

  it('rejects outdated base commits', async () => {
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
    await service.push({
      repoId: repository.id,
      baseCommitId: first.commit.id,
      message: 'second commit',
      files: [{ path: 'src/index.ts', content: 'export const value = 1;\n' }],
    });

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: first.commit.id,
        message: 'stale commit',
        files: [{ path: 'src/other.ts', content: 'export const other = 1;\n' }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'BASE_COMMIT_OUTDATED',
    });
  });

  it('returns unchanged without files when knownTreeHash matches', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const push = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'first commit',
      files: [{ path: 'README.md', content: '# Demo\n' }],
    });
    const pull = await service.pull({
      repoId: repository.id,
      knownTreeHash: push.tree.hash,
    });

    expect(pull).toMatchObject({
      unchanged: true,
      tree: {
        hash: push.tree.hash,
      },
    });
    expect(pull.files).toBeUndefined();
  });

  it('does not load blob content when includeContent is none', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'first commit',
      files: [{ path: 'README.md', content: '# Demo\n' }],
    });
    const pull = await service.pull({
      repoId: repository.id,
      includeContent: 'none',
    });

    expect(pull.files).toHaveLength(1);
    expect(pull.files?.[0]).toMatchObject({
      path: 'README.md',
      language: 'markdown',
    });
    expect(pull.files?.[0]).not.toHaveProperty('content');
  });

  it('supports selected content pulls and direct file reads', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'first commit',
      files: [
        { path: 'README.md', content: '# Demo\n' },
        { path: 'src/index.ts', content: 'export const value = 1;\n' },
      ],
    });
    const pull = await service.pull({
      repoId: repository.id,
      includeContent: 'selected',
      selectedPaths: ['src/index.ts'],
    });
    const file = await service.getFile({
      repoId: repository.id,
      path: 'README.md',
    });

    expect(pull.files?.find((entry) => entry.path === 'README.md')).not.toHaveProperty('content');
    expect(pull.files?.find((entry) => entry.path === 'src/index.ts')).toMatchObject({
      content: 'export const value = 1;\n',
    });
    expect(file).toMatchObject({
      path: 'README.md',
      content: '# Demo\n',
    });
  });

  it('rejects hash-only pushes for blobs outside the current repository context', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const secretContent = 'secret\n';
    const secretHash = sha256Hex(secretContent);
    await db.getRepository('vscFileBlobs').create({
      values: {
        hash: secretHash,
        size: Buffer.byteLength(secretContent, 'utf8'),
        content: secretContent,
      },
    });

    await expect(
      service.push({
        repoId: repository.id,
        baseCommitId: null,
        message: 'hash-only',
        files: [{ path: 'secret.txt', blobHash: secretHash }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'PERMISSION_DENIED',
    });
  });
});
