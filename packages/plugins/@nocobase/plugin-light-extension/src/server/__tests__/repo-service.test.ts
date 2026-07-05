/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginVscFileServer from '@nocobase/plugin-vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';

import { LightExtensionError } from '../../shared/errors';
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
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'draft',
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

  it('does not create an initial commit or source audit for an empty initialFiles array', async () => {
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

    expect(repo.headCommitId).toBeNull();
    expect(vscRepo?.get('headCommitId')).toBeNull();
    expect(
      await app.db.getRepository('vscFileCommits').count({
        filter: {
          repoId: vscRepoId,
        },
      }),
    ).toBe(0);
    expect(
      await app.db.getRepository('lightExtensionLogs').count({
        filter: {
          repoId: repo.id,
          action: 'sourceCreate',
        },
      }),
    ).toBe(0);
  });

  it('uses compare-and-set guards for lifecycle changes and archives the vsc repository', async () => {
    const repo = await service.createRepo({ name: 'Lifecycle Demo' }, { requestId: 'req_lifecycle_create' });

    const disabled = await service.changeLifecycle(
      {
        repoId: repo.id,
        lifecycleStatus: 'disabled',
        expectedLifecycleStatus: 'enabled',
      },
      {
        requestId: 'req_lifecycle_disable',
      },
    );

    expect(disabled.lifecycleStatus).toBe('disabled');
    expect(disabled.version).toBe(repo.version + 1);
    await expect(
      service.changeLifecycle(
        {
          repoId: repo.id,
          lifecycleStatus: 'enabled',
          expectedLifecycleStatus: 'enabled',
        },
        {
          requestId: 'req_lifecycle_stale',
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
      status: 409,
    });

    const archived = await service.archiveRepo(
      {
        repoId: repo.id,
        expectedLifecycleStatus: 'disabled',
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
    expect(archived.version).toBe(disabled.version + 1);
    expect(vscRepo?.get('status')).toBe('archived');
    const archivedAgain = await service.archiveRepo(
      {
        repoId: repo.id,
        expectedLifecycleStatus: 'archived',
      },
      {
        requestId: 'req_lifecycle_archive_idempotent',
      },
    );

    expect(archivedAgain.lifecycleStatus).toBe('archived');
    expect(archivedAgain.version).toBe(archived.version);
    await expect(
      service.changeLifecycle(
        {
          repoId: repo.id,
          lifecycleStatus: 'enabled',
          expectedLifecycleStatus: 'archived',
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

  it('rejects lifecycle changes with a stale repo version after source writes', async () => {
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const repoService = new LightExtensionRepoService(app.db, auditService, permissionService);
    const fileService = new LightExtensionFileService(app.db, auditService, permissionService, repoService);
    const repo = await repoService.createRepo({ name: 'Versioned Lifecycle' }, { requestId: 'req_version_create' });
    const pushResult = await fileService.push(
      {
        repoId: repo.id,
        baseCommitId: null,
        message: 'versioned source write',
        files: [
          {
            path: 'README.md',
            content: '# versioned\n',
          },
        ],
      },
      {
        requestId: 'req_version_push',
      },
    );

    expect(pushResult.repo.version).toBe(repo.version + 1);
    await expect(
      repoService.archiveRepo(
        {
          repoId: repo.id,
          expectedVersion: repo.version,
        },
        {
          requestId: 'req_version_archive_stale',
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
      status: 409,
      details: {
        expectedVersion: repo.version,
        currentVersion: pushResult.repo.version,
      },
    });
  });

  it('reports the latest lifecycle status when compare-and-set input is stale', async () => {
    const repo = await service.createRepo({ name: 'Lifecycle Race' }, { requestId: 'req_lifecycle_race_create' });
    const disabled = await service.changeLifecycle(
      {
        repoId: repo.id,
        lifecycleStatus: 'disabled',
        expectedLifecycleStatus: 'enabled',
      },
      {
        requestId: 'req_lifecycle_race_disable',
      },
    );

    await expect(
      service.changeLifecycle(
        {
          repoId: repo.id,
          lifecycleStatus: 'archived',
          expectedLifecycleStatus: 'enabled',
        },
        {
          requestId: 'req_lifecycle_race',
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
      status: 409,
      details: {
        currentLifecycleStatus: 'disabled',
        currentVersion: disabled.version,
      },
    });

    const blockedLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'repoLifecycleChange',
        result: 'blocked',
      },
    });

    expect(blockedLog?.get('details')).toMatchObject({
      currentLifecycleStatus: 'disabled',
    });
  });

  it('rejects delete when references exist and points callers to archive', async () => {
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
        message: expect.stringContaining('archive'),
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
    const entry = await app.db.getRepository('lightExtensionEntries').create({
      values: {
        repoId: repo.id,
        target: 'client',
        kind: 'jsBlock',
        entryName: 'main',
        entryPath: 'src/client/index.tsx',
      },
    });
    await app.db.getRepository('lightExtensionEntryPublications').create({
      values: {
        repoId: repo.id,
        entryId: entry.get('id'),
        commitId: 'vscc_deleted',
        entryPath: 'src/client/index.tsx',
        target: 'client',
        kind: 'jsBlock',
        surfaceStyle: 'render',
        runtimeVersion: 'v2',
        artifact: {
          type: 'compiled',
        },
        filesHash: 'files_hash',
        runtimeCodeHash: 'runtime_hash',
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
    expect(await app.db.getRepository('lightExtensionEntryPublications').count({ filter: { repoId: repo.id } })).toBe(
      0,
    );
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
