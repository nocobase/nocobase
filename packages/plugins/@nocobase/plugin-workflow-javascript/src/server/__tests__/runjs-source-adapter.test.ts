/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MockServer } from '@nocobase/test';
import PluginVscFileServer, { type RunJSSourceLocator } from '@nocobase/plugin-vsc-file';
import { getApp } from '@nocobase/plugin-workflow-test';

import PluginWorkflowJavaScriptServer from '..';
import { createWorkflowJavaScriptRunJSSourceAdapter } from '../runjs-sources/workflow-javascript-adapter';

describe('workflow-javascript RunJS source adapter', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await getApp({
      plugins: [PluginVscFileServer, PluginWorkflowJavaScriptServer],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('saves workflow JavaScript node content while preserving other config fields', async () => {
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    const node = await workflow.createNode({
      title: 'Calculate score',
      type: 'script',
      config: {
        arguments: [{ name: 'score', value: 1 }],
        content: 'return score + 1;',
        continue: false,
        timeout: 2000,
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'workflow.javascript',
      nodeId: node.id,
    };
    const adapter = createWorkflowJavaScriptRunJSSourceAdapter(app.db);
    const adapterCtx = {
      can: () => ({}),
    };

    await adapter.assertCanRead({
      locator,
      ctx: adapterCtx,
    });
    const legacy = await adapter.readLegacy({
      locator,
      ctx: adapterCtx,
    });

    expect(legacy).toMatchObject({
      code: 'return score + 1;',
      version: 'workflow-js',
      surfaceStyle: 'workflow',
      language: 'javascript',
    });

    await adapter.assertCanWrite({
      locator,
      ctx: adapterCtx,
    });
    await app.db.sequelize.transaction(async (transaction) => {
      await adapter.writeRuntime({
        locator,
        artifact: {
          code: 'return score + 2;',
          version: 'workflow-js',
          diagnostics: [],
          filesHash: 'test-files-hash',
          entryPath: 'src/main.js',
        },
        commitId: 'vscc_test',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx: {
          ...adapterCtx,
          transaction,
        },
      });
    });

    await node.reload();
    expect(node.get('config')).toMatchObject({
      arguments: [{ name: 'score', value: 1 }],
      content: 'return score + 2;',
      continue: false,
      timeout: 2000,
    });
  });

  it('preserves sibling node config changed after the source was opened', async () => {
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    const node = await workflow.createNode({
      title: 'Changing sibling config',
      type: 'script',
      config: {
        arguments: [{ name: 'score', value: 1 }],
        content: 'return score + 1;',
        timeout: 1000,
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'workflow.javascript',
      nodeId: node.id,
    };
    const adapter = createWorkflowJavaScriptRunJSSourceAdapter(app.db);
    const adapterCtx = {
      can: () => ({}),
    };
    const legacy = await adapter.readLegacy({ locator, ctx: adapterCtx });

    await node.update({
      config: {
        arguments: [{ name: 'score', value: 2 }],
        content: 'return score + 1;',
        timeout: 3000,
      },
    });

    await app.db.sequelize.transaction(async (transaction) => {
      await adapter.writeRuntime({
        locator,
        artifact: {
          code: 'return score + 2;',
          version: 'workflow-js',
          diagnostics: [],
          filesHash: 'test-files-hash',
          entryPath: 'src/main.js',
        },
        commitId: 'vscc_test',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx: {
          ...adapterCtx,
          transaction,
        },
      });
    });

    await node.reload();
    expect(node.get('config')).toMatchObject({
      arguments: [{ name: 'score', value: 2 }],
      content: 'return score + 2;',
      timeout: 3000,
    });
  });

  it('rejects save when workflow JavaScript host code diverges from the versioned source', async () => {
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    const node = await workflow.createNode({
      title: 'Diverged host code',
      type: 'script',
      config: {
        content: 'return 1;',
        timeout: 1000,
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'workflow.javascript',
      nodeId: node.id,
    };
    const adapter = createWorkflowJavaScriptRunJSSourceAdapter(app.db);
    const adapterCtx = {
      can: () => ({}),
    };
    const legacy = await adapter.readLegacy({ locator, ctx: adapterCtx });

    await node.update({
      config: {
        content: 'return 99;',
        timeout: 1000,
      },
    });

    await expect(
      app.db.sequelize.transaction(async (transaction) => {
        await adapter.writeRuntime({
          locator,
          artifact: {
            code: 'return 2;',
            version: 'workflow-js',
            diagnostics: [],
            filesHash: 'test-files-hash',
            entryPath: 'src/main.js',
          },
          commitId: 'vscc_test',
          baseOwnerFingerprint: legacy.ownerFingerprint,
          ctx: {
            ...adapterCtx,
            transaction,
          },
        });
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      message: 'RunJS host code differs from the versioned source',
      status: 409,
    });

    await node.reload();
    expect(node.get('config')).toMatchObject({
      content: 'return 99;',
      timeout: 1000,
    });
  });

  it('denies saving a script node after the workflow version has executed', async () => {
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    await workflow.versionStats.update({ executed: 1 });
    const node = await workflow.createNode({
      title: 'Executed script',
      type: 'script',
      config: {
        arguments: [{ name: 'score', value: 1 }],
        content: 'return score + 1;',
        continue: true,
        timeout: 1000,
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'workflow.javascript',
      nodeId: node.id,
    };
    const adapter = createWorkflowJavaScriptRunJSSourceAdapter(app.db);
    const adapterCtx = {
      can: () => ({}),
    };
    const legacy = await adapter.readLegacy({
      locator,
      ctx: adapterCtx,
    });

    await expect(
      app.db.sequelize.transaction(async (transaction) => {
        await adapter.writeRuntime({
          locator,
          artifact: {
            code: 'return score + 2;',
            version: 'workflow-js',
            diagnostics: [],
            filesHash: 'test-files-hash',
            entryPath: 'src/main.js',
          },
          commitId: 'vscc_test',
          baseOwnerFingerprint: legacy.ownerFingerprint,
          ctx: {
            ...adapterCtx,
            transaction,
          },
        });
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_READONLY',
      status: 403,
    });

    await node.reload();
    expect(node.get('config')).toMatchObject({
      arguments: [{ name: 'score', value: 1 }],
      content: 'return score + 1;',
      continue: true,
      timeout: 1000,
    });
  });

  it('denies workflow JavaScript source access without node update permission', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'workflow-reader',
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'Workflow reader',
        roles: ['workflow-reader'],
      },
    });
    const restrictedAgent = (await app.agent().login(user)).set('x-role', 'workflow-reader');
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    const node = await workflow.createNode({
      title: 'Restricted script',
      type: 'script',
      config: {
        content: 'return 1;',
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'workflow.javascript',
      nodeId: node.id,
    };

    const open = await restrictedAgent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(open.status).toBe(403);
    expect(open.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flow_nodes',
        action: 'update',
      },
    });
  });

  it('denies workflow JavaScript source access outside the node update filter', async () => {
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    const allowedNode = await workflow.createNode({
      title: 'Allowed script',
      type: 'script',
      config: {
        content: 'return 1;',
      },
    });
    const blockedNode = await workflow.createNode({
      title: 'Blocked script',
      type: 'script',
      config: {
        content: 'return 2;',
      },
    });
    const adapter = createWorkflowJavaScriptRunJSSourceAdapter(app.db);
    const adapterCtx = {
      can: () => ({
        params: {
          filter: {
            id: allowedNode.id,
          },
          whitelist: ['config'],
        },
      }),
    };

    await expect(
      adapter.assertCanWrite({
        locator: {
          kind: 'workflow.javascript',
          nodeId: allowedNode.id,
        },
        ctx: adapterCtx,
      }),
    ).resolves.toBeUndefined();

    await expect(
      adapter.assertCanWrite({
        locator: {
          kind: 'workflow.javascript',
          nodeId: blockedNode.id,
        },
        ctx: adapterCtx,
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flow_nodes',
      },
    });
  });

  it('denies workflow JavaScript source access when node update cannot change config', async () => {
    const WorkflowModel = app.db.getCollection('workflows').model;
    const workflow = await WorkflowModel.create({
      enabled: false,
      type: 'asyncTrigger',
    });
    const node = await workflow.createNode({
      title: 'Title-only script',
      type: 'script',
      config: {
        content: 'return 1;',
      },
    });
    const adapter = createWorkflowJavaScriptRunJSSourceAdapter(app.db);

    await expect(
      adapter.assertCanRead({
        locator: {
          kind: 'workflow.javascript',
          nodeId: node.id,
        },
        ctx: {
          can: () => ({
            params: {
              whitelist: ['title'],
            },
          }),
        },
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flow_nodes',
        action: 'update',
        fields: ['config'],
      },
    });
  });
});
