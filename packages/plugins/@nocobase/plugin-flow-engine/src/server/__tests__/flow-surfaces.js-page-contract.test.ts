/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createFlowSurfacesContractContext,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

const JS_PAGE_SOURCE_BINDING = {
  type: 'js-template-entry',
  projectId: 'jtp_dashboards',
  templateId: 'jtt_sales_dashboard',
  kind: 'js-page',
};

describe('flowSurfaces JS Page public contract', () => {
  let context: FlowSurfacesContractContext;

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('creates a JS Page RunJS binding through the public create API', async () => {
    const created = await createJSPage(context, 'Created JS Page');
    expect(created).toMatchObject({
      pageType: 'js-page',
      modelUse: 'JSPageModel',
      runJSLocator: {
        kind: 'flowModel.step',
        modelUid: created.pageUid,
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
        versionPath: ['version'],
      },
      capabilities: {
        tabs: false,
        blocks: false,
        compose: false,
        blueprint: false,
        export: false,
        runJSWorkspace: true,
      },
      workspaceStatus: 'ready',
      workspaceRetryable: false,
      idempotentReplay: false,
    });
    const readback = await getSurface(context.rootAgent, { uid: created.pageUid });
    expect(readback.tree).toMatchObject({
      uid: created.pageUid,
      use: 'JSPageModel',
      runJSLocator: created.runJSLocator,
    });
    expect(readback.tree.subModels?.tabs).toBeUndefined();
    expect(readback.tree.subModels?.grid).toBeUndefined();
  }, 120000);

  it('reads and updates JS Page configuration through public resources', async () => {
    const created = await createJSPage(context, 'Configurable JS Page');
    const configureResponse = await context.rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: created.pageUid },
        changes: {
          title: 'Updated JS page',
          documentTitle: 'Updated JS document',
          displayTitle: false,
          sourceMode: 'js-template',
          sourceBinding: JS_PAGE_SOURCE_BINDING,
          settings: { enabled: false, threshold: 0, label: '' },
        },
      },
    });
    expect(configureResponse.status, readErrorMessage(configureResponse)).toBe(200);

    const configured = await getSurface(context.rootAgent, { uid: created.pageUid });
    expect(configured.tree).toMatchObject({
      use: 'JSPageModel',
      props: { title: 'Updated JS page', displayTitle: false },
      stepParams: {
        pageSettings: {
          general: {
            title: 'Updated JS page',
            documentTitle: 'Updated JS document',
            displayTitle: false,
          },
        },
        jsSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: JS_PAGE_SOURCE_BINDING,
            settings: { enabled: false, threshold: 0, label: '' },
          },
        },
      },
    });
  }, 120000);

  it('deletes a JS Page and cleans its route and JS Template owner references', async () => {
    const created = await createJSPage(context, 'Disposable JS Page');
    const calls: Array<{ rootUid: string; action?: string }> = [];
    const pluginManager = context.app.pm as typeof context.app.pm & {
      get: (name: string) => unknown;
    };
    const originalGet = pluginManager.get.bind(pluginManager);
    pluginManager.get = (name: string) =>
      ['@nocobase/plugin-js-template', 'js-template', 'plugin-js-template'].includes(name)
        ? {
            markJsTemplateUsagesOwnerMissingForNodeTree: async (input: { rootUid: string; action?: string }) => {
              calls.push(input);
            },
          }
        : originalGet(name);

    try {
      const destroyResponse = await context.rootAgent.resource('flowSurfaces').destroyPage({
        values: { uid: created.pageUid },
      });
      expect(destroyResponse.status, readErrorMessage(destroyResponse)).toBe(200);
    } finally {
      pluginManager.get = originalGet;
    }

    expect(calls).toContainEqual({
      rootUid: created.pageUid,
      action: 'flowSurfaces.removeNode',
    });
    expect(await context.routesRepo.findOne({ filter: { schemaUid: created.pageSchemaUid } })).toBeNull();
    expect(
      await context.flowRepo.findModelByParentId(created.pageSchemaUid, {
        subKey: 'page',
        includeAsyncNode: true,
      }),
    ).toBeNull();
  }, 120000);
});

async function createJSPage(context: FlowSurfacesContractContext, title: string) {
  const response = await context.rootAgent.resource('flowSurfaces').createPage({
    values: {
      pageType: 'js-page',
      idempotencyKey: `${title.toLowerCase().replaceAll(' ', '-')}-${Date.now()}`,
      title,
      icon: 'CodeOutlined',
      documentTitle: `${title} document`,
    },
  });
  expect(response.status, readErrorMessage(response)).toBe(200);
  return getData(response);
}
