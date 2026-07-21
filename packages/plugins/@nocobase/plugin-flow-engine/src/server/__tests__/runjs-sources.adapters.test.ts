/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import type { RunJSSourceAdapterContext, RunJSSourceLocator } from '@nocobase/server';

import PluginLightExtensionServer from '../../../../plugin-light-extension/src/server';
import FlowModelRepository from '../repository';
import { createFlowModelRunJSSourceAdapters } from '../runjs-sources/flow-model-adapters';

const basePlugins = ['field-sort', 'system-settings', 'users', 'auth', 'acl', 'data-source-manager'];

describe('flow-engine RunJS source adapters', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let repository: FlowModelRepository;

  beforeAll(async () => {
    await resetApp([PluginLightExtensionServer, 'flow-engine']);
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('rejects ordinary RunJS workspace authoring for active external FlowModel step sources', async () => {
    await repository.insertModel({
      uid: 'external-source-runjs-model',
      title: 'External source RunJS model',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("inline fallback");',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_external_source',
              entryId: 'lee_external_source',
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'external-source-runjs-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const repositoriesBefore = await app.db.getRepository('vscFileRepositories').count();
    const open = await openSource(locator);
    const save = await saveSource(locator, 'no-repository', 'ctx.render("bypass");');

    expect(open.status).toBe(403);
    expect(save.status).toBe(403);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_READONLY',
      details: {
        kind: 'flowModel.step',
        sourceMode: 'light-extension',
      },
    });
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_READONLY',
      details: {
        kind: 'flowModel.step',
        sourceMode: 'light-extension',
      },
    });
    expect(await app.db.getRepository('vscFileRepositories').count()).toBe(repositoriesBefore);
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

    const repositoriesBefore = await app.db.getRepository('vscFileRepositories').count();
    const nestedOpen = await openSource(nestedLocator);
    const nestedSave = await saveSource(nestedLocator, 'no-repository', 'return 2;');
    expect(nestedOpen.status).toBe(403);
    expect(nestedSave.status).toBe(403);
    expect(nestedOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_READONLY',
      details: {
        kind: 'flowModel.nestedRunJS',
        sourceMode: 'light-extension',
      },
    });
    expect(nestedSave.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_READONLY',
      details: {
        kind: 'flowModel.nestedRunJS',
        sourceMode: 'light-extension',
      },
    });
    expect(await app.db.getRepository('vscFileRepositories').count()).toBe(repositoriesBefore);

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

  it.each([
    {
      label: 'render',
      modelUse: 'JSBlockModel',
      flowKey: 'jsSettings',
      initialCode: 'ctx.render("new block");',
      savedCode: 'ctx.render("saved block");',
    },
    {
      label: 'action',
      modelUse: 'JSActionModel',
      flowKey: 'clickSettings',
      initialCode: 'ctx.message.success("new action");',
      savedCode: 'ctx.message.success("saved action");',
    },
  ])('initializes and saves a new $label RunJS source before its step params exist', async (input) => {
    const modelUid = `new-js-${input.label}-model`;
    await repository.insertModel({
      uid: modelUid,
      title: `New JS ${input.label}`,
      use: input.modelUse,
      stepParams: {},
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid,
      flowKey: input.flowKey,
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator, agent, {
      code: input.initialCode,
      version: 'v2',
    });

    expect(open.status).toBe(200);
    expect(open.body.data.legacy).toMatchObject({
      code: input.initialCode,
      version: 'v2',
      surfaceStyle: input.label,
      uninitialized: true,
      metadata: {
        modelUse: input.modelUse,
      },
    });
    expect(open.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: input.initialCode,
        }),
      ]),
    );

    const save = await saveSource(locator, open.body.data, input.savedCode);
    expect(save.status).toBe(200);

    const updated = await repository.findModelById(modelUid);
    expect(getAtPath(updated, ['stepParams', input.flowKey, 'runJs'])).toMatchObject({
      code: runtimeCode(input.savedCode),
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
    const modelUid = `js-step-missing-${input.label}-path-model`;
    await repository.insertModel({
      uid: modelUid,
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
      modelUid,
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

  it('rejects RunJS workspace saves after light-extension source metadata changes without changing code', async () => {
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
    const repositoriesBefore = await app.db.getRepository('vscFileRepositories').count();
    const open = await openSource(locator);
    expect(open.status).toBe(403);

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

    const save = await saveSource(locator, 'no-repository', 'ctx.render("newValue");');
    expect(save.status).toBe(403);
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_READONLY',
      details: {
        sourceMode: 'light-extension',
      },
    });

    const updated = await repository.findModelById('js-step-light-extension-metadata-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'return oldValue;',
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
        repoId: 'repo_new',
        commitId: 'commit_new',
        entry: 'src/main.tsx',
      },
    });
    expect(await app.db.getRepository('vscFileRepositories').count()).toBe(repositoriesBefore);
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
    await resetApp(['flow-engine', PluginLightExtensionServer]);

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

  async function resetApp(runJSPlugins: Array<string | typeof PluginLightExtensionServer>) {
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
  let pattern = '';
  let quote: '"' | "'" | '`' | undefined;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      pattern += escapeRegExp(character);
      if (character === '\\' && index + 1 < source.length) {
        index += 1;
        pattern += escapeRegExp(source[index]);
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      pattern += escapeRegExp(character);
      continue;
    }
    if (/\s/u.test(character)) {
      while (index + 1 < source.length && /\s/u.test(source[index + 1])) {
        index += 1;
      }
      pattern += '\\s*';
      continue;
    }
    pattern += escapeRegExp(character);
  }
  return expect.stringMatching(new RegExp(pattern));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
