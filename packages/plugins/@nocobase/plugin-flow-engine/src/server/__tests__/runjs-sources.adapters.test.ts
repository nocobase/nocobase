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

  it('allows a light extension FlowModel step to be written only during the external-to-inline transition', async () => {
    await repository.insertModel({
      uid: 'external-to-inline-runjs-model',
      title: 'External to inline RunJS model',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("inline fallback");',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_external_to_inline',
              entryId: 'lee_external_to_inline',
            },
            settings: { title: 'preserved' },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'external-to-inline-runjs-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const adapter = createFlowModelRunJSSourceAdapters(app.db).find((item) => item.kind === locator.kind);
    if (!adapter) {
      throw new Error('FlowModel step source adapter is unavailable');
    }

    await app.db.sequelize.transaction(async (transaction) => {
      const ctx: RunJSSourceAdapterContext = {
        transaction,
        can: () => ({}),
        sourceTransition: 'external-to-inline',
      };

      await expect(adapter.assertCanRead({ locator, ctx })).rejects.toMatchObject({
        code: 'RUNJS_SOURCE_READONLY',
      });
      await expect(adapter.assertCanWrite({ locator, ctx })).resolves.toBeUndefined();
      const legacy = await adapter.readLegacy({ locator, ctx });
      expect(legacy).toMatchObject({
        code: 'ctx.render("inline fallback");',
        version: 'v2',
        metadata: { modelUse: 'JSBlockModel' },
      });

      await adapter.writeRuntime({
        locator,
        artifact: {
          code: 'ctx.render("moved inline");',
          version: 'v2',
          diagnostics: [],
          filesHash: 'external_to_inline_files_hash',
          entryPath: 'src/client/index.tsx',
          metadata: { repoId: 'runjs_external_to_inline' },
        },
        commitId: 'commit_external_to_inline',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx,
      });
    });

    const updated = await repository.findModelById('external-to-inline-runjs-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'ctx.render("moved inline");',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'ler_external_to_inline',
        entryId: 'lee_external_to_inline',
      },
      settings: { title: 'preserved' },
      sourceRef: {
        type: 'vsc-file',
        repoId: 'runjs_external_to_inline',
        commitId: 'commit_external_to_inline',
        entry: 'src/client/index.tsx',
      },
    });
  });

  it('writes an external binding for a FlowModel step without removing its inline fallback', async () => {
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
      },
    });

    const stepAdapter = createFlowModelRunJSSourceAdapters(app.db).find((adapter) => adapter.kind === 'flowModel.step');
    if (!stepAdapter?.writeExternalBinding) {
      throw new Error('FlowModel step external binding adapter is unavailable');
    }
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'external-binding-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };

    await app.db.sequelize.transaction(async (transaction) => {
      const ctx = { transaction, can: () => ({}) };
      const fingerprint = await stepAdapter.getFingerprint({ locator, ctx });
      await stepAdapter.writeExternalBinding?.({
        locator,
        binding: {
          sourceMode: 'light-extension',
          sourceBinding: { type: 'light-extension-entry', repoId: 'ler_1', entryId: 'lee_block' },
        },
        baseOwnerFingerprint: fingerprint,
        ctx,
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
  });

  it('rejects raw legacy nested RunJS open and save requests as unsupported', async () => {
    const locator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'legacy-nested-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'customVariable',
      valuePath: ['variables', 'legacy_variable', 'runjs'],
      scene: 'eventFlow',
    };
    const repositoriesBefore = await app.db.getRepository('vscFileRepositories').count();

    const open = await agent.resource('runJSSources').open({
      values: { locator },
    });
    const save = await agent.resource('runJSSources').save({
      values: {
        locator,
        baseCommitId: null,
        baseOwnerFingerprint: 'unsupported-owner',
        message: 'Attempt legacy nested save',
        files: [],
      },
    });

    expect(open.status).toBe(400);
    expect(save.status).toBe(400);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      details: { kind: 'flowModel.nestedRunJS' },
    });
    expect(save.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      details: { kind: 'flowModel.nestedRunJS' },
    });
    expect(await app.db.getRepository('vscFileRepositories').count()).toBe(repositoriesBefore);
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
        baseCommitId: open.body.data.repository.headCommitId,
        baseOwnerFingerprint: open.body.data.ownerFingerprint,
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

  it('denies FlowModel step source access outside the flow model permission filter', async () => {
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

    for (const [uid, code] of [
      ['allowed-flow-model', 'return allowed;'],
      ['blocked-flow-model', 'return blocked;'],
    ]) {
      await repository.insertModel({
        uid,
        title: uid,
        use: 'JSBlockModel',
        stepParams: {
          jsSettings: {
            runJs: {
              code,
              version: 'v2',
            },
          },
        },
      });
    }

    const buildLocator = (modelUid: string): RunJSSourceLocator => ({
      kind: 'flowModel.step',
      modelUid,
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    });
    const allowedOpen = await openSource(buildLocator('allowed-flow-model'), scopedAgent);
    const blockedOpen = await openSource(buildLocator('blocked-flow-model'), scopedAgent);

    expect(allowedOpen.status).toBe(200);
    expect(blockedOpen.status).toBe(403);
    expect(blockedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });
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
          },
        },
      },
    });

    const buildLocator = (stepKey: string): RunJSSourceLocator => ({
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-model',
      flowKey: 'submitFlow',
      stepKey,
      sourcePath: ['defaultParams', 'code'],
    });
    const defaultLocator = buildLocator('defaultRun');
    const legacyLocator = buildLocator('legacyRun');
    const bothLocator = buildLocator('bothRun');

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
    const reversedApp = await createMockServer({
      skipSupervisor: true,
      registerActions: true,
      acl: true,
      plugins: [...basePlugins, 'flow-engine', PluginLightExtensionServer],
    });

    try {
      const user = await reversedApp.db.getRepository('users').findOne();
      const reversedAgent = await reversedApp.agent().login(user);
      const reversedRepository = reversedApp.db.getCollection('flowModels').repository as FlowModelRepository;

      await reversedRepository.insertModel({
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
      const open = await openSource(locator, reversedAgent);
      expect(open.status).toBe(200);

      const save = await saveSource(locator, open.body.data, 'ctx.render(null);', reversedAgent);

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
    } finally {
      await reversedApp.destroy();
    }
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
        baseCommitId: opened?.repository.headCommitId ?? null,
        baseOwnerFingerprint: opened?.ownerFingerprint || 'missing-owner-fingerprint',
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
