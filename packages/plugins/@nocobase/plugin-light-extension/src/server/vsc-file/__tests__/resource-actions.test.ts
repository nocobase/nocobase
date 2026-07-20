/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import PluginLightExtensionServer from '../../plugin';
import { vscFileActionNames } from '../resources/vscFile';

describe('vsc-file resource actions and ACL', () => {
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
        PluginLightExtensionServer,
      ],
    });

    const user = await app.db.getRepository('users').findOne();
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

  it('exercises the full repository workflow through public APIs', async () => {
    const createResponse = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'workflow',
        name: `main-${Math.random()}`,
      },
    });
    const repository = createResponse.body.data.repository;
    const emptyPullResponse = await agent.resource('vscFile').pull({
      values: {
        repoId: repository.id,
      },
    });
    const firstPushResponse = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: null,
        message: 'first commit',
        files: [
          { path: 'README.md', content: '# Demo\n' },
          { path: 'src/index.ts', content: 'export const value = 1;\n' },
        ],
      },
    });
    const firstCommit = firstPushResponse.body.data.commit;
    const fileResponse = await agent.resource('vscFile').getFile({
      values: {
        repoId: repository.id,
        path: 'README.md',
      },
    });
    const secondPushResponse = await agent.resource('vscFile').push({
      values: {
        repoId: repository.id,
        baseCommitId: firstCommit.id,
        message: 'second commit',
        files: [
          { path: 'README.md', operation: 'upsert', content: '# Demo\n\nSecond update\n' },
          { path: 'src/second.ts', operation: 'upsert', content: 'export const second = true;\n' },
        ],
      },
    });
    const secondCommit = secondPushResponse.body.data.commit;
    const commitsResponse = await agent.resource('vscFile').listCommits({
      values: {
        repoId: repository.id,
      },
    });
    const pagedCommitsResponse = await agent.resource('vscFile').listCommits({
      values: {
        repoId: repository.id,
        limit: 1,
      },
    });
    const olderCommitsResponse = await agent.resource('vscFile').listCommits({
      values: {
        repoId: repository.id,
        beforeSeq: secondCommit.seq,
        limit: 1,
      },
    });
    const commitDiffResponse = await agent.resource('vscFile').diff({
      values: {
        repoId: repository.id,
        fromCommitId: firstCommit.id,
        toCommitId: secondCommit.id,
      },
    });
    const textDiffResponse = await agent.resource('vscFile').diffFile({
      values: {
        repoId: repository.id,
        from: { type: 'commit', commitId: firstCommit.id, path: 'README.md' },
        to: { type: 'commit', commitId: secondCommit.id, path: 'README.md' },
      },
    });
    const restoreFileResponse = await agent.resource('vscFile').restoreFile({
      values: {
        repoId: repository.id,
        sourceCommitId: firstCommit.id,
        path: 'README.md',
        message: 'restore readme',
      },
    });
    const restoreCommitResponse = await agent.resource('vscFile').restoreCommit({
      values: {
        repoId: repository.id,
        sourceCommitId: firstCommit.id,
        message: 'restore first commit',
      },
    });
    const refsResponse = await agent.resource('vscFile').listRefs({
      values: {
        repoId: repository.id,
      },
    });
    const archiveResponse = await agent.resource('vscFile').archiveRepository({
      values: {
        repoId: repository.id,
      },
    });

    expect(createResponse.status).toBe(200);
    expect(emptyPullResponse.body.data).toMatchObject({
      commit: null,
      tree: null,
      files: [],
    });
    expect(firstPushResponse.body.data.commit).toMatchObject({
      seq: 1,
      parentCommitId: null,
    });
    expect(fileResponse.body.data).toMatchObject({
      path: 'README.md',
      content: '# Demo\n',
    });
    expect(secondPushResponse.body.data.commit).toMatchObject({
      seq: 2,
      parentCommitId: firstCommit.id,
      message: 'second commit',
    });
    expect(commitsResponse.body.data.map((commit: { id: string }) => commit.id)).toEqual([
      secondCommit.id,
      firstCommit.id,
    ]);
    expect(pagedCommitsResponse.body.data.map((commit: { id: string }) => commit.id)).toEqual([secondCommit.id]);
    expect(olderCommitsResponse.body.data.map((commit: { id: string }) => commit.id)).toEqual([firstCommit.id]);
    expect(commitDiffResponse.body.data.summary).toMatchObject({
      added: 1,
      modified: 1,
      deleted: 0,
    });
    expect(textDiffResponse.body.data).toMatchObject({
      additions: 2,
      deletions: 0,
      tooLarge: false,
    });
    expect(restoreFileResponse.body.data.commit).toMatchObject({
      seq: 3,
      parentCommitId: secondCommit.id,
    });
    expect(restoreCommitResponse.body.data.commit).toMatchObject({
      seq: 4,
      parentCommitId: restoreFileResponse.body.data.commit.id,
      treeHash: firstCommit.treeHash,
    });
    expect(refsResponse.body.data).toEqual([
      expect.objectContaining({
        name: 'head',
        commitId: restoreCommitResponse.body.data.commit.id,
      }),
    ]);
    expect(archiveResponse.body.data).toMatchObject({
      id: repository.id,
      status: 'archived',
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
