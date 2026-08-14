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
const JS_TEMPLATE_ENTRY_KINDS = ['js-block', 'js-field', 'js-action', 'js-item'] as const;
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

type RunJSHost = {
  uid?: string;
  fieldUid?: string;
  runJSLocator?: Record<string, unknown>;
  workspaceStatus?: string;
  workspaceRetryable?: boolean;
  workspaceError?: Record<string, unknown>;
};

type CreatedRunJSHost = {
  kind: (typeof JS_TEMPLATE_ENTRY_KINDS)[number];
  modelUse: 'JSBlockModel' | 'JSFieldModel' | 'JSActionModel' | 'JSItemModel';
  modelUid: string;
  host: RunJSHost;
};

function requireModelUid(host: RunJSHost) {
  const modelUid = host.fieldUid || host.uid;
  if (!modelUid) {
    throw new Error('Inline JS host model UID was not returned');
  }
  return modelUid;
}

async function getFlowSurface(agent: Awaited<ReturnType<typeof getRootAgent>>, modelUid: string) {
  return await agent.get(`/flowSurfaces:get?uid=${encodeURIComponent(modelUid)}`);
}

async function createInlineJsHosts(app: MockServer, suffix: string) {
  const agent = await getRootAgent(app);
  const pageResponse = await agent.resource('flowSurfaces').createPage({
    values: {
      idempotencyKey: `preset-inline-js-hosts-${suffix}`,
      title: `Preset Inline JS Hosts ${suffix}`,
      tabTitle: 'Main',
      icon: 'CodeOutlined',
      portalUid: DEFAULT_ADMIN_PORTAL_UID,
    },
  });
  expect(pageResponse.status, pageResponse.body?.errors?.[0]?.message).toBe(200);
  const page = pageResponse.body.data;
  const createHost = async (action: 'addBlock' | 'addField' | 'addAction', values: Record<string, unknown>) => {
    const response = await agent.resource('flowSurfaces')[action]({ values });
    expect(response.status, response.body?.errors?.[0]?.message).toBe(200);
    return response.body.data as RunJSHost;
  };
  const jsBlock = await createHost('addBlock', {
    target: { uid: page.tabSchemaUid },
    type: 'jsBlock',
    settings: { title: `Preset JS Block ${suffix}`, code: "ctx.render('block');" },
  });
  const table = await createHost('addBlock', {
    target: { uid: page.tabSchemaUid },
    type: 'table',
    resourceInit: { dataSourceKey: 'main', collectionName: 'users' },
    fields: ['nickname'],
  });
  const createForm = await createHost('addBlock', {
    target: { uid: page.tabSchemaUid },
    type: 'createForm',
    resourceInit: { dataSourceKey: 'main', collectionName: 'users' },
    fields: ['nickname'],
  });
  const actionPanel = await createHost('addBlock', {
    target: { uid: page.tabSchemaUid },
    type: 'actionPanel',
  });
  const jsField = await createHost('addField', {
    target: { uid: (table as Record<string, unknown>).uid },
    fieldPath: 'nickname',
    renderer: 'js',
  });
  const jsItem = await createHost('addField', {
    target: { uid: (createForm as Record<string, unknown>).uid },
    type: 'jsItem',
  });
  const jsAction = await createHost('addAction', {
    target: { uid: (actionPanel as Record<string, unknown>).uid },
    type: 'js',
  });
  const hosts: CreatedRunJSHost[] = [
    { kind: 'js-block', modelUse: 'JSBlockModel', modelUid: requireModelUid(jsBlock), host: jsBlock },
    { kind: 'js-field', modelUse: 'JSFieldModel', modelUid: requireModelUid(jsField), host: jsField },
    { kind: 'js-action', modelUse: 'JSActionModel', modelUid: requireModelUid(jsAction), host: jsAction },
    { kind: 'js-item', modelUse: 'JSItemModel', modelUid: requireModelUid(jsItem), host: jsItem },
  ];
  return { agent, hosts };
}

async function expectInlineJsHostsReady(app: MockServer, suffix: string) {
  const { agent, hosts } = await createInlineJsHosts(app, suffix);
  expect(hosts.map((host) => host.kind)).toEqual(JS_TEMPLATE_ENTRY_KINDS);
  for (const { host, kind, modelUid, modelUse } of hosts) {
    const flowKey = kind === 'js-action' ? 'clickSettings' : 'jsSettings';
    expect(host).toMatchObject({
      workspaceStatus: 'ready',
      workspaceRetryable: false,
      runJSLocator: { kind: 'flowModel.step', modelUid, flowKey },
    });
    const readbackResponse = await getFlowSurface(agent, modelUid);
    expect(readbackResponse.status).toBe(200);
    expect(readbackResponse.body.data.tree).toMatchObject({ use: modelUse, runJSLocator: host.runJSLocator });
    const openResponse = await agent.resource('runJSSources').open({ values: { locator: host.runJSLocator } });
    expect(openResponse.status).toBe(200);
    expect(openResponse.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/index.tsx' }),
        expect.objectContaining({ path: 'src/client/entry.json' }),
        expect.objectContaining({ path: '.nocobase/runjs-source.json' }),
      ]),
    );
    const openedFiles = openResponse.body.data.files as Array<{ path: string; blobHash: string }>;
    const entryFile = openedFiles.find((file) => file.path === 'src/client/index.tsx');
    if (!entryFile) {
      throw new Error(`${modelUse} entry file was not materialized`);
    }
    const savedCode =
      flowKey === 'clickSettings'
        ? `ctx.message.info('Preset ${modelUse} ${suffix} saved');\n`
        : `ctx.render('Preset ${modelUse} ${suffix} saved');\n`;
    const saveResponse = await agent.resource('runJSSources').saveChanges({
      values: {
        locator: host.runJSLocator,
        repoId: openResponse.body.data.repository.repoId,
        baseCommitId: openResponse.body.data.repository.headCommitId,
        baseOwnerFingerprint: openResponse.body.data.ownerFingerprint,
        message: `Save preset ${modelUse} ${suffix}`,
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
    const reopenedResponse = await agent.resource('runJSSources').open({ values: { locator: host.runJSLocator } });
    expect(reopenedResponse.status).toBe(200);
    expect(reopenedResponse.body.data.files).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'src/client/index.tsx', content: savedCode })]),
    );
  }
}

async function expectInlineJsHostsWithoutWorkspace(app: MockServer, suffix: string) {
  const { agent, hosts } = await createInlineJsHosts(app, suffix);
  expect(hosts.map((host) => host.kind)).toEqual(JS_TEMPLATE_ENTRY_KINDS);
  for (const { host, modelUid, modelUse } of hosts) {
    expect(host.runJSLocator).toBeUndefined();
    expect(host.workspaceStatus).toBeUndefined();
    expect(host.workspaceRetryable).toBeUndefined();
    expect(host.workspaceError).toBeUndefined();
    const readbackResponse = await getFlowSurface(agent, modelUid);
    expect(readbackResponse.status).toBe(200);
    expect(readbackResponse.body.data.tree).toMatchObject({ use: modelUse });
    expect(readbackResponse.body.data.tree.runJSLocator).toBeUndefined();
    expect(readbackResponse.body.data.tree.workspaceStatus).toBeUndefined();
    expect(readbackResponse.body.data.tree.workspaceRetryable).toBeUndefined();
    expect(readbackResponse.body.data.tree.workspaceError).toBeUndefined();
  }
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
    expect(capabilities.externalization.entryKinds).toEqual(JS_TEMPLATE_ENTRY_KINDS);
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

  it('loads one canonical plugin, initializes its collections, and preserves the four Inline JS hosts', async () => {
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
    await expectInlineJsHostsReady(app, 'enabled');

    await app.pm.disable(JS_TEMPLATE_NAME);
    const disabledResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(disabledResponse.status).toBe(503);
    expect(disabledResponse.body.errors[0]).toMatchObject({ code: 'JS_TEMPLATE_RUNTIME_UNAVAILABLE', status: 503 });
    for (const resourceName of JS_TEMPLATE_RESOURCE_NAMES) {
      expect(app.resourceManager.isDefined(resourceName)).toBe(false);
    }
    await expectInlineJsHostsWithoutWorkspace(app, 'disabled');

    await app.upgrade();
    const disabledAfterUpgrade = await app.pm.repository.findOne({ filter: { name: JS_TEMPLATE_NAME } });
    expect(disabledAfterUpgrade?.get('enabled')).toBe(false);
    const disabledAfterUpgradeResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(disabledAfterUpgradeResponse.status).toBe(503);

    await app.pm.enable(JS_TEMPLATE_NAME);
    const enabledResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(enabledResponse.status).toBe(200);
    for (const resourceName of JS_TEMPLATE_RESOURCE_NAMES) {
      expect(app.resourceManager.isDefined(resourceName)).toBe(true);
    }
    await expectAuthoringCapabilities(app, true);
    await expectInlineJsHostsReady(app, 're-enabled');
  }, 120000);
});
