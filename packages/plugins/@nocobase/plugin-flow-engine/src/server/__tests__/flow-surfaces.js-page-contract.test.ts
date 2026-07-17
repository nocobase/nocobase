/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  readErrorItem,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

const JS_PAGE_ERROR_CODE = 'FLOW_SURFACE_JS_PAGE_OPERATION_UNSUPPORTED';

async function createJSPage(context: FlowSurfacesContractContext, title: string) {
  const pageSchemaUid = uid();
  const pageUid = uid();
  const route = await context.routesRepo.create({
    values: {
      type: 'flowPage',
      title,
      schemaUid: pageSchemaUid,
      enableTabs: false,
      displayTitle: true,
      options: {
        pageType: 'js-page',
      },
    },
  });
  await context.flowRepo.upsertModel({
    uid: pageUid,
    parentId: pageSchemaUid,
    subKey: 'page',
    subType: 'object',
    use: 'JSPageModel',
    props: {
      routeId: route.get('id'),
      title,
      displayTitle: true,
    },
    stepParams: {
      pageSettings: {
        general: {
          title,
          documentTitle: `${title} document`,
          displayTitle: true,
        },
      },
    },
  });
  return {
    pageUid,
    pageSchemaUid,
    routeId: route.get('id'),
  };
}

async function createResidualJSPageTab(context: FlowSurfacesContractContext, pageRouteId: string | number) {
  const tabSchemaUid = uid();
  await context.routesRepo.create({
    values: {
      type: 'tabs',
      title: 'Legacy tab',
      schemaUid: tabSchemaUid,
      parentId: pageRouteId,
      hidden: true,
    },
  });
  return tabSchemaUid;
}

function expectJSPageUnsupported(response: any, action: string) {
  expect(response.status).toBe(400);
  expect(readErrorItem(response)).toMatchObject({
    code: JS_PAGE_ERROR_CODE,
    status: 400,
    details: {
      action,
      pageUse: 'JSPageModel',
    },
  });
}

describe('flowSurfaces JS page contract', () => {
  let context: FlowSurfacesContractContext;

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('locates JS pages without inventing tabs and exposes only page-level configuration', async () => {
    const page = await createJSPage(context, `JS page ${Date.now()}`);

    for (const locator of [
      { routeId: String(page.routeId) },
      { pageSchemaUid: page.pageSchemaUid },
      { uid: page.pageUid },
    ]) {
      const readback = getData(await context.rootAgent.resource('flowSurfaces').get(locator));
      expect(readback.target).toMatchObject({
        uid: page.pageUid,
        kind: 'page',
      });
      expect(readback.tree).toMatchObject({
        uid: page.pageUid,
        use: 'JSPageModel',
      });
      expect(readback.tree.subModels?.tabs).toBeUndefined();
      expect(readback.tree.subModels?.grid).toBeUndefined();
    }

    const catalog = getData(
      await context.rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: page.pageUid },
          sections: ['blocks', 'node'],
          expand: ['node.contracts'],
        },
      }),
    );
    expect(catalog.blocks || []).toEqual([]);
    expect(Object.keys(catalog.node.configureOptions)).toEqual(['title', 'documentTitle', 'displayTitle']);
    expect(catalog.node.editableDomains).toEqual(['props', 'stepParams']);

    const configureRes = await context.rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: page.pageUid },
        changes: {
          title: 'Updated JS page',
          documentTitle: 'Updated JS document',
          displayTitle: false,
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);
    const configured = getData(
      await context.rootAgent.resource('flowSurfaces').get({
        uid: page.pageUid,
      }),
    );
    expect(configured.tree).toMatchObject({
      use: 'JSPageModel',
      props: {
        title: 'Updated JS page',
        displayTitle: false,
      },
      stepParams: {
        pageSettings: {
          general: {
            title: 'Updated JS page',
            documentTitle: 'Updated JS document',
            displayTitle: false,
          },
        },
      },
    });

    const rejectedConfigure = await context.rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: page.pageUid },
        changes: {
          enableTabs: true,
        },
      },
    });
    expect(rejectedConfigure.status).toBe(400);
    expect(readErrorMessage(rejectedConfigure)).toContain('enableTabs');
  });

  it('keeps synthetic get and lazy-created get on JSPageModel without writing during read', async () => {
    const pageSchemaUid = uid();
    const pageUid = uid();
    const pageRoute = await context.routesRepo.create({
      values: {
        type: 'flowPage',
        title: 'Lazy JS page',
        schemaUid: pageSchemaUid,
        enableTabs: false,
        options: {
          pageType: 'js-page',
        },
      },
    });
    await context.routesRepo.create({
      values: {
        type: 'tabs',
        title: 'Hidden tab',
        schemaUid: uid(),
        parentId: pageRoute.get('id'),
        hidden: true,
      },
    });

    const synthetic = getData(
      await context.rootAgent.resource('flowSurfaces').get({
        pageSchemaUid,
      }),
    );
    expect(synthetic.tree.use).toBe('JSPageModel');
    expect(
      await context.flowRepo.findModelByParentId(pageSchemaUid, {
        subKey: 'page',
        includeAsyncNode: true,
      }),
    ).toBeNull();

    await context.flowRepo.upsertModel({
      uid: pageUid,
      parentId: pageSchemaUid,
      subKey: 'page',
      subType: 'object',
      use: 'JSPageModel',
      props: {
        routeId: pageRoute.get('id'),
      },
    });
    const persisted = getData(
      await context.rootAgent.resource('flowSurfaces').get({
        pageSchemaUid,
      }),
    );
    expect(persisted.tree.use).toBe(synthetic.tree.use);
  });

  it('rejects tab, block, compose and blueprint authoring with a stable JS page error', async () => {
    const page = await createJSPage(context, `Guarded JS page ${Date.now()}`);
    const residualTabUid = await createResidualJSPageTab(context, page.routeId);
    const ordinaryPage = await createPage(context.rootAgent, {
      title: `Ordinary page ${Date.now()}`,
      tabTitle: 'Overview',
    });

    expectJSPageUnsupported(
      await context.rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: { uid: page.pageUid },
          title: 'Not allowed',
        },
      }),
      'addTab',
    );
    expectJSPageUnsupported(
      await context.rootAgent.resource('flowSurfaces').moveTab({
        values: {
          sourceUid: residualTabUid,
          targetUid: ordinaryPage.tabSchemaUid,
          position: 'after',
        },
      }),
      'moveTab',
    );
    expectJSPageUnsupported(
      await context.rootAgent.resource('flowSurfaces').removeTab({
        values: {
          uid: residualTabUid,
        },
      }),
      'removeTab',
    );
    expectJSPageUnsupported(
      await context.rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.pageUid },
          type: 'markdown',
          settings: { content: 'Not allowed' },
        },
      }),
      'addBlock',
    );

    const addBlocks = getData(
      await context.rootAgent.resource('flowSurfaces').addBlocks({
        values: {
          target: { uid: page.pageUid },
          blocks: [{ type: 'markdown', settings: { content: 'Not allowed' } }],
        },
      }),
    );
    expect(addBlocks).toMatchObject({
      successCount: 0,
      errorCount: 1,
      blocks: [
        {
          ok: false,
          error: {
            code: JS_PAGE_ERROR_CODE,
            details: {
              action: 'addBlock',
              pageUse: 'JSPageModel',
            },
          },
        },
      ],
    });

    expectJSPageUnsupported(
      await context.rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.pageUid },
          mode: 'append',
          blocks: [{ key: 'markdown', type: 'markdown', settings: { content: 'Not allowed' } }],
        },
      }),
      'compose',
    );
    expectJSPageUnsupported(
      await context.rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'replace',
          target: { pageSchemaUid: page.pageSchemaUid },
          page: { title: 'Not allowed' },
          tabs: [{ key: 'overview', title: 'Overview', blocks: [] }],
        },
      }),
      'applyBlueprint',
    );
    expectJSPageUnsupported(
      await context.rootAgent.resource('flowSurfaces').exportBlueprint({
        values: {
          target: { pageSchemaUid: page.pageSchemaUid },
        },
      }),
      'exportBlueprint',
    );

    const removeNode = await context.rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: { uid: page.pageUid },
      },
    });
    expect(removeNode.status).toBe(400);
    expect(readErrorMessage(removeNode)).toContain('destroyPage');
  });

  it('destroys a JS page and runs the reference cleanup hook', async () => {
    const page = await createJSPage(context, `Disposable JS page ${Date.now()}`);
    const calls: Array<{ rootUid: string; action?: string }> = [];
    const pluginManager = context.app.pm as typeof context.app.pm & {
      get: (name: string) => unknown;
    };
    const originalGet = pluginManager.get.bind(pluginManager);
    pluginManager.get = (name: string) =>
      ['@nocobase/plugin-light-extension', 'light-extension', 'plugin-light-extension'].includes(name)
        ? {
            markFlowModelReferencesOwnerMissingForNodeTree: async (input: { rootUid: string; action?: string }) => {
              calls.push(input);
            },
          }
        : originalGet(name);

    try {
      const destroyRes = await context.rootAgent.resource('flowSurfaces').destroyPage({
        values: {
          uid: page.pageUid,
        },
      });
      expect(destroyRes.status, readErrorMessage(destroyRes)).toBe(200);
    } finally {
      pluginManager.get = originalGet;
    }

    expect(calls).toContainEqual({
      rootUid: page.pageUid,
      action: 'flowSurfaces.removeNode',
    });
    expect(
      await context.routesRepo.findOne({
        filter: { schemaUid: page.pageSchemaUid },
      }),
    ).toBeNull();
    expect(
      await context.flowRepo.findModelByParentId(page.pageSchemaUid, {
        subKey: 'page',
        includeAsyncNode: true,
      }),
    ).toBeNull();
  });
});
