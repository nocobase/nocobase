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

const LIGHT_EXTENSION_NAME = 'light-extension';
const LIGHT_EXTENSION_PACKAGE = '@nocobase/plugin-light-extension';

type RunJSLocator = Record<string, unknown>;

async function getLightExtensionRecord(app: MockServer) {
  return await app.db.getRepository('applicationPlugins').findOne({
    filter: {
      packageName: LIGHT_EXTENSION_PACKAGE,
    },
  });
}

async function getRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });
  expect(rootUser).toBeTruthy();
  return await app.agent().login(rootUser);
}

async function expectInlineJSPageWorkspaceReady(app: MockServer, suffix: string) {
  const agent = await getRootAgent(app);
  const pageResponse = await agent.resource('flowSurfaces').createPage({
    values: {
      pageType: 'js-page',
      idempotencyKey: `preset-inline-js-page-${suffix}`,
      title: `Preset Inline JS Page ${suffix}`,
      icon: 'CodeOutlined',
    },
  });

  expect(pageResponse.status).toBe(200);
  expect(pageResponse.body.data).toMatchObject({
    pageType: 'js-page',
    workspaceStatus: 'ready',
    runJSLocator: { kind: 'flowModel.step' },
  });

  const locator = pageResponse.body.data.runJSLocator as RunJSLocator;
  const openResponse = await agent.resource('runJSSources').open({ values: { locator } });
  expect(openResponse.status).toBe(200);
  expect(openResponse.body.data.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: 'src/client/index.tsx' }),
      expect.objectContaining({ path: 'src/client/entry.json' }),
      expect.objectContaining({ path: '.nocobase/runjs-source.json' }),
    ]),
  );
  expect(await app.db.getRepository('lightExtensionRepos').count()).toBe(0);
}

describe('Light Extension preset runtime', () => {
  let app: MockServer;

  afterEach(async () => {
    if (!app) {
      return;
    }
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('enables the Workspace provider on fresh install and upgrade without creating Light Extension repositories', async () => {
    app = await createMockServer({
      acl: true,
      plugins: [PresetNocoBase],
      registerActions: true,
      skipSupervisor: true,
    });

    const freshRecord = await getLightExtensionRecord(app);
    expect(freshRecord).toBeTruthy();
    expect(freshRecord?.get('name')).toBe(LIGHT_EXTENSION_NAME);
    expect(freshRecord?.get('packageName')).toBe(LIGHT_EXTENSION_PACKAGE);
    expect(freshRecord?.get('enabled')).toBe(true);
    expect(freshRecord?.get('builtIn')).toBe(true);
    await expectInlineJSPageWorkspaceReady(app, 'fresh-install');

    await app.db.getRepository('applicationPlugins').destroy({
      filter: {
        packageName: LIGHT_EXTENSION_PACKAGE,
      },
    });
    expect(await getLightExtensionRecord(app)).toBeNull();

    await app.upgrade();

    const upgradedRecord = await getLightExtensionRecord(app);
    expect(upgradedRecord).toBeTruthy();
    expect(upgradedRecord?.get('name')).toBe(LIGHT_EXTENSION_NAME);
    expect(upgradedRecord?.get('packageName')).toBe(LIGHT_EXTENSION_PACKAGE);
    expect(upgradedRecord?.get('enabled')).toBe(true);
    expect(upgradedRecord?.get('builtIn')).toBe(true);
    await expectInlineJSPageWorkspaceReady(app, 'upgrade');
  }, 120000);
});
