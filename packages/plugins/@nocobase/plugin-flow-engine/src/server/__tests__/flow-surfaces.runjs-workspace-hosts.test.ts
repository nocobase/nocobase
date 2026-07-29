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
  FLOW_SURFACE_RUNJS_HOSTS,
  registerFlowSurfaceRunJSWorkspaceBootstrapPort,
  type FlowSurfaceRunJSModelUse,
} from '../flow-surfaces/page-surface-contract';
import {
  addBlockData,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getComposeBlock,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

type RunJSLocator = {
  kind: 'flowModel.step';
  modelUid: string;
  flowKey: 'jsSettings' | 'clickSettings';
  stepKey: 'runJs';
  paramPath: ['code'];
  versionPath: ['version'];
};

type WorkspaceHost = {
  modelUse: FlowSurfaceRunJSModelUse;
  locator: RunJSLocator;
};

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object');
  }
  return value as Record<string, unknown>;
}

function expectWorkspaceResult(value: unknown, modelUse: FlowSurfaceRunJSModelUse): WorkspaceHost {
  const result = readRecord(value);
  const locator = readRecord(result.runJSLocator) as RunJSLocator;
  const expected = FLOW_SURFACE_RUNJS_HOSTS[modelUse];
  expect(result).toMatchObject({
    runJSLocator: {
      kind: 'flowModel.step',
      flowKey: expected.flowKey,
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
    },
  });
  if (result.workspaceStatus === 'error') {
    expect(result).toMatchObject({
      workspaceRetryable: false,
      workspaceError: { code: 'RUNJS_COMPILE_FAILED' },
    });
  } else {
    expect(result).toMatchObject({ workspaceStatus: 'ready', workspaceRetryable: false });
  }
  expect(locator.modelUid).toEqual(expect.any(String));
  return { modelUse, locator };
}

describe('flowSurfaces complete RunJS workspace hosts', () => {
  let context: FlowSurfacesContractContext;
  let actionPanelUid: string;
  let standardTabUid: string;
  let tableUid: string;
  const hosts: WorkspaceHost[] = [];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('returns canonical workspace metadata from every public JS host create path and readback', async () => {
    const standardPage = await createPage(context.rootAgent, {
      title: `RunJS host matrix ${Date.now()}`,
      tabTitle: 'Main',
    });
    standardTabUid = standardPage.tabSchemaUid;
    const table = await addBlockData(context.rootAgent, {
      target: { uid: standardPage.tabSchemaUid },
      type: 'table',
      resourceInit: { dataSourceKey: 'main', collectionName: 'users' },
    });
    tableUid = table.uid;
    const createForm = await addBlockData(context.rootAgent, {
      target: { uid: standardPage.tabSchemaUid },
      type: 'createForm',
      resourceInit: { dataSourceKey: 'main', collectionName: 'users' },
    });
    const filterForm = await addBlockData(context.rootAgent, {
      target: { uid: standardPage.tabSchemaUid },
      type: 'filterForm',
      resourceInit: { dataSourceKey: 'main', collectionName: '' },
      fields: [{ fieldPath: 'nickname', defaultTargetUid: table.uid }],
    });
    const actionPanel = await addBlockData(context.rootAgent, {
      target: { uid: standardPage.tabSchemaUid },
      type: 'actionPanel',
    });
    actionPanelUid = actionPanel.uid;

    const jsPage = getData(
      await context.rootAgent.resource('flowSurfaces').createPage({
        values: {
          pageType: 'js-page',
          idempotencyKey: `runjs-host-page-${Date.now()}`,
          title: 'RunJS host page',
          icon: 'CodeOutlined',
        },
      }),
    );
    hosts.push(expectWorkspaceResult(jsPage, 'JSPageModel'));

    const jsBlock = getData(
      await context.rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: standardPage.tabSchemaUid },
          type: 'jsBlock',
          settings: { title: 'RunJS host block', code: 'ctx.render(null);' },
        },
      }),
    );
    hosts.push(expectWorkspaceResult(jsBlock, 'JSBlockModel'));

    const fieldCreates: Array<{ modelUse: FlowSurfaceRunJSModelUse; values: Record<string, unknown> }> = [
      {
        modelUse: 'JSFieldModel',
        values: { target: { uid: table.uid }, fieldPath: 'nickname', renderer: 'js' },
      },
      {
        modelUse: 'JSEditableFieldModel',
        values: { target: { uid: createForm.uid }, fieldPath: 'nickname', renderer: 'js' },
      },
      {
        modelUse: 'JSColumnModel',
        values: { target: { uid: table.uid }, type: 'jsColumn' },
      },
      {
        modelUse: 'JSItemModel',
        values: { target: { uid: createForm.uid }, type: 'jsItem' },
      },
    ];
    for (const input of fieldCreates) {
      const result = getData(await context.rootAgent.resource('flowSurfaces').addField({ values: input.values }));
      hosts.push(expectWorkspaceResult(result, input.modelUse));
    }

    const actionCreates: Array<{ modelUse: FlowSurfaceRunJSModelUse; values: Record<string, unknown> }> = [
      { modelUse: 'JSCollectionActionModel', values: { target: { uid: table.uid }, type: 'js' } },
      { modelUse: 'JSItemActionModel', values: { target: { uid: table.uid }, type: 'jsItem' } },
      { modelUse: 'JSFormActionModel', values: { target: { uid: createForm.uid }, type: 'js' } },
      { modelUse: 'FilterFormJSActionModel', values: { target: { uid: filterForm.uid }, type: 'js' } },
      { modelUse: 'JSActionModel', values: { target: { uid: actionPanel.uid }, type: 'js' } },
    ];
    for (const input of actionCreates) {
      const result = getData(await context.rootAgent.resource('flowSurfaces').addAction({ values: input.values }));
      hosts.push(expectWorkspaceResult(result, input.modelUse));
    }

    const recordAction = getData(
      await context.rootAgent.resource('flowSurfaces').addRecordAction({
        values: { target: { uid: table.uid }, type: 'js' },
      }),
    );
    hosts.push(expectWorkspaceResult(recordAction, 'JSRecordActionModel'));

    const formItemUid = uid();
    await context.flowRepo.upsertModel({
      uid: formItemUid,
      use: 'FormJSFieldItemModel',
      stepParams: {},
    });
    hosts.push({
      modelUse: 'FormJSFieldItemModel',
      locator: {
        kind: 'flowModel.step',
        modelUid: formItemUid,
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
        versionPath: ['version'],
      },
    });

    expect(hosts.map((host) => host.modelUse).sort()).toEqual(Object.keys(FLOW_SURFACE_RUNJS_HOSTS).sort());
    for (const host of hosts) {
      const readback = await getSurface(context.rootAgent, { uid: host.locator.modelUid });
      expect(readback.tree).toMatchObject({
        uid: host.locator.modelUid,
        use: host.modelUse,
        runJSLocator: host.locator,
        workspaceStatus: 'ready',
        workspaceRetryable: false,
      });
      expect(readback.nodeMap[host.locator.modelUid]).toMatchObject({ runJSLocator: host.locator });
    }

    const markdown = getData(
      await context.rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: standardPage.tabSchemaUid },
          type: 'markdown',
          settings: { content: 'No RunJS workspace' },
        },
      }),
    );
    const markdownReadback = await getSurface(context.rootAgent, { uid: markdown.uid });
    expect(markdownReadback.tree.runJSLocator).toBeUndefined();
    expect(markdownReadback.tree.workspaceStatus).toBeUndefined();
  }, 120000);

  it('materializes and reopens a multi-file workspace for every complete JS host', async () => {
    expect(hosts).toHaveLength(Object.keys(FLOW_SURFACE_RUNJS_HOSTS).length);

    for (const host of hosts) {
      const openedResponse = await context.rootAgent.resource('runJSSources').open({
        values: { locator: host.locator },
      });
      expect(openedResponse.status, `${host.modelUse}: ${readErrorMessage(openedResponse)}`).toBe(200);
      const opened = readRecord(openedResponse.body.data);
      const repository = readRecord(opened.repository);
      const openedFiles = opened.files as Array<Record<string, unknown>>;
      const expectedBlobHash = (path: string) => {
        const file = openedFiles.find((item) => item.path === path);
        return typeof file?.blobHash === 'string' && file.blobHash ? file.blobHash : null;
      };
      const surfaceStyle = host.locator.flowKey === 'clickSettings' ? 'action' : 'render';
      const entryCode =
        surfaceStyle === 'action'
          ? `import { workspaceLabel } from './workspace-label';\nctx.message.info(workspaceLabel);`
          : `import { workspaceLabel } from './workspace-label';\nctx.render(workspaceLabel);`;
      const descriptor = {
        schemaVersion: 1,
        key: `workspace-${host.modelUse.toLowerCase()}`,
        settingsSchema: {
          type: 'object',
          properties: {
            label: { type: 'string', default: host.modelUse, 'x-component': 'Input' },
          },
        },
      };
      const saveResponse = await context.rootAgent.resource('runJSSources').saveChanges({
        values: {
          locator: host.locator,
          repoId: repository.repoId,
          baseCommitId: repository.headCommitId,
          baseOwnerFingerprint: opened.ownerFingerprint,
          message: `Materialize ${host.modelUse} workspace`,
          entryPath: 'src/client/index.tsx',
          changes: [
            {
              path: 'src/client/index.tsx',
              operation: 'upsert',
              expectedBlobHash: expectedBlobHash('src/client/index.tsx'),
              content: entryCode,
              language: 'tsx',
            },
            {
              path: 'src/client/workspace-label.ts',
              operation: 'upsert',
              expectedBlobHash: expectedBlobHash('src/client/workspace-label.ts'),
              content: `export const workspaceLabel = '${host.modelUse}';`,
              language: 'typescript',
            },
            {
              path: 'src/client/entry.json',
              operation: 'upsert',
              expectedBlobHash: expectedBlobHash('src/client/entry.json'),
              content: `${JSON.stringify(descriptor, null, 2)}\n`,
              language: 'json',
            },
          ],
        },
      });
      expect(saveResponse.status, `${host.modelUse}: ${readErrorMessage(saveResponse)}`).toBe(200);

      const reopenedResponse = await context.rootAgent.resource('runJSSources').openLatest({
        values: { locator: host.locator },
      });
      expect(reopenedResponse.status, `${host.modelUse}: ${readErrorMessage(reopenedResponse)}`).toBe(200);
      const reopened = readRecord(reopenedResponse.body.data);
      const files = reopened.files as Array<Record<string, unknown>>;
      expect(files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'src/client/index.tsx', content: entryCode }),
          expect.objectContaining({
            path: 'src/client/workspace-label.ts',
            content: `export const workspaceLabel = '${host.modelUse}';`,
          }),
        ]),
      );
      expect(reopened.settingsDescriptor).toMatchObject({
        key: descriptor.key,
        schema: descriptor.settingsSchema,
        defaults: { label: host.modelUse },
        diagnostics: [],
      });

      const model = await context.flowRepo.findModelById(host.locator.modelUid, { includeAsyncNode: true });
      expect(model.stepParams?.[host.locator.flowKey]?.runJs).toMatchObject({
        code: expect.stringContaining(host.modelUse),
        sourceRef: {
          type: 'vsc-file',
          repoId: repository.repoId,
          entry: 'src/client/index.tsx',
        },
      });
      expect(model.settings?.code).toBeUndefined();
    }
  }, 120000);

  it('preserves workspace metadata through batch, compose, and applyBlueprint results', async () => {
    const batchFields = getData(
      await context.rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: { uid: tableUid },
          fields: [{ type: 'jsColumn' }],
        },
      }),
    );
    expectWorkspaceResult(batchFields.fields[0].result, 'JSColumnModel');

    const batchActions = getData(
      await context.rootAgent.resource('flowSurfaces').addActions({
        values: {
          target: { uid: actionPanelUid },
          actions: [{ type: 'js' }],
        },
      }),
    );
    expectWorkspaceResult(batchActions.actions[0].result, 'JSActionModel');

    const batchRecordActions = getData(
      await context.rootAgent.resource('flowSurfaces').addRecordActions({
        values: {
          target: { uid: tableUid },
          recordActions: [{ type: 'js' }],
        },
      }),
    );
    expectWorkspaceResult(batchRecordActions.recordActions[0].result, 'JSRecordActionModel');

    const composed = getData(
      await context.rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: standardTabUid },
          blocks: [
            {
              key: 'workspacePanel',
              type: 'actionPanel',
              actions: [{ key: 'workspaceAction', type: 'js' }],
            },
          ],
        },
      }),
    );
    const composedPanel = getComposeBlock(composed, 'workspacePanel');
    expectWorkspaceResult(composedPanel.actions[0], 'JSActionModel');

    const bootstrap = vi.fn(async () => ({ status: 'ready' as const, retryable: false }));
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, bootstrap);
    try {
      const applied = getData(
        await context.rootAgent.resource('flowSurfaces').applyBlueprint({
          values: {
            mode: 'create',
            page: { title: `RunJS apply matrix ${Date.now()}` },
            tabs: [
              {
                title: 'Main',
                blocks: [
                  {
                    type: 'actionPanel',
                    actions: [{ type: 'js' }],
                  },
                ],
              },
            ],
          },
        }),
      );
      const appliedAction = Object.values(applied.surface.nodeMap).find(
        (node) => readRecord(node).use === 'JSActionModel',
      );
      expect(readRecord(appliedAction)).toMatchObject({
        runJSLocator: { flowKey: 'clickSettings' },
        workspaceStatus: 'ready',
      });
      expect(bootstrap).toHaveBeenCalledWith(
        expect.objectContaining({
          modelUse: 'JSActionModel',
          hostKind: 'js-action',
          authoringContext: expect.objectContaining({
            userId: expect.any(String),
            can: expect.any(Function),
          }),
        }),
      );
    } finally {
      unregister();
    }
  }, 120000);

  it('reports provider unavailability on readback without adding workspace metadata to non-JS nodes', async () => {
    const unregister = registerFlowSurfaceRunJSWorkspaceBootstrapPort(context.app, async () => ({
      status: 'ready',
      retryable: false,
    }));
    unregister();

    const readback = await getSurface(context.rootAgent, { uid: hosts[0].locator.modelUid });
    expect(readback.tree).toMatchObject({
      workspaceStatus: 'pending',
      workspaceRetryable: true,
      workspaceError: {
        code: 'FLOW_SURFACE_RUNJS_BOOTSTRAP_PROVIDER_UNAVAILABLE',
      },
    });
  });
});
