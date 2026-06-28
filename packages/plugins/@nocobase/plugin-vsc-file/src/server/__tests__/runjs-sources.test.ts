/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import type { RunJSRuntimeArtifact, RunJSSourceAdapterContext } from '../../shared/runjs-source-types';
import PluginVscFileServer from '../plugin';
import { runJSSourceActionNames } from '../runjs-sources';

describe('runJSSources resource', () => {
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

  it('registers the RunJS source action surface', async () => {
    const resource = app.resourceManager.getResource('runJSSources');
    const actions = Array.from(resource.actions.keys()).sort();
    const expectedActions = [...runJSSourceActionNames].sort();

    expect(actions).toEqual(expectedActions);
  });

  it('returns a clear error when no adapter supports the locator kind', async () => {
    const response = await agent.resource('runJSSources').open({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      status: 400,
      details: {
        kind: 'flowModel.step',
      },
    });
  });

  it('returns unsupported kind for an unknown RunJS source kind', async () => {
    const response = await agent.resource('runJSSources').open({
      values: {
        locator: {
          kind: 'custom.runjs',
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      status: 400,
      details: {
        kind: 'custom.runjs',
      },
    });
  });

  it('opens a RunJS source through the registered owner adapter', async () => {
    let capturedContext: RunJSSourceAdapterContext | null = null;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:fingerprint:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:fingerprint:v2',
      }),
      readLegacy: ({ ctx }) => {
        capturedContext = ctx;
        return {
          label: 'JS block / Write JavaScript',
          code: 'return ctx;',
          version: 'v2',
          entry: 'src/main.tsx',
          ownerFingerprint: 'owner:fingerprint:v1',
          surfaceStyle: 'render',
          language: 'typescript',
        };
      },
    });

    const response = await agent.resource('runJSSources').open({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      locatorKind: 'flowModel.step',
      repositoryIdentity: {
        ownerType: 'runjs-source',
        name: 'source',
      },
      legacy: {
        label: 'JS block / Write JavaScript',
        code: 'return ctx;',
        version: 'v2',
      },
      ownerFingerprint: 'owner:fingerprint:v1',
    });
    expect(response.body.data.repositoryIdentity.ownerId).toMatch(/^runjs:flowModel\.step:fm_1:[a-f0-9]{16}$/);
    expect(capturedContext).toMatchObject({
      userId: currentUserId,
      request: {
        resourceName: 'runJSSources',
        actionName: 'open',
      },
    });
  });

  it('publishes a RunJS source through VSC and rejects stale owner fingerprints before creating a commit', async () => {
    let ownerFingerprint = 'owner:fingerprint:v1';
    const publishedArtifacts: Array<{ artifact: RunJSRuntimeArtifact; commitId: string }> = [];

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Write JavaScript',
        code: 'return ctx;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact, commitId }) => {
        publishedArtifacts.push({ artifact, commitId });
        ownerFingerprint = 'owner:fingerprint:v2';
        return {
          ownerFingerprint,
        };
      },
    });

    const publishResponse = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:fingerprint:v1',
        message: 'Update RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return next;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.data).toMatchObject({
      locatorKind: 'flowModel.step',
      repository: {
        publishedCommitId: publishResponse.body.data.commit.id,
      },
      artifact: {
        entryPath: 'src/main.tsx',
      },
      ownerFingerprint: 'owner:fingerprint:v2',
    });
    expect(publishedArtifacts).toHaveLength(1);
    expect(publishedArtifacts[0]).toMatchObject({
      artifact: {
        code: 'return next;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        metadata: {
          repoId: publishResponse.body.data.repository.id,
        },
      },
      commitId: publishResponse.body.data.commit.id,
    });

    const commitCountAfterPublish = await app.db.getRepository('vscFileCommits').count();
    ownerFingerprint = 'owner:fingerprint:external';

    const staleResponse = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        repoId: publishResponse.body.data.repository.id,
        baseCommitId: publishResponse.body.data.commit.id,
        basePublishedCommitId: publishResponse.body.data.commit.id,
        baseOwnerFingerprint: 'owner:fingerprint:v1',
        message: 'Update stale RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return stale;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(staleResponse.status).toBe(409);
    expect(staleResponse.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountAfterPublish);
    expect(publishedArtifacts).toHaveLength(1);
  });

  it('rolls back the VSC commit when the owner changes after the pre-push fingerprint check', async () => {
    let getFingerprintCalls = 0;
    let writePublishedCalled = false;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => {
        getFingerprintCalls += 1;
        return getFingerprintCalls === 1 ? 'owner:mid-publish:v1' : 'owner:mid-publish:external';
      },
      readLegacy: () => ({
        label: 'JS block / Mid-publish guard',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:mid-publish:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        writePublishedCalled = true;
        return {
          ownerFingerprint: 'owner:mid-publish:v2',
        };
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_mid_publish',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:mid-publish:v1',
        message: 'Update guarded RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return guarded;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    expect(writePublishedCalled).toBe(false);
  });

  it('publishes an explicit empty RunJS source without dropping the artifact code', async () => {
    let ownerFingerprint = 'owner:empty:v1';
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Empty JavaScript',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact }) => {
        publishedArtifacts.push(artifact);
        ownerFingerprint = 'owner:empty:v2';
        return {
          ownerFingerprint,
        };
      },
    });

    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_empty',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:empty:v1',
        message: 'Clear RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: '',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(publishedArtifacts).toHaveLength(1);
    expect(publishedArtifacts[0]).toMatchObject({
      code: '',
      entryPath: 'src/main.tsx',
    });
    expect(response.body.data.artifact.runtimeCodeHash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('rejects a supplied repository that does not belong to the RunJS source locator', async () => {
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:repo:v1',
      readLegacy: () => ({
        label: 'JS block / Repository guard',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:repo:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact }) => {
        publishedArtifacts.push(artifact);
        return {
          ownerFingerprint: 'owner:repo:v2',
        };
      },
    });

    const wrongRepositoryResponse = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'runjs-source',
        ownerId: 'runjs:flowModel.step:other-model:0000000000000000',
        name: 'source',
      },
    });
    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();

    expect(wrongRepositoryResponse.status).toBe(200);

    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_repo_guard',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        repoId: wrongRepositoryResponse.body.data.repository.id,
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:repo:v1',
        message: 'Update guarded RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return guarded;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        repoId: wrongRepositoryResponse.body.data.repository.id,
        sourceKind: 'flowModel.step',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    expect(publishedArtifacts).toHaveLength(0);
  });

  function getPlugin(): PluginVscFileServer {
    return app.pm.get(PluginVscFileServer) as PluginVscFileServer;
  }
});
