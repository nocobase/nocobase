/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getNodeContract } from '../flow-surfaces/catalog';
import { getConfigureOptionsForUse } from '../flow-surfaces/configure-options';
import { FlowSurfacesService } from '../flow-surfaces/service';
import {
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

const LIGHT_EXTENSION_SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_kpi_cards',
  kind: 'js-block',
};

const LIGHT_EXTENSION_ACTION_SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_refresh_sales_kpi',
  kind: 'js-action',
};

type ConfigureJSBlockForTest = {
  configureJSBlock(
    target: { uid: string },
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
};

describe('flowSurfaces JS block light-extension contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    rootAgent = context.rootAgent;
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should expose JS block source binding options without changing other runJs contracts', async () => {
    const options = getConfigureOptionsForUse('JSBlockModel');
    const jsBlockPaths = getNodeContract('JSBlockModel').domains.stepParams?.groups?.jsSettings?.allowedPaths || [];
    const jsActionPaths =
      getNodeContract('JSActionModel').domains.stepParams?.groups?.clickSettings?.allowedPaths || [];

    expect(options).toEqual(
      expect.objectContaining({
        sourceMode: expect.objectContaining({
          type: 'string',
          enum: ['inline', 'light-extension'],
        }),
        sourceBinding: expect.objectContaining({
          type: 'object',
        }),
        settings: expect.objectContaining({
          type: 'object',
        }),
        sourceRef: expect.objectContaining({
          type: 'object',
        }),
      }),
    );
    expect(options.sourceBinding?.example).toEqual(LIGHT_EXTENSION_SOURCE_BINDING);
    expect(jsBlockPaths).toEqual(
      expect.arrayContaining(['runJs.sourceRef.*', 'runJs.sourceMode', 'runJs.sourceBinding', 'runJs.settings.*']),
    );
    expect(jsActionPaths).toEqual(
      expect.arrayContaining(['runJs.sourceMode', 'runJs.sourceBinding', 'runJs.settings.*']),
    );
    expect(jsBlockPaths).not.toEqual(expect.arrayContaining(['sourceMode', 'sourceBinding', 'settings.*']));
    expect(jsActionPaths).not.toEqual(expect.arrayContaining(['sourceMode', 'sourceBinding', 'settings.*']));

    const service = new FlowSurfacesService({
      db: {},
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'js-block-1' });
    const target = { uid: 'js-block-1' };

    await (service as unknown as ConfigureJSBlockForTest).configureJSBlock(
      target,
      {
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings: {
          region: 'APAC',
        },
        showBlockCard: false,
        sourceRef: {
          type: 'vsc-file',
          path: 'packages/plugins/custom/src/blocks/sales-kpi.tsx',
        },
      },
      {},
    );

    expect(updateSettings).toHaveBeenCalledWith(
      {
        target,
        decoratorProps: {},
        stepParams: {
          jsSettings: {
            runJs: {
              sourceRef: {
                type: 'vsc-file',
                path: 'packages/plugins/custom/src/blocks/sales-kpi.tsx',
              },
              sourceMode: 'light-extension',
              sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
              settings: {
                region: 'APAC',
              },
            },
            showBlockCard: {
              showBlockCard: false,
            },
          },
        },
      },
      {},
    );
  });

  it('should persist light-extension binding and instance settings through addBlock/configure/updateSettings', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS block source page',
      tabTitle: 'Main',
    });

    const block = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'jsBlock',
          settings: {
            title: 'Sales KPI',
            sourceMode: 'light-extension',
            sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
            settings: {
              region: 'APAC',
            },
          },
        },
      }),
    );

    let readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');

    const nextBinding = {
      ...LIGHT_EXTENSION_SOURCE_BINDING,
      entryId: 'entry_sales_kpi_v2',
    };
    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: block.uid,
        },
        changes: {
          sourceMode: 'light-extension',
          sourceBinding: nextBinding,
          settings: {
            region: 'EMEA',
            refreshInterval: 60,
          },
          showBlockCard: false,
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings).toMatchObject({
      runJs: {
        sourceMode: 'light-extension',
        sourceBinding: nextBinding,
        settings: {
          region: 'EMEA',
          refreshInterval: 60,
        },
      },
      showBlockCard: {
        showBlockCard: false,
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');

    const legacyMirrorUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: block.uid,
        },
        stepParams: {
          jsSettings: {
            sourceBinding: {
              entryId: 'entry_sales_kpi_v3',
            },
            settings: {
              currency: 'USD',
            },
          },
        },
      },
    });
    expect(legacyMirrorUpdateRes.status, readErrorMessage(legacyMirrorUpdateRes)).toBe(400);

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: block.uid,
        },
        stepParams: {
          jsSettings: {
            runJs: {
              sourceBinding: {
                entryId: 'entry_sales_kpi_v3',
              },
              settings: {
                currency: 'USD',
              },
            },
          },
        },
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: {
        ...nextBinding,
        entryId: 'entry_sales_kpi_v3',
      },
      settings: {
        region: 'EMEA',
        refreshInterval: 60,
        currency: 'USD',
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');
    expect(readback.tree.stepParams?.jsSettings?.runJs?.sourceBinding?.settings).toBeUndefined();
  });

  it('should persist JS action source fields only in clickSettings.runJs', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS action source page',
      tabTitle: 'Main',
    });
    const actionPanel = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'actionPanel',
        },
      }),
    );
    const actionResponse = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: actionPanel.uid,
        },
        type: 'js',
        settings: {
          title: 'Refresh KPI',
          code: "ctx.message.success('Refreshed');",
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: LIGHT_EXTENSION_ACTION_SOURCE_BINDING,
          settings: {
            region: 'APAC',
          },
        },
      },
    });
    expect(actionResponse.status, readErrorMessage(actionResponse)).toBe(200);
    const action = getData(actionResponse);

    let readback = await getSurface(rootAgent, { uid: action.uid });
    expect(readback.tree.stepParams?.clickSettings?.runJs).toMatchObject({
      code: "ctx.message.success('Refreshed');",
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_ACTION_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('settings');

    const configureResponse = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: action.uid,
        },
        changes: {
          sourceBinding: {
            entryId: 'entry_refresh_sales_kpi_v2',
          },
          settings: {
            currency: 'USD',
          },
        },
      },
    });
    expect(configureResponse.status, readErrorMessage(configureResponse)).toBe(200);

    readback = await getSurface(rootAgent, { uid: action.uid });
    expect(readback.tree.stepParams?.clickSettings?.runJs).toMatchObject({
      code: "ctx.message.success('Refreshed');",
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        ...LIGHT_EXTENSION_ACTION_SOURCE_BINDING,
        entryId: 'entry_refresh_sales_kpi_v2',
      },
      settings: {
        region: 'APAC',
        currency: 'USD',
      },
    });
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('settings');
  });
});
