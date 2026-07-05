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

import { LIGHT_EXTENSION_ACL_SNIPPET } from '../../constants';
import PluginLightExtensionServer from '../plugin';
import { lightExtensionFileActionNames } from '../resources/lightExtensionFiles';
import { lightExtensionRepoActionNames } from '../resources/lightExtensionRepos';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';

describe('plugin-light-extension file service resource bridge', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'system-settings',
        PluginVscFileServer,
        PluginLightExtensionServer,
      ],
    });

    agent = await createRoleAgent(app, 'lightExtensionAdmin', [LIGHT_EXTENSION_ACL_SNIPPET]);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('registers the light-extension repo and file resource action surfaces', async () => {
    expect(Array.from(app.resourceManager.getResource('lightExtensionRepos').actions.keys()).sort()).toEqual(
      [...lightExtensionRepoActionNames].sort(),
    );
    expect(Array.from(app.resourceManager.getResource('lightExtensionFiles').actions.keys()).sort()).toEqual(
      [...lightExtensionFileActionNames].sort(),
    );
  });

  it('runs shared vsc permission hooks for light-extension internal source operations', async () => {
    const capturedActions: string[] = [];
    const unregister = getVscPermissionHookRegistrar(app).registerPermissionHook((input) => {
      if (input.ownerType === 'light-extension') {
        capturedActions.push(input.action);
      }
    });

    try {
      const createResponse = await agent.resource('lightExtensionRepos').create({
        values: {
          name: 'Shared Hook Source',
        },
      });
      const repo = createResponse.body.data;

      const pushResponse = await agent.resource('lightExtensionFiles').push({
        values: {
          repoId: repo.id,
          baseCommitId: null,
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
    const createResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Zero Byte Initial Source',
        initialFiles: [
          {
            path: 'empty-initial.txt',
            content: '',
          },
        ],
      },
    });
    const initialRepo = createResponse.body.data;
    const initialFileResponse = await agent.resource('lightExtensionFiles').getFile({
      values: {
        repoId: initialRepo.id,
        path: 'empty-initial.txt',
      },
    });
    const pushRepoResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Zero Byte Push Source',
      },
    });
    const pushRepo = pushRepoResponse.body.data;
    const pushResponse = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: pushRepo.id,
        baseCommitId: null,
        message: 'add empty file',
        files: [
          {
            path: 'empty-push.txt',
            content: '',
          },
        ],
      },
    });
    const pushedFileResponse = await agent.resource('lightExtensionFiles').getFile({
      values: {
        repoId: pushRepo.id,
        path: 'empty-push.txt',
      },
    });

    expect(createResponse.status).toBe(200);
    expect(initialFileResponse.status).toBe(200);
    expect(initialFileResponse.body.data.content).toBe('');
    expect(pushResponse.status).toBe(200);
    expect(pushedFileResponse.status).toBe(200);
    expect(pushedFileResponse.body.data.content).toBe('');
  });

  it('reads, writes, diffs, and lists history without exposing the underlying vsc repo id', async () => {
    const createResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Source Workflow',
      },
    });
    const repo = createResponse.body.data;
    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = repoRecord?.get('vscRepoId') as string;
    const firstPush = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: null,
        message: 'first commit',
        files: [
          {
            path: 'README.md',
            content: '# Light extension\n',
            language: 'markdown',
          },
        ],
      },
    });
    const firstCommit = firstPush.body.data.commit;
    const secondPush = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: firstCommit.id,
        message: 'second commit',
        files: [
          {
            path: 'README.md',
            content: '# Light extension\n\nUpdated\n',
            language: 'markdown',
          },
          {
            path: 'src/client/index.tsx',
            content: 'export default function demo() { return null; }\n',
            language: 'typescript',
          },
        ],
      },
    });
    const secondCommit = secondPush.body.data.commit;
    const pullResponse = await agent.resource('lightExtensionFiles').pull({
      values: {
        repoId: repo.id,
        includeContent: 'all',
      },
    });
    const fileResponse = await agent.resource('lightExtensionFiles').getFile({
      values: {
        repoId: repo.id,
        path: 'README.md',
      },
    });
    const historyResponse = await agent.resource('lightExtensionFiles').history({
      values: {
        repoId: repo.id,
      },
    });
    const diffResponse = await agent.resource('lightExtensionFiles').diff({
      values: {
        repoId: repo.id,
        fromCommitId: firstCommit.id,
        toCommitId: secondCommit.id,
      },
    });
    const diffFileResponse = await agent.resource('lightExtensionFiles').diffFile({
      values: {
        repoId: repo.id,
        from: {
          type: 'commit',
          commitId: firstCommit.id,
          path: 'README.md',
        },
        to: {
          type: 'commit',
          commitId: secondCommit.id,
          path: 'README.md',
        },
      },
    });
    const rawVscResponse = await agent.resource('vscFile').getRepository({
      values: {
        repoId: vscRepoId,
      },
    });

    expect(createResponse.status).toBe(200);
    expect(firstPush.status).toBe(200);
    expect(secondPush.status).toBe(200);
    expect(secondPush.body.data.repo).toMatchObject({
      id: repo.id,
      headCommitId: secondCommit.id,
    });
    expect(pullResponse.body.data.files.map((file: { path: string }) => file.path)).toEqual([
      'README.md',
      'src/client/index.tsx',
    ]);
    expect(fileResponse.body.data).toMatchObject({
      path: 'README.md',
      content: '# Light extension\n\nUpdated\n',
    });
    expect(historyResponse.body.data.map((commit: { id: string }) => commit.id)).toEqual([
      secondCommit.id,
      firstCommit.id,
    ]);
    expect(historyResponse.body.data.every((commit: { repoId: string }) => commit.repoId === repo.id)).toBe(true);
    expect(diffResponse.body.data.summary).toMatchObject({
      added: 1,
      modified: 1,
      deleted: 0,
    });
    expect(diffFileResponse.body.data).toMatchObject({
      additions: 2,
      deletions: 0,
      tooLarge: false,
    });
    expect(rawVscResponse.status).toBe(403);
    expect(rawVscResponse.body.errors[0].details).toMatchObject({
      ownerType: 'light-extension',
      rawResourceAction: 'vscFile:getRepository',
      result: 'denied',
    });
    expect(
      JSON.stringify([createResponse.body.data, firstPush.body.data, secondPush.body.data, pullResponse.body.data]),
    ).not.toContain(vscRepoId);
  });

  it('returns sanitized light-extension errors when the backing vsc repository rejects the operation', async () => {
    const createResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Sanitized Source Error',
      },
    });
    const repo = createResponse.body.data;
    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = repoRecord?.get('vscRepoId') as string;

    await app.db.getRepository('vscFileRepositories').update({
      filterByTk: vscRepoId,
      values: {
        status: 'archived',
      },
    });
    const response = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: null,
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
      code: 'LIGHT_EXTENSION_SOURCE_ERROR',
      status: 409,
      details: {
        repoId: repo.id,
        sourceCode: 'REPO_ARCHIVED',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain(vscRepoId);
  });

  it('returns sanitized light-extension errors from direct file service calls', async () => {
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const repoService = new LightExtensionRepoService(app.db, auditService, permissionService);
    const fileService = new LightExtensionFileService(app.db, auditService, permissionService, repoService);
    const repo = await repoService.createRepo({ name: 'Direct Sanitized Source Error' });
    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const vscRepoId = repoRecord?.get('vscRepoId') as string;

    await app.db.getRepository('vscFileRepositories').update({
      filterByTk: vscRepoId,
      values: {
        status: 'archived',
      },
    });

    try {
      await fileService.push({
        repoId: repo.id,
        baseCommitId: null,
        message: 'should fail safely',
        files: [
          {
            path: 'README.md',
            content: '# safe error\n',
          },
        ],
      });
      throw new Error('Expected direct service push to fail');
    } catch (error) {
      expect(error).toMatchObject({
        code: 'LIGHT_EXTENSION_SOURCE_ERROR',
        status: 409,
        details: {
          repoId: repo.id,
          sourceCode: 'REPO_ARCHIVED',
        },
      });
      expect(JSON.stringify(error)).not.toContain(vscRepoId);
      expect(error instanceof Error ? error.message : '').not.toContain(vscRepoId);
    }
  });

  it('ignores caller supplied push metadata and returns only generated commit metadata', async () => {
    const createResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Generated Metadata Source',
      },
    });
    const repo = createResponse.body.data;
    const pushResponse = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: null,
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
    const historyResponse = await agent.resource('lightExtensionFiles').history({
      values: {
        repoId: repo.id,
      },
    });
    const serializedCommits = JSON.stringify([pushResponse.body.data.commit, historyResponse.body.data]);

    expect(pushResponse.status).toBe(200);
    expect(pushResponse.body.data.commit.metadata).toMatchObject({
      lightExtensionRepoId: repo.id,
      requestSource: 'internal',
    });
    expect(serializedCommits).not.toContain('metadata secret');
    expect(serializedCommits).not.toContain('source-map-secret');
    expect(serializedCommits).not.toContain('settings-token-secret');
  });

  it('blocks ordinary archived source reads and writes while allowing readArchivedSource', async () => {
    const createResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Archived Source',
        initialFiles: [
          {
            path: 'README.md',
            content: '# Archived\n',
            language: 'markdown',
          },
        ],
      },
    });
    const repo = createResponse.body.data;
    const prematureAuditRead = await agent.resource('lightExtensionFiles').readArchivedSource({
      values: {
        repoId: repo.id,
        path: 'README.md',
      },
    });
    const archiveResponse = await agent.resource('lightExtensionRepos').archive({
      values: {
        repoId: repo.id,
        expectedLifecycleStatus: 'enabled',
      },
    });
    const ordinaryRead = await agent.resource('lightExtensionFiles').getFile({
      values: {
        repoId: repo.id,
        path: 'README.md',
      },
    });
    const ordinaryWrite = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: repo.headCommitId,
        message: 'should fail',
        files: [
          {
            path: 'README.md',
            content: '# Should fail\n',
          },
        ],
      },
    });
    const ordinaryHistory = await agent.resource('lightExtensionFiles').history({
      values: {
        repoId: repo.id,
      },
    });
    const restrictedAgent = await createRoleAgent(app, 'lightExtensionRestricted');
    const restrictedAuditRead = await restrictedAgent.resource('lightExtensionFiles').readArchivedSource({
      values: {
        repoId: repo.id,
        path: 'README.md',
      },
    });
    const auditRead = await agent.resource('lightExtensionFiles').readArchivedSource({
      values: {
        repoId: repo.id,
        path: 'README.md',
      },
    });

    expect(prematureAuditRead.status).toBe(409);
    expect(prematureAuditRead.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_NOT_ARCHIVED',
      status: 409,
    });
    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body.data.lifecycleStatus).toBe('archived');
    expect(ordinaryRead.status).toBe(409);
    expect(ordinaryRead.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_ARCHIVED',
      status: 409,
    });
    expect(ordinaryWrite.status).toBe(409);
    expect(ordinaryHistory.status).toBe(409);
    expect(restrictedAuditRead.status).toBe(403);
    expect(auditRead.status).toBe(200);
    expect(auditRead.body.data).toMatchObject({
      path: 'README.md',
      content: '# Archived\n',
    });

    const rejectedWriteLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'sourcePush',
        result: 'blocked',
      },
    });
    const serializedRejectedWriteLog = JSON.stringify(rejectedWriteLog?.toJSON());

    expect(rejectedWriteLog?.get('reasonCode')).toBe('LIGHT_EXTENSION_REPO_ARCHIVED');
    expect(serializedRejectedWriteLog).toContain('README.md');
    expect(serializedRejectedWriteLog).not.toContain('# Should fail');
  });

  it('rejects a push that races with archiving behind the repo write lock', async () => {
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const repoService = new LightExtensionRepoService(app.db, auditService, permissionService);
    const fileService = new LightExtensionFileService(app.db, auditService, permissionService, repoService);
    const repo = await repoService.createRepo({ name: 'Push Archive Race' }, { requestId: 'req_push_race_create' });
    const transaction = await app.db.sequelize.transaction();

    await app.db.getModel('lightExtensionRepos').findByPk(repo.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const pushPromise = fileService.push(
      {
        repoId: repo.id,
        baseCommitId: null,
        message: 'should reject after archive',
        files: [
          {
            path: 'README.md',
            content: '# Should not commit\n',
            language: 'markdown',
          },
        ],
      },
      {
        requestId: 'req_push_race_push',
      },
    );

    await delay(100);
    await app.db.getRepository('lightExtensionRepos').update({
      filterByTk: repo.id,
      values: {
        lifecycleStatus: 'archived',
      },
      transaction,
    });
    await transaction.commit();

    await expect(pushPromise).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_ARCHIVED',
      status: 409,
    });

    expect(await app.db.getRepository('vscFileCommits').count()).toBe(0);
  });

  it('does not hold an exclusive repo lock while reading ordinary source files', async () => {
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const repoService = new LightExtensionRepoService(app.db, auditService, permissionService);
    const fileService = new LightExtensionFileService(app.db, auditService, permissionService, repoService);
    const repo = await repoService.createRepo(
      {
        name: 'Read Archive Race',
        initialFiles: [
          {
            path: 'README.md',
            content: '# Read race\n',
            language: 'markdown',
          },
        ],
      },
      { requestId: 'req_read_race_create' },
    );
    const transaction = await app.db.sequelize.transaction();

    await app.db.getModel('lightExtensionRepos').findByPk(repo.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const readPromise = fileService.getFile(
      {
        repoId: repo.id,
        path: 'README.md',
      },
      {
        requestId: 'req_read_race_read',
      },
    );

    await expect(Promise.race([readPromise, delay(200).then(() => 'blocked')])).resolves.toMatchObject({
      path: 'README.md',
      content: '# Read race\n',
    });

    await app.db.getRepository('lightExtensionRepos').update({
      filterByTk: repo.id,
      values: {
        lifecycleStatus: 'archived',
      },
      transaction,
    });
    await transaction.commit();
  });

  it('records file write audit summaries without storing source content in logs', async () => {
    const createResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Audit Source',
      },
    });
    const repo = createResponse.body.data;

    await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: null,
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

    const log = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'sourcePush',
      },
    });
    const serializedLog = JSON.stringify(log?.toJSON());

    expect(log).toBeTruthy();
    expect(serializedLog).toContain('README.md');
    expect(serializedLog).not.toContain('do-not-log-this-secret-source');
  });

  it('keeps light-extension resource validation errors on the light-extension error contract', async () => {
    const createResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        name: 'Invalid Input Source',
      },
    });
    const repo = createResponse.body.data;
    const invalidPushResponse = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: null,
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
    const invalidRepoResponse = await agent.resource('lightExtensionRepos').create({
      values: {
        title: 'Missing name',
      },
    });
    const missingPushSourceResponse = await agent.resource('lightExtensionFiles').push({
      values: {
        repoId: repo.id,
        baseCommitId: null,
        message: 'invalid missing source',
        files: [
          {
            path: 'README.md',
          },
        ],
      },
    });
    const invalidInitialFileResponse = await agent.resource('lightExtensionRepos').create({
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
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });
    expect(invalidRepoResponse.status).toBe(400);
    expect(invalidRepoResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });
    expect(missingPushSourceResponse.status).toBe(400);
    expect(missingPushSourceResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });
    expect(missingPushSourceResponse.body.errors[0].code).not.toBe('LIGHT_EXTENSION_SOURCE_ERROR');
    expect(invalidInitialFileResponse.status).toBe(400);
    expect(invalidInitialFileResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  registerPermissionHook: PluginVscFileServer['registerPermissionHook'];
} {
  const plugin =
    app.pm.get('@nocobase/plugin-vsc-file') ||
    app.pm.get('vsc-file') ||
    app.pm.get('plugin-vsc-file') ||
    Array.from(app.pm.getPlugins().values()).find(
      (candidate) => typeof (candidate as { registerPermissionHook?: unknown }).registerPermissionHook === 'function',
    );

  return plugin as {
    registerPermissionHook: PluginVscFileServer['registerPermissionHook'];
  };
}
