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

import FlowModelRepository from '../../../../plugin-flow-engine/src/server/repository';
import PluginLightExtensionServer from '../plugin';

describe('Light Extension Flow Engine RunJS source integration', () => {
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
        PluginLightExtensionServer,
        'flow-engine',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('opens and saves a Flow Engine source with only the Light Extension host', async () => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'light-extension-flow-source',
      title: 'Light Extension Flow source',
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
      modelUid: 'light-extension-flow-source',
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
    await expect(repository.findModelById('light-extension-flow-source')).resolves.toMatchObject({
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

  it('bootstraps a complete ordinary workspace in the Host transaction without creating a Light Extension repo', async () => {
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
    const lightExtensionRepoCount = await app.db.getRepository('lightExtensionRepos').count();

    await app.db.sequelize.transaction(async (transaction) => {
      await expect(
        bootstrapFlowSurfaceRunJSWorkspace(app, {
          hostKind: 'js-block',
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
    await expect(app.db.getRepository('lightExtensionRepos').count()).resolves.toBe(lightExtensionRepoCount);

    const commitCount = await app.db.getRepository('vscFileCommits').count();
    await app.db.sequelize.transaction(async (transaction) => {
      await bootstrapFlowSurfaceRunJSWorkspace(app, {
        hostKind: 'js-block',
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
