/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import PluginVscFileServer from '@nocobase/plugin-vsc-file';
import type { RunJSSourceLocator } from '@nocobase/server';

import FlowModelRepository from '../repository';
import { createFlowModelRunJSSourceAdapters } from '../runjs-sources/flow-model-adapters';

const basePlugins = ['field-sort', 'system-settings', 'users', 'auth', 'acl', 'data-source-manager'];

describe('flow-engine RunJS source adapters', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let repository: FlowModelRepository;

  beforeEach(async () => {
    await resetApp([PluginVscFileServer, 'flow-engine']);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('reads and writes FlowModel step jsSettings.runJs code/version without replacing sibling settings', async () => {
    await repository.insertModel({
      uid: 'js-step-model',
      title: 'JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            keep: 'preserved',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator, agent, {
      code: 'ctx.render("client draft");',
      version: 'v2',
    });

    expect(open.status).toBe(200);
    expect(open.body.data.legacy).toMatchObject({
      code: 'return oldValue;',
      version: 'v2',
      surfaceStyle: 'render',
      language: 'typescript',
    });

    const save = await saveSource(locator, open.body.data, 'ctx.render("newValue");');
    expect(save.status).toBe(200);

    const updated = await repository.findModelById('js-step-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: runtimeCode('ctx.render("newValue");'),
      version: 'v2',
      keep: 'preserved',
      sourceRef: {
        type: 'vsc-file',
        repoId: save.body.data.repository.id,
        commitId: save.body.data.commit.id,
        entry: 'src/main.tsx',
      },
    });
  });

  it('writes external bindings for FlowModel step and nested RunJS values without removing inline fallback', async () => {
    await repository.insertModel({
      uid: 'external-binding-model',
      title: 'External binding model',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("inline fallback");',
            version: 'v2',
            sourceRef: { type: 'vsc-file', repoId: 'runjs_repo', commitId: 'runjs_commit' },
          },
        },
        eventSettings: {
          customVariable: {
            variables: [
              {
                key: 'var_total',
                type: 'runjs',
                runjs: {
                  code: 'return 1;',
                  version: 'v2',
                },
              },
            ],
          },
        },
      },
    });

    const adapters = createFlowModelRunJSSourceAdapters(app.db);
    const stepAdapter = adapters.find((adapter) => adapter.kind === 'flowModel.step');
    const nestedAdapter = adapters.find((adapter) => adapter.kind === 'flowModel.nestedRunJS');
    if (!stepAdapter?.writeExternalBinding || !nestedAdapter?.writeExternalBinding) {
      throw new Error('FlowModel external binding adapters are unavailable');
    }
    const stepLocator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'external-binding-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const nestedLocator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'external-binding-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'customVariable',
      valuePath: ['variables', 'var_total', 'runjs'],
      scene: 'eventFlow',
    };
    const can = () => ({});

    await app.db.sequelize.transaction(async (transaction) => {
      const stepCtx = { transaction, can };
      const stepFingerprint = await stepAdapter.getFingerprint({ locator: stepLocator, ctx: stepCtx });
      await stepAdapter.writeExternalBinding?.({
        locator: stepLocator,
        binding: {
          sourceMode: 'light-extension',
          sourceBinding: { type: 'light-extension-entry', repoId: 'ler_1', entryId: 'lee_block' },
        },
        baseOwnerFingerprint: stepFingerprint,
        ctx: stepCtx,
      });

      const nestedCtx = { transaction, can };
      const nestedFingerprint = await nestedAdapter.getFingerprint({ locator: nestedLocator, ctx: nestedCtx });
      await nestedAdapter.writeExternalBinding?.({
        locator: nestedLocator,
        binding: {
          sourceMode: 'light-extension',
          sourceBinding: { type: 'light-extension-entry', repoId: 'ler_1', entryId: 'lee_runjs' },
        },
        baseOwnerFingerprint: nestedFingerprint,
        ctx: nestedCtx,
      });
    });

    const updated = await repository.findModelById('external-binding-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'ctx.render("inline fallback");',
      version: 'v2',
      sourceRef: { type: 'vsc-file', repoId: 'runjs_repo', commitId: 'runjs_commit' },
      sourceMode: 'light-extension',
      sourceBinding: { type: 'light-extension-entry', repoId: 'ler_1', entryId: 'lee_block' },
    });
    expect(
      getAtPath(updated, ['stepParams', 'eventSettings', 'customVariable', 'variables', 0, 'runjs']),
    ).toMatchObject({
      code: 'return 1;',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: { type: 'light-extension-entry', repoId: 'ler_1', entryId: 'lee_runjs' },
    });
  });

  it('initializes and saves a new JS block RunJS source before its step params exist', async () => {
    await repository.insertModel({
      uid: 'new-js-block-model',
      title: 'New JS block',
      use: 'JSBlockModel',
      stepParams: {},
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'new-js-block-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const initialCode = 'ctx.render("new block");';
    const open = await openSource(locator, agent, {
      code: initialCode,
      version: 'v2',
    });

    expect(open.status).toBe(200);
    expect(open.body.data.legacy).toMatchObject({
      code: initialCode,
      version: 'v2',
      surfaceStyle: 'render',
      uninitialized: true,
      metadata: {
        modelUse: 'JSBlockModel',
      },
    });
    expect(open.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: initialCode,
        }),
      ]),
    );

    const save = await saveSource(locator, open.body.data, 'ctx.render("saved block");');
    expect(save.status).toBe(200);

    const updated = await repository.findModelById('new-js-block-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: runtimeCode('ctx.render("saved block");'),
      version: 'v2',
      sourceRef: {
        type: 'vsc-file',
        repoId: save.body.data.repository.id,
        commitId: save.body.data.commit.id,
        entry: 'src/main.tsx',
      },
    });
  });

  it('opens, saves, and externally binds a JS Page through the FlowModel step adapter', async () => {
    await repository.insertModel({
      uid: 'js-page-source-model',
      title: 'JS Page',
      use: 'JSPageModel',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'inline',
            sourceBinding: { keep: 'binding snapshot' },
            settings: { theme: 'dark' },
            keep: 'preserved',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-page-source-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator, agent, {
      code: 'ctx.render("new page");',
      version: 'v2',
    });

    expect(open.status).toBe(200);
    expect(open.body.data.legacy).toMatchObject({
      surfaceStyle: 'render',
      entryPath: 'src/main.tsx',
      entry: 'src/main.tsx',
      uninitialized: true,
      metadata: { modelUse: 'JSPageModel' },
    });

    const save = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: open.body.data.repository.repoId,
        message: 'Update JS Page source',
        entryPath: 'src/main.tsx',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'import { message } from "./message";\nctx.render(message);',
            language: 'typescript',
          },
          {
            path: 'src/message.ts',
            operation: 'upsert',
            content: 'export const message = "saved page";',
            language: 'typescript',
          },
        ],
      },
    });
    expect(save.status).toBe(200);

    const saved = await repository.findModelById('js-page-source-model');
    expect(getAtPath(saved, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: runtimeCode('saved page'),
      version: 'v2',
      sourceMode: 'inline',
      sourceBinding: { keep: 'binding snapshot' },
      settings: { theme: 'dark' },
      keep: 'preserved',
      sourceRef: {
        type: 'vsc-file',
        repoId: save.body.data.repository.id,
        commitId: save.body.data.commit.id,
        entry: 'src/main.tsx',
      },
    });

    const stepAdapter = createFlowModelRunJSSourceAdapters(app.db).find((adapter) => adapter.kind === 'flowModel.step');
    if (!stepAdapter?.writeExternalBinding) {
      throw new Error('FlowModel step external binding adapter is unavailable');
    }
    await app.db.sequelize.transaction(async (transaction) => {
      const ctx = { transaction, can: () => ({}) };
      const baseOwnerFingerprint = await stepAdapter.getFingerprint({ locator, ctx });
      await stepAdapter.writeExternalBinding?.({
        locator,
        binding: {
          sourceMode: 'light-extension',
          sourceBinding: { type: 'light-extension-entry', repoId: 'repo_1', entryId: 'entry_1' },
        },
        baseOwnerFingerprint,
        ctx,
      });
    });

    const externallyBound = await repository.findModelById('js-page-source-model');
    expect(getAtPath(externallyBound, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: runtimeCode('saved page'),
      version: 'v2',
      sourceRef: {
        type: 'vsc-file',
        repoId: save.body.data.repository.id,
        commitId: save.body.data.commit.id,
        entry: 'src/main.tsx',
      },
      sourceMode: 'light-extension',
      sourceBinding: { type: 'light-extension-entry', repoId: 'repo_1', entryId: 'entry_1' },
      settings: { theme: 'dark' },
      keep: 'preserved',
    });
  });

  it('rejects a JS Page save when its owner fingerprint is outdated', async () => {
    await repository.insertModel({
      uid: 'js-page-outdated-model',
      use: 'JSPageModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("old page");',
            version: 'v2',
          },
        },
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-page-outdated-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'js-page-outdated-model',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("changed page");',
            version: 'v2',
          },
        },
      },
    });

    const save = await saveSource(locator, open.body.data, 'ctx.render("Studio page");');
    expect(save.status).toBe(409);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
  });

  it('enforces FlowModel read and write ACL for JS Page sources', async () => {
    await app.db.getRepository('roles').create({ values: { name: 'js-page-no-read' } });
    await app.db.getRepository('roles').create({ values: { name: 'js-page-readonly' } });
    app.acl.define({ role: 'js-page-no-read', actions: {} });
    app.acl.define({
      role: 'js-page-readonly',
      actions: {
        'flowModels:findOne': {},
      },
    });
    const noReadUser = await app.db.getRepository('users').create({
      values: { nickname: 'JS Page no read', roles: ['js-page-no-read'] },
    });
    const readonlyUser = await app.db.getRepository('users').create({
      values: { nickname: 'JS Page readonly', roles: ['js-page-readonly'] },
    });
    const noReadAgent = (await app.agent().login(noReadUser)).set('x-role', 'js-page-no-read');
    const readonlyAgent = (await app.agent().login(readonlyUser)).set('x-role', 'js-page-readonly');

    await repository.insertModel({
      uid: 'js-page-acl-model',
      use: 'JSPageModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("acl page");',
            version: 'v2',
          },
        },
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-page-acl-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };

    const deniedOpen = await openSource(locator, noReadAgent);
    expect(deniedOpen.status).toBe(403);
    expect(deniedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: { resource: 'flowModels', action: 'findOne' },
    });

    const readonlyOpen = await openSource(locator, readonlyAgent);
    expect(readonlyOpen.status).toBe(200);
    expect(readonlyOpen.body.data.files).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'src/client/index.tsx' })]),
    );
    const deniedSave = await saveSource(locator, readonlyOpen.body.data, 'ctx.render("denied");', readonlyAgent);
    expect(deniedSave.status).toBe(403);
    expect(deniedSave.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: { resource: 'flowModels', action: 'save' },
    });
  });

  it.each([
    {
      label: 'flow',
      flowKey: 'missingSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
      expectedPath: 'stepParams.missingSettings.runJs',
    },
    {
      label: 'step',
      flowKey: 'jsSettings',
      stepKey: 'missingRunJs',
      paramPath: ['code'],
      expectedPath: 'stepParams.jsSettings.missingRunJs',
    },
    {
      label: 'parameter',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['missingCode'],
      expectedPath: 'stepParams.jsSettings.runJs.missingCode',
    },
  ])('rejects FlowModel step locators with a missing $label path', async (input) => {
    await repository.insertModel({
      uid: 'js-step-missing-path-model',
      title: 'JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
          },
        },
      },
    });

    const response = await openSource({
      kind: 'flowModel.step',
      modelUid: 'js-step-missing-path-model',
      flowKey: input.flowKey,
      stepKey: input.stepKey,
      paramPath: input.paramPath,
    });

    expect(response.status).toBe(404);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      status: 404,
      details: {
        path: input.expectedPath,
      },
    });
  });

  it('does not run Flow Surface authoring validation for FlowModel step RunJS sources', async () => {
    await repository.insertModel({
      uid: 'js-step-user-runjs-model',
      title: 'User JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("oldValue");',
            version: 'v2',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-user-runjs-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    const save = await saveSource(
      locator,
      open.body.data,
      "ctx.request({ url: 'users:list' });\nctx.render('newValue');",
    );

    expect(save.status).toBe(200);
    const updated = await repository.findModelById('js-step-user-runjs-model');
    expectRuntimeCode(
      getAtPath(updated, ['stepParams', 'jsSettings', 'runJs', 'code']),
      "ctx.request({ url: 'users:list' });\nctx.render('newValue');",
    );
  });

  it('allows FlowModel save after light-extension source metadata changes without changing code', async () => {
    await repository.insertModel({
      uid: 'js-step-light-extension-metadata-model',
      title: 'Light extension metadata JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'repo_old',
              entryId: 'entry_old',
              kind: 'js-block',
            },
            sourceRef: {
              type: 'vsc-file',
              repoId: 'repo_old',
              commitId: 'commit_old',
              entry: 'src/main.tsx',
            },
            settings: {
              message: 'old',
            },
            keep: 'preserved',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-light-extension-metadata-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'js-step-light-extension-metadata-model',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'repo_new',
              entryId: 'entry_new',
              kind: 'js-block',
            },
            sourceRef: {
              type: 'vsc-file',
              repoId: 'repo_new',
              commitId: 'commit_new',
              entry: 'src/main.tsx',
            },
            settings: {
              message: 'new',
            },
            keep: 'preserved',
          },
        },
      },
    });

    const save = await saveSource(locator, open.body.data, 'ctx.render("newValue");');
    expect(save.status).toBe(200);

    const updated = await repository.findModelById('js-step-light-extension-metadata-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: runtimeCode('ctx.render("newValue");'),
      keep: 'preserved',
      sourceBinding: {
        repoId: 'repo_new',
        entryId: 'entry_new',
      },
      settings: {
        message: 'new',
      },
      sourceRef: {
        type: 'vsc-file',
        repoId: save.body.data.repository.id,
        commitId: save.body.data.commit.id,
        entry: 'src/main.tsx',
      },
    });
  });

  it('saves against the current FlowModel state and preserves sibling settings changed after open', async () => {
    await repository.insertModel({
      uid: 'js-step-stale-model',
      title: 'Stale JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            keep: 'preserved',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-stale-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'js-step-stale-model',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            keep: 'changed elsewhere',
          },
        },
      },
    });

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const save = await saveSource(locator, open.body.data, 'ctx.render("newValue");');

    expect(save.status).toBe(200);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave + 1);

    const updated = await repository.findModelById('js-step-stale-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: runtimeCode('ctx.render("newValue");'),
      keep: 'changed elsewhere',
    });
  });

  it('rejects save when the FlowModel host code diverges from the versioned head', async () => {
    await repository.insertModel({
      uid: 'js-step-diverged-host-model',
      title: 'Diverged host JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("oldValue");',
            version: 'v2',
            keep: 'preserved',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-diverged-host-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'js-step-diverged-host-model',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("changed outside Studio");',
            version: 'v2',
            keep: 'preserved',
          },
        },
      },
    });

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const save = await saveSource(locator, open.body.data, 'ctx.render("Studio edit");');

    expect(save.status).toBe(409);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      message: 'RunJS host code differs from the versioned source',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);

    const updated = await repository.findModelById('js-step-diverged-host-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs', 'code'])).toBe(
      'ctx.render("changed outside Studio");',
    );
  });

  it('denies FlowModel save when the current role cannot save flow models', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'runjs-reader',
      },
    });
    app.acl.define({
      role: 'runjs-reader',
      actions: {
        'flowModels:findOne': {},
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'RunJS reader',
        roles: ['runjs-reader'],
      },
    });
    const restrictedAgent = (await app.agent().login(user)).set('x-role', 'runjs-reader');

    await repository.insertModel({
      uid: 'js-step-readonly-model',
      title: 'Readonly JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-readonly-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator, restrictedAgent);
    expect(open.status).toBe(200);

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const save = await saveSource(locator, open.body.data, 'ctx.render("denied");', restrictedAgent);

    expect(save.status).toBe(403);
    expect(save.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
        action: 'save',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);
  });

  it('checks nested FlowModel source permission before loading the owner model', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'runjs-no-flow-models',
      },
    });
    app.acl.define({
      role: 'runjs-no-flow-models',
      actions: {},
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'RunJS no flow models',
        roles: ['runjs-no-flow-models'],
      },
    });
    const restrictedAgent = (await app.agent().login(user)).set('x-role', 'runjs-no-flow-models');

    await repository.insertModel({
      uid: 'nested-no-permission-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          customVariable: {
            variables: [
              {
                key: 'var_total',
                type: 'runjs',
                runjs: {
                  code: 'return 1;',
                  version: 'v2',
                },
              },
            ],
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-no-permission-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'customVariable',
      valuePath: ['variables', 'var_total', 'runjs'],
      scene: 'eventFlow',
    };

    const existingOpen = await openSource(locator, restrictedAgent);
    expect(existingOpen.status).toBe(403);
    expect(existingOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        resource: 'flowModels',
        action: 'findOne',
      },
    });

    const missingOwnerOpen = await openSource({ ...locator, modelUid: 'missing-flow-model' }, restrictedAgent);
    expect(missingOwnerOpen.status).toBe(403);
    expect(missingOwnerOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        resource: 'flowModels',
        action: 'findOne',
      },
    });
  });

  it('denies FlowModel source access outside the flow model permission filter', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'flow-model-scoped-reader',
      },
    });
    app.acl.define({
      role: 'flow-model-scoped-reader',
      actions: {
        'flowModels:findOne': {
          filter: {
            uid: 'allowed-flow-model',
          },
          whitelist: ['stepParams'],
        },
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'FlowModel scoped reader',
        roles: ['flow-model-scoped-reader'],
      },
    });
    const scopedAgent = (await app.agent().login(user)).set('x-role', 'flow-model-scoped-reader');

    await repository.insertModel({
      uid: 'allowed-flow-model',
      title: 'Allowed JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return allowed;',
            version: 'v2',
          },
        },
        eventSettings: {
          customVariable: {
            variables: [
              {
                key: 'var_allowed',
                type: 'runjs',
                runjs: {
                  code: 'return allowedNested;',
                  version: 'v2',
                },
              },
            ],
          },
        },
      },
    });
    await repository.insertModel({
      uid: 'blocked-flow-model',
      title: 'Blocked JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return blocked;',
            version: 'v2',
          },
        },
        eventSettings: {
          customVariable: {
            variables: [
              {
                key: 'var_blocked',
                type: 'runjs',
                runjs: {
                  code: 'return blockedNested;',
                  version: 'v2',
                },
              },
            ],
          },
        },
      },
    });

    const allowedOpen = await openSource(
      {
        kind: 'flowModel.step',
        modelUid: 'allowed-flow-model',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      scopedAgent,
    );
    expect(allowedOpen.status).toBe(200);

    const blockedOpen = await openSource(
      {
        kind: 'flowModel.step',
        modelUid: 'blocked-flow-model',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      scopedAgent,
    );

    expect(blockedOpen.status).toBe(403);
    expect(blockedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });

    const allowedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'allowed-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_allowed', 'runjs'],
        scene: 'eventFlow',
      },
      scopedAgent,
    );
    expect(allowedNestedOpen.status).toBe(200);

    const blockedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'blocked-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_blocked', 'runjs'],
        scene: 'eventFlow',
      },
      scopedAgent,
    );
    expect(blockedNestedOpen.status).toBe(403);
    expect(blockedNestedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });

    const missingNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_missing', 'runjs'],
        scene: 'eventFlow',
      },
      scopedAgent,
    );
    expect(missingNestedOpen.status).toBe(403);
    expect(missingNestedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });

    await app.db.getRepository('roles').create({
      values: {
        name: 'flow-model-flow-registry-only-reader',
      },
    });
    app.acl.define({
      role: 'flow-model-flow-registry-only-reader',
      actions: {
        'flowModels:findOne': {
          whitelist: ['flowRegistry'],
        },
      },
    });
    const fieldRestrictedUser = await app.db.getRepository('users').create({
      values: {
        nickname: 'FlowModel flow registry reader',
        roles: ['flow-model-flow-registry-only-reader'],
      },
    });
    const fieldRestrictedAgent = (await app.agent().login(fieldRestrictedUser)).set(
      'x-role',
      'flow-model-flow-registry-only-reader',
    );

    const fieldDeniedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'allowed-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_allowed', 'runjs'],
        scene: 'eventFlow',
      },
      fieldRestrictedAgent,
    );
    expect(fieldDeniedNestedOpen.status).toBe(403);
    expect(fieldDeniedNestedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });

    const missingFieldDeniedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_allowed', 'runjs'],
        scene: 'eventFlow',
      },
      fieldRestrictedAgent,
    );
    expect(missingFieldDeniedNestedOpen.status).toBe(403);
    expect(missingFieldDeniedNestedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });
  });

  it('reads and writes nested RunJSValue, script, event flow, Assign Form, and Filter Form paths', async () => {
    await repository.insertModel({
      uid: 'nested-runjs-model',
      use: 'FormModel',
      stepParams: {
        rules: {
          configure: {
            values: [
              {
                type: 'runjs',
                value: {
                  code: 'return oldNested;',
                  version: 'v2',
                  keep: 'nested',
                },
              },
            ],
            linkage: {
              params: {
                value: {
                  script: 'ctx.oldLinkage();',
                  keep: 'script',
                },
              },
            },
            eventFlow: {
              params: {
                code: 'ctx.oldEvent();',
                keep: 'event',
              },
            },
            assignForm: {
              fieldSettings: {
                assignValue: {
                  mode: 'dynamic',
                  value: {
                    code: 'return oldAssign;',
                    version: 'v2',
                    keep: 'assign',
                  },
                },
              },
            },
            filterForm: {
              formFilterBlockModelSettings: {
                defaultValues: {
                  value: [
                    {
                      field: 'status',
                      operator: '$eq',
                      value: {
                        code: 'return oldFilter;',
                        version: 'v2',
                        keep: 'filter',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });

    await saveNested(['values', 0, 'value'], 'defaultValue', 'const nextNested = "nextNested";\nreturn nextNested;');
    await saveNested(['linkage', 'params', 'value'], 'linkageRunjs', 'ctx.message.info("nextLinkage");');
    await saveNested(['eventFlow', 'params', 'code'], 'eventFlow', 'ctx.message.info("nextEvent");');
    await saveNested(
      ['assignForm', 'fieldSettings', 'assignValue', 'value'],
      'assignForm',
      'const nextAssign = "nextAssign";\nreturn nextAssign;',
    );
    await saveNested(
      ['filterForm', 'formFilterBlockModelSettings', 'defaultValues', 'value', 0, 'value'],
      'filterFormDefaultValues',
      'const nextFilter = "nextFilter";\nreturn nextFilter;',
    );

    const updated = await repository.findModelById('nested-runjs-model');
    const configure = getAtPath(updated, ['stepParams', 'rules', 'configure']);

    expect(getAtPath(configure, ['values', 0, 'value'])).toMatchObject({
      code: runtimeCode('const nextNested = "nextNested";\nreturn nextNested;'),
      version: 'v2',
      keep: 'nested',
    });
    expect(getAtPath(configure, ['linkage', 'params', 'value'])).toMatchObject({
      script: runtimeCode('ctx.message.info("nextLinkage");'),
      keep: 'script',
    });
    expect(getAtPath(configure, ['eventFlow', 'params'])).toMatchObject({
      code: runtimeCode('ctx.message.info("nextEvent");'),
      keep: 'event',
    });
    expect(getAtPath(configure, ['assignForm', 'fieldSettings', 'assignValue'])).toMatchObject({
      mode: 'dynamic',
      value: {
        code: runtimeCode('const nextAssign = "nextAssign";\nreturn nextAssign;'),
        version: 'v2',
        keep: 'assign',
      },
    });
    expect(
      getAtPath(configure, ['filterForm', 'formFilterBlockModelSettings', 'defaultValues', 'value', 0]),
    ).toMatchObject({
      field: 'status',
      operator: '$eq',
      value: {
        code: runtimeCode('const nextFilter = "nextFilter";\nreturn nextFilter;'),
        version: 'v2',
        keep: 'filter',
      },
    });

    async function saveNested(valuePath: Array<string | number>, scene: string, code: string) {
      const locator: RunJSSourceLocator = {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'nested-runjs-model',
        containerFlowKey: 'rules',
        containerStepKey: 'configure',
        valuePath,
        scene,
      };
      const open = await openSource(locator);

      expect(open.status).toBe(200);
      const save = await saveSource(locator, open.body.data, code);
      expect(save.status).toBe(200);
    }
  });

  it('preserves nested sibling changes after open but rejects an actual nested code change', async () => {
    await repository.insertModel({
      uid: 'nested-runjs-fingerprint-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          customVariable: {
            title: 'Original step title',
            variables: [
              {
                key: 'var_total',
                title: 'Original variable title',
                type: 'runjs',
                runjs: {
                  code: 'return 1;',
                  version: 'v2',
                  keep: 'original sibling',
                },
              },
            ],
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-runjs-fingerprint-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'customVariable',
      valuePath: ['variables', 'var_total', 'runjs'],
      scene: 'eventFlow',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'nested-runjs-fingerprint-model',
      stepParams: {
        eventSettings: {
          customVariable: {
            title: 'Changed elsewhere',
            variables: [
              {
                key: 'var_total',
                title: 'Changed variable title',
                type: 'runjs',
                runjs: {
                  code: 'return 1;',
                  version: 'v2',
                  keep: 'changed elsewhere',
                },
              },
            ],
          },
        },
      },
    });

    const save = await saveSource(locator, open.body.data, 'return 2;');
    expect(save.status).toBe(200);
    const saved = await repository.findModelById('nested-runjs-fingerprint-model');
    expect(getAtPath(saved, ['stepParams', 'eventSettings', 'customVariable'])).toMatchObject({
      title: 'Changed elsewhere',
      variables: [
        expect.objectContaining({
          title: 'Changed variable title',
          runjs: expect.objectContaining({
            code: runtimeCode('return 2;'),
            keep: 'changed elsewhere',
          }),
        }),
      ],
    });

    const reopened = await openSource(locator);
    expect(reopened.status).toBe(200);
    await repository.patch({
      uid: 'nested-runjs-fingerprint-model',
      stepParams: {
        eventSettings: {
          customVariable: {
            title: 'Changed elsewhere',
            variables: [
              {
                key: 'var_total',
                title: 'Changed variable title',
                type: 'runjs',
                runjs: {
                  code: 'return 3;',
                  version: 'v2',
                  keep: 'changed elsewhere',
                },
              },
            ],
          },
        },
      },
    });

    const commitCountBeforeRejectedSave = await app.db.getRepository('vscFileCommits').count();
    const rejected = await saveSource(locator, reopened.body.data, 'return 4;');
    expect(rejected.status).toBe(409);
    expect(rejected.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      message: 'RunJS host code differs from the versioned source',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeRejectedSave);
    const diverged = await repository.findModelById('nested-runjs-fingerprint-model');
    expect(
      getAtPath(diverged, ['stepParams', 'eventSettings', 'customVariable', 'variables', 0, 'runjs', 'code']),
    ).toBe('return 3;');
  });

  it('reads and writes nested RunJS sources through keyed arrays', async () => {
    await repository.insertModel({
      uid: 'nested-keyed-runjs-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          linkageRules: {
            value: [
              {
                key: 'rule_1',
                actions: [
                  {
                    key: 'runjs_action',
                    name: 'linkageRunjs',
                    params: {
                      value: {
                        script: 'ctx.oldLinkage();',
                        keep: 'script',
                      },
                    },
                  },
                  {
                    key: 'assign_action',
                    name: 'linkageAssignField',
                    params: {
                      value: [
                        {
                          key: 'assign_rule',
                          targetPath: 'status',
                          value: {
                            code: 'return oldAssign;',
                            version: 'v2',
                            keep: 'assign',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          customVariable: {
            variables: [
              {
                key: 'var_total',
                title: 'Total',
                type: 'runjs',
                runjs: {
                  code: 'return oldVariable;',
                  version: 'v2',
                  keep: 'variable',
                },
              },
            ],
          },
        },
      },
    });

    await saveNested(
      ['value', 'rule_1', 'actions', 'runjs_action', 'params', 'value', 'script'],
      'linkage',
      'ctx.message.info("nextLinkage");',
    );
    await saveNested(
      ['value', 'rule_1', 'actions', 'assign_action', 'params', 'value', 'assign_rule', 'value'],
      'formValue',
      'return "nextAssign";',
    );
    await saveNested(['variables', 'var_total', 'runjs'], 'eventFlow', 'return 123;');

    const updated = await repository.findModelById('nested-keyed-runjs-model');

    expect(
      getAtPath(updated, ['stepParams', 'eventSettings', 'linkageRules', 'value', 0, 'actions', 0, 'params', 'value']),
    ).toMatchObject({
      script: runtimeCode('ctx.message.info("nextLinkage");'),
      keep: 'script',
    });
    expect(
      getAtPath(updated, [
        'stepParams',
        'eventSettings',
        'linkageRules',
        'value',
        0,
        'actions',
        1,
        'params',
        'value',
        0,
        'value',
      ]),
    ).toMatchObject({
      code: runtimeCode('return "nextAssign";'),
      version: 'v2',
      keep: 'assign',
    });
    expect(
      getAtPath(updated, ['stepParams', 'eventSettings', 'customVariable', 'variables', 0, 'runjs']),
    ).toMatchObject({
      code: runtimeCode('return 123;'),
      version: 'v2',
      keep: 'variable',
    });

    async function saveNested(valuePath: Array<string | number>, scene: string, code: string) {
      const locator: RunJSSourceLocator = {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'nested-keyed-runjs-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: scene === 'eventFlow' ? 'customVariable' : 'linkageRules',
        valuePath,
        scene,
      };
      const open = await openSource(locator);

      expect(open.status).toBe(200);
      const save = await saveSource(locator, open.body.data, code);
      expect(save.status).toBe(200);
    }
  });

  it('rejects nested keyed RunJS sources when the keyed array container is missing', async () => {
    await repository.insertModel({
      uid: 'nested-missing-keyed-container-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          linkageRules: {},
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-keyed-container-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'linkageRules',
      valuePath: ['value', 'rule_new', 'actions', 'action_new', 'params', 'value', 'script'],
      scene: 'linkage',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'rule_new',
      },
    });

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const save = await saveSource(locator, 'missing-owner-fingerprint', 'ctx.message.info("edited");');

    expect(save.status).toBe(404);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'rule_new',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);

    const updated = await repository.findModelById('nested-missing-keyed-container-model');
    expect(getAtPath(updated, ['stepParams', 'eventSettings', 'linkageRules', 'value'])).toBeUndefined();
  });

  it('rejects nested keyed RunJS sources when the target path under existing keyed rows is missing', async () => {
    await repository.insertModel({
      uid: 'nested-missing-keyed-target-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          linkageRules: {
            value: [
              {
                key: 'rule_1',
                actions: [
                  {
                    key: 'runjs_action',
                    name: 'linkageRunjs',
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-keyed-target-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'linkageRules',
      valuePath: ['value', 'rule_1', 'actions', 'runjs_action', 'params', 'value', 'script'],
      scene: 'linkage',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'value.rule_1.actions.runjs_action.params.value.script',
      },
    });

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const save = await saveSource(locator, 'missing-owner-fingerprint', 'ctx.message.info("edited");');

    expect(save.status).toBe(404);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'value.rule_1.actions.runjs_action.params.value.script',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);

    const updated = await repository.findModelById('nested-missing-keyed-target-model');
    expect(
      getAtPath(updated, ['stepParams', 'eventSettings', 'linkageRules', 'value', 0, 'actions', 0, 'params']),
    ).toBeUndefined();
  });

  it('creates RunJSValue objects when saving missing value-surface leaves', async () => {
    await repository.insertModel({
      uid: 'nested-empty-value-surface-model',
      use: 'FormModel',
      stepParams: {
        editItemSettings: {
          initialValue: {},
        },
        fieldSettings: {
          assignValue: {},
        },
      },
    });

    const defaultLocator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-empty-value-surface-model',
      containerFlowKey: 'editItemSettings',
      containerStepKey: 'initialValue',
      valuePath: ['defaultValue'],
      scene: 'formValue',
    };
    const assignLocator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-empty-value-surface-model',
      containerFlowKey: 'fieldSettings',
      containerStepKey: 'assignValue',
      valuePath: ['value'],
      scene: 'assignForm',
    };

    const defaultOpen = await openSource(defaultLocator);
    expect(defaultOpen.status).toBe(200);
    await expect(saveSource(defaultLocator, defaultOpen.body.data, 'return "default";')).resolves.toHaveProperty(
      'status',
      200,
    );

    const assignOpen = await openSource(assignLocator);
    expect(assignOpen.status).toBe(200);
    await expect(saveSource(assignLocator, assignOpen.body.data, 'return "assigned";')).resolves.toHaveProperty(
      'status',
      200,
    );

    const updated = await repository.findModelById('nested-empty-value-surface-model');
    expect(getAtPath(updated, ['stepParams', 'editItemSettings', 'initialValue', 'defaultValue'])).toEqual({
      code: runtimeCode('return "default";'),
      version: 'v2',
    });
    expect(getAtPath(updated, ['stepParams', 'fieldSettings', 'assignValue', 'value'])).toEqual({
      code: runtimeCode('return "assigned";'),
      version: 'v2',
    });
  });

  it('rejects missing nested RunJS owners without creating value-surface paths', async () => {
    await repository.insertModel({
      uid: 'nested-missing-owner-model',
      use: 'FormModel',
      stepParams: {},
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-owner-model',
      containerFlowKey: 'editItemSettings',
      containerStepKey: 'initialValue',
      valuePath: ['defaultValue'],
      scene: 'formValue',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'stepParams.editItemSettings.initialValue',
      },
    });

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const save = await saveSource(locator, 'missing-owner-fingerprint', 'return "created";');

    expect(save.status).toBe(404);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'stepParams.editItemSettings.initialValue',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);

    const updated = await repository.findModelById('nested-missing-owner-model');
    expect(getAtPath(updated, ['stepParams', 'editItemSettings'])).toBeUndefined();
  });

  it('rejects missing nested RunJS intermediate paths without creating value-surface objects', async () => {
    await repository.insertModel({
      uid: 'nested-missing-intermediate-model',
      use: 'FormModel',
      stepParams: {
        editItemSettings: {
          initialValue: {},
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-intermediate-model',
      containerFlowKey: 'editItemSettings',
      containerStepKey: 'initialValue',
      valuePath: ['missingParent', 'value'],
      scene: 'formValue',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'missingParent',
      },
    });

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const save = await saveSource(locator, 'missing-owner-fingerprint', 'return "created";');

    expect(save.status).toBe(404);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'missingParent',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);

    const updated = await repository.findModelById('nested-missing-intermediate-model');
    expect(getAtPath(updated, ['stepParams', 'editItemSettings', 'initialValue', 'missingParent'])).toBeUndefined();
  });

  it('reads and writes flowRegistry RunJS steps from defaultParams and legacy params paths', async () => {
    await repository.insertModel({
      uid: 'flow-registry-runjs-model',
      use: 'ActionModel',
      flowRegistry: {
        submitFlow: {
          steps: {
            defaultRun: {
              use: 'runjs',
              defaultParams: {
                code: 'ctx.oldDefault();',
              },
            },
            legacyRun: {
              use: 'runjs',
              params: {
                code: 'ctx.oldLegacy();',
                keep: 'legacy',
              },
            },
            bothRun: {
              use: 'runjs',
              defaultParams: {
                code: 'ctx.oldDefaultInBoth();',
                keepDefault: 'default',
              },
              params: {
                code: 'ctx.oldLegacyInBoth();',
                keepLegacy: 'legacy',
              },
            },
            customVariableRun: {
              use: 'customVariable',
              defaultParams: {
                variables: [
                  {
                    key: 'var_total',
                    title: 'Total',
                    type: 'runjs',
                    runjs: {
                      code: 'return oldTotal;',
                      version: 'v2',
                      keep: 'variable',
                    },
                  },
                ],
              },
            },
            customVariableLegacy: {
              use: 'customVariable',
              params: {
                variables: [
                  {
                    key: 'var_legacy',
                    title: 'Legacy',
                    type: 'runjs',
                    runjs: {
                      code: 'return oldLegacyVariable;',
                      version: 'v2',
                      keep: 'legacy variable',
                    },
                  },
                ],
              },
            },
            customVariableEmpty: {
              use: 'customVariable',
              defaultParams: {},
            },
          },
        },
      },
    });

    const defaultLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'defaultRun',
      sourcePath: ['defaultParams', 'code'],
    };
    const legacyLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'legacyRun',
      sourcePath: ['defaultParams', 'code'],
    };
    const bothLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'bothRun',
      sourcePath: ['defaultParams', 'code'],
    };

    const defaultOpen = await openSource(defaultLocator);
    expect(defaultOpen.body.data.legacy).toMatchObject({ code: 'ctx.oldDefault();', surfaceStyle: 'action' });
    await expect(
      saveSource(defaultLocator, defaultOpen.body.data, 'ctx.message.info("nextDefault");'),
    ).resolves.toHaveProperty('status', 200);

    const legacyOpen = await openSource(legacyLocator);
    expect(legacyOpen.body.data.legacy).toMatchObject({ code: 'ctx.oldLegacy();', surfaceStyle: 'action' });
    await expect(
      saveSource(legacyLocator, legacyOpen.body.data, 'ctx.message.info("nextLegacy");'),
    ).resolves.toHaveProperty('status', 200);

    const bothOpen = await openSource(bothLocator);
    expect(bothOpen.body.data.legacy).toMatchObject({ code: 'ctx.oldLegacyInBoth();', surfaceStyle: 'action' });
    await expect(saveSource(bothLocator, bothOpen.body.data, 'ctx.message.info("nextBoth");')).resolves.toHaveProperty(
      'status',
      200,
    );

    const variableLocator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'flow-registry-runjs-model',
      containerFlowKey: 'submitFlow',
      containerStepKey: 'customVariableRun',
      valuePath: ['variables', 'var_total', 'runjs'],
      scene: 'eventFlow',
    };
    const variableOpen = await openSource(variableLocator);
    expect(variableOpen.body.data.legacy).toMatchObject({ code: 'return oldTotal;', surfaceStyle: 'value' });
    const commitCountBeforeBadVariableSave = await app.db.getRepository('vscFileCommits').count();
    const badVariableSave = await saveSource(variableLocator, variableOpen.body.data, 'ctx.render(null);');
    expect(badVariableSave.status).toBe(400);
    expect(badVariableSave.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeBadVariableSave);
    await expect(saveSource(variableLocator, variableOpen.body.data, 'return 456;')).resolves.toHaveProperty(
      'status',
      200,
    );

    const legacyVariableLocator: RunJSSourceLocator = {
      ...variableLocator,
      containerStepKey: 'customVariableLegacy',
      valuePath: ['variables', 'var_legacy', 'runjs'],
    };
    const legacyVariableOpen = await openSource(legacyVariableLocator);
    expect(legacyVariableOpen.body.data.legacy).toMatchObject({
      code: 'return oldLegacyVariable;',
      surfaceStyle: 'value',
    });
    await expect(
      saveSource(legacyVariableLocator, legacyVariableOpen.body.data, 'return 654;'),
    ).resolves.toHaveProperty('status', 200);

    const missingVariableLocator: RunJSSourceLocator = {
      ...variableLocator,
      valuePath: ['variables', 'missing_var', 'runjs'],
    };
    const missingOpen = await openSource(missingVariableLocator);
    expect(missingOpen.status).toBe(404);
    expect(missingOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'missing_var',
      },
    });
    const commitCountBeforeMissingSave = await app.db.getRepository('vscFileCommits').count();
    const missingSave = await saveSource(missingVariableLocator, 'missing-owner-fingerprint', 'return 789;');
    expect(missingSave.status).toBe(404);
    expect(missingSave.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'missing_var',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeMissingSave);

    const missingVariablesContainerLocator: RunJSSourceLocator = {
      ...variableLocator,
      containerStepKey: 'customVariableEmpty',
      valuePath: ['variables', 'var_new', 'runjs'],
    };
    const missingVariablesContainerOpen = await openSource(missingVariablesContainerLocator);
    expect(missingVariablesContainerOpen.status).toBe(404);
    expect(missingVariablesContainerOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'var_new',
      },
    });
    const commitCountBeforeMissingContainerSave = await app.db.getRepository('vscFileCommits').count();
    const missingVariablesContainerSave = await saveSource(
      missingVariablesContainerLocator,
      'missing-owner-fingerprint',
      'return 789;',
    );
    expect(missingVariablesContainerSave.status).toBe(404);
    expect(missingVariablesContainerSave.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'var_new',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeMissingContainerSave);

    const updated = await repository.findModelById('flow-registry-runjs-model');

    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'defaultRun', 'defaultParams', 'code'])).toEqual(
      runtimeCode('ctx.message.info("nextDefault");'),
    );
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'legacyRun', 'params'])).toMatchObject({
      code: runtimeCode('ctx.message.info("nextLegacy");'),
      keep: 'legacy',
    });
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'legacyRun', 'defaultParams'])).toBeUndefined();
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'bothRun', 'params'])).toMatchObject({
      code: runtimeCode('ctx.message.info("nextBoth");'),
      keepLegacy: 'legacy',
    });
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'bothRun', 'defaultParams'])).toMatchObject({
      code: 'ctx.oldDefaultInBoth();',
      keepDefault: 'default',
    });
    expect(
      getAtPath(updated, [
        'flowRegistry',
        'submitFlow',
        'steps',
        'customVariableRun',
        'defaultParams',
        'variables',
        0,
        'runjs',
      ]),
    ).toMatchObject({
      code: runtimeCode('return 456;'),
      version: 'v2',
      keep: 'variable',
    });
    expect(
      getAtPath(updated, [
        'flowRegistry',
        'submitFlow',
        'steps',
        'customVariableLegacy',
        'params',
        'variables',
        0,
        'runjs',
      ]),
    ).toMatchObject({
      code: runtimeCode('return 654;'),
      version: 'v2',
      keep: 'legacy variable',
    });
    expect(
      getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'customVariableLegacy', 'defaultParams']),
    ).toBeUndefined();
    expect(
      (
        getAtPath(updated, [
          'flowRegistry',
          'submitFlow',
          'steps',
          'customVariableRun',
          'defaultParams',
          'variables',
        ]) as Array<{ key?: string }>
      ).some((variable) => variable.key === 'missing_var'),
    ).toBe(false);
    expect(
      getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'customVariableEmpty', 'defaultParams', 'variables']),
    ).toBeUndefined();
    expect(getAtPath(updated, ['stepParams', 'submitFlow', 'customVariableRun'])).toBeUndefined();
  });

  it('preserves flowRegistry step siblings after open but rejects an actual source code change', async () => {
    await repository.insertModel({
      uid: 'flow-registry-fingerprint-model',
      use: 'ActionModel',
      flowRegistry: {
        submitFlow: {
          steps: {
            runStep: {
              use: 'runjs',
              title: 'Original title',
              defaultParams: {
                code: 'ctx.message.info("one");',
                keep: 'original sibling',
              },
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-fingerprint-model',
      flowKey: 'submitFlow',
      stepKey: 'runStep',
      sourcePath: ['defaultParams', 'code'],
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'flow-registry-fingerprint-model',
      flowRegistry: {
        submitFlow: {
          steps: {
            runStep: {
              use: 'runjs',
              title: 'Changed elsewhere',
              defaultParams: {
                code: 'ctx.message.info("one");',
                keep: 'changed elsewhere',
              },
            },
          },
        },
      },
    });

    const save = await saveSource(locator, open.body.data, 'ctx.message.info("two");');
    expect(save.status).toBe(200);
    const saved = await repository.findModelById('flow-registry-fingerprint-model');
    expect(getAtPath(saved, ['flowRegistry', 'submitFlow', 'steps', 'runStep'])).toMatchObject({
      title: 'Changed elsewhere',
      defaultParams: {
        code: runtimeCode('ctx.message.info("two");'),
        keep: 'changed elsewhere',
      },
    });

    const reopened = await openSource(locator);
    expect(reopened.status).toBe(200);
    await repository.patch({
      uid: 'flow-registry-fingerprint-model',
      flowRegistry: {
        submitFlow: {
          steps: {
            runStep: {
              use: 'runjs',
              title: 'Changed elsewhere',
              defaultParams: {
                code: 'ctx.message.info("three");',
                keep: 'changed elsewhere',
              },
            },
          },
        },
      },
    });

    const commitCountBeforeRejectedSave = await app.db.getRepository('vscFileCommits').count();
    const rejected = await saveSource(locator, reopened.body.data, 'ctx.message.info("four");');
    expect(rejected.status).toBe(409);
    expect(rejected.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      message: 'RunJS host code differs from the versioned source',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeRejectedSave);
    const diverged = await repository.findModelById('flow-registry-fingerprint-model');
    expect(getAtPath(diverged, ['flowRegistry', 'submitFlow', 'steps', 'runStep', 'defaultParams', 'code'])).toBe(
      'ctx.message.info("three");',
    );
  });

  it('rejects flowRegistry RunJS sources for unsupported paths and non-RunJS steps', async () => {
    await repository.insertModel({
      uid: 'flow-registry-runjs-guard-model',
      use: 'ActionModel',
      flowRegistry: {
        submitFlow: {
          steps: {
            runStep: {
              use: 'runjs',
              title: 'Do not overwrite',
              defaultParams: {
                code: 'ctx.safe();',
              },
            },
            nonRunJSStep: {
              use: 'customVariable',
              defaultParams: {
                code: 'return notRunJS;',
              },
            },
          },
        },
      },
    });

    const unsupportedPathLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-guard-model',
      flowKey: 'submitFlow',
      stepKey: 'runStep',
      sourcePath: ['title'],
    };
    const nonRunJSStepLocator: RunJSSourceLocator = {
      ...unsupportedPathLocator,
      stepKey: 'nonRunJSStep',
      sourcePath: ['defaultParams', 'code'],
    };

    await expectBlockedLocator(unsupportedPathLocator, 'flowRegistry.submitFlow.steps.runStep.title');
    await expectBlockedLocator(nonRunJSStepLocator, 'flowRegistry.submitFlow.steps.nonRunJSStep');

    const updated = await repository.findModelById('flow-registry-runjs-guard-model');
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'runStep', 'title'])).toBe('Do not overwrite');
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'nonRunJSStep', 'defaultParams', 'code'])).toBe(
      'return notRunJS;',
    );

    async function expectBlockedLocator(locator: RunJSSourceLocator, path: string) {
      const open = await openSource(locator);
      expect(open.status).toBe(404);
      expect(open.body.errors[0]).toMatchObject({
        code: 'RUNJS_SOURCE_NOT_FOUND',
        details: {
          path,
        },
      });

      const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
      const save = await saveSource(locator, 'missing-owner-fingerprint', 'ctx.message.info("blocked");');
      expect(save.status).toBe(404);
      expect(save.body.errors[0]).toMatchObject({
        code: 'RUNJS_SOURCE_NOT_FOUND',
        details: {
          path,
        },
      });
      await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);
    }
  });

  it('rejects flowRegistry RunJS sources when the owner flow or step is missing', async () => {
    await repository.insertModel({
      uid: 'flow-registry-missing-runjs-model',
      use: 'ActionModel',
      flowRegistry: {
        submitFlow: {
          steps: {},
        },
      },
    });

    const missingStepLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-missing-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'missingRun',
      sourcePath: ['defaultParams', 'code'],
    };

    const missingStepOpen = await openSource(missingStepLocator);
    expect(missingStepOpen.status).toBe(404);
    expect(missingStepOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'flowRegistry.submitFlow.steps.missingRun',
      },
    });

    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();
    const missingStepSave = await saveSource(
      missingStepLocator,
      'missing-owner-fingerprint',
      'ctx.message.info("edited");',
    );
    expect(missingStepSave.status).toBe(404);
    expect(missingStepSave.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'flowRegistry.submitFlow.steps.missingRun',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);

    const missingFlowOpen = await openSource({
      ...missingStepLocator,
      flowKey: 'missingFlow',
    });
    expect(missingFlowOpen.status).toBe(404);
    expect(missingFlowOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'flowRegistry.missingFlow.steps.missingRun',
      },
    });

    const updated = await repository.findModelById('flow-registry-missing-runjs-model');
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'missingRun'])).toBeUndefined();
    expect(getAtPath(updated, ['flowRegistry', 'missingFlow'])).toBeUndefined();
  });

  it('uses compiler-owned value-surface validation for nested reaction RunJS values', async () => {
    await repository.insertModel({
      uid: 'reaction-runjs-model',
      use: 'FormModel',
      stepParams: {
        reactionSettings: {
          fieldValues: {
            value: [
              {
                key: 'rule_1',
                code: 'return oldValue;',
              },
            ],
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'reaction-runjs-model',
      containerFlowKey: 'reactionSettings',
      containerStepKey: 'fieldValues',
      valuePath: ['value', 'rule_1', 'code'],
      scene: 'formValue',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);
    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();

    const save = await saveSource(locator, open.body.data, 'ctx.render(null);');

    expect(save.status).toBe(400);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);
    const updated = await repository.findModelById('reaction-runjs-model');
    expect(getAtPath(updated, ['stepParams', 'reactionSettings', 'fieldValues', 'value', 0, 'code'])).toBe(
      'return oldValue;',
    );
  });

  it('reads and writes chart option and events raw sources with distinct surface styles', async () => {
    await repository.insertModel({
      uid: 'chart-runjs-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                builder: {
                  type: 'bar',
                },
                raw: 'return { xAxis: {} };',
              },
              events: {
                raw: 'ctx.onClick();',
              },
            },
          },
        },
      },
    });

    const optionLocator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'chart-runjs-model',
    };
    const eventsLocator: RunJSSourceLocator = {
      kind: 'chart.events',
      modelUid: 'chart-runjs-model',
    };
    const optionOpen = await openSource(optionLocator);
    const eventsOpen = await openSource(eventsLocator);

    expect(optionOpen.body.data.legacy).toMatchObject({
      code: 'return { xAxis: {} };',
      surfaceStyle: 'value',
    });
    expect(eventsOpen.body.data.legacy).toMatchObject({
      code: 'ctx.onClick();',
      surfaceStyle: 'action',
    });

    await expect(
      saveSource(
        optionLocator,
        optionOpen.body.data,
        'const rows = ctx.data.objects || [];\nreturn { dataset: { source: rows } };',
      ),
    ).resolves.toHaveProperty('status', 200);
    await expect(
      saveSource(eventsLocator, eventsOpen.body.data, 'ctx.message.info("nextClick");'),
    ).resolves.toHaveProperty('status', 200);

    const updated = await repository.findModelById('chart-runjs-model');
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'option'])).toMatchObject({
      mode: 'raw',
      builder: {
        type: 'bar',
      },
      raw: runtimeCode('const rows = ctx.data.objects || [];\nreturn { dataset: { source: rows } };'),
    });
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'])).toEqual(
      runtimeCode('ctx.message.info("nextClick");'),
    );
  });

  it('preserves chart option siblings after open but rejects an actual raw code change', async () => {
    await repository.insertModel({
      uid: 'chart-fingerprint-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                builder: {
                  type: 'bar',
                },
                raw: 'return { series: [] };',
              },
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'chart-fingerprint-model',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'chart-fingerprint-model',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                builder: {
                  type: 'line',
                },
                raw: 'return { series: [] };',
              },
            },
          },
        },
      },
    });

    const save = await saveSource(locator, open.body.data, 'return { dataset: {} };');
    expect(save.status).toBe(200);
    const saved = await repository.findModelById('chart-fingerprint-model');
    expect(getAtPath(saved, ['stepParams', 'chartSettings', 'configure', 'chart', 'option'])).toMatchObject({
      mode: 'raw',
      builder: {
        type: 'line',
      },
      raw: runtimeCode('return { dataset: {} };'),
    });

    const reopened = await openSource(locator);
    expect(reopened.status).toBe(200);
    await repository.patch({
      uid: 'chart-fingerprint-model',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                builder: {
                  type: 'line',
                },
                raw: 'return { changedOutsideStudio: true };',
              },
            },
          },
        },
      },
    });

    const commitCountBeforeRejectedSave = await app.db.getRepository('vscFileCommits').count();
    const rejected = await saveSource(locator, reopened.body.data, 'return { studio: true };');
    expect(rejected.status).toBe(409);
    expect(rejected.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      message: 'RunJS host code differs from the versioned source',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeRejectedSave);
    const diverged = await repository.findModelById('chart-fingerprint-model');
    expect(getAtPath(diverged, ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'])).toBe(
      'return { changedOutsideStudio: true };',
    );
  });

  it('preserves chart event siblings after open but rejects an actual raw code change', async () => {
    await repository.insertModel({
      uid: 'chart-events-fingerprint-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                raw: 'return { series: [] };',
              },
              events: {
                raw: 'ctx.message.info("one");',
                keep: 'original sibling',
              },
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'chart.events',
      modelUid: 'chart-events-fingerprint-model',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'chart-events-fingerprint-model',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                raw: 'return { series: [] };',
              },
              events: {
                raw: 'ctx.message.info("one");',
                keep: 'changed elsewhere',
                debounce: 300,
              },
            },
          },
        },
      },
    });

    const save = await saveSource(locator, open.body.data, 'ctx.message.info("two");');
    expect(save.status).toBe(200);
    const saved = await repository.findModelById('chart-events-fingerprint-model');
    expect(getAtPath(saved, ['stepParams', 'chartSettings', 'configure', 'chart', 'events'])).toMatchObject({
      raw: runtimeCode('ctx.message.info("two");'),
      keep: 'changed elsewhere',
      debounce: 300,
    });
    expect(getAtPath(saved, ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'])).toBe(
      'return { series: [] };',
    );

    const reopened = await openSource(locator);
    expect(reopened.status).toBe(200);
    await repository.patch({
      uid: 'chart-events-fingerprint-model',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                raw: 'return { series: [] };',
              },
              events: {
                raw: 'ctx.message.info("three");',
                keep: 'changed elsewhere',
                debounce: 300,
              },
            },
          },
        },
      },
    });

    const commitCountBeforeRejectedSave = await app.db.getRepository('vscFileCommits').count();
    const rejected = await saveSource(locator, reopened.body.data, 'ctx.message.info("four");');
    expect(rejected.status).toBe(409);
    expect(rejected.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      message: 'RunJS host code differs from the versioned source',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeRejectedSave);
    const diverged = await repository.findModelById('chart-events-fingerprint-model');
    expect(getAtPath(diverged, ['stepParams', 'chartSettings', 'configure', 'chart', 'events'])).toMatchObject({
      raw: 'ctx.message.info("three");',
      keep: 'changed elsewhere',
      debounce: 300,
    });
  });

  it('preserves legacy chart settings paths when saving option and events sources', async () => {
    await repository.insertModel({
      uid: 'legacy-chart-runjs-model',
      use: 'ChartBlockModel',
      settings: {
        visual: {
          raw: 'return { xAxis: { type: "category" } };',
          keep: 'visual sibling',
        },
        events: {
          raw: 'chart.off("click");',
          keep: 'events sibling',
        },
      },
    });

    const optionLocator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'legacy-chart-runjs-model',
    };
    const eventsLocator: RunJSSourceLocator = {
      kind: 'chart.events',
      modelUid: 'legacy-chart-runjs-model',
    };
    const optionOpen = await openSource(optionLocator);
    const eventsOpen = await openSource(eventsLocator);

    expect(optionOpen.body.data.legacy).toMatchObject({
      code: 'return { xAxis: { type: "category" } };',
      surfaceStyle: 'value',
    });
    expect(eventsOpen.body.data.legacy).toMatchObject({
      code: 'chart.off("click");',
      surfaceStyle: 'action',
    });

    await expect(
      saveSource(optionLocator, optionOpen.body.data, 'return { series: [{ type: "bar" }] };'),
    ).resolves.toHaveProperty('status', 200);
    await expect(
      saveSource(eventsLocator, eventsOpen.body.data, 'chart.on("click", function() {});'),
    ).resolves.toHaveProperty('status', 200);

    const updated = await repository.findModelById('legacy-chart-runjs-model');
    expect(getAtPath(updated, ['settings', 'visual'])).toMatchObject({
      raw: runtimeCode('return { series: [{ type: "bar" }] };'),
      keep: 'visual sibling',
    });
    expect(getAtPath(updated, ['settings', 'events'])).toMatchObject({
      raw: runtimeCode('chart.on("click", function () { });'),
      keep: 'events sibling',
    });
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'])).toBeUndefined();
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'])).toBeUndefined();
  });

  it('writes chart sources to the v2 path when no existing raw path is present', async () => {
    await repository.insertModel({
      uid: 'new-chart-runjs-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'custom',
              },
              events: {},
            },
          },
        },
      },
    });

    const optionLocator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'new-chart-runjs-model',
    };
    const eventsLocator: RunJSSourceLocator = {
      kind: 'chart.events',
      modelUid: 'new-chart-runjs-model',
    };
    const optionOpen = await openSource(optionLocator);
    const eventsOpen = await openSource(eventsLocator);
    expect(optionOpen.status).toBe(200);
    expect(eventsOpen.status).toBe(200);
    expect(optionOpen.body.data.legacy).toMatchObject({
      code: expect.stringContaining('return {'),
      entryPath: 'src/main.ts',
      entry: 'src/main.ts',
    });
    expect(optionOpen.body.data.legacy.code).toContain('series: []');
    expect(eventsOpen.body.data.legacy).toMatchObject({
      code: expect.stringContaining('chart.on'),
      entryPath: 'src/main.ts',
      entry: 'src/main.ts',
    });

    const save = await saveSource(optionLocator, optionOpen.body.data, 'return { yAxis: {} };');
    expect(save.status).toBe(200);

    const updated = await repository.findModelById('new-chart-runjs-model');
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'option'])).toMatchObject({
      mode: 'custom',
      raw: runtimeCode('return { yAxis: {} };'),
    });
    expect(getAtPath(updated, ['settings', 'visual', 'raw'])).toBeUndefined();
  });

  it('uses compiler-owned surface validation before saving browser RunJS artifacts', async () => {
    await repository.insertModel({
      uid: 'chart-runjs-authoring-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                raw: 'return { xAxis: {} };',
              },
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'chart-runjs-authoring-model',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);
    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();

    const save = await saveSource(locator, open.body.data, 'ctx.render(null);');

    expect(save.status).toBe(400);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
            message: 'Value RunJS must return a value and cannot call ctx.render(...).',
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);
    const updated = await repository.findModelById('chart-runjs-authoring-model');
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'])).toBe(
      'return { xAxis: {} };',
    );
  });

  it('registers adapters while compiler validation remains available when Flow Engine loads first', async () => {
    await app.destroy();
    await resetApp(['flow-engine', PluginVscFileServer]);

    await repository.insertModel({
      uid: 'chart-runjs-reversed-order-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                raw: 'return { xAxis: {} };',
              },
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'chart-runjs-reversed-order-model',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    const save = await saveSource(locator, open.body.data, 'ctx.render(null);');

    expect(save.status).toBe(400);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
          }),
        ]),
      },
    });
  });

  async function resetApp(runJSPlugins: Array<string | typeof PluginVscFileServer>) {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [...basePlugins, ...runJSPlugins],
    });
    const user = await app.db.getRepository('users').findOne();
    agent = await app.agent().login(user);
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  }

  function openSource(
    locator: RunJSSourceLocator,
    requestAgent = agent,
    initialSource?: { code: string; version: string },
  ) {
    return requestAgent.resource('runJSSources').open({
      values: {
        locator,
        initialSource,
      },
    });
  }

  function saveSource(
    locator: RunJSSourceLocator,
    base:
      | string
      | {
          ownerFingerprint: string;
          repository: {
            repoId: string;
            headCommitId: string | null;
          };
        },
    code: string,
    requestAgent = agent,
  ) {
    const entryPath = getRunJSSavePath(locator);
    const opened = typeof base === 'string' ? null : base;

    return requestAgent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened?.repository.repoId,
        message: 'Update RunJS source',
        entryPath,
        files: [
          {
            path: entryPath,
            operation: 'upsert',
            content: code,
            language: 'typescript',
          },
        ],
      },
    });
  }

  function getRunJSSavePath(locator: RunJSSourceLocator): string {
    return locator.kind === 'chart.option' || locator.kind === 'chart.events' ? 'src/main.ts' : 'src/main.tsx';
  }
});

function getAtPath(root: unknown, path: Array<string | number>): unknown {
  let current = root;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === 'number') {
      current = current[segment];
      continue;
    }
    if (isRecord(current) && typeof segment === 'string') {
      current = current[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function runtimeCode(source: string) {
  const expected = normalizeRuntimeCode(source);
  return {
    asymmetricMatch(value: unknown) {
      return typeof value === 'string' && normalizeRuntimeCode(value).includes(expected);
    },
    toString() {
      return 'StringContainingIgnoringWhitespace';
    },
  };
}

function expectRuntimeCode(value: unknown, source: string) {
  expect(typeof value).toBe('string');
  if (typeof value === 'string') {
    expect(normalizeRuntimeCode(value)).toContain(normalizeRuntimeCode(source));
  }
}

function normalizeRuntimeCode(source: string) {
  return source.replace(/\s+/g, '').replace(/"/g, "'");
}
