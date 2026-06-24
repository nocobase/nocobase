/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import PluginVscFileServer from '../plugin';
import { vscFileActionNames } from '../resources/vscFile';

describe('vsc-file resource actions and ACL', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let currentUserId: string;

  beforeEach(async () => {
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
    await app?.destroy();
  });

  it('registers the complete vscFile action surface', async () => {
    const resource = app.resourceManager.getResource('vscFile');
    const actions = Array.from(resource.actions.keys()).sort();
    const expectedActions = [...vscFileActionNames].sort();

    expect(actions).toEqual(expectedActions);
  });

  it('allows logged-in users to create repositories, pull, and push', async () => {
    const createResponse = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'demo',
        name: 'main',
      },
    });
    const repository = createResponse.body.data.repository;
    const pullResponse = await agent.resource('vscFile').pull({
      values: {
        repoId: repository.id,
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

    expect(createResponse.status).toBe(200);
    expect(pullResponse.status).toBe(200);
    expect(pushResponse.status).toBe(200);
    expect(pushResponse.body.data.commit).toMatchObject({
      seq: 1,
      message: 'first commit',
    });
    expect(pushResponse.body.data.repository).toMatchObject({
      id: repository.id,
      headCommitId: pushResponse.body.data.commit.id,
    });
  });

  it('rejects anonymous access', async () => {
    const response = await app
      .agent()
      .resource('vscFile')
      .createRepository({
        values: {
          ownerType: 'plugin',
          ownerId: 'demo',
          name: 'main',
        },
      });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid paths', async () => {
    const repository = await createRepository();
    const response = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'invalid path',
        files: [{ path: '../README.md', content: '# Demo\n' }],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
  });

  it('returns 400 for malformed payloads', async () => {
    const repository = await createRepository();
    const response = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'missing files',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
  });

  it('returns 404 for missing repositories', async () => {
    const response = await agent.resource('vscFile').pull({
      values: {
        repoId: 'missing-repo',
      },
    });

    expect(response.status).toBe(404);
    expect(response.body.errors[0]).toMatchObject({
      code: 'REPO_NOT_FOUND',
      status: 404,
    });
  });

  it('returns 409 for stale pushes', async () => {
    const repository = await createRepository();
    const first = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'first commit',
        files: [{ path: 'README.md', content: '# Demo\n' }],
      },
    });
    await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: first.body.data.commit.id,
        message: 'second commit',
        files: [{ path: 'src/index.ts', content: 'export const value = 1;\n' }],
      },
    });

    const response = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: first.body.data.commit.id,
        message: 'stale commit',
        files: [{ path: 'src/other.ts', content: 'export const other = 1;\n' }],
      },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'BASE_COMMIT_OUTDATED',
      status: 409,
    });
  });

  it('binds draft actions to the current user and rejects cross-user draft access', async () => {
    const repository = await createRepository();
    const saveResponse = await agent.resource('vscFile').saveDraft({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        files: [{ path: 'README.md', operation: 'upsert', content: '# Draft\n' }],
      },
    });
    const draft = saveResponse.body.data.draft;
    const otherUser = await app.db.getRepository('users').create({
      values: {
        nickname: 'other user',
      },
    });
    const otherAgent = await app.agent().login(otherUser);

    const crossReadResponse = await otherAgent.resource('vscFile').getDraft({
      values: {
        repoId: repository.id,
        userId: currentUserId,
      },
    });
    const crossPushResponse = await otherAgent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'commit another user draft',
        files: [{ path: 'README.md', content: '# Other\n' }],
        draftId: draft.id,
      },
    });
    const ownerDraftResponse = await agent.resource('vscFile').getDraft({
      values: {
        repoId: repository.id,
      },
    });

    expect(saveResponse.status).toBe(200);
    expect(draft).toMatchObject({
      userId: currentUserId,
    });
    expect(crossReadResponse.status).toBe(403);
    expect(crossReadResponse.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
    });
    expect(crossPushResponse.status).toBe(403);
    expect(crossPushResponse.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
    });
    expect(ownerDraftResponse.body.data.draft).toMatchObject({
      id: draft.id,
      status: 'active',
    });
  });

  it('returns 413 for oversized files', async () => {
    const repository = await createRepository();
    const response = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'large file',
        files: [{ path: 'large.txt', content: 'a'.repeat(1024 * 1024 + 1) }],
      },
    });

    expect(response.status).toBe(413);
    expect(response.body.errors[0]).toMatchObject({
      code: 'FILE_TOO_LARGE',
      status: 413,
    });
  });

  async function createRepository() {
    const response = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'demo',
        name: `main-${Math.random()}`,
      },
    });

    expect(response.status).toBe(200);
    return response.body.data.repository;
  }
});
