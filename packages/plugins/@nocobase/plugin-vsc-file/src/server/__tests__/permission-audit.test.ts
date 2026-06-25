/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { MockServer, createMockServer } from '@nocobase/test';

import { vscFileAuditActionNames } from '../audit';
import type { VscPermissionHookInput } from '../permissions';
import PluginVscFileServer from '../plugin';

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
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', PluginVscFileServer],
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

  it('keeps logged-in vscFile writes allowed when no permission hook is registered', async () => {
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

  it('registers audit manager actions for vscFile write operations', async () => {
    for (const actionName of vscFileAuditActionNames) {
      const action = getAuditAction(actionName);

      expect(action).toMatchObject({
        name: `vscFile:${actionName}`,
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
    const saveResponse = await agent.resource('vscFile').saveDraft({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        files: [{ path: 'README.md', operation: 'upsert', content: '# Draft\n' }],
      },
    });
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
        name: 'published',
        targetCommitId: commitId,
        basePublishedCommitId: null,
      },
    });

    expect(saveResponse.status).toBe(200);
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
    const saveMetadata = await expectAuditMetadata(
      'saveDraft',
      {
        values: {
          repoId: repository.id,
        },
      },
      {
        data: saveResponse.body.data,
      },
      {
        repoId: repository.id,
        ownerType: 'plugin',
        ownerId: 'demo',
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
          name: 'published',
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
        refName: 'published',
      },
    );

    expect(createMetadata).not.toHaveProperty('refName');
    expect(JSON.stringify(createMetadata.request?.body)).not.toContain('Initial secret');
    expect(JSON.stringify(createMetadata.response?.body)).not.toContain('Initial secret');
    expect(JSON.stringify(saveMetadata.request?.body)).not.toContain('Draft');
    expect(JSON.stringify(saveMetadata.response?.body)).not.toContain('Draft');
    expect(JSON.stringify(pushMetadata.request?.body)).not.toContain('Demo');
    expect(JSON.stringify(pushMetadata.response?.body)).not.toContain('Demo');
    expect(updateRefMetadata.request?.body).toMatchObject({
      repoId: repository.id,
      refName: 'published',
      targetCommitId: commitId,
    });
  });

  function getPlugin(): PluginVscFileServer {
    return app.pm.get(PluginVscFileServer) as PluginVscFileServer;
  }

  function getAuditAction(actionName: string): VscAuditActionRegistration | null {
    return app.auditManager.getAction(actionName, 'vscFile') as VscAuditActionRegistration | null;
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
});
