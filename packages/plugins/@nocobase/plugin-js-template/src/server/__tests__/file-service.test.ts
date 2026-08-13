/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VscFileService, VscPermissionHookRegistry } from '@nocobase/runjs/workspace/server';
import { MockServer, createMockServer } from '@nocobase/test';

import { JS_TEMPLATE_ACL_SNIPPET, JS_TEMPLATE_SCHEMA_VERSION } from '../../constants';
import type {
  JsTemplateCreateJob,
  JsTemplateCreateProjectInput,
  JsTemplateProject,
  JsTemplateTreeEntryInput,
} from '../../shared/types';
import PluginJsTemplateServer from '../plugin';
import { jsTemplateFileActionNames } from '../resources/jsTemplateFiles';
import { jsTemplateProjectActionNames } from '../resources/jsTemplateProjects';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateFileService } from '../services/JsTemplateFileService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import { JsTemplateService } from '../services/JsTemplateService';
import { JS_TEMPLATE_VALIDATION_LIMITS, JsTemplateValidator } from '../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';

describe('plugin-js-template file service resource bridge', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', PluginJsTemplateServer],
    });

    agent = await createRoleAgent(app, 'jsTemplateAdmin', [JS_TEMPLATE_ACL_SNIPPET]);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('registers the js-template repo and file resource action surfaces', async () => {
    expect(Array.from(app.resourceManager.getResource('jsTemplateProjects').actions.keys()).sort()).toEqual(
      [...jsTemplateProjectActionNames].sort(),
    );
    expect(Array.from(app.resourceManager.getResource('jsTemplateFiles').actions.keys()).sort()).toEqual(
      [...jsTemplateFileActionNames].sort(),
    );
  });

  it('updates repository metadata through the custom non-CRUD resource action', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Resource Metadata Update',
      title: 'Original title',
      description: 'Original description',
    });

    const updateResponse = await agent.resource('jsTemplateProjects').updateMetadata({
      values: {
        projectId: repo.id,
        title: 'Updated title',
        description: null,
      },
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({
      id: repo.id,
      name: 'Resource Metadata Update',
      normalizedName: 'resource-metadata-update',
      title: 'Updated title',
      description: null,
    });
  });

  it('keeps every public Project mutation non-enumerating across application boundaries', async () => {
    const supportAuditService = new JsTemplateAuditService(app.db);
    const supportPermissionService = new JsTemplatePermissionService(supportAuditService);
    const supportProjectService = new JsTemplateProjectService(
      app.db,
      supportAuditService,
      supportPermissionService,
      undefined,
      undefined,
      'support',
    );
    const mutationEntries = [
      {
        actionName: 'updateMetadata',
        run: (projectId: string) =>
          agent.resource('jsTemplateProjects').updateMetadata({
            values: { projectId, title: 'Attacker update', description: 'Attacker description' },
          }),
      },
      {
        actionName: 'changeLifecycle',
        run: (projectId: string) =>
          agent.resource('jsTemplateProjects').changeLifecycle({
            values: { projectId, lifecycleStatus: 'disabled' },
          }),
      },
      {
        actionName: 'delete',
        run: (projectId: string) => agent.resource('jsTemplateProjects').delete({ values: { projectId } }),
      },
    ];

    for (const [index, entry] of mutationEntries.entries()) {
      const secretTitle = `Foreign ${entry.actionName} secret`;
      const secretDescription = `Support-only ${entry.actionName} description`;
      const foreignProject = await supportProjectService.createProject({
        name: `Foreign ${entry.actionName} boundary ${index}`,
        title: secretTitle,
        description: secretDescription,
      });
      const projects = app.db.getRepository('jsTemplateProjects');
      const foreignRecordBefore = await projects.findOne({ filterByTk: foreignProject.id });
      const vscRepoId = String(foreignRecordBefore?.get('vscRepoId'));
      const vscRepositoryBefore = await app.db.getRepository('vscFileRepositories').findOne({ filterByTk: vscRepoId });

      const foreignResponse = await entry.run(foreignProject.id);

      expect(foreignResponse.status).toBe(404);
      expect(foreignResponse.body).toMatchObject({
        errors: [
          {
            code: 'JS_TEMPLATE_PROJECT_NOT_FOUND',
            message: `JS Template project "${foreignProject.id}" was not found`,
            status: 404,
          },
        ],
      });
      expect(JSON.stringify(foreignResponse.body)).not.toMatch(
        new RegExp(`${secretTitle}|${secretDescription}|applicationName|vscRepoId|headCommitId`, 'u'),
      );
      const foreignRecordAfter = await projects.findOne({ filterByTk: foreignProject.id });
      expect(foreignRecordAfter?.get('title')).toBe(secretTitle);
      expect(foreignRecordAfter?.get('description')).toBe(secretDescription);
      expect(foreignRecordAfter?.get('lifecycleStatus')).toBe('enabled');
      expect(foreignRecordAfter?.get('applicationName')).toBe('support');
      const vscRepositoryAfter = await app.db.getRepository('vscFileRepositories').findOne({ filterByTk: vscRepoId });
      expect(vscRepositoryAfter?.get('status')).toBe(vscRepositoryBefore?.get('status'));

      await projects.destroy({ filterByTk: foreignProject.id });
      const missingResponse = await entry.run(foreignProject.id);

      expect(missingResponse.status).toBe(404);
      expect(missingResponse.body).toEqual(foreignResponse.body);
    }
  });

  it('rejects the CLI saveSource persistence route before reading a foreign application Project', async () => {
    const supportAuditService = new JsTemplateAuditService(app.db);
    const supportPermissionService = new JsTemplatePermissionService(supportAuditService);
    const supportProjectService = new JsTemplateProjectService(
      app.db,
      supportAuditService,
      supportPermissionService,
      undefined,
      undefined,
      'support',
    );
    const foreignProject = await supportProjectService.createProject({
      name: 'Foreign CLI save boundary',
      title: 'Foreign CLI secret title',
      description: 'Foreign CLI secret description',
    });
    const projects = app.db.getRepository('jsTemplateProjects');
    const commits = app.db.getRepository('vscFileCommits');
    const commitCountBefore = await commits.count();
    const runCliSave = (projectId: string) =>
      agent.resource('jsTemplateFiles').saveSource({
        values: {
          projectId,
          expectedHeadCommitId: null,
          message: 'Attempt foreign CLI save',
          files: [{ path: 'README.md', content: '# Foreign write attempt\n' }],
        },
      });

    const foreignResponse = await runCliSave(foreignProject.id);

    expect(foreignResponse.status).toBe(404);
    expect(foreignResponse.body).toMatchObject({
      errors: [
        {
          code: 'JS_TEMPLATE_PROJECT_NOT_FOUND',
          message: `JS Template project "${foreignProject.id}" was not found`,
          status: 404,
        },
      ],
    });
    expect(JSON.stringify(foreignResponse.body)).not.toMatch(
      /Foreign CLI secret|applicationName|vscRepoId|headCommitId/u,
    );
    await expect(commits.count()).resolves.toBe(commitCountBefore);
    const foreignRecordAfter = await projects.findOne({ filterByTk: foreignProject.id });
    expect(foreignRecordAfter?.get('title')).toBe('Foreign CLI secret title');
    expect(foreignRecordAfter?.get('description')).toBe('Foreign CLI secret description');
    expect(foreignRecordAfter?.get('applicationName')).toBe('support');

    await projects.destroy({ filterByTk: foreignProject.id });
    const missingResponse = await runCliSave(foreignProject.id);

    expect(missingResponse.status).toBe(404);
    expect(missingResponse.body).toEqual(foreignResponse.body);
    await expect(commits.count()).resolves.toBe(commitCountBefore);
  });

  it('requires both the saveSource resource action and the writeSource domain permission', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: `Source permission matrix ${Date.now()}`,
    });
    const rootAgent = await app.agent().login(await app.db.getRepository('users').findOne());
    const cases = [
      { roleName: 'jsTemplateSaveOnly', saveSource: true, writeSource: false, expectedStatus: 403 },
      { roleName: 'jsTemplateWriteOnly', saveSource: false, writeSource: true, expectedStatus: 403 },
      { roleName: 'jsTemplateSaveAndWrite', saveSource: true, writeSource: true, expectedStatus: 200 },
    ];

    let expectedHeadCommitId = repo.headCommitId;
    for (const entry of cases) {
      const roleAgent = await createRoleAgent(app, entry.roleName);
      await rootAgent.resource('roles.resources', entry.roleName).create({
        values: {
          name: 'jsTemplateProjects',
          usingActionsConfig: true,
          actions: [{ name: 'get' }],
        },
      });
      if (entry.saveSource) {
        await rootAgent.resource('roles.resources', entry.roleName).create({
          values: {
            name: 'jsTemplateFiles',
            usingActionsConfig: true,
            actions: [{ name: 'saveSource' }],
          },
        });
      }
      if (entry.writeSource) {
        await rootAgent.resource('roles.resources', entry.roleName).create({
          values: {
            name: 'jsTemplate',
            usingActionsConfig: true,
            actions: [{ name: 'writeSource' }],
          },
        });
      }

      const projectResponse = await roleAgent.resource('jsTemplateProjects').get({ filterByTk: repo.id });
      expect(projectResponse.status, JSON.stringify(projectResponse.body)).toBe(200);
      expect(projectResponse.body.data.permissions).toEqual({
        canWriteSource: entry.saveSource && entry.writeSource,
      });

      const response = await roleAgent.resource('jsTemplateFiles').saveSource({
        values: {
          projectId: repo.id,
          expectedHeadCommitId,
          message: `Permission matrix ${entry.roleName}`,
          files: [{ path: `${entry.roleName}.md`, content: `# ${entry.roleName}\n` }],
        },
      });
      expect(response.status, JSON.stringify(response.body)).toBe(entry.expectedStatus);
      if (entry.saveSource && !entry.writeSource) {
        expect(response.body).toMatchObject({
          errors: [{ code: 'JS_TEMPLATE_PERMISSION_DENIED', details: { action: 'writeSource' } }],
        });
      }
      if (response.status === 200) {
        expectedHeadCommitId = response.body.data.project.headCommitId;
      }
    }
  });

  it('runs shared vsc permission hooks for js-template internal source operations', async () => {
    const capturedActions: string[] = [];
    const unregister = getVscPermissionHookRegistrar(app).registerPermissionHook((input) => {
      if (input.ownerType === 'js-template') {
        capturedActions.push(input.action);
      }
    });

    try {
      const repo = await createRepoAndWait(app, agent, {
        name: 'Shared Hook Source',
      });

      const pushResponse = await agent.resource('jsTemplateFiles').saveSource({
        values: {
          projectId: repo.id,
          expectedHeadCommitId: repo.headCommitId,
          message: 'shared hook commit',
          files: [
            {
              path: 'README.md',
              content: '# shared hook\n',
            },
          ],
        },
      });

      expect(pushResponse.status).toBe(200);
      expect(capturedActions).toEqual(expect.arrayContaining(['createRepository', 'push']));
    } finally {
      unregister();
    }
  });

  it('accepts zero-byte source files in initial repository content and pushes', async () => {
    const initialRepo = await createRepoAndWait(app, agent, {
      name: 'Zero Byte Initial Source',
      initialFiles: [
        {
          path: 'src/shared/empty-initial.ts',
          content: '',
        },
      ],
    });
    const initialFileResponse = await agent.resource('jsTemplateFiles').getFile({
      values: {
        projectId: initialRepo.id,
        path: 'src/shared/empty-initial.ts',
      },
    });
    const pushRepo = await createRepoAndWait(app, agent, {
      name: 'Zero Byte Push Source',
    });
    const pushResponse = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: pushRepo.id,
        expectedHeadCommitId: pushRepo.headCommitId,
        message: 'add empty file',
        files: [
          {
            path: 'src/shared/empty-push.ts',
            content: '',
          },
        ],
      },
    });
    const pushedFileResponse = await agent.resource('jsTemplateFiles').getFile({
      values: {
        projectId: pushRepo.id,
        path: 'src/shared/empty-push.ts',
      },
    });

    expect(initialFileResponse.status).toBe(200);
    expect(initialFileResponse.body.data.content).toBe('');
    expect(pushResponse.status).toBe(200);
    expect(pushedFileResponse.status).toBe(200);
    expect(pushedFileResponse.body.data.content).toBe('');
  });

  it('reads, writes, and lists history without exposing the underlying vsc repo id', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Source Workflow',
    });
    const initialCommitId = repo.headCommitId as string;
    const projectRecord = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = projectRecord?.get('vscRepoId') as string;
    const firstPush = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: initialCommitId,
        message: 'first commit',
        files: [
          {
            path: 'README.md',
            content: '# JS Template\n',
            language: 'markdown',
          },
        ],
      },
    });
    const firstCommit = firstPush.body.data.commit;
    const secondPush = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: firstCommit.id,
        message: 'second commit',
        files: [
          {
            path: 'README.md',
            content: '# JS Template\n\nUpdated\n',
            language: 'markdown',
          },
          {
            path: 'src/client/js-blocks/source-workflow/index.tsx',
            content: 'ctx.render(<div>Source workflow</div>);\n',
            language: 'typescript',
          },
          {
            path: 'src/client/js-blocks/source-workflow/entry.json',
            content: `${JSON.stringify(
              {
                schemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
                key: 'source-workflow',
                title: 'Source workflow',
              },
              null,
              2,
            )}\n`,
            language: 'json',
          },
        ],
      },
    });
    const secondCommit = secondPush.body.data.commit;
    const pullResponse = await agent.resource('jsTemplateFiles').pull({
      values: {
        projectId: repo.id,
        includeContent: 'all',
      },
    });
    const fileResponse = await agent.resource('jsTemplateFiles').getFile({
      values: {
        projectId: repo.id,
        path: 'README.md',
      },
    });
    const historyResponse = await agent.resource('jsTemplateFiles').listCommits({
      values: {
        projectId: repo.id,
      },
    });
    const diffResponse = await agent.resource('jsTemplateFiles').diff({
      values: {
        projectId: repo.id,
        fromCommitId: firstCommit.id,
        toCommitId: secondCommit.id,
      },
    });

    expect(firstPush.status).toBe(200);
    expect(secondPush.status).toBe(200);
    expect(secondPush.body.data.project).toMatchObject({
      id: repo.id,
      headCommitId: secondCommit.id,
    });
    expect(firstCommit.parentCommitId).toBe(initialCommitId);
    expect(secondCommit.parentCommitId).toBe(firstCommit.id);
    expect(pullResponse.body.data.files.map((file: { path: string }) => file.path)).toEqual(
      expect.arrayContaining([
        'README.md',
        'src/client/js-blocks/source-workflow/entry.json',
        'src/client/js-blocks/source-workflow/index.tsx',
      ]),
    );
    expect(fileResponse.body.data).toMatchObject({
      path: 'README.md',
      content: '# JS Template\n\nUpdated\n',
    });
    expect(historyResponse.body.data.map((commit: { id: string }) => commit.id)).toEqual([
      secondCommit.id,
      firstCommit.id,
      initialCommitId,
    ]);
    expect(historyResponse.body.data.every((commit: { projectId: string }) => commit.projectId === repo.id)).toBe(true);
    expect(diffResponse.status).toBe(200);
    expect(diffResponse.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'modified',
          path: 'README.md',
        }),
        expect.objectContaining({
          status: 'added',
          path: 'src/client/js-blocks/source-workflow/index.tsx',
        }),
      ]),
    );
    expect(() => app.resourceManager.getResource('vscFile')).toThrow('vscFile resource does not exist');
    expect(JSON.stringify([repo, firstPush.body.data, secondPush.body.data, pullResponse.body.data])).not.toContain(
      vscRepoId,
    );
  });

  it('returns sanitized js-template errors when the backing vsc repository rejects the operation', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Sanitized Source Error',
    });
    const projectRecord = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = projectRecord?.get('vscRepoId') as string;

    await app.db.getRepository('vscFileRepositories').update({
      filterByTk: vscRepoId,
      values: {
        status: 'archived',
      },
    });
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'should fail safely',
        files: [
          {
            path: 'README.md',
            content: '# safe error\n',
          },
        ],
      },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_SOURCE_ERROR',
      status: 409,
      details: {
        projectId: repo.id,
        sourceCode: 'REPO_ARCHIVED',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain(vscRepoId);
  });

  it('requires an explicit expected head and rejects stale source writes without creating a commit', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Expected Head Source',
    });
    const commitCountBefore = await app.db.getRepository('vscFileCommits').count();
    const missingExpected = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        message: 'missing expected head',
        files: [{ path: 'README.md', content: '# missing expected\n' }],
      },
    });
    const firstSave = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'first expected head save',
        files: [{ path: 'README.md', content: '# first\n' }],
      },
    });
    const staleSave = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'stale expected head save',
        files: [{ path: 'README.md', content: '# stale\n' }],
      },
    });
    const currentRepo = await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: repo.id });

    expect(missingExpected.status).toBe(400);
    expect(missingExpected.body.errors[0]).toMatchObject({ code: 'JS_TEMPLATE_INVALID_INPUT', status: 400 });
    expect(firstSave.status).toBe(200);
    expect(staleSave.status).toBe(409);
    expect(staleSave.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_SOURCE_OUTDATED',
      status: 409,
      details: {
        expectedHeadCommitId: repo.headCommitId,
        currentHeadCommitId: firstSave.body.data.commit.id,
      },
    });
    expect(currentRepo?.get('headCommitId')).toBe(firstSave.body.data.commit.id);
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(commitCountBefore + 1);
  });

  it('ignores caller supplied push metadata and returns only generated commit metadata', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Generated Metadata Source',
    });
    const pushResponse = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'commit generated metadata',
        metadata: {
          code: 'ctx.render("metadata secret")',
          sourceMap: 'source-map-secret',
          settings: {
            token: 'settings-token-secret',
          },
        },
        files: [
          {
            path: 'README.md',
            content: '# metadata\n',
          },
        ],
      },
    });
    const historyResponse = await agent.resource('jsTemplateFiles').listCommits({
      values: {
        projectId: repo.id,
      },
    });
    const serializedCommits = JSON.stringify([pushResponse.body.data.commit, historyResponse.body.data]);

    expect(pushResponse.status).toBe(200);
    expect(pushResponse.body.data.commit.metadata).toMatchObject({
      jsTemplateProjectId: repo.id,
      requestSource: 'internal',
    });
    expect(serializedCommits).not.toContain('metadata secret');
    expect(serializedCommits).not.toContain('source-map-secret');
    expect(serializedCommits).not.toContain('settings-token-secret');
  });

  it('records one Save audit without storing source content in logs', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Audit Source',
    });

    await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'commit secret source',
        files: [
          {
            path: 'README.md',
            content: 'do-not-log-this-secret-source',
            language: 'markdown',
          },
        ],
      },
    });

    const log = await app.db.getRepository('jsTemplateLogs').findOne({
      filter: {
        projectId: repo.id,
        action: 'runtimeCompile',
      },
    });
    const serializedLog = JSON.stringify(log?.toJSON());

    expect(log).toBeTruthy();
    expect(serializedLog).not.toContain('do-not-log-this-secret-source');
  });

  it('rejects oversized source sync batches before writing to vsc storage', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Oversized Sync Batch Source',
    });
    const baselineCommitCount = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'oversized batch',
        files: Array.from({ length: 101 }, (_, index) => ({
          path: `src/client/js-blocks/batch-${index}/index.tsx`,
          content: 'ctx.render(<div>Batch entry</div>);\n',
        })),
      },
    });

    expect(response.status).toBe(422);
    expect(response.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'sync_batch_too_large',
          }),
        ]),
      },
    });
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(baselineCommitCount);
  });

  it('rejects oversized source content even when callers supply a smaller size', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Spoofed Size Source',
    });
    const baselineCommitCount = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'spoofed file size',
        files: [
          {
            path: 'src/client/js-blocks/spoofed-size/index.tsx',
            content: `ctx.render(null);\n${'x'.repeat(256 * 1024 + 1)}`,
            size: 1,
          },
        ],
      },
    });

    expect(response.status).toBe(422);
    expect(response.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'file_size_limit_exceeded',
          }),
        ]),
      },
    });
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(baselineCommitCount);
  });

  it('rejects blob-hash-only source upserts before writing to vsc storage', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Blob Hash Only Source',
    });
    const baselineCommitCount = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'blob hash only source',
        files: [
          {
            path: 'src/client/js-blocks/blob-hash-only/index.tsx',
            blobHash: 'caller-supplied-blob',
            size: 1,
          },
        ],
      },
    });

    expect(response.status).toBe(422);
    expect(response.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'source_content_required',
            path: 'src/client/js-blocks/blob-hash-only/index.tsx',
          }),
        ]),
      },
    });
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(baselineCommitCount);
  });

  it('rejects delete changes outside the js-template source whitelist before writing to vsc storage', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Invalid Delete Source',
    });
    const baselineCommitCount = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'delete invalid source paths',
        files: [
          {
            path: 'package.json',
            operation: 'delete',
          },
          {
            path: 'src/client/js-blocks/Invalid/index.tsx',
            operation: 'delete',
          },
          {
            path: 'src/client/js-blocks/delete-css/style.css',
            operation: 'delete',
          },
        ],
      },
    });

    expect(response.status).toBe(422);
    expect(response.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'workspace_path_not_allowed',
            path: 'package.json',
          }),
          expect.objectContaining({
            code: 'invalid_template_name',
            path: 'src/client/js-blocks/Invalid/index.tsx',
          }),
          expect.objectContaining({
            code: 'path_extension_not_allowed',
            path: 'src/client/js-blocks/delete-css/style.css',
          }),
        ]),
      },
    });
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(baselineCommitCount);
  });

  it('allows deleting existing invalid source files so validation failures can be repaired', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Repair Invalid Delete Source',
    });
    const baselinePullResponse = await agent.resource('jsTemplateFiles').pull({
      values: {
        projectId: repo.id,
        includeContent: 'all',
      },
    });
    const baselinePaths = baselinePullResponse.body.data.files.map((file: { path: string }) => file.path);
    const seeded = await seedRawSourceFiles(app, repo.id, [
      {
        path: 'package.json',
        content: '{"private":true}\n',
      },
    ]);
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: seeded.commit.id,
        message: 'remove invalid legacy file',
        files: [
          {
            path: 'package.json',
            operation: 'delete',
          },
        ],
      },
    });
    const pullResponse = await agent.resource('jsTemplateFiles').pull({
      values: {
        projectId: repo.id,
        includeContent: 'all',
      },
    });

    expect(response.status).toBe(200);
    expect(pullResponse.body.data.files.map((file: { path: string }) => file.path)).toEqual(baselinePaths);
    expect(baselinePaths).not.toContain('package.json');
  });

  it('rejects incremental pushes that would exceed the final template count limit', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Cumulative Entry Limit Source',
    });
    const baselineCommitCount = await app.db.getRepository('vscFileCommits').count();
    const baselineTemplateCount = await app.db.getRepository('jsTemplates').count({
      filter: { projectId: repo.id },
    });
    const firstPushResponse = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'fill entry budget',
        files: Array.from(
          { length: JS_TEMPLATE_VALIDATION_LIMITS.maxTemplates - baselineTemplateCount },
          (_, index) => [
            {
              path: `src/client/js-blocks/entry-${index}/entry.json`,
              content: `${JSON.stringify({
                schemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
                key: `entry-${index}`,
                title: `Entry ${index}`,
              })}\n`,
            },
            {
              path: `src/client/js-blocks/entry-${index}/index.tsx`,
              content: `ctx.render(<div>Entry ${index}</div>);\n`,
            },
          ],
        ).flat(),
      },
    });
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: firstPushResponse.body.data.commit.id,
        message: 'exceed entry budget',
        files: [
          {
            path: 'src/client/js-blocks/entry-over-limit/entry.json',
            content: `${JSON.stringify({
              schemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
              key: 'entry-over-limit',
              title: 'Entry over limit',
            })}\n`,
          },
          {
            path: 'src/client/js-blocks/entry-over-limit/index.tsx',
            content: 'ctx.render(<div>Entry over limit</div>);\n',
          },
        ],
      },
    });

    expect(firstPushResponse.status).toBe(200);
    expect(response.status).toBe(422);
    expect(response.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'template_count_limit_exceeded',
          }),
        ]),
      },
    });
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(baselineCommitCount + 1);
  });

  it('rejects incremental pushes that would exceed the final project byte budget', async () => {
    const auditService = new JsTemplateAuditService(app.db);
    const permissionService = new JsTemplatePermissionService(auditService);
    const validator = new JsTemplateValidator({
      limits: {
        maxProjectBytes: 180,
      },
    });
    const projectService = new JsTemplateProjectService(app.db, auditService, permissionService, undefined, validator);
    const fileService = new JsTemplateFileService(app.db, permissionService, projectService, undefined, validator);
    const templateService = new JsTemplateService(app.db, fileService, projectService, validator);
    const compileService = new JsTemplateCompileService(
      app.db,
      fileService,
      templateService,
      new JsTemplateWorkspaceCompilerBridge(),
      { auditService, validator },
    );
    const repo = await projectService.createProject({
      name: 'Cumulative Byte Limit Source',
      initialFiles: [
        {
          path: 'README.md',
          content: '',
        },
      ],
    });
    const baselineCommitCount = await app.db.getRepository('vscFileCommits').count();
    const firstPush = await compileService.saveSource({
      projectId: repo.id,
      expectedHeadCommitId: repo.headCommitId,
      message: 'add first source',
      files: [
        {
          path: 'src/client/js-blocks/byte-limit/entry.json',
          content: `${JSON.stringify({
            schemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
            key: 'byte-limit',
            title: 'Byte limit',
          })}\n`,
        },
        {
          path: 'src/client/js-blocks/byte-limit/index.tsx',
          content: 'ctx.render(<div>Byte limit</div>);\n',
        },
      ],
    });

    await expect(
      compileService.saveSource({
        projectId: repo.id,
        expectedHeadCommitId: firstPush.commit.id,
        message: 'exceed repo byte budget',
        files: [
          {
            path: 'src/client/js-blocks/byte-limit/helper.ts',
            content: `const value = '${'x'.repeat(50)}';\nexport default value;\n`,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'project_budget_limit_exceeded',
          }),
        ]),
      },
    });
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(baselineCommitCount + 1);
  });

  it('rejects forbidden source APIs in pushes before writing to vsc storage', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Forbidden Api Push Source',
    });
    const baselineCommitCount = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'forbidden api source',
        files: [
          {
            path: 'src/client/js-blocks/forbidden-api/index.tsx',
            content: 'const fs = require("fs");\nctx.render(<div>{String(fs)}</div>);\n',
          },
        ],
      },
    });

    expect(response.status).toBe(422);
    expect(response.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'require_not_allowed',
            path: 'src/client/js-blocks/forbidden-api/index.tsx',
          }),
        ]),
      },
    });
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(baselineCommitCount);
  });

  it('rejects invalid initial source before creating the backing vsc repository', async () => {
    const response = await agent.resource('jsTemplateProjects').create({
      values: {
        name: 'Invalid Initial Validation',
        initialFiles: [
          {
            path: '../escape.ts',
            content: 'export default null;\n',
          },
          {
            path: 'src/client/js-blocks/invalid-initial/index.tsx',
            content: 'import fs from "fs";\nctx.render(<div>{String(fs)}</div>);\n',
          },
          {
            path: 'src/client/js-blocks/blob-hash-initial/index.tsx',
            blobHash: 'caller-supplied-blob',
            size: 1,
          },
        ],
      },
    });
    const job = await waitForFailedCreateJob(app, response.body.data.id);

    expect(response.status).toBe(202);
    expect(job).toMatchObject({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_VALIDATION_FAILED',
    });
    expect(
      await app.db.getRepository('jsTemplateProjects').count({
        filter: {
          normalizedName: 'invalid-initial-validation',
        },
      }),
    ).toBe(0);
    expect(await app.db.getRepository('vscFileRepositories').count()).toBe(0);
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(0);
  });

  it('keeps js-template resource validation errors on the js-template error contract', async () => {
    const repo = await createRepoAndWait(app, agent, {
      name: 'Invalid Input Source',
    });
    const invalidPushResponse = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'invalid push',
        files: [
          {
            path: 'README.md',
            content: '# Invalid\n',
            operation: 'replace',
          },
        ],
      },
    });
    const invalidRepoResponse = await agent.resource('jsTemplateProjects').create({
      values: {
        title: 'Missing name',
      },
    });
    const missingPushSourceResponse = await agent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'invalid missing source',
        files: [
          {
            path: 'README.md',
          },
        ],
      },
    });
    const invalidInitialFileResponse = await agent.resource('jsTemplateProjects').create({
      values: {
        name: 'Invalid Initial Source',
        initialFiles: [
          {
            path: 'README.md',
          },
        ],
      },
    });

    expect(invalidPushResponse.status).toBe(400);
    expect(invalidPushResponse.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      status: 400,
    });
    expect(invalidRepoResponse.status).toBe(400);
    expect(invalidRepoResponse.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      status: 400,
    });
    expect(missingPushSourceResponse.status).toBe(400);
    expect(missingPushSourceResponse.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      status: 400,
    });
    expect(missingPushSourceResponse.body.errors[0].code).not.toBe('JS_TEMPLATE_SOURCE_ERROR');
    expect(invalidInitialFileResponse.status).toBe(400);
    expect(invalidInitialFileResponse.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      status: 400,
    });
  });
});

async function createRepoAndWait(
  app: MockServer,
  agent: ReturnType<MockServer['agent']>,
  values: JsTemplateCreateProjectInput,
): Promise<JsTemplateProject> {
  const response = await agent.resource('jsTemplateProjects').create({ values });
  expect(response.status).toBe(202);
  const accepted = response.body.data as JsTemplateCreateJob;
  await waitForSuccessfulCreate(app, accepted.id, accepted.targetProjectId);
  const repoResponse = await agent.resource('jsTemplateProjects').get({ filterByTk: accepted.targetProjectId });
  if (repoResponse.status !== 200 || !repoResponse.body.data) {
    throw new Error(`Creation job ${accepted.id} did not persist repository ${accepted.targetProjectId}`);
  }
  return repoResponse.body.data as JsTemplateProject;
}

async function waitForSuccessfulCreate(app: MockServer, jobId: string, projectId: string): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const job = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (job?.get('status') === 'failed') {
      throw new Error(`Creation job ${jobId} failed with ${String(job.get('errorCode'))}`);
    }
    if (job?.get('status') === 'succeeded' && job.get('resultProjectId') === projectId) {
      const repo = await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId });
      if (repo) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
}

async function waitForFailedCreateJob(app: MockServer, jobId: string): Promise<JsTemplateCreateJob> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const job = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (job?.get('status') === 'failed') {
      return job.toJSON() as JsTemplateCreateJob;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Creation job ${jobId} did not fail`);
}

async function seedRawSourceFiles(app: MockServer, projectId: string, files: JsTemplateTreeEntryInput[]) {
  const repo = await app.db.getRepository('jsTemplateProjects').findOne({
    filterByTk: projectId,
  });
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(() => ({
    allowed: true,
    ownerType: 'js-template',
  }));
  const vscFileService = new VscFileService(app.db, permissionHooks);
  const push = await vscFileService.push(
    {
      repoId: String(repo?.get('vscRepoId')),
      baseCommitId: (repo?.get('headCommitId') as string | null) || null,
      message: 'seed raw source',
      files,
      allowEmptyCommit: true,
      metadata: {
        jsTemplateProjectId: projectId,
        testSeed: true,
      },
    },
    {
      request: {
        resourceName: 'test',
        actionName: 'seedRawSource',
      },
    },
  );

  await app.db.getRepository('jsTemplateProjects').update({
    filterByTk: projectId,
    values: {
      headCommitId: push.repository.headCommitId || null,
    },
  });

  return push;
}

async function createRoleAgent(app: MockServer, roleName: string, snippets: string[] = []) {
  await app.db.getRepository('roles').create({
    values: {
      name: roleName,
      snippets,
    },
  });
  const user = await app.db.getRepository('users').create({
    values: {
      nickname: roleName,
      roles: [roleName],
    },
  });

  return (await app.agent().login(user)).set('x-role', roleName);
}

function getVscPermissionHookRegistrar(app: MockServer): {
  registerPermissionHook: PluginJsTemplateServer['registerPermissionHook'];
} {
  const plugin = app.pm.get(PluginJsTemplateServer);
  return plugin as {
    registerPermissionHook: PluginJsTemplateServer['registerPermissionHook'];
  };
}
