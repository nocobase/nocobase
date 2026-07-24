/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  registerFlowSurfaceRunJSWorkspaceBootstrapPort,
  type FlowSurfaceRunJSWorkspaceBootstrapResult,
} from '../flow-surfaces/page-surface-contract';
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

  it.each<{
    label: string;
    bootstrapResult: FlowSurfaceRunJSWorkspaceBootstrapResult;
  }>([
    {
      label: 'ready',
      bootstrapResult: { status: 'ready', retryable: false },
    },
    {
      label: 'pending',
      bootstrapResult: { status: 'pending', retryable: true },
    },
    {
      label: 'error',
      bootstrapResult: {
        status: 'error',
        retryable: true,
        error: { code: 'WORKSPACE_BOOTSTRAP_FAILED', message: 'Workspace bootstrap failed' },
      },
    },
  ])('creates a JS Page host with one $label workspace bootstrap call', async ({ label, bootstrapResult }) => {
    const bootstrap = vi.fn(async () => bootstrapResult);
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, bootstrap);
    const title = `Created JS page ${label} ${Date.now()}`;

    try {
      const response = await context.rootAgent.resource('flowSurfaces').createPage({
        values: {
          pageType: 'js-page',
          idempotencyKey: `create-js-page-${label}-${Date.now()}`,
          title,
          icon: 'CodeOutlined',
          documentTitle: `${title} document`,
        },
      });
      expect(response.status, readErrorMessage(response)).toBe(200);
      const created = getData(response);
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
        workspaceStatus: bootstrapResult.status,
        workspaceRetryable: bootstrapResult.retryable,
        idempotentReplay: false,
      });
      if (bootstrapResult.error) {
        expect(created.workspaceError).toEqual(bootstrapResult.error);
      } else {
        expect(created.workspaceError).toBeUndefined();
      }

      expect(bootstrap).toHaveBeenCalledTimes(1);
      expect(bootstrap).toHaveBeenCalledWith(
        expect.objectContaining({
          hostKind: 'js-page',
          locator: created.runJSLocator,
          transaction: expect.anything(),
          authoringContext: expect.objectContaining({
            userId: expect.any(String),
            request: expect.anything(),
            state: expect.anything(),
            currentUser: expect.anything(),
            can: expect.any(Function),
          }),
        }),
      );

      const route = await context.routesRepo.findOne({
        filterByTk: String(created.routeId),
        appends: ['children'],
      });
      expect(route.get('options')).toMatchObject({ pageType: 'js-page' });
      expect(route.get('enableTabs')).toBe(false);
      expect(route.get('children') || []).toHaveLength(0);
      const pageModel = await context.flowRepo.findModelByParentId(created.pageSchemaUid, {
        subKey: 'page',
        includeAsyncNode: true,
      });
      expect(pageModel).toMatchObject({ uid: created.pageUid, use: 'JSPageModel' });
      expect(pageModel.subModels?.tabs).toBeUndefined();
      expect(pageModel.subModels?.grid).toBeUndefined();
    } finally {
      unregister();
    }
  });

  it('replays a scoped idempotent JS Page create and rejects an inconsistent request', async () => {
    const bootstrap = vi.fn(async () => ({ status: 'ready' as const, retryable: false }));
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, bootstrap);
    const idempotencyKey = `js-page-replay-${Date.now()}`;
    const values = {
      pageType: 'js-page',
      idempotencyKey,
      title: `Idempotent JS page ${Date.now()}`,
      icon: 'CodeOutlined',
    };

    try {
      const first = getData(await context.rootAgent.resource('flowSurfaces').createPage({ values }));
      const replay = getData(await context.rootAgent.resource('flowSurfaces').createPage({ values }));
      expect(replay).toMatchObject({
        routeId: first.routeId,
        pageSchemaUid: first.pageSchemaUid,
        pageUid: first.pageUid,
        idempotentReplay: true,
        workspaceStatus: 'ready',
      });
      expect(bootstrap).toHaveBeenCalledTimes(1);

      const conflict = await context.rootAgent.resource('flowSurfaces').createPage({
        values: {
          ...values,
          title: `${values.title} changed`,
        },
      });
      expect(conflict.status).toBe(409);
      expect(readErrorItem(conflict)).toMatchObject({
        code: 'FLOW_SURFACE_IDEMPOTENCY_CONFLICT',
        status: 409,
      });

      const parentA = getData(
        await context.rootAgent.resource('flowSurfaces').createMenu({
          values: { type: 'group', title: `JS scope A ${Date.now()}`, icon: 'FolderOutlined' },
        }),
      );
      const parentB = getData(
        await context.rootAgent.resource('flowSurfaces').createMenu({
          values: { type: 'group', title: `JS scope B ${Date.now()}`, icon: 'FolderOutlined' },
        }),
      );
      const scopedKey = `shared-js-page-key-${Date.now()}`;
      const scopedA = getData(
        await context.rootAgent.resource('flowSurfaces').createPage({
          values: {
            pageType: 'js-page',
            idempotencyKey: scopedKey,
            parentMenuRouteId: parentA.routeId,
            title: 'Scoped JS page A',
            icon: 'CodeOutlined',
          },
        }),
      );
      const scopedB = getData(
        await context.rootAgent.resource('flowSurfaces').createPage({
          values: {
            pageType: 'js-page',
            idempotencyKey: scopedKey,
            parentMenuRouteId: parentB.routeId,
            title: 'Scoped JS page B',
            icon: 'CodeOutlined',
          },
        }),
      );
      expect(scopedB.pageUid).not.toBe(scopedA.pageUid);
    } finally {
      unregister();
    }
  });

  it('serializes concurrent JS Page creates with the same scoped idempotency key', async () => {
    const bootstrap = vi.fn(async () => ({ status: 'ready' as const, retryable: false }));
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, bootstrap);
    const values = {
      pageType: 'js-page',
      idempotencyKey: `js-page-concurrent-${Date.now()}`,
      title: `Concurrent JS page ${Date.now()}`,
      icon: 'CodeOutlined',
    };

    try {
      const responses = await Promise.all([
        context.rootAgent.resource('flowSurfaces').createPage({ values }),
        context.rootAgent.resource('flowSurfaces').createPage({ values }),
      ]);
      responses.forEach((response) => expect(response.status, readErrorMessage(response)).toBe(200));
      const [first, second] = responses.map(getData);
      expect(second).toMatchObject({
        routeId: first.routeId,
        pageSchemaUid: first.pageSchemaUid,
        pageUid: first.pageUid,
      });
      expect([first.idempotentReplay, second.idempotentReplay].sort()).toEqual([false, true]);
      expect(bootstrap).toHaveBeenCalledTimes(1);
    } finally {
      unregister();
    }
  });

  it('clears an old workspace error after an idempotent retry becomes ready', async () => {
    const bootstrap = vi
      .fn()
      .mockResolvedValueOnce({
        status: 'error' as const,
        retryable: true,
        error: { code: 'WORKSPACE_BOOTSTRAP_FAILED', message: 'First attempt failed' },
      })
      .mockResolvedValueOnce({ status: 'ready' as const, retryable: false });
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, bootstrap);
    const values = {
      pageType: 'js-page',
      idempotencyKey: `js-page-error-retry-${Date.now()}`,
      title: `Retried JS page ${Date.now()}`,
      icon: 'CodeOutlined',
    };

    try {
      const first = getData(await context.rootAgent.resource('flowSurfaces').createPage({ values }));
      expect(first).toMatchObject({
        workspaceStatus: 'error',
        workspaceError: { code: 'WORKSPACE_BOOTSTRAP_FAILED' },
      });

      const replay = getData(await context.rootAgent.resource('flowSurfaces').createPage({ values }));
      expect(replay).toMatchObject({ workspaceStatus: 'ready', workspaceRetryable: false, idempotentReplay: true });
      expect(replay.workspaceError).toBeUndefined();
      expect(bootstrap).toHaveBeenCalledTimes(2);
    } finally {
      unregister();
    }
  });

  it('rolls back a JS Page host and idempotency reservation when bootstrap throws', async () => {
    const idempotencyKey = `js-page-rollback-${Date.now()}`;
    const title = `Rolled back JS page ${Date.now()}`;
    const values = {
      pageType: 'js-page',
      idempotencyKey,
      title,
      icon: 'CodeOutlined',
    };
    const unregisterFailing = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, async () => {
      throw new Error('bootstrap exploded');
    });
    const failed = await context.rootAgent.resource('flowSurfaces').createPage({ values });
    unregisterFailing();

    expect(failed.status).toBe(500);
    expect(
      await context.db.getRepository('flowSurfaceIdempotencyKeys').findOne({ filter: { idempotencyKey } }),
    ).toBeNull();
    expect(await context.routesRepo.findOne({ filter: { title } })).toBeNull();

    const unregisterReady = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, async () => ({
      status: 'ready',
      retryable: false,
    }));
    try {
      const retried = getData(await context.rootAgent.resource('flowSurfaces').createPage({ values }));
      expect(retried).toMatchObject({ workspaceStatus: 'ready', idempotentReplay: false });
    } finally {
      unregisterReady();
    }
  });

  it('bootstraps only a newly created JS Block and maps its workspace result', async () => {
    const bootstrap = vi.fn(async () => ({ status: 'pending' as const, retryable: true }));
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, bootstrap);
    try {
      const page = await createPage(context.rootAgent, {
        title: `JS Block bootstrap page ${Date.now()}`,
        tabTitle: 'Main',
      });
      const block = getData(
        await context.rootAgent.resource('flowSurfaces').addBlock({
          values: {
            target: { uid: page.tabSchemaUid },
            type: 'jsBlock',
            settings: {
              title: 'Bootstrapped JS Block',
              code: 'ctx.render(null);',
            },
          },
        }),
      );
      expect(block).toMatchObject({
        runJSLocator: {
          kind: 'flowModel.step',
          modelUid: block.uid,
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
          versionPath: ['version'],
        },
        workspaceStatus: 'pending',
        workspaceRetryable: true,
      });
      expect(bootstrap).toHaveBeenCalledTimes(1);
      expect(bootstrap).toHaveBeenCalledWith(
        expect.objectContaining({
          hostKind: 'js-block',
          locator: block.runJSLocator,
          transaction: expect.anything(),
        }),
      );

      await context.rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.tabSchemaUid },
          type: 'markdown',
          settings: { content: 'No workspace bootstrap' },
        },
      });
      expect(bootstrap).toHaveBeenCalledTimes(1);
    } finally {
      unregister();
    }
  });

  it('bootstraps a JS Block copied from a block template exactly once', async () => {
    const bootstrap = vi.fn(async () => ({ status: 'ready' as const, retryable: false }));
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, bootstrap);
    try {
      const page = await createPage(context.rootAgent, {
        title: `JS Block template page ${Date.now()}`,
        tabTitle: 'Main',
      });
      const source = getData(
        await context.rootAgent.resource('flowSurfaces').addBlock({
          values: {
            target: { uid: page.tabSchemaUid },
            type: 'jsBlock',
            settings: { title: 'Template source JS Block', code: 'ctx.render(null);' },
          },
        }),
      );
      const template = getData(
        await context.rootAgent.resource('flowSurfaces').saveTemplate({
          values: {
            target: { uid: source.uid },
            name: `Reusable JS Block ${Date.now()}`,
            description: 'Reusable JavaScript block for workspace bootstrap coverage',
            saveMode: 'duplicate',
          },
        }),
      );
      bootstrap.mockClear();

      const copied = getData(
        await context.rootAgent.resource('flowSurfaces').addBlock({
          values: {
            target: { uid: page.tabSchemaUid },
            template: { uid: template.uid, mode: 'copy' },
          },
        }),
      );
      expect(copied).toMatchObject({
        runJSLocator: { kind: 'flowModel.step', modelUid: copied.uid },
        workspaceStatus: 'ready',
      });
      expect(bootstrap).toHaveBeenCalledTimes(1);
    } finally {
      unregister();
    }
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
