/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { PresetNocoBase } from '../index';

const JS_TEMPLATE_NAME = 'js-template';
const JS_TEMPLATE_PACKAGE = '@nocobase/plugin-js-template';
const DEFAULT_ADMIN_PORTAL_UID = '__default_admin__';
const JS_TEMPLATE_RESOURCE_NAMES = [
  'runJSSources',
  'jsTemplates',
  'jsTemplateRuntime',
  'jsTemplateUsages',
  'jsTemplateProjects',
  'jsTemplateFiles',
  'jsTemplateCapabilities',
  'jsTemplateSync',
  'jsTemplateCreateJobs',
  'vscFileRemotes',
  'vscFileSyncJobs',
  'vscFileExternalCommitMaps',
  'vscFileConflicts',
] as const;

async function getRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({ filter: { 'roles.name': 'root' } });
  expect(rootUser).toBeTruthy();
  return await app.agent().login(rootUser);
}

async function createInlineJsPage(app: MockServer, suffix: string) {
  const agent = await getRootAgent(app);
  const pageResponse = await agent.resource('flowSurfaces').createPage({
    values: {
      pageType: 'js-page',
      idempotencyKey: `preset-inline-js-page-${suffix}`,
      title: `Preset Inline JS Page ${suffix}`,
      icon: 'CodeOutlined',
      portalUid: DEFAULT_ADMIN_PORTAL_UID,
    },
  });

  expect(pageResponse.status, pageResponse.body?.errors?.[0]?.message).toBe(200);
  return { agent, page: pageResponse.body.data };
}

async function expectInlineJsPageReady(app: MockServer, suffix: string) {
  const { agent, page } = await createInlineJsPage(app, suffix);
  expect(page).toMatchObject({
    pageType: 'js-page',
    workspaceStatus: 'ready',
    runJSLocator: { kind: 'flowModel.step' },
  });
  const openResponse = await agent.resource('runJSSources').open({
    values: { locator: page.runJSLocator },
  });
  expect(openResponse.status).toBe(200);
  expect(openResponse.body.data.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: 'src/client/index.tsx' }),
      expect.objectContaining({ path: 'src/client/entry.json' }),
      expect.objectContaining({ path: '.nocobase/runjs-source.json' }),
    ]),
  );

  const openedFiles = openResponse.body.data.files as Array<{ path: string; blobHash: string; content?: string }>;
  const entryFile = openedFiles.find((file) => file.path === 'src/client/index.tsx');
  if (!entryFile) {
    throw new Error('Inline JS Page entry file was not materialized');
  }
  const savedCode = `ctx.render('Preset Inline JS Page ${suffix} saved');\n`;
  const saveResponse = await agent.resource('runJSSources').saveChanges({
    values: {
      locator: page.runJSLocator,
      repoId: openResponse.body.data.repository.repoId,
      baseCommitId: openResponse.body.data.repository.headCommitId,
      baseOwnerFingerprint: openResponse.body.data.ownerFingerprint,
      message: `Save preset Inline JS Page ${suffix}`,
      entryPath: 'src/client/index.tsx',
      version: 'v2',
      changes: [
        {
          path: 'src/client/index.tsx',
          operation: 'upsert',
          expectedBlobHash: entryFile.blobHash,
          content: savedCode,
          language: 'tsx',
        },
      ],
    },
  });
  expect(saveResponse.status, saveResponse.body?.errors?.[0]?.message).toBe(200);
  expect(saveResponse.body.data.artifact.diagnostics).toEqual([]);

  const reopenedResponse = await agent.resource('runJSSources').open({
    values: { locator: page.runJSLocator },
  });
  expect(reopenedResponse.status).toBe(200);
  expect(reopenedResponse.body.data.files).toEqual(
    expect.arrayContaining([expect.objectContaining({ path: 'src/client/index.tsx', content: savedCode })]),
  );
}

async function expectInlineJsPageWithoutWorkspace(app: MockServer, suffix: string) {
  const { page } = await createInlineJsPage(app, suffix);
  expect(page).toMatchObject({
    pageType: 'js-page',
    modelUse: 'JSPageModel',
    capabilities: { runJSWorkspace: false },
  });
  expect(page.runJSLocator).toBeUndefined();
  expect(page.workspaceStatus).toBeUndefined();
  expect(page.workspaceRetryable).toBeUndefined();
  expect(page.workspaceError).toBeUndefined();
}

async function expectAuthoringCapabilities(app: MockServer, externalizationAvailable: boolean) {
  const response = await (await getRootAgent(app)).resource('runJSSources').capabilities();
  expect(response.status).toBe(200);
  const capabilities = (response.body.data || response.body) as {
    inlineWorkspace: { available: boolean };
    externalization: {
      available: boolean;
      entryKinds: string[];
      destinationTypes: string[];
      supportsIdempotency: boolean;
      supportsDetachToInline: boolean;
    };
  };
  expect(capabilities.inlineWorkspace).toMatchObject({ available: true });
  expect(capabilities.externalization).toMatchObject({ available: externalizationAvailable });
  if (externalizationAvailable) {
    expect(capabilities.externalization.entryKinds).toEqual([
      'js-block',
      'js-page',
      'js-field',
      'js-action',
      'js-item',
    ]);
    expect(capabilities.externalization.destinationTypes).toEqual(['existing', 'new']);
    expect(capabilities.externalization).toMatchObject({
      supportsIdempotency: true,
      supportsDetachToInline: true,
    });
  } else {
    expect(capabilities.externalization).toMatchObject({
      entryKinds: [],
      destinationTypes: [],
      supportsIdempotency: false,
      supportsDetachToInline: false,
    });
  }
}

describe('JS Template preset runtime', () => {
  let app: MockServer;

  afterEach(async () => {
    if (!app) {
      return;
    }
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('loads one canonical plugin, initializes its collections, and keeps Inline JS available while disabled', async () => {
    app = await createMockServer({
      acl: true,
      plugins: [PresetNocoBase],
      registerActions: true,
      skipSupervisor: true,
    });

    const record = await app.db.getRepository('applicationPlugins').findOne({ filter: { name: JS_TEMPLATE_NAME } });
    expect(record).toBeTruthy();
    expect(record?.get('packageName')).toBe(JS_TEMPLATE_PACKAGE);
    expect(record?.get('enabled')).toBe(true);
    expect(record?.get('builtIn')).toBe(true);
    for (const collectionName of [
      'jsTemplateProjects',
      'jsTemplates',
      'jsTemplateUsages',
      'jsTemplateArtifacts',
      'jsTemplateLogs',
      'jsTemplateSourceOperations',
      'jsTemplateCreateJobs',
    ]) {
      expect(app.db.hasCollection(collectionName)).toBe(true);
    }
    const initiallyEnabledResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(initiallyEnabledResponse.status).toBe(200);
    await expectAuthoringCapabilities(app, true);
    await expectInlineJsPageReady(app, 'enabled');

    await app.pm.disable(JS_TEMPLATE_NAME);
    const disabledResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(disabledResponse.status).toBe(503);
    expect(disabledResponse.body.errors[0]).toMatchObject({ code: 'JS_TEMPLATE_RUNTIME_UNAVAILABLE', status: 503 });
    for (const resourceName of JS_TEMPLATE_RESOURCE_NAMES) {
      expect(app.resourceManager.isDefined(resourceName)).toBe(false);
    }
    await expectInlineJsPageWithoutWorkspace(app, 'disabled');

    await app.pm.enable(JS_TEMPLATE_NAME);
    const enabledResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(enabledResponse.status).toBe(200);
    for (const resourceName of JS_TEMPLATE_RESOURCE_NAMES) {
      expect(app.resourceManager.isDefined(resourceName)).toBe(true);
    }
    await expectAuthoringCapabilities(app, true);
    await expectInlineJsPageReady(app, 're-enabled');
  }, 120000);
});
