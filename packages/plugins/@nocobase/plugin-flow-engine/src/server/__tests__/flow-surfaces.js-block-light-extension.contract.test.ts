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

const LEGACY_SOURCE_REF = {
  type: 'vsc-file',
  path: 'packages/plugins/custom/src/blocks/finance-summary.tsx',
};

function findExportedJsBlock(blocks: Array<Record<string, unknown>>) {
  return blocks.find((item) => item.type === 'jsBlock');
}

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

  it('should preserve legacy inline code/sourceRef when adding light-extension binding and exporting blueprints', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS block export page',
      tabTitle: 'Main',
    });
    const legacyCode = "ctx.render('Legacy inline summary');";

    const block = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'jsBlock',
          settings: {
            title: 'Finance summary',
            code: legacyCode,
            version: 'v1',
            sourceRef: LEGACY_SOURCE_REF,
          },
        },
      }),
    );

    const legacyReadback = await getSurface(rootAgent, { uid: block.uid });
    expect(legacyReadback.tree.stepParams?.jsSettings?.runJs).toEqual({
      code: legacyCode,
      version: 'v1',
      sourceRef: LEGACY_SOURCE_REF,
    });

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: block.uid,
        },
        changes: {
          sourceMode: 'light-extension',
          sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
          settings: {
            region: 'APAC',
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      code: legacyCode,
      version: 'v1',
      sourceRef: LEGACY_SOURCE_REF,
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    expect(exported.unsupported).toEqual([]);

    const exportedJsBlock = findExportedJsBlock(exported.document.tabs[0].blocks);
    expect(exportedJsBlock).toMatchObject({
      type: 'jsBlock',
      settings: {
        code: legacyCode,
        version: 'v1',
        sourceRef: LEGACY_SOURCE_REF,
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings: {
          region: 'APAC',
        },
      },
    });

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);

    const replacedExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
      },
    });
    expect(replacedExportRes.status, readErrorMessage(replacedExportRes)).toBe(200);
    const replaced = getData(replacedExportRes);
    const replacedJsBlock = findExportedJsBlock(replaced.document.tabs[0].blocks);
    expect(replacedJsBlock?.settings).toMatchObject({
      code: legacyCode,
      version: 'v1',
      sourceRef: LEGACY_SOURCE_REF,
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
  });

  it('should keep inline configure active with no light-extension source metadata on readback', async () => {
    const page = await createPage(rootAgent, {
      title: 'Legacy inline configure page',
      tabTitle: 'Main',
    });
    const block = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.tabSchemaUid },
          type: 'jsBlock',
          settings: {
            code: "ctx.render('before');",
            version: 'v1',
          },
        },
      }),
    );

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: block.uid },
        changes: {
          code: "ctx.render('after');",
          version: 'v2',
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toEqual({
      code: "ctx.render('after');",
      version: 'v2',
    });
    expect(readback.tree.stepParams?.jsSettings?.runJs).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings?.runJs).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings?.runJs).not.toHaveProperty('sourceRef');
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
