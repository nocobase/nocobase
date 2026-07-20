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
});
