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

async function getRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({ filter: { 'roles.name': 'root' } });
  expect(rootUser).toBeTruthy();
  return await app.agent().login(rootUser);
}

async function expectInlineJsPageReady(app: MockServer, suffix: string) {
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
  expect(pageResponse.body.data).toMatchObject({
    pageType: 'js-page',
    workspaceStatus: 'ready',
    runJSLocator: { kind: 'flowModel.step' },
  });
  const openResponse = await agent.resource('runJSSources').open({
    values: { locator: pageResponse.body.data.runJSLocator },
  });
  expect(openResponse.status).toBe(200);
  expect(openResponse.body.data.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: 'src/client/index.tsx' }),
      expect.objectContaining({ path: 'src/client/entry.json' }),
      expect.objectContaining({ path: '.nocobase/runjs-source.json' }),
    ]),
  );
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
    await expectInlineJsPageReady(app, 'enabled');

    await app.pm.disable(JS_TEMPLATE_NAME);
    const disabledResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(disabledResponse.status).toBe(503);
    expect(disabledResponse.body.errors[0]).toMatchObject({ code: 'JS_TEMPLATE_RUNTIME_UNAVAILABLE', status: 503 });
    await expectInlineJsPageReady(app, 'disabled');

    await app.pm.enable(JS_TEMPLATE_NAME);
    const enabledResponse = await (await getRootAgent(app)).resource('jsTemplateProjects').list();
    expect(enabledResponse.status).toBe(200);
  }, 120000);
});
