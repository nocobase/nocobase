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

  it('creates an inline JS Page without workspace metadata when JS Template is disabled', async () => {
    expect(context.app.resourceManager.isDefined('runJSSources')).toBe(false);

    const created = await createJSPage(context, 'Created JS Page');
    expect(created).toMatchObject({
      pageType: 'js-page',
      modelUse: 'JSPageModel',
      capabilities: {
        tabs: false,
        blocks: false,
        compose: false,
        blueprint: false,
        export: false,
        runJSWorkspace: false,
      },
      idempotentReplay: false,
    });
    expect(created.runJSLocator).toBeUndefined();
    expect(created.workspaceStatus).toBeUndefined();
    expect(created.workspaceRetryable).toBeUndefined();
    expect(created.workspaceError).toBeUndefined();

    const readback = await getSurface(context.rootAgent, { uid: created.pageUid });
    expect(readback.tree).toMatchObject({
      uid: created.pageUid,
      use: 'JSPageModel',
    });
    expect(readback.tree.runJSLocator).toBeUndefined();
    expect(readback.tree.workspaceStatus).toBeUndefined();
    expect(readback.tree.workspaceRetryable).toBeUndefined();
    expect(readback.tree.workspaceError).toBeUndefined();
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
