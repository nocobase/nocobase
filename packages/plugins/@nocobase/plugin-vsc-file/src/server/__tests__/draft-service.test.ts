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

import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import { VscError } from '../../shared/errors';
import { VscFileService } from '../services/VscFileService';

describe('vsc-file draft service', () => {
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

  it('saves one active draft for a repository and user', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    let permissionRepoOwner: string | null = null;
    const draft = await service.saveDraft(
      {
        repoId: repository.id,
        userId: 'user-1',
        baseCommitId: null,
        files: [{ path: 'src\\index.ts', operation: 'upsert', content: 'export const value = 1;\n' }],
      },
      {
        assertCanWrite: ({ repository: checkedRepository }) => {
          permissionRepoOwner = checkedRepository.ownerId;
        },
      },
    );
    const loaded = await service.getDraft({
      repoId: repository.id,
      userId: 'user-1',
    });

    expect(permissionRepoOwner).toBe('demo');
    expect(await db.getRepository('vscFileDrafts').count()).toBe(1);
    expect(draft.draft).toMatchObject({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: null,
      status: 'active',
      activeKey: `${repository.id}:user-1`,
    });
    expect(loaded?.files).toHaveLength(1);
    expect(loaded?.files[0]).toMatchObject({
      path: 'src/index.ts',
      operation: 'upsert',
    });
    expect(loaded?.files[0].blobHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('updates draft files on a second save with the same base without creating another draft', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const first = await service.saveDraft({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: null,
      files: [
        { path: 'README.md', operation: 'upsert', content: '# Draft\n' },
        { path: 'src/index.ts', operation: 'upsert', content: 'export const value = 1;\n' },
      ],
    });
    const originalReadme = first.files.find((file) => file.path === 'README.md');
    const second = await service.saveDraft({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: null,
      files: [{ path: 'README.md', operation: 'upsert', content: '# Updated\n' }],
    });

    expect(await db.getRepository('vscFileDrafts').count()).toBe(1);
    expect(await db.getRepository('vscFileDraftFiles').count()).toBe(2);
    expect(second.files).toHaveLength(2);
    expect(second.files.find((file) => file.path === 'src/index.ts')).toMatchObject({
      operation: 'upsert',
    });
    expect(second.files.find((file) => file.path === 'README.md')?.blobHash).not.toBe(originalReadme?.blobHash);
  });

  it('stores delete draft files without a blob hash', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const draft = await service.saveDraft({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: null,
      files: [
        { path: 'README.md', operation: 'upsert', content: '# Draft\n' },
        { path: 'src/index.ts', operation: 'delete' },
      ],
    });

    expect(draft.files.find((file) => file.path === 'src/index.ts')).toMatchObject({
      operation: 'delete',
      blobHash: null,
    });
    expect(draft.files.find((file) => file.path === 'README.md')?.blobHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects saving an active draft with a changed base commit', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const base = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'base',
      files: [{ path: 'README.md', content: '# Base\n' }],
    });

    await service.saveDraft({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: base.commit.id,
      files: [{ path: 'README.md', operation: 'upsert', content: '# Draft\n' }],
    });

    await expect(
      service.saveDraft({
        repoId: repository.id,
        userId: 'user-1',
        baseCommitId: null,
        files: [{ path: 'README.md', operation: 'upsert', content: '# Stale\n' }],
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'DRAFT_BASE_OUTDATED',
    });
  });

  it('discards an active draft and clears active draft lookup', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    await service.saveDraft({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: null,
      files: [{ path: 'README.md', operation: 'upsert', content: '# Draft\n' }],
    });
    const discarded = await service.discardDraft({
      repoId: repository.id,
      userId: 'user-1',
    });
    const loaded = await service.getDraft({
      repoId: repository.id,
      userId: 'user-1',
    });

    expect(discarded).toMatchObject({
      status: 'discarded',
      activeKey: null,
    });
    expect(loaded).toBeNull();
  });

  it('marks a draft committed when push receives draftId', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
    const base = await service.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'base',
      files: [{ path: 'README.md', content: '# Base\n' }],
    });
    const draft = await service.saveDraft({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: base.commit.id,
      files: [{ path: 'src/index.ts', operation: 'upsert', content: 'export const value = 1;\n' }],
    });

    await service.push({
      repoId: repository.id,
      baseCommitId: base.commit.id,
      message: 'commit draft',
      files: [{ path: 'src/index.ts', content: 'export const value = 1;\n' }],
      draftId: draft.draft.id,
    });

    const committedDraft = await db.getRepository('vscFileDrafts').findOne({
      filterByTk: draft.draft.id,
    });
    expect(committedDraft?.get('status')).toBe('committed');
    expect(committedDraft?.get('activeKey')).toBeNull();
  });

  it('keeps separate active drafts for two users in the same repository', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });

    await service.saveDraft({
      repoId: repository.id,
      userId: 'user-1',
      baseCommitId: null,
      files: [{ path: 'README.md', operation: 'upsert', content: '# User 1\n' }],
    });
    await service.saveDraft({
      repoId: repository.id,
      userId: 'user-2',
      baseCommitId: null,
      files: [{ path: 'README.md', operation: 'upsert', content: '# User 2\n' }],
    });

    expect(await db.getRepository('vscFileDrafts').count()).toBe(2);
    expect(await service.getDraft({ repoId: repository.id, userId: 'user-1' })).toMatchObject({
      draft: {
        userId: 'user-1',
      },
    });
    expect(await service.getDraft({ repoId: repository.id, userId: 'user-2' })).toMatchObject({
      draft: {
        userId: 'user-2',
      },
    });
  });

  it('rejects saveDraft when the facade write assertion denies access', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });

    await expect(
      service.saveDraft(
        {
          repoId: repository.id,
          userId: 'user-1',
          baseCommitId: null,
          files: [{ path: 'README.md', operation: 'upsert', content: '# Draft\n' }],
        },
        {
          assertCanWrite: () => {
            throw new VscError('PERMISSION_DENIED', 'Denied by test hook');
          },
        },
      ),
    ).rejects.toMatchObject<VscError>({
      code: 'PERMISSION_DENIED',
    });
    expect(await db.getRepository('vscFileDrafts').count()).toBe(0);
  });

  it('rejects draft saves that exceed the repository file limit', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });

    await expect(
      service.saveDraft({
        repoId: repository.id,
        userId: 'user-1',
        baseCommitId: null,
        files: Array.from({ length: maxFilesPerRepo + 1 }, (_, index) => ({
          path: `src/file-${String(index).padStart(3, '0')}.ts`,
          operation: 'upsert' as const,
          content: 'export const value = true;\n',
        })),
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'REPO_LIMIT_EXCEEDED',
    });
    expect(await db.getRepository('vscFileDraftFiles').count()).toBe(0);
  });

  it('rejects draft saves that exceed the repository text-size limit', async () => {
    const { repository } = await service.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });

    await expect(
      service.saveDraft({
        repoId: repository.id,
        userId: 'user-1',
        baseCommitId: null,
        files: Array.from({ length: Math.floor(maxRepoTextSize / maxFileSize) + 1 }, (_, index) => ({
          path: `src/large-${String(index).padStart(2, '0')}.txt`,
          operation: 'upsert' as const,
          content: 'x'.repeat(maxFileSize),
        })),
      }),
    ).rejects.toMatchObject<VscError>({
      code: 'REPO_LIMIT_EXCEEDED',
    });
    expect(await db.getRepository('vscFileDraftFiles').count()).toBe(0);
  });
});
