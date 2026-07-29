/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import {
  runJSSourceAuditActionNames,
  type VscPermissionHookInput,
  vscFileAuditActionNames,
} from '@nocobase/runjs-workspace/server';
import { VscError, getRunJSSourceOwnerId, type RunJSSourceLocator } from '@nocobase/runjs-workspace/shared';
import { MockServer, createMockServer } from '@nocobase/test';

import PluginLightExtensionServer from '../../plugin';
import { RemoteStore } from '../remotes/RemoteStore';
import { SyncJobStore } from '../remotes/SyncJobStore';

type VscFileAgent = ReturnType<MockServer['agent']>;

type VscAuditActionRegistration = {
  name: string;
  getMetaData?: (ctx: Context) => Promise<Record<string, unknown>>;
};

interface VscRepositoryForTest {
  id: string;
  ownerType: string;
  ownerId: string;
  headCommitId: string | null;
}

interface VscTreeEntryModelForTest {
  get: (key: string) => unknown;
}

describe('vsc-file permission hooks and audit registration', () => {
  let app: MockServer;
  let agent: VscFileAgent;
  let currentUserId: string;
  let unregisterHooks: Array<() => void>;

  beforeEach(async () => {
    unregisterHooks = [];
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
        PluginLightExtensionServer,
      ],
    });

    const user = await app.db.getRepository('users').findOne();
    currentUserId = String(user.get('id'));
    agent = await app.agent().login(user);
  });

  afterEach(async () => {
    for (const unregister of unregisterHooks) {
      unregister();
    }
    await app?.destroy();
  });

  it('allows raw vscFile writes for configuration roles', async () => {
    const response = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'demo',
        name: 'main',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.repository).toMatchObject({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: 'main',
    });
  });

  it('denies raw vscFile access to logged-in roles without configuration permission', async () => {
    const roleName = 'vscFileRestricted';
    app.acl.define({
      role: roleName,
      strategy: {
        actions: false,
        allowConfigure: false,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        allowConfigure: false,
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: roleName,
        roles: [roleName],
      },
    });
    const restrictedAgent = (await app.agent().login(user)).set('x-role', roleName);

    const response = await restrictedAgent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'demo',
        name: 'main',
      },
    });

    expect(response.status).toBe(403);
  });

  it('rejects raw vscFile access for RunJS source repositories', async () => {
    const response = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'runjs-source',
        ownerId: 'runjs:flowModel.step:form_1:source_1',
        name: 'source',
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        ownerType: 'runjs-source',
        denyReason: 'runjs_source_requires_adapter_resource',
      },
    });
  });

  it('does not let a generic permissive hook open protected light-extension owners', async () => {
    unregisterHooks.push(getPlugin().registerPermissionHook(() => true));

    const response = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'light-extension',
        ownerId: 'ler_protected',
        name: 'main',
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        ownerType: 'light-extension',
        denyReason: 'raw_resource_forbidden',
      },
    });
  });

  it('returns 403 when a permission hook denies a write action with false', async () => {
    unregisterHooks.push(
      getPlugin().registerPermissionHook((input) => {
        return input.action === 'createRepository' ? false : true;
      }),
    );

    const response = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'demo',
        name: 'main',
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
    });
  });

  it('passes repository owner fields and request metadata to permission hooks', async () => {
    const repository = await createRepository();
    let captured: VscPermissionHookInput | null = null;

    unregisterHooks.push(
      getPlugin().registerPermissionHook((input) => {
        if (input.action === 'push') {
          captured = input;
        }
        return true;
      }),
    );

    const response = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'first commit',
        files: [{ path: 'README.md', content: '# Demo\n' }],
      },
    });

    expect(response.status).toBe(200);
    expect(captured).toMatchObject({
      action: 'push',
      userId: currentUserId,
      repoId: repository.id,
      ownerType: 'plugin',
      ownerId: 'demo',
      repository: {
        id: repository.id,
        ownerType: 'plugin',
        ownerId: 'demo',
      },
      request: {
        resourceName: 'vscFile',
        actionName: 'push',
      },
    });
  });

  it('rejects raw blob diff endpoints before they can bypass repository permission hooks', async () => {
    const allowedRepository = await createRepository('allowed');
    const deniedRepository = await createRepository('denied');
    const deniedPushResponse = await agent.resource('vscFile').push({
      values: {
        repoId: deniedRepository.id,
        baseCommitId: null,
        message: 'secret commit',
        files: [{ path: 'secret.txt', content: 'repo-b-secret\n' }],
      },
    });
    const deniedTreeEntry = (await app.db.getRepository('vscFileTreeEntries').findOne({
      filter: {
        treeHash: deniedPushResponse.body.data.commit.treeHash,
        path: 'secret.txt',
      },
    })) as VscTreeEntryModelForTest | null;

    if (!deniedTreeEntry) {
      throw new Error('Expected denied repository tree entry');
    }

    unregisterHooks.push(
      getPlugin().registerPermissionHook((input) => {
        return input.repoId === deniedRepository.id ? false : true;
      }),
    );

    const response = await agent.resource('vscFile').diffFile({
      values: {
        repoId: allowedRepository.id,
        from: {
          type: 'blob',
          blobHash: String(deniedTreeEntry.get('blobHash')),
        },
        to: null,
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
    expect(JSON.stringify(response.body)).not.toContain('repo-b-secret');
  });

  it('blocks raw repository archive while a remote job is active', async () => {
    const repository = await createRepository('archive-busy');
    const remote = await new RemoteStore(app.db).create({
      repoId: repository.id,
      name: 'origin',
      provider: 'git',
      config: {
        url: 'https://git.example.com/nocobase/demo.git',
        branch: 'main',
        subdirectory: null,
        transport: 'https',
      },
      authRef: null,
    });
    await new SyncJobStore(app.db).createOrGet({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      operation: 'push',
      idempotencyKey: 'archive-busy',
    });

    const response = await agent.resource('vscFile').archiveRepository({
      values: { repoId: repository.id },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'BUSY',
      details: { reasonCode: 'active-sync-job' },
    });
  });

  it('does not expose remote persistence collections through generic CRUD resources', async () => {
    for (const resourceName of ['vscFileRemotes', 'vscFileSyncJobs', 'vscFileExternalCommitMaps', 'vscFileConflicts']) {
      const response = await agent.resource(resourceName).list();
      expect(response.status).toBe(403);
      expect(response.body.errors[0]).toMatchObject({
        code: 'PERMISSION_DENIED',
        details: { reasonCode: 'remote-internal-resource' },
      });
    }
  });

  it('allows an authorized logged-in caller to use the incremental RunJS action', async () => {
    const locator = createRunJSSourceLocator('fm_incremental_authorized');
    let ownerFingerprint = 'owner:fm_incremental_authorized:v1';
    await createRunJSSourceRepository('repo_incremental_authorized', locator);
    unregisterHooks.push(
      getPlugin().registerRunJSSourceAdapter({
        kind: 'flowModel.step',
        assertCanRead: () => undefined,
        assertCanWrite: () => undefined,
        readLegacy: () => ({
          code: 'ctx.render("legacy");',
          version: 'v2',
          label: 'Authorized incremental source',
          surfaceStyle: 'render',
          language: 'typescript',
          ownerFingerprint,
        }),
        getFingerprint: () => ownerFingerprint,
        writeRuntime: () => {
          ownerFingerprint = 'owner:fm_incremental_authorized:v2';
          return { ownerFingerprint };
        },
      }),
    );

    const response = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: 'repo_incremental_authorized',
        baseCommitId: null,
        baseOwnerFingerprint: 'owner:fm_incremental_authorized:v1',
        message: 'Create authorized source',
        changes: [
          {
            operation: 'upsert',
            path: 'src/client/index.tsx',
            expectedBlobHash: null,
            content: 'ctx.render("authorized");',
          },
        ],
      },
    });

    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data).toMatchObject({
      repository: { id: 'repo_incremental_authorized' },
      ownerFingerprint: 'owner:fm_incremental_authorized:v2',
    });
  });

  it('returns the adapter permission denial from the incremental RunJS action', async () => {
    const locator = createRunJSSourceLocator('fm_incremental_denied');
    await createRunJSSourceRepository('repo_incremental_denied', locator);
    unregisterHooks.push(
      getPlugin().registerRunJSSourceAdapter({
        kind: 'flowModel.step',
        assertCanRead: () => undefined,
        assertCanWrite: () => {
          throw new VscError('PERMISSION_DENIED', 'Adapter denied incremental authoring');
        },
        readLegacy: () => ({
          code: 'ctx.render("legacy");',
          version: 'v2',
          label: 'Denied incremental source',
          surfaceStyle: 'render',
          language: 'typescript',
          ownerFingerprint: 'owner:fm_incremental_denied:v1',
        }),
        getFingerprint: () => 'owner:fm_incremental_denied:v1',
        writeRuntime: () => {
          throw new Error('Unexpected runtime write');
        },
      }),
    );

    const response = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: 'repo_incremental_denied',
        baseCommitId: null,
        baseOwnerFingerprint: 'owner:fm_incremental_denied:v1',
        message: 'Reject denied source',
        changes: [
          {
            operation: 'upsert',
            path: 'src/client/index.tsx',
            expectedBlobHash: null,
            content: 'ctx.render("denied secret");',
          },
        ],
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      message: 'Adapter denied incremental authoring',
    });
  });

  it('registers audit manager actions for vscFile write operations', async () => {
    for (const actionName of vscFileAuditActionNames) {
      const action = getAuditAction(actionName);

      expect(action).toMatchObject({
        name: `vscFile:${actionName}`,
      });
      expect(typeof action?.getMetaData).toBe('function');
    }
  });

  it('registers audit manager actions for runJSSources write operations', async () => {
    for (const actionName of runJSSourceAuditActionNames) {
      const action = getAuditAction(actionName, 'runJSSources');

      expect(action).toMatchObject({
        name: `runJSSources:${actionName}`,
      });
      expect(typeof action?.getMetaData).toBe('function');
    }
  });

  it('adds repository owner and target commit or ref fields to audit metadata', async () => {
    const createWithInitialResponse = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'initial-demo',
        name: 'initial-main',
        initialFiles: [{ path: 'README.md', content: '# Initial secret\n' }],
      },
    });
    const repository = await createRepository();
    const pushResponse = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'first commit',
        files: [{ path: 'README.md', content: '# Demo\n' }],
      },
    });
    const commitId = pushResponse.body.data.commit.id;
    const updateRefResponse = await agent.resource('vscFile').updateRef({
      values: {
        repoId: repository.id,
        name: 'head',
        targetCommitId: commitId,
      },
    });

    expect(pushResponse.status).toBe(200);
    expect(updateRefResponse.status).toBe(200);
    expect(createWithInitialResponse.status).toBe(200);
    const createWithInitialCommitId = createWithInitialResponse.body.data.initialCommit.id;
    const createMetadata = await expectAuditMetadata(
      'createRepository',
      {
        values: {
          ownerType: 'plugin',
          ownerId: 'initial-demo',
          name: 'initial-main',
          initialFiles: [{ path: 'README.md', content: '# Initial secret\n' }],
        },
      },
      {
        data: createWithInitialResponse.body.data,
      },
      {
        repoId: createWithInitialResponse.body.data.repository.id,
        ownerType: 'plugin',
        ownerId: 'initial-demo',
        targetCommitId: createWithInitialCommitId,
      },
    );
    const pushMetadata = await expectAuditMetadata(
      'push',
      {
        values: {
          repoId: repository.id,
        },
      },
      {
        data: pushResponse.body.data,
      },
      {
        repoId: repository.id,
        ownerType: 'plugin',
        ownerId: 'demo',
        targetCommitId: commitId,
      },
    );
    const updateRefMetadata = await expectAuditMetadata(
      'updateRef',
      {
        values: {
          repoId: repository.id,
          name: 'head',
          targetCommitId: commitId,
        },
      },
      {
        data: updateRefResponse.body.data,
      },
      {
        repoId: repository.id,
        ownerType: 'plugin',
        ownerId: 'demo',
        targetCommitId: commitId,
        refName: 'head',
      },
    );

    expect(createMetadata).not.toHaveProperty('refName');
    expect(JSON.stringify(createMetadata.request?.body)).not.toContain('Initial secret');
    expect(JSON.stringify(createMetadata.response?.body)).not.toContain('Initial secret');
    expect(JSON.stringify(pushMetadata.request?.body)).not.toContain('Demo');
    expect(JSON.stringify(pushMetadata.response?.body)).not.toContain('Demo');
    expect(updateRefMetadata.request?.body).toMatchObject({
      repoId: repository.id,
      refName: 'head',
      targetCommitId: commitId,
    });
  });

  it('adds RunJS source fields to audit metadata without leaking source code', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_audit',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };
    const metadata = await expectRunJSSourceAuditMetadata(
      'save',
      {
        values: {
          locator,
          repoId: 'repo_audit',
          message: 'Update JS action',
          files: [
            {
              path: 'src/main.tsx',
              operation: 'upsert',
              content: 'ctx.render("request secret");',
              language: 'typescript',
            },
          ],
        },
      },
      {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          repository: {
            id: 'repo_audit',
            ownerType: 'runjs-source',
            ownerId: 'runjs:flowModel.step:fm_audit:source-path-hash',
          },
          commit: {
            id: 'commit_next',
            repoId: 'repo_audit',
          },
          artifact: {
            entryPath: 'src/main.tsx',
            filesHash: 'response-files-hash',
            runtimeCodeHash: 'response-runtime-hash',
            code: 'ctx.render("response artifact secret");',
            diagnostics: [{ message: 'ignored detail' }],
          },
          ownerFingerprint: 'owner:v2',
          files: [
            {
              path: 'src/main.tsx',
              content: 'ctx.render("response file secret");',
            },
          ],
        },
      },
      {
        resource: 'runJSSources',
        action: 'save',
        locatorKind: 'flowModel.step',
        repoId: 'repo_audit',
        commitId: 'commit_next',
        ownerId: 'fm_audit',
        repositoryOwnerId: 'runjs:flowModel.step:fm_audit:source-path-hash',
        message: 'Update JS action',
      },
    );

    expect(metadata.request?.body).toMatchObject({
      locatorKind: 'flowModel.step',
      repoId: 'repo_audit',
      message: 'Update JS action',
      files: [
        {
          path: 'src/main.tsx',
          operation: 'upsert',
          language: 'typescript',
        },
      ],
    });
    expect(metadata.response?.body).toMatchObject({
      commit: {
        id: 'commit_next',
        repoId: 'repo_audit',
      },
      artifact: {
        entryPath: 'src/main.tsx',
        filesHash: 'response-files-hash',
        runtimeCodeHash: 'response-runtime-hash',
        diagnosticsCount: 1,
      },
      fileCount: 1,
    });
    expect(JSON.stringify(metadata)).not.toContain('request secret');
    expect(JSON.stringify(metadata)).not.toContain('response artifact secret');
    expect(JSON.stringify(metadata)).not.toContain('response file secret');
  });

  it('audits successful and conflicting incremental saves with content summaries only', async () => {
    const locator = createRunJSSourceLocator('fm_incremental_audit');
    const content = 'ctx.render("incremental request secret");';
    const params = {
      values: {
        locator,
        repoId: 'repo_incremental_audit',
        baseCommitId: 'commit_base',
        baseOwnerFingerprint: 'owner:incremental:v1',
        message: 'Update one incremental file',
        changes: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            expectedBlobHash: 'a'.repeat(64),
            content,
          },
          {
            path: 'src/client/obsolete.ts',
            operation: 'delete',
            expectedBlobHash: 'b'.repeat(64),
          },
        ],
      },
    };
    const success = await expectRunJSSourceAuditMetadata(
      'saveChanges',
      params,
      {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          repository: {
            id: 'repo_incremental_audit',
            ownerType: 'runjs-source',
            ownerId: 'runjs:flowModel.step:fm_incremental_audit:source-path-hash',
          },
          commit: {
            id: 'commit_next',
            repoId: 'repo_incremental_audit',
          },
          artifact: {
            entryPath: 'src/client/index.tsx',
            filesHash: 'files-hash',
            runtimeCodeHash: 'runtime-hash',
            code: 'compiled response secret',
            sourceMap: 'source map secret',
            diagnostics: [],
          },
          ownerFingerprint: 'owner:incremental:v2',
        },
      },
      {
        resource: 'runJSSources',
        action: 'saveChanges',
        locatorKind: 'flowModel.step',
        repoId: 'repo_incremental_audit',
        commitId: 'commit_next',
        ownerId: 'fm_incremental_audit',
        message: 'Update one incremental file',
      },
    );

    expect(success.request?.body).toMatchObject({
      locatorKind: 'flowModel.step',
      repoId: 'repo_incremental_audit',
      message: 'Update one incremental file',
      changes: [
        {
          path: 'src/client/index.tsx',
          operation: 'upsert',
          expectedBlobHash: 'a'.repeat(64),
          size: Buffer.byteLength(content, 'utf8'),
          contentHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        },
        {
          path: 'src/client/obsolete.ts',
          operation: 'delete',
          expectedBlobHash: 'b'.repeat(64),
        },
      ],
    });
    expect(success.request?.body).not.toHaveProperty('files');
    expect(JSON.stringify(success)).not.toContain('incremental request secret');
    expect(JSON.stringify(success)).not.toContain('compiled response secret');
    expect(JSON.stringify(success)).not.toContain('source map secret');

    const conflict = await expectRunJSSourceAuditMetadata(
      'saveChanges',
      params,
      {
        errors: [
          {
            code: 'RUNJS_FILE_CONFLICT',
            message: 'RunJS source file changed after the workspace was opened',
            status: 409,
            details: {
              path: 'src/client/index.tsx',
              expectedBlobHash: 'a'.repeat(64),
              currentBlobHash: 'c'.repeat(64),
            },
          },
        ],
      },
      {
        resource: 'runJSSources',
        action: 'saveChanges',
        locatorKind: 'flowModel.step',
        repoId: 'repo_incremental_audit',
        ownerId: 'fm_incremental_audit',
        message: 'Update one incremental file',
      },
    );

    expect(conflict.request?.body).toMatchObject({
      changes: expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/index.tsx',
          operation: 'upsert',
          expectedBlobHash: 'a'.repeat(64),
        }),
      ]),
    });
    expect(JSON.stringify(conflict)).not.toContain('incremental request secret');
  });

  it('audits RunJS import and recovery without leaking ZIP or source content', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_audit',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };
    const response = {
      data: {
        locator,
        locatorKind: 'flowModel.step',
        repository: {
          id: 'repo_audit',
          ownerType: 'runjs-source',
          ownerId: 'runjs:flowModel.step:fm_audit:source-path-hash',
          headCommitId: 'commit_next',
        },
        commit: {
          id: 'commit_next',
          repoId: 'repo_audit',
        },
        artifact: {
          entryPath: 'src/main.tsx',
          filesHash: 'response-files-hash',
          runtimeCodeHash: 'response-runtime-hash',
          code: 'response source secret',
        },
      },
    };

    const importMetadata = await expectRunJSSourceAuditMetadata(
      'importZip',
      {
        values: {
          locator,
          repoId: 'repo_audit',
          message: 'Import RunJS workspace',
          zipBase64: 'zip-source-secret',
        },
      },
      response,
      {
        resource: 'runJSSources',
        action: 'importZip',
        repoId: 'repo_audit',
        commitId: 'commit_next',
        message: 'Import RunJS workspace',
      },
    );
    const recoveryResponse = {
      data: {
        ...response.data,
        commit: undefined,
      },
    };
    const recoveryMetadata = await expectRunJSSourceAuditMetadata(
      'restoreFromCode',
      {
        values: {
          locator,
          sourceCode: 'request source secret',
        },
      },
      recoveryResponse,
      {
        resource: 'runJSSources',
        action: 'restoreFromCode',
        repoId: 'repo_audit',
        commitId: 'commit_next',
      },
    );

    expect(JSON.stringify(importMetadata)).not.toContain('zip-source-secret');
    expect(JSON.stringify(importMetadata)).not.toContain('response source secret');
    expect(JSON.stringify(recoveryMetadata)).not.toContain('request source secret');
    expect(JSON.stringify(recoveryMetadata)).not.toContain('response source secret');
  });

  function getPlugin(): PluginLightExtensionServer {
    return app.pm.get(PluginLightExtensionServer) as PluginLightExtensionServer;
  }

  function getAuditAction(actionName: string, resourceName = 'vscFile'): VscAuditActionRegistration | null {
    return app.auditManager.getAction(actionName, resourceName) as VscAuditActionRegistration | null;
  }

  async function expectAuditMetadata(
    actionName: string,
    params: Record<string, unknown>,
    body: Record<string, unknown>,
    expected: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const action = getAuditAction(actionName);

    if (!action?.getMetaData) {
      throw new Error(`Missing audit metadata resolver for ${actionName}`);
    }

    const metadata = await action.getMetaData({
      action: {
        resourceName: 'vscFile',
        actionName,
        params,
      },
      body,
    } as unknown as Context);

    expect(metadata).toMatchObject(expected);
    return metadata;
  }

  async function expectRunJSSourceAuditMetadata(
    actionName: string,
    params: Record<string, unknown>,
    body: Record<string, unknown>,
    expected: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const action = getAuditAction(actionName, 'runJSSources');

    if (!action?.getMetaData) {
      throw new Error(`Missing audit metadata resolver for runJSSources:${actionName}`);
    }

    const metadata = await action.getMetaData({
      action: {
        resourceName: 'runJSSources',
        actionName,
        params,
      },
      body,
    } as unknown as Context);

    expect(metadata).toMatchObject(expected);
    return metadata;
  }

  async function createRepository(ownerId = 'demo'): Promise<VscRepositoryForTest> {
    const response = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId,
        name: `main-${ownerId}-${Math.random()}`,
      },
    });

    expect(response.status).toBe(200);
    return response.body.data.repository as VscRepositoryForTest;
  }

  async function createRunJSSourceRepository(repoId: string, locator: RunJSSourceLocator): Promise<void> {
    await app.db.getRepository('vscFileRepositories').create({
      values: {
        id: repoId,
        ownerType: 'runjs-source',
        ownerId: getRunJSSourceOwnerId(locator),
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headSeq: 0,
      },
    });
    await app.db.getRepository('vscFileRefs').create({
      values: {
        repoId,
        name: 'head',
        type: 'branch',
        commitId: null,
      },
    });
  }

  function createRunJSSourceLocator(modelUid: string): Extract<RunJSSourceLocator, { kind: 'flowModel.step' }> {
    return {
      kind: 'flowModel.step',
      modelUid,
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };
  }
});
