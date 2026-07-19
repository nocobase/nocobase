/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginVscFileServer, { RemoteSyncError } from '@nocobase/plugin-vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { LightExtensionError } from '../../shared/errors';
import { DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES } from '../../shared/default-template';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';

describe('plugin-light-extension repo service', () => {
  let app: MockServer;
  let service: LightExtensionRepoService;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
    });
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    service = new LightExtensionRepoService(app.db, auditService, permissionService);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('creates light-extension and vsc repositories with the light-extension owner boundary', async () => {
    const repo = await service.createRepo(
      {
        name: 'Sales Widgets',
        title: 'Sales widgets',
        initialFiles: [
          {
            path: 'README.md',
            content: '# secret README content',
            language: 'markdown',
          },
        ],
      },
      {
        actorUserId: '1',
        requestId: 'req_create_repo',
      },
    );

    expect(repo).toMatchObject({
      id: expect.stringMatching(/^ler_/),
      name: 'Sales Widgets',
      normalizedName: 'sales-widgets',
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
    });
    expect(repo).not.toHaveProperty('vscRepoId');
    expect(repo.headCommitId).toEqual(expect.stringMatching(/^vscc_/));

    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = repoRecord?.get('vscRepoId') as string;
    const vscRepo = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: vscRepoId,
    });

    expect(vscRepo).toBeTruthy();
    expect(vscRepo?.get('ownerType')).toBe('light-extension');
    expect(vscRepo?.get('ownerId')).toBe(repo.id);
    expect(vscRepo?.get('name')).toBe('source');
    expect(vscRepo?.get('headCommitId')).toBe(repo.headCommitId);

    const logs = await app.db.getRepository('lightExtensionLogs').find({
      filter: {
        repoId: repo.id,
      },
      sort: ['createdAt'],
    });
    expect(logs.map((log) => log.get('action'))).toEqual(expect.arrayContaining(['repoCreate', 'sourceCreate']));
    expect(JSON.stringify(logs.map((log) => log.toJSON()))).not.toContain('secret README content');
  });

  it('returns a typed conflict when a repository name already exists', async () => {
    await service.createRepo({ name: 'Duplicate Repo' }, { requestId: 'req_duplicate_create' });

    await expect(
      service.createRepo({ name: 'duplicate repo' }, { requestId: 'req_duplicate_conflict' }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_CONFLICT',
      status: 409,
      details: {
        normalizedName: 'duplicate-repo',
      },
    });
  });

  it('updates repository display metadata without changing its technical identity', async () => {
    const repo = await service.createRepo(
      {
        name: 'Stable Technical Name',
        title: 'Original display name',
        description: 'Original description',
      },
      { requestId: 'req_update_repo_create' },
    );

    const updated = await service.updateRepo(
      {
        repoId: repo.id,
        title: 'Updated display name',
        description: 'Updated description',
      },
      { requestId: 'req_update_repo' },
    );

    expect(updated).toMatchObject({
      id: repo.id,
      name: 'Stable Technical Name',
      normalizedName: 'stable-technical-name',
      title: 'Updated display name',
      description: 'Updated description',
    });
    await expect(
      app.db.getRepository('lightExtensionLogs').count({
        filter: {
          repoId: repo.id,
          action: 'repoUpdate',
        },
      }),
    ).resolves.toBe(1);

    await service.updateRepo(
      {
        repoId: repo.id,
        title: 'Updated display name',
        description: 'Updated description',
      },
      { requestId: 'req_update_repo_noop' },
    );
    await expect(
      app.db.getRepository('lightExtensionLogs').count({
        filter: {
          repoId: repo.id,
          action: 'repoUpdate',
        },
      }),
    ).resolves.toBe(1);
  });

  it('creates the default template as the first commit for an empty initialFiles array', async () => {
    const repo = await service.createRepo(
      {
        name: 'Empty Initial Files',
        initialFiles: [],
      },
      {
        requestId: 'req_empty_initial_files',
      },
    );
    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = repoRecord?.get('vscRepoId') as string;
    const vscRepo = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: vscRepoId,
    });

    expect(repo.headCommitId).toEqual(expect.stringMatching(/^vscc_/));
    expect(vscRepo?.get('headCommitId')).toBe(repo.headCommitId);
    expect(
      await app.db.getRepository('vscFileCommits').count({
        filter: {
          repoId: vscRepoId,
        },
      }),
    ).toBe(1);
    expect(
      await app.db.getRepository('lightExtensionLogs').count({
        filter: {
          repoId: repo.id,
          action: 'sourceCreate',
        },
      }),
    ).toBe(1);

    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const fileService = new LightExtensionFileService(app.db, auditService, permissionService, service);
    const pull = await fileService.pull({ repoId: repo.id, includeContent: 'all' });
    expect(pull.files?.map((file) => file.path).sort()).toEqual(
      DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => file.path).sort(),
    );
  });

  it('changes lifecycle without client compare-and-set input and archives the vsc repository', async () => {
    const repo = await service.createRepo({ name: 'Lifecycle Demo' }, { requestId: 'req_lifecycle_create' });
    const refreshReferencesForRepo = vi.fn(async () => undefined);
    service.useReferenceService({ refreshReferencesForRepo } as never);

    const disabled = await service.changeLifecycle(
      {
        repoId: repo.id,
        lifecycleStatus: 'disabled',
      },
      {
        requestId: 'req_lifecycle_disable',
      },
    );

    expect(disabled.lifecycleStatus).toBe('disabled');
    const enabled = await service.changeLifecycle(
      {
        repoId: repo.id,
        lifecycleStatus: 'enabled',
      },
      {
        requestId: 'req_lifecycle_enable',
      },
    );
    expect(enabled.lifecycleStatus).toBe('enabled');
    await service.changeLifecycle(
      {
        repoId: repo.id,
        lifecycleStatus: 'disabled',
      },
      {
        requestId: 'req_lifecycle_disable_again',
      },
    );

    const archived = await service.archiveRepo(
      {
        repoId: repo.id,
      },
      {
        requestId: 'req_lifecycle_archive',
      },
    );
    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = repoRecord?.get('vscRepoId') as string;
    const vscRepo = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: vscRepoId,
    });

    expect(archived.lifecycleStatus).toBe('archived');
    expect(vscRepo?.get('status')).toBe('archived');
    const archivedAgain = await service.archiveRepo(
      {
        repoId: repo.id,
      },
      {
        requestId: 'req_lifecycle_archive_idempotent',
      },
    );

    expect(archivedAgain.lifecycleStatus).toBe('archived');
    expect(refreshReferencesForRepo).toHaveBeenCalledTimes(4);
    expect(refreshReferencesForRepo.mock.calls).toEqual(
      Array.from({ length: 4 }, () => [
        repo.id,
        expect.objectContaining({ transaction: expect.anything() }),
        'repo_lifecycle_change',
      ]),
    );
    await expect(
      service.changeLifecycle(
        {
          repoId: repo.id,
          lifecycleStatus: 'enabled',
        },
        {
          requestId: 'req_lifecycle_reenable',
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_ARCHIVED',
      status: 409,
    });
    const archivedBlockedLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'repoLifecycleChange',
        result: 'blocked',
        reasonCode: 'repo_archived',
      },
    });

    expect(archivedBlockedLog).toBeTruthy();
  });

  it('blocks archive and delete while the shared remote lifecycle gate reports an active job', async () => {
    const repo = await service.createRepo({ name: 'Lifecycle Busy' }, { requestId: 'req_lifecycle_busy_create' });
    const assertRepositoryIdle = vi.fn(async () => {
      throw new RemoteSyncError('BUSY', 'Repository has an active synchronization job', {
        details: { reasonCode: 'active-sync-job' },
      });
    });
    service.useRemoteSyncLifecycleGate({ assertRepositoryIdle });

    await expect(service.archiveRepo({ repoId: repo.id })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SYNC_BUSY',
      status: 409,
    });
    await expect(service.deleteRepo({ repoId: repo.id })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SYNC_BUSY',
      status: 409,
    });
    expect(assertRepositoryIdle).toHaveBeenCalledTimes(2);
  });

  it('allows lifecycle changes after source writes without a repo version precondition', async () => {
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const repoService = new LightExtensionRepoService(app.db, auditService, permissionService);
    const fileService = new LightExtensionFileService(app.db, auditService, permissionService, repoService);
    const repo = await repoService.createRepo({ name: 'Source Lifecycle' }, { requestId: 'req_source_create' });
    await fileService.push(
      {
        repoId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'source write before lifecycle change',
        files: [
          {
            path: 'README.md',
            content: '# updated\n',
          },
        ],
      },
      {
        requestId: 'req_source_push',
      },
    );

    const archived = await repoService.archiveRepo(
      {
        repoId: repo.id,
      },
      {
        requestId: 'req_source_archive',
      },
    );

    expect(archived.lifecycleStatus).toBe('archived');
  });

  it('rejects delete when references exist without suggesting an unavailable UI action', async () => {
    const repo = await service.createRepo({ name: 'Referenced Repo' }, { requestId: 'req_reference_create' });
    await app.db.getRepository('lightExtensionReferences').create({
      values: {
        repoId: repo.id,
        entryId: 'lee_referenced',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          flowModelId: 'flow_1',
          stepId: 'step_1',
        },
        ownerLocatorHash: 'owner_hash_1',
      },
    });

    await expect(service.deleteRepo({ repoId: repo.id }, { requestId: 'req_delete_referenced' })).rejects.toMatchObject(
      {
        code: 'LIGHT_EXTENSION_REFERENCE_EXISTS',
        status: 409,
        message: 'Light extension repository is referenced and cannot be deleted',
      },
    );

    expect(await app.db.getRepository('lightExtensionRepos').findOne({ filterByTk: repo.id })).toBeTruthy();
    const blockedLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'repoDelete',
        result: 'blocked',
      },
    });
    expect(blockedLog?.get('reasonCode')).toBe('references_exist');
  });

  it('deletes unreferenced light-extension metadata after archiving source storage', async () => {
    const repo = await service.createRepo({ name: 'Delete Demo' }, { requestId: 'req_delete_create' });
    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = repoRecord?.get('vscRepoId') as string;
    await app.db.getRepository('lightExtensionEntries').create({
      values: {
        repoId: repo.id,
        target: 'client',
        kind: 'jsBlock',
        entryName: 'main',
        entryPath: 'src/client/index.tsx',
        descriptorPath: 'src/client/entry.json',
        compiledCommitId: 'vscc_deleted',
        runtimeArtifact: {
          code: 'ctx.render("deleted");',
          version: 'v2',
          entryPath: 'src/client/index.tsx',
        },
        runtimeVersion: 'v2',
        surfaceStyle: 'render',
        runtimeCodeHash: 'runtime_hash',
        filesHash: 'files_hash',
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
        compiledAt: new Date(),
      },
    });

    const deleted = await service.deleteRepo({ repoId: repo.id }, { requestId: 'req_delete_success' });
    const vscRepo = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: vscRepoId,
    });

    expect(deleted.id).toBe(repo.id);
    expect(deleted).not.toHaveProperty('vscRepoId');
    expect(await app.db.getRepository('lightExtensionRepos').findOne({ filterByTk: repo.id })).toBeNull();
    expect(await app.db.getRepository('lightExtensionEntries').count({ filter: { repoId: repo.id } })).toBe(0);
    expect(vscRepo?.get('status')).toBe('archived');
    await expect(
      app.db.getRepository('lightExtensionReferences').create({
        values: {
          repoId: repo.id,
          entryId: 'lee_after_delete',
          ownerKind: 'flowModel.step',
          ownerLocator: {
            kind: 'flowModel.step',
            flowModelId: 'flow_after_delete',
            stepId: 'step_after_delete',
          },
          ownerLocatorHash: 'owner_hash_after_delete',
        },
      }),
    ).rejects.toThrow();
  });

  it('throws a typed not-found error for missing repositories', async () => {
    await expect(service.getRepo('ler_missing')).rejects.toBeInstanceOf(LightExtensionError);
  });
});
