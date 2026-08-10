/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSyncError } from '../vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { JsTemplateError } from '../../shared/errors';
import { DEFAULT_JS_TEMPLATE_TEMPLATE_FILES } from '../../shared/default-template';
import PluginJsTemplateServer from '../plugin';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateFileService } from '../services/JsTemplateFileService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import { JsTemplateService } from '../services/JsTemplateService';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';

describe('plugin-js-template project service', () => {
  let app: MockServer;
  let service: JsTemplateProjectService;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginJsTemplateServer],
    });
    const auditService = new JsTemplateAuditService(app.db);
    const permissionService = new JsTemplatePermissionService(auditService);
    service = new JsTemplateProjectService(app.db, auditService, permissionService);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('creates a JS Template project and its backing VSC repository with the owner boundary', async () => {
    const project = await service.createProject(
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
        requestId: 'req_create_project',
      },
    );

    expect(project).toMatchObject({
      id: expect.stringMatching(/^jtp_/),
      name: 'Sales Widgets',
      normalizedName: 'sales-widgets',
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
    });
    expect(project).not.toHaveProperty('vscRepoId');
    expect(project.headCommitId).toEqual(expect.stringMatching(/^vscc_/));

    const projectRecord = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: project.id,
    });
    expect(projectRecord?.get('applicationName')).toBe('main');
    const vscRepoId = projectRecord?.get('vscRepoId') as string;
    const vscRepo = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: vscRepoId,
    });

    expect(vscRepo).toBeTruthy();
    expect(vscRepo?.get('ownerType')).toBe('js-template');
    expect(vscRepo?.get('ownerId')).toBe(project.id);
    expect(vscRepo?.get('name')).toBe('source');
    expect(vscRepo?.get('headCommitId')).toBe(project.headCommitId);

    const logs = await app.db.getRepository('jsTemplateLogs').find({
      filter: {
        projectId: project.id,
      },
      sort: ['createdAt'],
    });
    expect(logs.map((log) => log.get('action'))).toEqual(['projectCreate']);
    expect(JSON.stringify(logs.map((log) => log.toJSON()))).not.toContain('secret README content');
  });

  it('returns a typed conflict when a project name already exists', async () => {
    await service.createProject({ name: 'Duplicate Project' }, { requestId: 'req_duplicate_create' });

    await expect(
      service.createProject({ name: 'duplicate project' }, { requestId: 'req_duplicate_conflict' }),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PROJECT_CONFLICT',
      status: 409,
      details: {
        normalizedName: 'duplicate-project',
      },
    });
  });

  it('isolates projects by their persisted application owner', async () => {
    const mainProject = await service.createProject({ name: 'Main application tools' });
    const auditService = new JsTemplateAuditService(app.db);
    const permissionService = new JsTemplatePermissionService(auditService);
    const supportService = new JsTemplateProjectService(
      app.db,
      auditService,
      permissionService,
      undefined,
      undefined,
      'support-app',
    );
    const supportProject = await supportService.createProject({ name: 'Support application tools' });

    await expect(service.getProject(supportProject.id)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });
    await expect(supportService.getProject(mainProject.id)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });
    await expect(service.listProjects()).resolves.toEqual([expect.objectContaining({ id: mainProject.id })]);
    await expect(supportService.listProjects()).resolves.toEqual([expect.objectContaining({ id: supportProject.id })]);
  });

  it('updates project display metadata without changing its technical identity', async () => {
    const project = await service.createProject(
      {
        name: 'Stable Technical Name',
        title: 'Original display name',
        description: 'Original description',
      },
      { requestId: 'req_update_project_create' },
    );

    const updated = await service.updateProject(
      {
        projectId: project.id,
        title: 'Updated display name',
        description: 'Updated description',
      },
      { requestId: 'req_update_project' },
    );

    expect(updated).toMatchObject({
      id: project.id,
      name: 'Stable Technical Name',
      normalizedName: 'stable-technical-name',
      title: 'Updated display name',
      description: 'Updated description',
    });
    await expect(
      app.db.getRepository('jsTemplateLogs').count({
        filter: {
          projectId: project.id,
          action: 'projectUpdate',
        },
      }),
    ).resolves.toBe(1);

    await service.updateProject(
      {
        projectId: project.id,
        title: 'Updated display name',
        description: 'Updated description',
      },
      { requestId: 'req_update_project_noop' },
    );
    await expect(
      app.db.getRepository('jsTemplateLogs').count({
        filter: {
          projectId: project.id,
          action: 'projectUpdate',
        },
      }),
    ).resolves.toBe(1);
  });

  it('reads only template fields required for project statistics and can skip the summary query', async () => {
    await service.createProject({ name: 'Project statistics' }, { requestId: 'req_project_statistics' });
    const templatesRepository = app.db.getRepository('jsTemplates');
    const findTemplates = vi.spyOn(templatesRepository, 'find');

    await service.listProjects();

    expect(findTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ['projectId', 'kind', 'healthStatus'] }),
    );

    await service.listProjects({}, { includeTemplateSummary: false });

    expect(findTemplates).toHaveBeenCalledTimes(1);
  });

  it('creates the default template as the first commit for an empty initialFiles array', async () => {
    const project = await service.createProject(
      {
        name: 'Empty Initial Files',
        initialFiles: [],
      },
      {
        requestId: 'req_empty_initial_files',
      },
    );
    const projectRecord = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: project.id,
    });
    const vscRepoId = projectRecord?.get('vscRepoId') as string;
    const vscRepo = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: vscRepoId,
    });

    expect(project.headCommitId).toEqual(expect.stringMatching(/^vscc_/));
    expect(vscRepo?.get('headCommitId')).toBe(project.headCommitId);
    expect(
      await app.db.getRepository('vscFileCommits').count({
        filter: {
          repoId: vscRepoId,
        },
      }),
    ).toBe(1);
    expect(
      await app.db.getRepository('jsTemplateLogs').count({
        filter: {
          projectId: project.id,
        },
      }),
    ).toBe(1);

    const auditService = new JsTemplateAuditService(app.db);
    const permissionService = new JsTemplatePermissionService(auditService);
    const fileService = new JsTemplateFileService(app.db, permissionService, service);
    const pull = await fileService.pull({ projectId: project.id, includeContent: 'all' });
    expect(pull.files?.map((file) => file.path).sort()).toEqual(
      DEFAULT_JS_TEMPLATE_TEMPLATE_FILES.map((file) => file.path).sort(),
    );
  });

  it('changes lifecycle without client compare-and-set input', async () => {
    const project = await service.createProject({ name: 'Lifecycle Demo' }, { requestId: 'req_lifecycle_create' });
    const refreshUsagesForProject = vi.fn(async () => undefined);
    service.useJsTemplateUsageService({ refreshUsagesForProject } as never);

    const disabled = await service.changeLifecycle(
      {
        projectId: project.id,
        lifecycleStatus: 'disabled',
      },
      {
        requestId: 'req_lifecycle_disable',
      },
    );

    expect(disabled.lifecycleStatus).toBe('disabled');
    const enabled = await service.changeLifecycle(
      {
        projectId: project.id,
        lifecycleStatus: 'enabled',
      },
      {
        requestId: 'req_lifecycle_enable',
      },
    );
    expect(enabled.lifecycleStatus).toBe('enabled');
    await service.changeLifecycle(
      {
        projectId: project.id,
        lifecycleStatus: 'disabled',
      },
      {
        requestId: 'req_lifecycle_disable_again',
      },
    );

    const disabledAgain = await service.changeLifecycle(
      {
        projectId: project.id,
        lifecycleStatus: 'disabled',
      },
      {
        requestId: 'req_lifecycle_disable_idempotent',
      },
    );

    expect(disabledAgain.lifecycleStatus).toBe('disabled');
    expect(refreshUsagesForProject).toHaveBeenCalledTimes(3);
    expect(refreshUsagesForProject.mock.calls).toEqual(
      Array.from({ length: 3 }, () => [
        project.id,
        expect.objectContaining({ transaction: expect.anything() }),
        'project_lifecycle_change',
      ]),
    );
  });

  it('rejects lifecycle values outside the public two-state collection contract', async () => {
    const project = await service.createProject({ name: 'Lifecycle Validation' });

    await expect(
      app.db.getRepository('jsTemplateProjects').update({
        filterByTk: project.id,
        values: { lifecycleStatus: 'archived' },
      }),
    ).rejects.toThrow();
    await expect(service.getProject(project.id)).resolves.toMatchObject({ lifecycleStatus: 'enabled' });
  });

  it('blocks delete while the shared remote lifecycle gate reports an active job', async () => {
    const project = await service.createProject({ name: 'Lifecycle Busy' }, { requestId: 'req_lifecycle_busy_create' });
    const assertRepositoryIdle = vi.fn(async () => {
      throw new RemoteSyncError('BUSY', 'Repository has an active synchronization job', {
        details: { reasonCode: 'active-sync-job' },
      });
    });
    service.useRemoteSyncLifecycleGate({ assertRepositoryIdle });

    await expect(service.deleteProject({ projectId: project.id })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_SYNC_BUSY',
      status: 409,
    });
    expect(assertRepositoryIdle).toHaveBeenCalledTimes(1);
  });

  it('allows lifecycle changes after source writes without a project version precondition', async () => {
    const auditService = new JsTemplateAuditService(app.db);
    const permissionService = new JsTemplatePermissionService(auditService);
    const projectService = new JsTemplateProjectService(app.db, auditService, permissionService);
    const fileService = new JsTemplateFileService(app.db, permissionService, projectService);
    const templateService = new JsTemplateService(app.db, fileService, projectService);
    const compileService = new JsTemplateCompileService(
      app.db,
      fileService,
      templateService,
      new JsTemplateWorkspaceCompilerBridge(),
      { auditService },
    );
    const project = await projectService.createProject(
      { name: 'Source Lifecycle' },
      { requestId: 'req_source_create' },
    );
    await compileService.saveSource(
      {
        projectId: project.id,
        expectedHeadCommitId: project.headCommitId,
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

    const disabled = await projectService.changeLifecycle(
      {
        projectId: project.id,
        lifecycleStatus: 'disabled',
      },
      {
        requestId: 'req_source_disable',
      },
    );

    expect(disabled.lifecycleStatus).toBe('disabled');
    await expect(fileService.pull({ projectId: project.id, includeContent: 'all' })).resolves.toMatchObject({
      project: { id: project.id, lifecycleStatus: 'disabled' },
      files: expect.arrayContaining([expect.objectContaining({ path: 'README.md', content: '# updated\n' })]),
    });

    const savedWhileDisabled = await compileService.saveSource(
      {
        projectId: project.id,
        expectedHeadCommitId: disabled.headCommitId,
        message: 'source write while disabled',
        files: [
          {
            path: 'README.md',
            content: '# updated while disabled\n',
          },
        ],
      },
      {
        requestId: 'req_source_push_disabled',
      },
    );

    expect(savedWhileDisabled.project.lifecycleStatus).toBe('disabled');
    await expect(
      projectService.changeLifecycle(
        {
          projectId: project.id,
          lifecycleStatus: 'enabled',
        },
        {
          requestId: 'req_source_reenable',
        },
      ),
    ).resolves.toMatchObject({ lifecycleStatus: 'enabled', headCommitId: savedWhileDisabled.commit.id });
  });

  it('rejects delete when source usages exist', async () => {
    const project = await service.createProject({ name: 'Used Project' }, { requestId: 'req_usage_create' });
    await app.db.getRepository('jsTemplateUsages').create({
      values: {
        projectId: project.id,
        templateId: 'jtt_usaged',
        kind: 'js-block',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          modelUid: 'flow_usaged',
          use: 'JSBlockModel',
          stepPath: ['stepParams', 'jsSettings'],
        },
        ownerLocatorHash: 'owner_hash_usaged',
        resolvedStatus: 'active',
      },
    });

    await expect(
      service.deleteProject({ projectId: project.id }, { requestId: 'req_delete_used' }),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_USAGE_EXISTS',
      status: 409,
      message: 'JS Template project is used and cannot be deleted',
      details: expect.objectContaining({ usageCount: 1 }),
    });

    expect(await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: project.id })).toBeTruthy();
    const blockedLog = await app.db.getRepository('jsTemplateLogs').findOne({
      filter: {
        projectId: project.id,
        action: 'projectDelete',
        result: 'blocked',
      },
    });
    expect(blockedLog?.get('reasonCode')).toBe('usages_exist');
  });

  it('deletes a project with only owner-missing usages and cleans those orphaned records', async () => {
    const project = await service.createProject({ name: 'Orphaned Usage Project' });
    await app.db.getRepository('jsTemplateUsages').create({
      values: {
        projectId: project.id,
        templateId: 'jtt_owner_missing',
        kind: 'js-block',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          modelUid: 'flow_owner_missing',
          use: 'JSBlockModel',
          stepPath: ['stepParams', 'jsSettings'],
        },
        ownerLocatorHash: 'owner_hash_missing',
        resolvedStatus: 'owner_missing',
      },
    });

    await expect(service.deleteProject({ projectId: project.id })).resolves.toMatchObject({ id: project.id });
    await expect(app.db.getRepository('jsTemplateUsages').count({ filter: { projectId: project.id } })).resolves.toBe(
      0,
    );
    await expect(app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: project.id })).resolves.toBeNull();
  });

  it('keeps all usages when an active and an owner-missing usage coexist', async () => {
    const project = await service.createProject({ name: 'Mixed Usage Project' });
    const usages = app.db.getRepository('jsTemplateUsages');
    await usages.create({
      values: {
        projectId: project.id,
        templateId: 'jtt_active',
        kind: 'js-block',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          modelUid: 'flow_active',
          use: 'JSBlockModel',
          stepPath: ['stepParams', 'jsSettings'],
        },
        ownerLocatorHash: 'owner_hash_active',
        resolvedStatus: 'active',
      },
    });
    await usages.create({
      values: {
        projectId: project.id,
        templateId: 'jtt_owner_missing',
        kind: 'js-block',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          modelUid: 'flow_owner_missing',
          use: 'JSBlockModel',
          stepPath: ['stepParams', 'jsSettings'],
        },
        ownerLocatorHash: 'owner_hash_missing',
        resolvedStatus: 'owner_missing',
      },
    });

    await expect(service.deleteProject({ projectId: project.id })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_USAGE_EXISTS',
      details: expect.objectContaining({ usageCount: 1 }),
    });
    await expect(usages.count({ filter: { projectId: project.id } })).resolves.toBe(2);
    await expect(app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: project.id })).resolves.toBeTruthy();
  });

  it('deletes unusaged js-template metadata after archiving source storage', async () => {
    const project = await service.createProject({ name: 'Delete Demo' }, { requestId: 'req_delete_create' });
    const projectRecord = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: project.id,
    });
    const vscRepoId = projectRecord?.get('vscRepoId') as string;
    await app.db.getRepository('jsTemplates').create({
      values: {
        projectId: project.id,
        target: 'client',
        kind: 'jsBlock',
        templateName: 'main',
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
    const deleted = await service.deleteProject({ projectId: project.id }, { requestId: 'req_delete_success' });
    const vscRepo = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: vscRepoId,
    });

    expect(deleted.id).toBe(project.id);
    expect(deleted).not.toHaveProperty('vscRepoId');
    expect(await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: project.id })).toBeNull();
    expect(await app.db.getRepository('jsTemplates').count({ filter: { projectId: project.id } })).toBe(0);
    expect(vscRepo?.get('status')).toBe('archived');
    await expect(
      app.db.getRepository('jsTemplateUsages').create({
        values: {
          projectId: project.id,
          templateId: 'jtt_after_delete',
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

  it('throws a typed not-found error for missing projects', async () => {
    await expect(service.getProject('jtp_missing')).rejects.toBeInstanceOf(JsTemplateError);
  });
});
