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

import PluginLightExtensionServer from '../plugin';

describe('Light Extension Workflow JavaScript RunJS source integration', () => {
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
        'workflow',
        PluginLightExtensionServer,
        'workflow-javascript',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('opens and saves a Workflow JavaScript source with only the Light Extension host', async () => {
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    const node = await workflow.createNode({
      title: 'Light Extension script',
      type: 'script',
      config: {
        content: 'return 1;',
        timeout: 2000,
      },
    });
    const user = await app.db.getRepository('users').findOne();
    const agent = await app.agent().login(user);
    const locator: RunJSSourceLocator = {
      kind: 'workflow.javascript',
      nodeId: node.id,
    };

    const opened = await agent.resource('runJSSources').open({ values: { locator } });

    expect(opened.status).toBe(200);
    expect(opened.body.data.legacy).toMatchObject({
      code: 'return 1;',
      version: 'workflow-js',
    });

    const saved = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.repoId,
        message: 'Update Workflow JavaScript source',
        entryPath: 'src/main.js',
        files: [
          {
            path: 'src/main.js',
            operation: 'upsert',
            content: 'return 2;',
            language: 'javascript',
          },
        ],
      },
    });

    expect(saved.status).toBe(200);
    await node.reload();
    expect(node.get('config')).toMatchObject({
      content: expect.stringContaining('return 2;'),
      timeout: 2000,
    });
  });
});
