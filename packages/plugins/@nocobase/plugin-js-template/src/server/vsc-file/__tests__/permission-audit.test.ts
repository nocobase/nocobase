/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { runJSSourceAuditActionNames, VscFileService, vscFileAuditActionNames } from '@nocobase/runjs/workspace/server';
import { VscError, getRunJSSourceOwnerId, type RunJSSourceLocator } from '@nocobase/runjs/workspace/shared';
import { MockServer, createMockServer } from '@nocobase/test';

import PluginJsTemplateServer from '../../plugin';

type VscFileAgent = ReturnType<MockServer['agent']>;

type VscAuditActionRegistration = {
  name: string;
  getMetaData?: (ctx: Context) => Promise<Record<string, unknown>>;
};

describe('vsc-file permission hooks and audit registration', () => {
  let app: MockServer;
  let agent: VscFileAgent;
  let unregisterHooks: Array<() => void>;

  beforeEach(async () => {
    unregisterHooks = [];
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', PluginJsTemplateServer],
    });

    const user = await app.db.getRepository('users').findOne();
    agent = await app.agent().login(user);
  });

  afterEach(async () => {
    for (const unregister of unregisterHooks) {
      unregister();
    }
    await app?.destroy();
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
    const vsc = new VscFileService(app.db);
    const createWithInitial = await vsc.createRepository({
      ownerType: 'plugin',
      ownerId: 'initial-demo',
      name: 'initial-main',
      initialFiles: [{ path: 'README.md', content: '# Initial secret\n' }],
    });
    const { repository } = await vsc.createRepository({
      ownerType: 'plugin',
      ownerId: 'demo',
      name: `main-${Math.random()}`,
    });
    const push = await vsc.push({
      repoId: repository.id,
      baseCommitId: null,
      message: 'first commit',
      files: [{ path: 'README.md', content: '# Demo\n' }],
    });
    const commitId = push.commit.id;
    const updateRef = await vsc.updateRef({
      repoId: repository.id,
      name: 'head',
      targetCommitId: commitId,
    });

    const createWithInitialCommitId = createWithInitial.initialCommit?.id;
    expect(createWithInitialCommitId).toBeTruthy();
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
        data: createWithInitial,
      },
      {
        repoId: createWithInitial.repository.id,
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
        data: push,
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
        data: updateRef,
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
            filesHash: 'a'.repeat(64),
            runtimeCodeHash: 'b'.repeat(64),
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
      },
    );

    expect(metadata.request?.body).toMatchObject({
      locatorKind: 'flowModel.step',
      repoId: 'repo_audit',
      fileCount: 1,
    });
    expect(metadata.response?.body).toMatchObject({
      commit: {
        id: 'commit_next',
        repoId: 'repo_audit',
      },
      artifact: {
        filesHash: 'a'.repeat(64),
        runtimeCodeHash: 'b'.repeat(64),
        diagnosticsCount: 1,
      },
      fileCount: 1,
    });
    expect(JSON.stringify(metadata)).not.toContain('request secret');
    expect(JSON.stringify(metadata)).not.toContain('response artifact secret');
    expect(JSON.stringify(metadata)).not.toContain('response file secret');
    expect(JSON.stringify(metadata)).not.toContain('Update JS action');
    expect(JSON.stringify(metadata)).not.toContain('src/main.tsx');
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
      },
    );

    expect(success.request?.body).toMatchObject({
      locatorKind: 'flowModel.step',
      repoId: 'repo_incremental_audit',
      totalSize: Buffer.byteLength(content, 'utf8'),
      contentHashes: [expect.stringMatching(/^[a-f0-9]{64}$/u)],
    });
    expect(success.request?.body).not.toHaveProperty('files');
    expect(success.request?.body).not.toHaveProperty('changes');
    expect(JSON.stringify(success)).not.toContain('incremental request secret');
    expect(JSON.stringify(success)).not.toContain('compiled response secret');
    expect(JSON.stringify(success)).not.toContain('source map secret');
    expect(JSON.stringify(success)).not.toContain('Update one incremental file');
    expect(JSON.stringify(success)).not.toContain('src/client/index.tsx');
    expect(JSON.stringify(success)).not.toContain('src/client/obsolete.ts');

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
      },
    );

    expect(conflict.request?.body).toMatchObject({
      totalSize: Buffer.byteLength(content, 'utf8'),
      contentHashes: [expect.stringMatching(/^[a-f0-9]{64}$/u)],
    });
    expect(JSON.stringify(conflict)).not.toContain('incremental request secret');
    expect(JSON.stringify(conflict)).not.toContain('Update one incremental file');
    expect(JSON.stringify(conflict)).not.toContain('src/client/index.tsx');
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
    expect(JSON.stringify(importMetadata)).not.toContain('Import RunJS workspace');
    expect(JSON.stringify(importMetadata)).not.toContain('src/main.tsx');
    expect(JSON.stringify(recoveryMetadata)).not.toContain('request source secret');
    expect(JSON.stringify(recoveryMetadata)).not.toContain('response source secret');
  });

  function getPlugin(): PluginJsTemplateServer {
    return app.pm.get(PluginJsTemplateServer) as PluginJsTemplateServer;
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
