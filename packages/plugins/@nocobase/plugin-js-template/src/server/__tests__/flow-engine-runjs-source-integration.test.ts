/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import type { RunJSSourceLocator } from '@nocobase/server';
import { bootstrapFlowSurfaceRunJSWorkspace } from '@nocobase/plugin-flow-engine';
import { defaultRunJSEntryPath } from '@nocobase/runjs-workspace/server';

import { JS_TEMPLATE_ACL_SNIPPET, JS_TEMPLATE_COLLECTIONS } from '../../constants';
import FlowModelRepository from '../../../../plugin-flow-engine/src/server/repository';
import PluginJsTemplateServer from '../plugin';

describe('JS Template Flow Engine RunJS source integration', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'system-settings',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        PluginJsTemplateServer,
        'flow-engine',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('opens and saves a Flow Engine source with only the JS Template host', async () => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'js-template-flow-source',
      title: 'JS Template Flow source',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("before");',
            version: 'v2',
          },
        },
      },
    });
    const user = await app.db.getRepository('users').findOne();
    const agent = await app.agent().login(user);
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-template-flow-source',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };

    const opened = await agent.resource('runJSSources').open({ values: { locator } });

    expect(opened.status).toBe(200);
    expect(opened.body.data.legacy).toMatchObject({
      code: 'ctx.render("before");',
      version: 'v2',
    });

    const saved = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.repoId,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Update Flow Engine source',
        entryPath: 'src/main.tsx',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("after");',
            language: 'typescript',
          },
        ],
      },
    });

    expect(saved.status).toBe(200);
    await expect(repository.findModelById('js-template-flow-source')).resolves.toMatchObject({
      stepParams: {
        jsSettings: {
          runJs: {
            code: expect.stringContaining('after'),
            version: 'v2',
            sourceRef: {
              type: 'vsc-file',
              repoId: saved.body.data.repository.id,
              commitId: saved.body.data.commit.id,
              entry: 'src/main.tsx',
            },
          },
        },
      },
    });
  });

  it('replays a completed Save-as against its canonical external FlowModel binding without repeating writes', async () => {
    const roleName = 'save-as-replay-author';
    await app.db.getRepository('roles').create({
      values: { name: roleName, snippets: [JS_TEMPLATE_ACL_SNIPPET] },
    });
    const role = app.acl.define({
      role: roleName,
      actions: {
        'flowModels:findOne': {},
        'flowModels:save': {},
      },
    });
    role.snippets.add(JS_TEMPLATE_ACL_SNIPPET);
    const user = await app.db.getRepository('users').create({
      values: { nickname: 'Save-as replay author', roles: [roleName] },
    });
    const agent = (await app.agent().login(user)).set('x-role', roleName);
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'save-as-replay-flow-source',
      title: 'Save-as replay source',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("saved once");',
            version: 'v2',
          },
        },
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'save-as-replay-flow-source',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    expect(opened.status).toBe(200);
    expect(opened.body.data.legacy.entryPath).toBe('src/main.tsx');
    expect(opened.body.data.source.runtimeVersion).toBe('v2');
    expect(opened.body.data.files).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: defaultRunJSEntryPath })]),
    );

    const sideEffectCollections = [
      JS_TEMPLATE_COLLECTIONS.projects,
      JS_TEMPLATE_COLLECTIONS.templates,
      JS_TEMPLATE_COLLECTIONS.artifacts,
      JS_TEMPLATE_COLLECTIONS.usages,
      JS_TEMPLATE_COLLECTIONS.sourceOperations,
    ] as const;
    const countsBeforeFirst = await Promise.all(
      sideEffectCollections.map((collectionName) => app.db.getRepository(collectionName).count()),
    );
    const input = {
      idempotencyKey: 'save-as-real-flow-model-replay',
      locator,
      expectedOwnerFingerprint: opened.body.data.ownerFingerprint,
      sourceRepoId: opened.body.data.repository.repoId,
      sourceHeadCommitId: opened.body.data.repository.headCommitId,
      entryPath: defaultRunJSEntryPath,
      runtimeVersion: opened.body.data.source.runtimeVersion,
      files: opened.body.data.files.map(
        (file: { path: string; content: string; language?: string; mode?: string }) => ({
          path: file.path,
          content: file.content,
          language: file.language,
          mode: file.mode,
        }),
      ),
      destination: {
        type: 'new',
        name: 'save-as-replay-project',
        title: 'Save-as replay project',
      },
      templateName: 'saved-once-block',
      templateTitle: 'Saved once block',
    };
    const patchFlowModel = vi.spyOn(repository, 'patch');

    const first = await agent.resource('jsTemplates').saveAsJsTemplate({ values: input });

    expect(first.status).toBe(200);
    expect(first.body.data).toMatchObject({
      project: { name: 'save-as-replay-project' },
      template: { kind: 'js-block', templateName: 'saved-once-block' },
      binding: {
        type: 'js-template-entry',
        projectId: expect.any(String),
        templateId: expect.any(String),
        kind: 'js-block',
      },
    });
    expect(patchFlowModel).toHaveBeenCalled();
    await expect(repository.findModelById(locator.modelUid)).resolves.toMatchObject({
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: first.body.data.binding,
          },
        },
      },
    });
    const ordinaryOpen = await agent.resource('runJSSources').open({ values: { locator } });
    expect(ordinaryOpen.status).toBe(403);
    expect(ordinaryOpen.body.errors[0]).toMatchObject({ code: 'RUNJS_SOURCE_READONLY' });

    const countsAfterFirst = await Promise.all(
      sideEffectCollections.map((collectionName) => app.db.getRepository(collectionName).count()),
    );
    expect(countsAfterFirst[0]).toBe(countsBeforeFirst[0] + 1);
    expect(countsAfterFirst[1]).toBe(countsBeforeFirst[1] + 1);
    expect(countsAfterFirst[2]).toBeGreaterThan(countsBeforeFirst[2]);
    expect(countsAfterFirst[3]).toBe(countsBeforeFirst[3] + 1);
    expect(countsAfterFirst[4]).toBe(countsBeforeFirst[4] + 1);
    const operationRepository = app.db.getRepository(JS_TEMPLATE_COLLECTIONS.sourceOperations);
    const operationAfterFirst = await operationRepository.findOne({
      filter: { idempotencyKey: input.idempotencyKey },
    });
    expect(operationAfterFirst?.get('status')).toBe('completed');
    const completedResult = operationAfterFirst?.get('result');
    const operationUpdatedAt = operationAfterFirst?.get('updatedAt');
    patchFlowModel.mockClear();

    const replay = await agent.resource('jsTemplates').saveAsJsTemplate({ values: input });

    expect(replay.status).toBe(200);
    expect(replay.body.data).toEqual(first.body.data);
    expect(patchFlowModel).not.toHaveBeenCalled();
    await expect(
      Promise.all(sideEffectCollections.map((collectionName) => app.db.getRepository(collectionName).count())),
    ).resolves.toEqual(countsAfterFirst);
    const operationAfterReplay = await operationRepository.findOne({
      filter: { idempotencyKey: input.idempotencyKey },
    });
    expect(operationAfterReplay?.get('result')).toEqual(completedResult);
    expect(operationAfterReplay?.get('updatedAt')).toEqual(operationUpdatedAt);

    role.revokeAction('flowModels:save');
    const conflict = await agent.resource('jsTemplates').saveAsJsTemplate({
      values: { ...input, templateTitle: 'Different request' },
    });
    expect(conflict.status).toBe(409);
    expect(conflict.body.errors[0]).toMatchObject({ code: 'JS_TEMPLATE_IDEMPOTENCY_CONFLICT' });

    const deniedReplay = await agent.resource('jsTemplates').saveAsJsTemplate({ values: input });
    expect(deniedReplay.status).toBe(403);
    expect(deniedReplay.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
      details: { resource: 'flowModels', action: 'save' },
    });
    expect(patchFlowModel).not.toHaveBeenCalled();
    await expect(
      Promise.all(sideEffectCollections.map((collectionName) => app.db.getRepository(collectionName).count())),
    ).resolves.toEqual(countsAfterFirst);
  });

  it('bootstraps a complete ordinary workspace in the Host transaction without creating a JS Template repo', async () => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'new-inline-js-block',
      title: 'New inline JS block',
      use: 'JSBlockModel',
      stepParams: {},
    });
    const user = await app.db.getRepository('users').findOne();
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'new-inline-js-block',
      flowKey: 'jsSettings' as const,
      stepKey: 'runJs' as const,
      paramPath: ['code'] as ['code'],
      versionPath: ['version'] as ['version'],
    };
    const jsTemplateProjectCount = await app.db.getRepository('jsTemplateProjects').count();

    await app.db.sequelize.transaction(async (transaction) => {
      await expect(
        bootstrapFlowSurfaceRunJSWorkspace(app, {
          hostKind: 'js-block',
          modelUse: 'JSBlockModel',
          locator,
          transaction,
          authoringContext: {
            userId: String(user.get('id')),
            currentUser: user,
            state: { currentUser: user },
            request: { resourceName: 'flowSurfaces', actionName: 'addBlock', requestId: 'bootstrap-request' },
            can: () => ({}),
          },
        }),
      ).resolves.toEqual({ status: 'ready', retryable: false });
    });

    const agent = await app.agent().login(user);
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    expect(opened.status).toBe(200);
    expect(opened.body.data.repository).toMatchObject({
      ownerType: 'runjs-source',
      name: 'source',
      headCommitId: expect.any(String),
    });
    expect(opened.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/index.tsx', content: 'ctx.render(null);' }),
        expect.objectContaining({ path: '.nocobase/runjs-source.json' }),
        expect.objectContaining({
          path: 'src/client/entry.json',
          content: expect.stringMatching(/"key": "inline-js-block-[a-f0-9]{16}"/),
        }),
      ]),
    );
    const model = await repository.findModelById('new-inline-js-block');
    expect(model).toMatchObject({
      stepParams: {
        jsSettings: {
          runJs: {
            sourceRef: {
              type: 'vsc-file',
              repoId: opened.body.data.repository.repoId,
              commitId: opened.body.data.repository.headCommitId,
              entry: 'src/client/index.tsx',
            },
          },
        },
      },
    });
    expect(model.stepParams.jsSettings.runJs).not.toHaveProperty('sourceBinding');
    await expect(app.db.getRepository('jsTemplateProjects').count()).resolves.toBe(jsTemplateProjectCount);

    const commitCount = await app.db.getRepository('vscFileCommits').count();
    await app.db.sequelize.transaction(async (transaction) => {
      await bootstrapFlowSurfaceRunJSWorkspace(app, {
        hostKind: 'js-block',
        modelUse: 'JSBlockModel',
        locator,
        transaction,
        authoringContext: {
          userId: String(user.get('id')),
          currentUser: user,
          state: { currentUser: user },
          request: { resourceName: 'flowSurfaces', actionName: 'addBlock' },
          can: () => ({}),
        },
      });
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
  });

  it('preserves existing workspace files while adding a missing descriptor', async () => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'partial-inline-js-block',
      use: 'JSBlockModel',
      stepParams: {},
    });
    const user = await app.db.getRepository('users').findOne();
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'partial-inline-js-block',
      flowKey: 'jsSettings' as const,
      stepKey: 'runJs' as const,
      paramPath: ['code'] as ['code'],
      versionPath: ['version'] as ['version'],
    };
    const agent = await app.agent().login(user);
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const existingFiles = opened.body.data.files.map(
      (file: { path: string; content: string; language?: string; mode?: string }) => ({
        path: file.path,
        content: file.content,
        language: file.language,
        mode: file.mode,
        operation: 'upsert',
      }),
    );
    const helperContent = 'export const preserved = true;';
    const saved = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.repoId,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Add an existing helper',
        files: [
          ...existingFiles,
          {
            path: 'src/client/preserved.ts',
            content: helperContent,
            language: 'typescript',
            operation: 'upsert',
          },
        ],
      },
    });
    expect(saved.status).toBe(200);

    await app.db.sequelize.transaction(async (transaction) => {
      await bootstrapFlowSurfaceRunJSWorkspace(app, {
        hostKind: 'js-block',
        modelUse: 'JSBlockModel',
        locator,
        transaction,
        authoringContext: {
          userId: String(user.get('id')),
          currentUser: user,
          state: { currentUser: user },
          request: { resourceName: 'flowSurfaces', actionName: 'addBlock' },
          can: () => ({}),
        },
      });
    });

    const reopened = await agent.resource('runJSSources').open({ values: { locator } });
    expect(reopened.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/preserved.ts', content: helperContent }),
        expect.objectContaining({ path: 'src/client/entry.json' }),
      ]),
    );
  });

  it('returns a non-retryable bootstrap error after rolling back partial workspace writes and can retry cleanly', async () => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'invalid-inline-js-page',
      use: 'JSPageModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render(',
            version: 'v2',
          },
        },
      },
    });
    const user = await app.db.getRepository('users').findOne();
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'invalid-inline-js-page',
      flowKey: 'jsSettings' as const,
      stepKey: 'runJs' as const,
      paramPath: ['code'] as ['code'],
      versionPath: ['version'] as ['version'],
    };
    const repositoryCount = await app.db.getRepository('vscFileRepositories').count();
    const authoringContext = {
      userId: String(user.get('id')),
      currentUser: user,
      state: { currentUser: user },
      request: { resourceName: 'flowSurfaces', actionName: 'createPage' },
      can: () => ({}),
    };

    const failed = await app.db.sequelize.transaction((transaction) =>
      bootstrapFlowSurfaceRunJSWorkspace(app, {
        hostKind: 'js-page',
        modelUse: 'JSPageModel',
        locator,
        transaction,
        authoringContext,
      }),
    );

    expect(failed).toMatchObject({
      status: 'error',
      retryable: false,
      error: {
        code: 'RUNJS_COMPILE_FAILED',
      },
    });
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(repositoryCount);
    await expect(repository.findModelById('invalid-inline-js-page')).resolves.not.toHaveProperty(
      'stepParams.jsSettings.runJs.sourceRef',
    );

    await repository.patch({
      uid: 'invalid-inline-js-page',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render(null);',
            version: 'v2',
          },
        },
      },
    });
    const retried = await app.db.sequelize.transaction((transaction) =>
      bootstrapFlowSurfaceRunJSWorkspace(app, {
        hostKind: 'js-page',
        modelUse: 'JSPageModel',
        locator,
        transaction,
        authoringContext,
      }),
    );

    expect(retried).toEqual({ status: 'ready', retryable: false });
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(repositoryCount + 1);
    await expect(repository.findModelById('invalid-inline-js-page')).resolves.toMatchObject({
      stepParams: {
        jsSettings: {
          runJs: {
            sourceRef: {
              type: 'vsc-file',
              repoId: expect.any(String),
              commitId: expect.any(String),
              entry: 'src/client/index.tsx',
            },
          },
        },
      },
    });
  });

  it('rolls back the ordinary repository and sourceRef when the surrounding Host transaction fails', async () => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'rolled-back-inline-js-page',
      use: 'JSPageModel',
      stepParams: {},
    });
    const user = await app.db.getRepository('users').findOne();
    const repositoryCount = await app.db.getRepository('vscFileRepositories').count();
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'rolled-back-inline-js-page',
      flowKey: 'jsSettings' as const,
      stepKey: 'runJs' as const,
      paramPath: ['code'] as ['code'],
      versionPath: ['version'] as ['version'],
    };

    await expect(
      app.db.sequelize.transaction(async (transaction) => {
        await bootstrapFlowSurfaceRunJSWorkspace(app, {
          hostKind: 'js-page',
          modelUse: 'JSPageModel',
          locator,
          transaction,
          authoringContext: {
            userId: String(user.get('id')),
            currentUser: user,
            state: { currentUser: user },
            request: { resourceName: 'flowSurfaces', actionName: 'createPage' },
            can: () => ({}),
          },
        });
        throw new Error('Host write failed');
      }),
    ).rejects.toThrow('Host write failed');

    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(repositoryCount);
    await expect(repository.findModelById('rolled-back-inline-js-page')).resolves.toMatchObject({ stepParams: {} });
  });
});
