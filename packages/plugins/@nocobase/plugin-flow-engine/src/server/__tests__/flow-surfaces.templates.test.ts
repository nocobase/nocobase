/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import _ from 'lodash';
import { vi } from 'vitest';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import {
  addBlockData,
  addFieldData,
  createPage,
  expectTemplateUsage,
  getData,
  getListData,
  getPopupGridItems,
  getPopupOpenView,
  getSurface,
  readErrorMessage,
  saveTemplate,
  setupFixtureCollections,
} from './flow-surfaces.templates.helpers';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';
import { FlowSurfacesService } from '../flow-surfaces/service';

const FLOW_SURFACES_TEMPLATE_TEST_PLUGINS = [...FLOW_SURFACES_TEST_PLUGINS, 'ui-templates'] as const;
const FLOW_SURFACES_TEMPLATE_TEST_PLUGIN_INSTALLS = [...FLOW_SURFACES_TEST_PLUGIN_INSTALLS, 'ui-templates'] as const;

function buildSingleColumnLayout(itemUids: string[]) {
  return {
    rows: Object.fromEntries(itemUids.map((itemUid, index) => [`autoRow${index + 1}`, [[itemUid]]])),
    sizes: Object.fromEntries(itemUids.map((_, index) => [`autoRow${index + 1}`, [24]])),
    rowOrder: itemUids.map((_, index) => `autoRow${index + 1}`),
  };
}

function defaultFilterFor(fieldPaths: string[]) {
  return {
    logic: '$and',
    items: fieldPaths.map((path) => ({
      path,
      operator: '$notEmpty',
    })),
  };
}

function employeeDefaultFilter() {
  return defaultFilterFor(['nickname', 'status', 'email', 'phone']);
}

function nameCodeDefaultFilter() {
  return defaultFilterFor(['name', 'code', 'label', 'scope']);
}

function nameLabelCodeDefaultFilter() {
  return defaultFilterFor(['name', 'label', 'code', 'scope']);
}

function departmentDefaultFilter() {
  return defaultFilterFor(['title', 'code', 'status', 'scope']);
}

describe('flowSurfaces templates', () => {
  let app: MockServer;
  let rootAgent: any;

  async function createPopupTestCollection(name: string) {
    await rootAgent.resource('collections').create({
      values: {
        name,
        title: name,
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'label', type: 'string', interface: 'input' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [name]: ['name', 'code', 'label', 'scope'],
    });
  }

  async function findPopupTemplateByName(name: string) {
    const listed = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          search: name,
        },
      }),
    );
    return listed.rows.find((row: any) => row.name === name);
  }

  async function expectPopupTemplateReference(targetUid: string, templateUid: string) {
    const surface = await getSurface(rootAgent, { uid: targetUid });
    expect(surface.tree.popup?.template).toMatchObject({
      uid: templateUid,
      mode: 'reference',
    });
    expect(surface.tree.popup?.pageUid).toBeUndefined();
    expect(surface.tree.popup?.tabUid).toBeUndefined();
    expect(surface.tree.popup?.gridUid).toBeUndefined();
    return surface;
  }

  async function getDefaultTableViewAction(tableUid: string) {
    const tableSurface = await getSurface(rootAgent, { uid: tableUid });
    const actionsColumn = _.castArray(tableSurface.tree.subModels?.columns || []).find(
      (column: any) => column?.use === 'TableActionsColumnModel',
    );
    const viewAction = _.castArray(actionsColumn?.subModels?.actions || []).find(
      (action: any) => action?.use === 'ViewActionModel',
    );
    expect(viewAction?.uid).toBeTruthy();
    return viewAction;
  }

  async function getPopupTemplateSurface(templateUid: string) {
    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: templateUid,
        },
      }),
    );
    const surface = await getSurface(rootAgent, { uid: template.targetUid });
    return {
      template,
      surface,
    };
  }

  function getFirstPopupDetailsBlock(surface: any) {
    return _.castArray(surface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [])[0];
  }

  function getDetailsFieldItems(detailsBlock: any) {
    return _.castArray(detailsBlock?.subModels?.grid?.subModels?.items || []);
  }

  async function getDefaultViewActionTemplateDetailsItems(tableUid: string) {
    const viewAction = await getDefaultTableViewAction(tableUid);
    const actionSurface = await getSurface(rootAgent, { uid: viewAction.uid });
    expect(actionSurface.tree.popup?.template).toMatchObject({
      mode: 'reference',
    });
    const { template, surface } = await getPopupTemplateSurface(actionSurface.tree.popup.template.uid);
    return {
      viewAction,
      actionSurface,
      actionTemplate: template,
      actionTemplateSurface: surface,
      detailsItems: getDetailsFieldItems(getFirstPopupDetailsBlock(surface)),
    };
  }

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer({
      plugins: FLOW_SURFACES_TEMPLATE_TEST_PLUGIN_INSTALLS as any,
      enabledPluginAliases: FLOW_SURFACES_TEMPLATE_TEST_PLUGINS,
    });
    expect(app.pm.get('ui-templates')).toBeTruthy();
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupFixtureCollections(rootAgent, app.db);
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should save block templates and reuse them through addBlock addBlocks compose and convertTemplateToCopy', async () => {
    const page = await createPage(rootAgent, {
      title: 'Block template page',
      tabTitle: 'Block template tab',
    });
    const sourceBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    await addFieldData(rootAgent, {
      target: { uid: sourceBlock.uid },
      fieldPath: 'nickname',
    });

    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceBlock.uid },
      name: 'Employee create form block',
      description: 'Reusable employee create form block for template-driven UI assembly.',
      saveMode: 'duplicate',
    });
    expect(template.type).toBe('block');
    expect(template.description).toContain('template-driven');

    const listed = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          search: 'employee create form block',
        },
      }),
    );
    expect(Array.isArray(listed.rows)).toBe(true);
    expect(listed.rows.some((row: any) => row.uid === template.uid)).toBe(true);
    await expectTemplateUsage(rootAgent, template.uid, 0);

    const addBlocksRes = getData(
      await rootAgent.resource('flowSurfaces').addBlocks({
        values: {
          target: { uid: page.gridUid },
          blocks: [
            {
              key: 'copy-form',
              template: {
                uid: template.uid,
                mode: 'copy',
              },
            },
          ],
        },
      }),
    );
    expect(addBlocksRes.successCount).toBe(1);
    expect(addBlocksRes.blocks[0].ok).toBe(true);
    const copiedBlockUid = addBlocksRes.blocks[0].result.uid;
    const copiedBlockSurface = await getSurface(rootAgent, { uid: copiedBlockUid });
    expect(copiedBlockSurface.tree.template).toBeUndefined();
    let pageSurface = await getSurface(rootAgent, { pageSchemaUid: page.pageSchemaUid });
    let pageGrid = pageSurface.tree?.subModels?.tabs?.[0]?.subModels?.grid;
    expect(pageGrid?.subModels?.items?.some((item: any) => item.uid === copiedBlockUid)).toBe(true);
    expect(Object.values(pageGrid?.props?.rows || {}).flat(2)).toContain(copiedBlockUid);
    getData(
      await rootAgent.resource('flowSurfaces').setLayout({
        values: {
          target: { uid: page.gridUid },
          rows: pageGrid?.props?.rows || {},
          sizes: pageGrid?.props?.sizes || {},
          rowOrder: pageGrid?.props?.rowOrder || [],
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 0);

    const referencedBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      template: {
        uid: template.uid,
        mode: 'reference',
      },
    });
    const referencedBlockSurface = await getSurface(rootAgent, { uid: referencedBlock.uid });
    expect(referencedBlockSurface.tree.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 1);

    const blockedDestroy = await rootAgent.resource('flowSurfaces').destroyTemplate({
      values: {
        uid: template.uid,
      },
    });
    expect(blockedDestroy.status).toBe(400);
    expect(readErrorMessage(blockedDestroy)).toContain('still in use');

    const convertedBlock = getData(
      await rootAgent.resource('flowSurfaces').convertTemplateToCopy({
        values: {
          target: { uid: referencedBlock.uid },
        },
      }),
    );
    expect(convertedBlock.type).toBe('block');
    const convertedBlockSurface = await getSurface(rootAgent, { uid: referencedBlock.uid });
    expect(convertedBlockSurface.tree.template).toBeUndefined();
    pageSurface = await getSurface(rootAgent, { pageSchemaUid: page.pageSchemaUid });
    pageGrid = pageSurface.tree?.subModels?.tabs?.[0]?.subModels?.grid;
    expect(pageGrid?.subModels?.items?.some((item: any) => item.uid === referencedBlock.uid)).toBe(true);
    expect(Object.values(pageGrid?.props?.rows || {}).flat(2)).toContain(referencedBlock.uid);
    await expectTemplateUsage(rootAgent, template.uid, 0);

    const composed = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.gridUid },
          blocks: [
            {
              key: 'templated-form',
              template: {
                uid: template.uid,
                mode: 'reference',
              },
            },
          ],
        },
      }),
    );
    expect(composed.blocks).toHaveLength(1);
    const composedBlockUid = composed.blocks[0].uid;
    const composedSurface = await getSurface(rootAgent, { uid: composedBlockUid });
    expect(composedSurface.tree.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 1);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: composedBlockUid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 0);

    const destroyTemplateRes = await rootAgent.resource('flowSurfaces').destroyTemplate({
      values: {
        uid: template.uid,
      },
    });
    expect(destroyTemplateRes.status).toBe(200);
  });

  it('should convert block template references to detached copies through convertTemplateToCopy', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute plan block template page',
      tabTitle: 'Execute plan block template tab',
    });
    const sourceBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    await addFieldData(rootAgent, {
      target: { uid: sourceBlock.uid },
      fieldPath: 'nickname',
    });

    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceBlock.uid },
      name: 'Convert-to-copy block template',
      description: 'Reusable block template to verify direct convertTemplateToCopy dispatch.',
      saveMode: 'duplicate',
    });
    const referencedBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      template: {
        uid: template.uid,
        mode: 'reference',
      },
    });

    const referencedSurface = await getSurface(rootAgent, { uid: referencedBlock.uid });
    expect(referencedSurface.tree.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 1);

    const convertRes = await rootAgent.resource('flowSurfaces').convertTemplateToCopy({
      values: {
        target: {
          uid: referencedBlock.uid,
        },
      },
    });
    const convertData = getData(convertRes);
    expect(convertData).toMatchObject({
      uid: referencedBlock.uid,
      type: 'block',
    });

    const convertedSurface = await getSurface(rootAgent, { uid: referencedBlock.uid });
    expect(convertedSurface.tree.template).toBeUndefined();
    await expectTemplateUsage(rootAgent, template.uid, 0);
  });

  it('should support fields templates through addBlock addField addFields convertTemplateToCopy and destroy cleanup', async () => {
    const page = await createPage(rootAgent, {
      title: 'Fields template page',
      tabTitle: 'Fields template tab',
    });
    const sourceBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    await addFieldData(rootAgent, {
      target: { uid: sourceBlock.uid },
      fieldPath: 'nickname',
    });
    await addFieldData(rootAgent, {
      target: { uid: sourceBlock.uid },
      fieldPath: 'status',
    });

    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceBlock.uid },
      name: 'Employee form fields',
      description: 'Reusable employee form fields template with nickname and status.',
      saveMode: 'duplicate',
    });

    const referencedFieldsBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      template: {
        uid: template.uid,
        usage: 'fields',
        mode: 'reference',
      },
    });
    let referencedFieldsSurface = await getSurface(rootAgent, { uid: referencedFieldsBlock.uid });
    expect(referencedFieldsSurface.tree.fieldsTemplate).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 1);

    const fieldImportBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    await addFieldData(rootAgent, {
      target: { uid: fieldImportBlock.uid },
      template: {
        uid: template.uid,
        mode: 'reference',
      },
    });
    const fieldImportSurface = await getSurface(rootAgent, { uid: fieldImportBlock.uid });
    expect(fieldImportSurface.tree.fieldsTemplate).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 2);

    const addFieldsBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const addFieldsResult = getData(
      await rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: { uid: addFieldsBlock.uid },
          template: {
            uid: template.uid,
            mode: 'copy',
          },
        },
      }),
    );
    expect(addFieldsResult.successCount).toBe(1);
    expect(addFieldsResult.fields[0].ok).toBe(true);
    const addFieldsSurface = await getSurface(rootAgent, { uid: addFieldsBlock.uid });
    expect(addFieldsSurface.tree.fieldsTemplate).toBeUndefined();
    const copiedFieldsGrid = addFieldsSurface.tree?.subModels?.grid;
    expect(copiedFieldsGrid?.uid).toBeTruthy();
    const copiedFieldsGridItemUids = (copiedFieldsGrid?.subModels?.items || []).map((item: any) => item.uid);
    expect(copiedFieldsGridItemUids.length).toBeGreaterThan(0);
    const copiedFieldsLayout = buildSingleColumnLayout(copiedFieldsGridItemUids);
    getData(
      await rootAgent.resource('flowSurfaces').setLayout({
        values: {
          target: { uid: copiedFieldsGrid.uid },
          ...copiedFieldsLayout,
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 2);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: fieldImportBlock.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 1);

    const convertedFields = getData(
      await rootAgent.resource('flowSurfaces').convertTemplateToCopy({
        values: {
          target: { uid: referencedFieldsBlock.uid },
        },
      }),
    );
    expect(convertedFields.type).toBe('fields');
    referencedFieldsSurface = await getSurface(rootAgent, { uid: referencedFieldsBlock.uid });
    expect(referencedFieldsSurface.tree.fieldsTemplate).toBeUndefined();
    const convertedFieldsGrid = referencedFieldsSurface.tree?.subModels?.grid;
    expect(convertedFieldsGrid?.uid).toBeTruthy();
    const convertedFieldsGridItemUids = (convertedFieldsGrid?.subModels?.items || []).map((item: any) => item.uid);
    expect(convertedFieldsGridItemUids.length).toBeGreaterThan(0);
    const convertedFieldsLayout = buildSingleColumnLayout(convertedFieldsGridItemUids);
    getData(
      await rootAgent.resource('flowSurfaces').setLayout({
        values: {
          target: { uid: convertedFieldsGrid.uid },
          ...convertedFieldsLayout,
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 0);
  });

  it('should support popup templates through saveTemplate convert mode addAction popup.template and convertTemplateToCopy', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup template page',
      tabTitle: 'Popup template tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const sourceAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'details',
                type: 'details',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );

    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceAction.uid },
      name: 'Employee popup details',
      description: 'Reusable popup template that opens employee details.',
      saveMode: 'convert',
    });
    expect(template.type).toBe('popup');
    const sourceActionSurface = await getSurface(rootAgent, { uid: sourceAction.uid });
    expect(sourceActionSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 1);

    const referencedAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            template: {
              uid: template.uid,
              mode: 'reference',
            },
          },
        },
      }),
    );
    let referencedActionSurface = await getSurface(rootAgent, { uid: referencedAction.uid });
    expect(referencedActionSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    expect(getPopupOpenView(referencedActionSurface.tree)?.popupTemplateUid).toBeUndefined();
    expect(getPopupOpenView(referencedActionSurface.tree)?.popupTemplateMode).toBeUndefined();
    expect(getPopupOpenView(referencedActionSurface.tree)?.uid).toBeUndefined();
    await expectTemplateUsage(rootAgent, template.uid, 2);

    const referencedActionWithIgnoredLocalPopup = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            title: 'Employee quick view',
            template: {
              uid: template.uid,
              mode: 'reference',
            },
            mode: 'append',
            blocks: [
              {
                key: 'ignored-details',
                type: 'details',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                fields: ['status'],
              },
            ],
            layout: {
              rows: [['ignored-details']],
            },
          },
        },
      }),
    );
    const referencedActionWithIgnoredLocalPopupSurface = await getSurface(rootAgent, {
      uid: referencedActionWithIgnoredLocalPopup.uid,
    });
    expect(referencedActionWithIgnoredLocalPopupSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    expect(referencedActionWithIgnoredLocalPopupSurface.tree.popup.pageUid).toBeUndefined();
    expect(referencedActionWithIgnoredLocalPopupSurface.tree.popup.tabUid).toBeUndefined();
    expect(referencedActionWithIgnoredLocalPopupSurface.tree.popup.gridUid).toBeUndefined();
    expect(getPopupOpenView(referencedActionWithIgnoredLocalPopupSurface.tree)).toMatchObject({
      title: 'Employee quick view',
    });
    await expectTemplateUsage(rootAgent, template.uid, 3);

    const referencedRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            template: {
              uid: template.uid,
              mode: 'reference',
            },
          },
        },
      }),
    );
    const referencedRecordActionSurface = await getSurface(rootAgent, { uid: referencedRecordAction.uid });
    expect(referencedRecordActionSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 4);

    const referencedPopupMutation = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: referencedAction.uid },
        type: 'markdown',
        settings: {
          content: 'Should fail for referenced popup template',
        },
      },
    });
    expect(referencedPopupMutation.status).toBe(400);
    expect(readErrorMessage(referencedPopupMutation)).toContain('convert it to copy before editing popup blocks');

    const copiedAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            template: {
              uid: template.uid,
              mode: 'copy',
            },
          },
        },
      }),
    );
    expect(copiedAction.popupPageUid).toBeTruthy();
    expect(copiedAction.popupTabUid).toBeTruthy();
    expect(copiedAction.popupGridUid).toBeTruthy();
    await expectTemplateUsage(rootAgent, template.uid, 4);
    const copiedActionSurface = await getSurface(rootAgent, { uid: copiedAction.uid });
    expect(copiedActionSurface.tree.popup.mode).toBe('copy');
    expect(copiedActionSurface.tree.popup.pageUid).toBe(copiedAction.popupPageUid);
    expect(copiedActionSurface.tree.popup.tabUid).toBe(copiedAction.popupTabUid);
    expect(copiedActionSurface.tree.popup.gridUid).toBe(copiedAction.popupGridUid);
    expect(getPopupOpenView(copiedActionSurface.tree)?.popupTemplateContext).toBeUndefined();
    expect(getPopupOpenView(copiedActionSurface.tree)?.uid).toBeUndefined();

    const copiedPopupBlock = await addBlockData(rootAgent, {
      target: { uid: copiedAction.uid },
      type: 'markdown',
      settings: {
        content: 'Copied popup note',
      },
    });
    const copiedPopupPageSurface = await getSurface(rootAgent, { uid: copiedAction.popupPageUid });
    expect(getPopupGridItems(copiedPopupPageSurface.tree).some((item: any) => item.uid === copiedPopupBlock.uid)).toBe(
      true,
    );
    const copiedPopupTemplate = await saveTemplate(rootAgent, {
      target: { uid: copiedAction.uid },
      name: 'Employee copied popup details',
      description: 'Reusable popup template saved from a detached popup template copy.',
      saveMode: 'duplicate',
    });
    expect(copiedPopupTemplate.type).toBe('popup');
    await expectTemplateUsage(rootAgent, template.uid, 4);

    const configurableAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'configurable-popup-details',
                type: 'details',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                fields: ['status'],
              },
            ],
          },
        },
      }),
    );
    getData(
      await rootAgent.resource('flowSurfaces').configure({
        values: {
          target: { uid: configurableAction.uid },
          changes: {
            openView: {
              template: {
                uid: template.uid,
                mode: 'reference',
              },
            },
          },
        },
      }),
    );
    const configurableActionSurface = await getSurface(rootAgent, { uid: configurableAction.uid });
    expect(configurableActionSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 5);

    const convertedPopup = getData(
      await rootAgent.resource('flowSurfaces').convertTemplateToCopy({
        values: {
          target: { uid: referencedAction.uid },
        },
      }),
    );
    expect(convertedPopup.type).toBe('popup');
    referencedActionSurface = await getSurface(rootAgent, { uid: referencedAction.uid });
    expect(referencedActionSurface.tree.popup?.template).toBeUndefined();
    expect(referencedActionSurface.tree.popup?.mode).toBe('copy');
    expect(referencedActionSurface.tree.popup?.pageUid).toBeTruthy();
    expect(referencedActionSurface.tree.popup?.tabUid).toBeTruthy();
    expect(referencedActionSurface.tree.popup?.gridUid).toBeTruthy();
    expect(getPopupOpenView(referencedActionSurface.tree)?.popupTemplateContext).toBeUndefined();
    expect(getPopupOpenView(referencedActionSurface.tree)?.uid).toBeUndefined();
    await expectTemplateUsage(rootAgent, template.uid, 4);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: sourceAction.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 3);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: referencedRecordAction.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 2);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: configurableAction.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 1);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: referencedActionWithIgnoredLocalPopup.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 0);

    const destroyTemplateRes = await rootAgent.resource('flowSurfaces').destroyTemplate({
      values: {
        uid: template.uid,
      },
    });
    expect(destroyTemplateRes.status).toBe(200);
  });

  it('should preserve empty popup payload semantics when settings target a popup template reference', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup template empty payload page',
      tabTitle: 'Popup template empty payload tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const sourceAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'details',
                type: 'details',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );
    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceAction.uid },
      name: 'Popup template empty payload guard',
      description: 'Reusable popup template for validating empty popup payload rejection.',
      saveMode: 'duplicate',
    });

    const referenceRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: table.uid },
        type: 'view',
        settings: {
          openView: {
            template: {
              uid: template.uid,
              mode: 'reference',
            },
          },
        },
        popup: {},
      },
    });
    expect(referenceRes.status).toBe(200);
    const referencedAction = getData(referenceRes);
    expect(referencedAction.popupPageUid).toBeUndefined();

    const referencedActionSurface = await getSurface(rootAgent, { uid: referencedAction.uid });
    expect(referencedActionSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    expect(referencedActionSurface.tree.popup.pageUid).toBeUndefined();
    expect(referencedActionSurface.tree.popup.tabUid).toBeUndefined();
    expect(referencedActionSurface.tree.popup.gridUid).toBeUndefined();
  });

  it('should preserve empty popup payload semantics for popup template copies', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup template copy empty payload page',
      tabTitle: 'Popup template copy empty payload tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const sourceAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'details',
                type: 'details',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );
    getData(
      await rootAgent.resource('flowSurfaces').updatePopupTab({
        values: {
          target: {
            uid: sourceAction.popupTabUid,
          },
          title: 'Copied employee popup',
        },
      }),
    );
    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceAction.uid },
      name: 'Popup template copy empty payload guard',
      description: 'Reusable popup template for validating empty popup payload copy behavior.',
      saveMode: 'duplicate',
    });

    const copiedAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          settings: {
            openView: {
              template: {
                uid: template.uid,
                mode: 'copy',
              },
            },
          },
          popup: {},
        },
      }),
    );
    expect(copiedAction.popupPageUid).toBeTruthy();
    expect(copiedAction.popupTabUid).toBeTruthy();
    expect(copiedAction.popupGridUid).toBeTruthy();

    const copiedActionSurface = await getSurface(rootAgent, { uid: copiedAction.uid });
    expect(copiedActionSurface.tree.popup.mode).toBe('copy');
    expect(copiedActionSurface.tree.popup.pageUid).toBe(copiedAction.popupPageUid);
    expect(copiedActionSurface.tree.popup.tabUid).toBe(copiedAction.popupTabUid);
    expect(copiedActionSurface.tree.popup.gridUid).toBe(copiedAction.popupGridUid);

    const copiedPopupPageSurface = await getSurface(rootAgent, { uid: copiedAction.popupPageUid });
    const copiedPopupTab = copiedPopupPageSurface.tree.subModels?.tabs?.[0];
    const copiedPopupBlock = getPopupGridItems(copiedPopupPageSurface.tree)[0];
    const copiedPopupFieldPaths = (copiedPopupBlock?.subModels?.grid?.subModels?.items || []).map(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath,
    );
    expect(copiedPopupTab?.props?.title).toBe('Copied employee popup');
    expect(copiedPopupBlock?.use).toBe('DetailsBlockModel');
    expect(copiedPopupFieldPaths).toEqual(['nickname']);
  });

  it('should support field popup templates through saveTemplate addField addFields configure and convertTemplateToCopy', async () => {
    const page = await createPage(rootAgent, {
      title: 'Field popup template page',
      tabTitle: 'Field popup template tab',
    });
    const sourceDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const sourceField = await addFieldData(rootAgent, {
      target: { uid: sourceDetails.uid },
      fieldPath: 'nickname',
      popup: {
        blocks: [
          {
            key: 'employee-field-popup-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname', 'status'],
          },
        ],
      },
    });

    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceField.fieldUid || sourceField.uid },
      name: 'Employee field popup template',
      description: 'Reusable popup template for employee display fields.',
      saveMode: 'convert',
    });
    expect(template.type).toBe('popup');
    expect(template.name).toBe('Employee field popup template');
    expect(template.description).toBe('Reusable popup template for employee display fields.');
    const sourceFieldSurface = await getSurface(rootAgent, { uid: sourceField.fieldUid || sourceField.uid });
    expect(sourceFieldSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 1);

    const referencedField = await addFieldData(rootAgent, {
      target: { uid: sourceDetails.uid },
      fieldPath: 'status',
      popup: {
        template: {
          uid: template.uid,
          mode: 'reference',
        },
      },
    });
    let referencedFieldSurface = await getSurface(rootAgent, { uid: referencedField.fieldUid || referencedField.uid });
    expect(referencedFieldSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    expect(getPopupOpenView(referencedFieldSurface.tree)?.popupTemplateUid).toBeUndefined();
    expect(getPopupOpenView(referencedFieldSurface.tree)?.popupTemplateMode).toBeUndefined();
    expect(getPopupOpenView(referencedFieldSurface.tree)?.uid).toBeUndefined();
    await expectTemplateUsage(rootAgent, template.uid, 2);

    const referencedFieldWithIgnoredLocalPopup = await addFieldData(rootAgent, {
      target: { uid: sourceDetails.uid },
      fieldPath: 'nickname',
      popup: {
        title: 'Employee status quick view',
        template: {
          uid: template.uid,
          mode: 'reference',
        },
        mode: 'append',
        blocks: [
          {
            key: 'ignored-field-popup-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['status'],
          },
        ],
        layout: {
          rows: [['ignored-field-popup-details']],
        },
      },
    });
    const referencedFieldWithIgnoredLocalPopupSurface = await getSurface(rootAgent, {
      uid: referencedFieldWithIgnoredLocalPopup.fieldUid || referencedFieldWithIgnoredLocalPopup.uid,
    });
    expect(referencedFieldWithIgnoredLocalPopupSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    expect(referencedFieldWithIgnoredLocalPopupSurface.tree.popup.pageUid).toBeUndefined();
    expect(referencedFieldWithIgnoredLocalPopupSurface.tree.popup.tabUid).toBeUndefined();
    expect(referencedFieldWithIgnoredLocalPopupSurface.tree.popup.gridUid).toBeUndefined();
    expect(getPopupOpenView(referencedFieldWithIgnoredLocalPopupSurface.tree)).toMatchObject({
      title: 'Employee status quick view',
    });
    await expectTemplateUsage(rootAgent, template.uid, 3);

    const referencedFieldPopupMutation = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: referencedField.fieldUid || referencedField.uid },
        type: 'markdown',
        settings: {
          content: 'Should fail for referenced field popup template',
        },
      },
    });
    expect(referencedFieldPopupMutation.status).toBe(400);
    expect(readErrorMessage(referencedFieldPopupMutation)).toContain('convert it to copy before editing popup blocks');

    const copyDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const copiedField = await addFieldData(rootAgent, {
      target: { uid: copyDetails.uid },
      fieldPath: 'nickname',
      popup: {
        template: {
          uid: template.uid,
          mode: 'copy',
        },
      },
    });
    expect(copiedField.popupPageUid).toBeTruthy();
    expect(copiedField.popupTabUid).toBeTruthy();
    expect(copiedField.popupGridUid).toBeTruthy();
    await expectTemplateUsage(rootAgent, template.uid, 3);
    const copiedFieldSurface = await getSurface(rootAgent, { uid: copiedField.fieldUid || copiedField.uid });
    expect(copiedFieldSurface.tree.popup.mode).toBe('copy');
    expect(copiedFieldSurface.tree.popup.pageUid).toBe(copiedField.popupPageUid);
    expect(copiedFieldSurface.tree.popup.tabUid).toBe(copiedField.popupTabUid);
    expect(copiedFieldSurface.tree.popup.gridUid).toBe(copiedField.popupGridUid);
    expect(getPopupOpenView(copiedFieldSurface.tree)?.popupTemplateContext).toBeUndefined();
    expect(getPopupOpenView(copiedFieldSurface.tree)?.uid).toBeUndefined();

    const copiedFieldPopupBlock = await addBlockData(rootAgent, {
      target: { uid: copiedField.fieldUid || copiedField.uid },
      type: 'markdown',
      settings: {
        content: 'Copied field popup note',
      },
    });
    const copiedFieldPopupPageSurface = await getSurface(rootAgent, { uid: copiedField.popupPageUid });
    expect(
      getPopupGridItems(copiedFieldPopupPageSurface.tree).some((item: any) => item.uid === copiedFieldPopupBlock.uid),
    ).toBe(true);

    const batchDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const addFieldsResult = getData(
      await rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: { uid: batchDetails.uid },
          fields: [
            {
              key: 'batch-status',
              fieldPath: 'status',
              popup: {
                template: {
                  uid: template.uid,
                  mode: 'reference',
                },
              },
            },
          ],
        },
      }),
    );
    expect(addFieldsResult.successCount).toBe(1);
    expect(addFieldsResult.fields[0].ok).toBe(true);
    const batchFieldUid = addFieldsResult.fields[0].result.fieldUid || addFieldsResult.fields[0].result.uid;
    const batchFieldSurface = await getSurface(rootAgent, { uid: batchFieldUid });
    expect(batchFieldSurface.tree.popup.template).toMatchObject({
      uid: template.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 4);

    const altSourceDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const altSourceField = await addFieldData(rootAgent, {
      target: { uid: altSourceDetails.uid },
      fieldPath: 'nickname',
      popup: {
        blocks: [
          {
            key: 'employee-field-popup-alt-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['status'],
          },
        ],
      },
    });
    const altTemplate = await saveTemplate(rootAgent, {
      target: { uid: altSourceField.fieldUid || altSourceField.uid },
      name: 'Employee field popup alt template',
      description: 'Alternate popup template for employee display fields.',
      saveMode: 'duplicate',
    });
    expect(altTemplate.type).toBe('popup');

    getData(
      await rootAgent.resource('flowSurfaces').configure({
        values: {
          target: { uid: referencedField.fieldUid || referencedField.uid },
          changes: {
            openView: {
              template: {
                uid: altTemplate.uid,
                mode: 'reference',
              },
            },
          },
        },
      }),
    );
    referencedFieldSurface = await getSurface(rootAgent, { uid: referencedField.fieldUid || referencedField.uid });
    expect(referencedFieldSurface.tree.popup.template).toMatchObject({
      uid: altTemplate.uid,
      mode: 'reference',
    });
    await expectTemplateUsage(rootAgent, template.uid, 3);
    await expectTemplateUsage(rootAgent, altTemplate.uid, 1);

    const convertedFieldPopup = getData(
      await rootAgent.resource('flowSurfaces').convertTemplateToCopy({
        values: {
          target: { uid: referencedField.fieldUid || referencedField.uid },
        },
      }),
    );
    expect(convertedFieldPopup.type).toBe('popup');
    referencedFieldSurface = await getSurface(rootAgent, { uid: referencedField.fieldUid || referencedField.uid });
    expect(referencedFieldSurface.tree.popup?.template).toBeUndefined();
    expect(referencedFieldSurface.tree.popup?.mode).toBe('copy');
    expect(referencedFieldSurface.tree.popup?.pageUid).toBeTruthy();
    expect(referencedFieldSurface.tree.popup?.tabUid).toBeTruthy();
    expect(referencedFieldSurface.tree.popup?.gridUid).toBeTruthy();
    expect(getPopupOpenView(referencedFieldSurface.tree)?.popupTemplateContext).toBeUndefined();
    expect(getPopupOpenView(referencedFieldSurface.tree)?.uid).toBeUndefined();
    await expectTemplateUsage(rootAgent, altTemplate.uid, 0);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: batchFieldUid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 2);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: sourceField.fieldUid || sourceField.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 1);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: {
            uid: referencedFieldWithIgnoredLocalPopup.fieldUid || referencedFieldWithIgnoredLocalPopup.uid,
          },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 0);
  });

  it('should auto-select popup templates via popup.tryTemplate with relation priority explicit override and first-match fallback', async () => {
    const unique = Date.now();
    const sourceCollection = `popup_try_relation_employees_${unique}`;
    const targetCollection = `popup_try_relation_departments_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        fields: [
          { name: 'nickname', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'input' },
          { name: 'email', type: 'string', interface: 'email' },
          { name: 'phone', type: 'string', interface: 'phone' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: targetCollection,
        titleField: 'title',
        filterTargetKey: 'title',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'department',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'departmentId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'secondaryDepartment',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'secondaryDepartmentId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [sourceCollection]: ['nickname', 'status', 'email', 'phone', 'departmentId', 'secondaryDepartmentId'],
      [targetCollection]: ['title', 'code', 'status', 'scope'],
    });

    const page = await createPage(rootAgent, {
      title: 'Popup tryTemplate relation priority page',
      tabTitle: 'Popup tryTemplate relation priority tab',
    });

    const genericDepartmentDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: targetCollection,
      },
    });
    const genericDepartmentField = await addFieldData(rootAgent, {
      target: { uid: genericDepartmentDetails.uid },
      fieldPath: 'title',
      popup: {
        blocks: [
          {
            key: 'department-popup-title-v1',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['title'],
          },
        ],
      },
    });
    const genericDepartmentTemplateV1 = await saveTemplate(rootAgent, {
      target: { uid: genericDepartmentField.fieldUid || genericDepartmentField.uid },
      name: 'Department popup generic template v1',
      description: 'Generic departments popup template for popup.tryTemplate fallback coverage.',
      saveMode: 'duplicate',
    });

    const latestDepartmentDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: targetCollection,
      },
    });
    const latestDepartmentField = await addFieldData(rootAgent, {
      target: { uid: latestDepartmentDetails.uid },
      fieldPath: 'title',
      popup: {
        blocks: [
          {
            key: 'department-popup-title-v2',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['title'],
          },
        ],
      },
    });
    const genericDepartmentTemplateV2 = await saveTemplate(rootAgent, {
      target: { uid: latestDepartmentField.fieldUid || latestDepartmentField.uid },
      name: 'Department popup generic template v2',
      description: 'Newer generic departments popup template for popup.tryTemplate latest-match coverage.',
      saveMode: 'duplicate',
    });
    getData(
      await rootAgent.resource('flowSurfaces').updateTemplate({
        values: {
          uid: genericDepartmentTemplateV2.uid,
          name: 'Department popup generic template v2',
          description: 'Updated generic departments popup template for popup.tryTemplate latest-match coverage.',
        },
      }),
    );
    const listedGenericDepartmentTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          filter: {
            $and: [
              { collectionName: targetCollection },
              {
                $or: [{ associationName: null }, { associationName: '' }],
              },
            ],
          },
        },
      }),
    );
    const expectedGenericDepartmentFallback = listedGenericDepartmentTemplates.rows[0];
    expect([genericDepartmentTemplateV1.uid, genericDepartmentTemplateV2.uid]).toContain(
      expectedGenericDepartmentFallback?.uid,
    );

    const employeesDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: sourceCollection,
      },
    });
    const secondaryDepartmentSourceField = await addFieldData(rootAgent, {
      target: { uid: employeesDetails.uid },
      fieldPath: 'secondaryDepartment',
      popup: {
        blocks: [
          {
            key: 'secondary-department-popup-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['title'],
          },
        ],
      },
    });
    const secondaryDepartmentTemplate = await saveTemplate(rootAgent, {
      target: { uid: secondaryDepartmentSourceField.fieldUid || secondaryDepartmentSourceField.uid },
      name: 'Secondary department popup template',
      description: 'Relation popup template bound to employees.secondaryDepartment for popup.tryTemplate coverage.',
      saveMode: 'duplicate',
    });

    const relationFallbackField = await addFieldData(rootAgent, {
      target: { uid: employeesDetails.uid },
      fieldPath: 'department',
      popup: {
        tryTemplate: true,
      },
    });
    const relationFallbackSurface = await getSurface(rootAgent, {
      uid: relationFallbackField.fieldUid || relationFallbackField.uid,
    });
    expect(relationFallbackSurface.tree.popup.template).toMatchObject({
      uid: expectedGenericDepartmentFallback.uid,
      mode: 'reference',
    });

    const departmentSourceField = await addFieldData(rootAgent, {
      target: { uid: employeesDetails.uid },
      fieldPath: 'department',
      popup: {
        blocks: [
          {
            key: 'department-popup-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['title'],
          },
        ],
      },
    });
    const departmentTemplate = await saveTemplate(rootAgent, {
      target: { uid: departmentSourceField.fieldUid || departmentSourceField.uid },
      name: 'Department relation popup template',
      description: 'Relation popup template bound to employees.department for popup.tryTemplate coverage.',
      saveMode: 'duplicate',
    });

    const relationPreferredField = await addFieldData(rootAgent, {
      target: { uid: employeesDetails.uid },
      fieldPath: 'department',
      popup: {
        tryTemplate: true,
      },
    });
    const relationPreferredSurface = await getSurface(rootAgent, {
      uid: relationPreferredField.fieldUid || relationPreferredField.uid,
    });
    expect(relationPreferredSurface.tree.popup.template).toMatchObject({
      uid: departmentTemplate.uid,
      mode: 'reference',
    });

    const explicitOverrideField = await addFieldData(rootAgent, {
      target: { uid: employeesDetails.uid },
      fieldPath: 'secondaryDepartment',
      popup: {
        tryTemplate: true,
        template: {
          uid: genericDepartmentTemplateV1.uid,
          mode: 'reference',
        },
      },
    });
    const explicitOverrideSurface = await getSurface(rootAgent, {
      uid: explicitOverrideField.fieldUid || explicitOverrideField.uid,
    });
    expect(explicitOverrideSurface.tree.popup.template).toMatchObject({
      uid: genericDepartmentTemplateV1.uid,
      mode: 'reference',
    });

    await expectTemplateUsage(
      rootAgent,
      genericDepartmentTemplateV1.uid,
      expectedGenericDepartmentFallback.uid === genericDepartmentTemplateV1.uid ? 2 : 1,
    );
    await expectTemplateUsage(
      rootAgent,
      genericDepartmentTemplateV2.uid,
      expectedGenericDepartmentFallback.uid === genericDepartmentTemplateV2.uid ? 1 : 0,
    );
    await expectTemplateUsage(rootAgent, secondaryDepartmentTemplate.uid, 0);
    await expectTemplateUsage(rootAgent, departmentTemplate.uid, 1);
  });

  it('should support popup.tryTemplate through batch APIs and compose popup specs', async () => {
    await rootAgent.resource('collections').create({
      values: {
        name: 'popup_try_template_batch_targets',
        title: 'Popup Try Template Batch Targets',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'label', type: 'string', interface: 'input' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      popup_try_template_batch_targets: ['name', 'code', 'label', 'scope'],
    });

    const page = await createPage(rootAgent, {
      title: 'Popup tryTemplate batch page',
      tabTitle: 'Popup tryTemplate batch tab',
    });

    const sourceTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'popup_try_template_batch_targets',
      },
    });
    const sourceAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: sourceTable.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'batch-template-table',
                type: 'table',
                resource: {
                  binding: 'currentCollection',
                },
                defaultFilter: nameCodeDefaultFilter(),
                fields: ['name', 'code'],
              },
            ],
          },
        },
      }),
    );
    const popupTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceAction.uid },
      name: 'Batch popup tryTemplate template',
      description: 'Reusable popup template used to verify batch and compose popup.tryTemplate coverage.',
      saveMode: 'duplicate',
    });

    const batchDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'popup_try_template_batch_targets',
      },
    });
    const addFieldsResult = getData(
      await rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: { uid: batchDetails.uid },
          fields: [
            {
              key: 'batch-name',
              fieldPath: 'name',
              popup: {
                tryTemplate: true,
              },
            },
          ],
        },
      }),
    );
    expect(addFieldsResult.successCount).toBe(1);
    const batchFieldUid = addFieldsResult.fields[0].result.fieldUid || addFieldsResult.fields[0].result.uid;
    const batchFieldSurface = await getSurface(rootAgent, { uid: batchFieldUid });
    expect(batchFieldSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });

    const batchActionTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'popup_try_template_batch_targets',
      },
    });
    const addActionsResult = getData(
      await rootAgent.resource('flowSurfaces').addActions({
        values: {
          target: { uid: batchActionTable.uid },
          actions: [
            {
              key: 'batch-popup-action',
              type: 'popup',
              popup: {
                tryTemplate: true,
              },
            },
          ],
        },
      }),
    );
    expect(addActionsResult.successCount).toBe(1);
    const batchActionSurface = await getSurface(rootAgent, {
      uid: addActionsResult.actions[0].result.uid,
    });
    expect(batchActionSurface.tree.popup.template).toMatchObject({
      uid: popupTemplate.uid,
      mode: 'reference',
    });

    const addRecordActionsResult = getData(
      await rootAgent.resource('flowSurfaces').addRecordActions({
        values: {
          target: { uid: batchActionTable.uid },
          recordActions: [
            {
              key: 'batch-view-action',
              type: 'view',
              popup: {
                tryTemplate: true,
              },
            },
          ],
        },
      }),
    );
    expect(addRecordActionsResult.successCount).toBe(1);
    const batchRecordActionSurface = await getSurface(rootAgent, {
      uid: addRecordActionsResult.recordActions[0].result.uid,
    });
    expect(batchRecordActionSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });

    const composeResult = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.gridUid },
          blocks: [
            {
              key: 'composeTryTable',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'popup_try_template_batch_targets',
              },
              defaultFilter: nameCodeDefaultFilter(),
              fields: ['name', 'code'],
              actions: [
                {
                  key: 'composePopupAction',
                  type: 'popup',
                  popup: {
                    tryTemplate: true,
                  },
                },
              ],
              recordActions: [
                {
                  key: 'composeViewAction',
                  type: 'view',
                  popup: {
                    tryTemplate: true,
                  },
                },
              ],
            },
          ],
        },
      }),
    );
    const composedTable = composeResult.blocks.find((item: any) => item.key === 'composeTryTable');
    const composedPopupAction = composedTable.actions.find((item: any) => item.key === 'composePopupAction');
    const composedViewAction = composedTable.recordActions.find((item: any) => item.key === 'composeViewAction');
    const composedPopupActionSurface = await getSurface(rootAgent, { uid: composedPopupAction.uid });
    expect(composedPopupActionSurface.tree.popup.template).toMatchObject({
      uid: popupTemplate.uid,
      mode: 'reference',
    });
    const composedViewActionSurface = await getSurface(rootAgent, { uid: composedViewAction.uid });
    expect(composedViewActionSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
  });

  it('should save local popup content as templates through add batch and compose APIs via popup.saveAsTemplate', async () => {
    const unique = Date.now();
    const page = await createPage(rootAgent, {
      title: `Popup saveAsTemplate page ${unique}`,
      tabTitle: 'Popup saveAsTemplate tab',
    });
    const detailsBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const tableBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    async function expectSavedPopupTemplateReference(templateName: string, targetUid: string) {
      const listed = getListData(
        await rootAgent.resource('flowSurfaces').listTemplates({
          values: {
            type: 'popup',
            search: templateName,
          },
        }),
      );
      const template = listed.rows.find((row: any) => row.name === templateName);
      expect(template?.uid).toBeTruthy();

      const surface = await getSurface(rootAgent, { uid: targetUid });
      expect(surface.tree.popup?.template).toMatchObject({
        uid: template.uid,
        mode: 'reference',
      });
      expect(surface.tree.popup?.pageUid).toBeUndefined();
      expect(surface.tree.popup?.tabUid).toBeUndefined();
      expect(surface.tree.popup?.gridUid).toBeUndefined();
      const templateWithUsage = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: template.uid,
          },
        }),
      );
      expect(templateWithUsage.usageCount).toBeGreaterThanOrEqual(1);
      return template;
    }

    const addFieldTemplateName = `Popup saveAsTemplate addField ${unique}`;
    const addFieldRes = await addFieldData(rootAgent, {
      target: { uid: detailsBlock.uid },
      fieldPath: 'nickname',
      popup: {
        blocks: [
          {
            key: 'addFieldPopupDetails',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname'],
          },
        ],
        saveAsTemplate: {
          name: addFieldTemplateName,
          description: 'Popup template saved from addField.',
        },
      },
    });
    expect(addFieldRes.popupPageUid).toBeUndefined();
    await expectSavedPopupTemplateReference(addFieldTemplateName, addFieldRes.fieldUid || addFieldRes.uid);

    const addFieldsTemplateName = `Popup saveAsTemplate addFields ${unique}`;
    const addFieldsRes = getData(
      await rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: { uid: detailsBlock.uid },
          fields: [
            {
              key: 'addFieldsStatus',
              fieldPath: 'status',
              popup: {
                blocks: [
                  {
                    key: 'addFieldsPopupDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: ['status'],
                  },
                ],
                saveAsTemplate: {
                  name: addFieldsTemplateName,
                  description: 'Popup template saved from addFields.',
                },
              },
            },
          ],
        },
      }),
    );
    expect(addFieldsRes.successCount).toBe(1);
    expect(addFieldsRes.fields[0].result.popupPageUid).toBeUndefined();
    await expectSavedPopupTemplateReference(
      addFieldsTemplateName,
      addFieldsRes.fields[0].result.fieldUid || addFieldsRes.fields[0].result.uid,
    );

    const addActionTemplateName = `Popup saveAsTemplate addAction ${unique}`;
    const addActionRes = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: tableBlock.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'addActionPopupTable',
                type: 'table',
                resource: {
                  binding: 'currentCollection',
                },
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname', 'status'],
              },
            ],
            saveAsTemplate: {
              name: addActionTemplateName,
              description: 'Popup template saved from addAction.',
            },
          },
        },
      }),
    );
    expect(addActionRes.popupPageUid).toBeUndefined();
    await expectSavedPopupTemplateReference(addActionTemplateName, addActionRes.uid);

    const addActionsTemplateName = `Popup saveAsTemplate addActions ${unique}`;
    const addActionsRes = getData(
      await rootAgent.resource('flowSurfaces').addActions({
        values: {
          target: { uid: tableBlock.uid },
          actions: [
            {
              key: 'addActionsPopup',
              type: 'popup',
              popup: {
                blocks: [
                  {
                    key: 'addActionsPopupTable',
                    type: 'table',
                    resource: {
                      binding: 'currentCollection',
                    },
                    defaultFilter: employeeDefaultFilter(),
                    fields: ['nickname'],
                  },
                ],
                saveAsTemplate: {
                  name: addActionsTemplateName,
                  description: 'Popup template saved from addActions.',
                },
              },
            },
          ],
        },
      }),
    );
    expect(addActionsRes.successCount).toBe(1);
    expect(addActionsRes.actions[0].result.popupPageUid).toBeUndefined();
    await expectSavedPopupTemplateReference(addActionsTemplateName, addActionsRes.actions[0].result.uid);

    const addRecordActionTemplateName = `Popup saveAsTemplate addRecordAction ${unique}`;
    const addRecordActionRes = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: tableBlock.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'addRecordActionPopupDetails',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['nickname', 'status'],
              },
            ],
            saveAsTemplate: {
              name: addRecordActionTemplateName,
              description: 'Popup template saved from addRecordAction.',
            },
          },
        },
      }),
    );
    expect(addRecordActionRes.popupPageUid).toBeUndefined();
    await expectSavedPopupTemplateReference(addRecordActionTemplateName, addRecordActionRes.uid);

    const addRecordActionsTemplateName = `Popup saveAsTemplate addRecordActions ${unique}`;
    const addRecordActionsRes = getData(
      await rootAgent.resource('flowSurfaces').addRecordActions({
        values: {
          target: { uid: tableBlock.uid },
          recordActions: [
            {
              key: 'addRecordActionsView',
              type: 'view',
              popup: {
                blocks: [
                  {
                    key: 'addRecordActionsPopupDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: ['nickname'],
                  },
                ],
                saveAsTemplate: {
                  name: addRecordActionsTemplateName,
                  description: 'Popup template saved from addRecordActions.',
                },
              },
            },
          ],
        },
      }),
    );
    expect(addRecordActionsRes.successCount).toBe(1);
    expect(addRecordActionsRes.recordActions[0].result.popupPageUid).toBeUndefined();
    await expectSavedPopupTemplateReference(
      addRecordActionsTemplateName,
      addRecordActionsRes.recordActions[0].result.uid,
    );

    const composeFieldTemplateName = `Popup saveAsTemplate composeField ${unique}`;
    const composeActionTemplateName = `Popup saveAsTemplate composeAction ${unique}`;
    const composeRecordActionTemplateName = `Popup saveAsTemplate composeRecordAction ${unique}`;
    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.gridUid },
          blocks: [
            {
              key: 'composeDetails',
              type: 'details',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: [
                {
                  key: 'composeNicknameField',
                  fieldPath: 'nickname',
                  popup: {
                    blocks: [
                      {
                        key: 'composeFieldPopupDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['nickname'],
                      },
                    ],
                    saveAsTemplate: {
                      name: composeFieldTemplateName,
                      description: 'Popup template saved from compose field popup.',
                    },
                  },
                },
              ],
            },
            {
              key: 'composeTable',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              defaultFilter: employeeDefaultFilter(),
              fields: ['nickname', 'status'],
              actions: [
                {
                  key: 'composePopupAction',
                  type: 'popup',
                  popup: {
                    blocks: [
                      {
                        key: 'composeActionPopupTable',
                        type: 'table',
                        resource: {
                          binding: 'currentCollection',
                        },
                        defaultFilter: employeeDefaultFilter(),
                        fields: ['nickname'],
                      },
                    ],
                    saveAsTemplate: {
                      name: composeActionTemplateName,
                      description: 'Popup template saved from compose action popup.',
                    },
                  },
                },
              ],
              recordActions: [
                {
                  key: 'composeViewAction',
                  type: 'view',
                  popup: {
                    blocks: [
                      {
                        key: 'composeRecordActionPopupDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['status'],
                      },
                    ],
                    saveAsTemplate: {
                      name: composeRecordActionTemplateName,
                      description: 'Popup template saved from compose record action popup.',
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );
    const composedDetails = composeRes.blocks.find((item: any) => item.key === 'composeDetails');
    const composedField = composedDetails.fields.find((item: any) => item.key === 'composeNicknameField');
    await expectSavedPopupTemplateReference(composeFieldTemplateName, composedField.fieldUid || composedField.uid);

    const composedTable = composeRes.blocks.find((item: any) => item.key === 'composeTable');
    const composedPopupAction = composedTable.actions.find((item: any) => item.key === 'composePopupAction');
    await expectSavedPopupTemplateReference(composeActionTemplateName, composedPopupAction.uid);
    const composedViewAction = composedTable.recordActions.find((item: any) => item.key === 'composeViewAction');
    await expectSavedPopupTemplateReference(composeRecordActionTemplateName, composedViewAction.uid);
  });

  it.skip('should support combining popup.tryTemplate with popup.saveAsTemplate across create-time popup writes', async () => {
    const unique = Date.now();
    const fieldBaseCollection = `popup_try_save_field_base_${unique}`;
    const fieldMissCollection = `popup_try_save_field_miss_${unique}`;
    const actionBaseCollection = `popup_try_save_action_base_${unique}`;
    const actionMissCollection = `popup_try_save_action_miss_${unique}`;
    const recordBaseCollection = `popup_try_save_record_base_${unique}`;
    const recordMissCollection = `popup_try_save_record_miss_${unique}`;
    const recordNoBlocksCollection = `popup_try_save_record_no_blocks_${unique}`;

    await createPopupTestCollection(fieldBaseCollection);
    await createPopupTestCollection(fieldMissCollection);
    await createPopupTestCollection(actionBaseCollection);
    await createPopupTestCollection(actionMissCollection);
    await createPopupTestCollection(recordBaseCollection);
    await createPopupTestCollection(recordMissCollection);
    await createPopupTestCollection(recordNoBlocksCollection);

    const page = await createPage(rootAgent, {
      title: `Popup try+save template page ${unique}`,
      tabTitle: 'Popup try+save template tab',
    });
    const fieldBaseDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: fieldBaseCollection,
      },
    });
    const fieldMissDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: fieldMissCollection,
      },
    });
    const actionBaseTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: actionBaseCollection,
      },
    });
    const actionMissTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: actionMissCollection,
      },
    });
    const recordBaseTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: recordBaseCollection,
      },
    });
    const recordMissTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: recordMissCollection,
      },
    });
    const recordNoBlocksDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: recordNoBlocksCollection,
      },
    });

    const fieldNoBlocksRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: fieldBaseDetails.uid },
        fieldPath: 'name',
        popup: {
          tryTemplate: true,
          saveAsTemplate: {
            name: `Popup try+save field no blocks ${unique}`,
            description: 'Combined mode must require local blocks after a tryTemplate miss.',
          },
        },
      },
    });
    expect(fieldNoBlocksRes.status).toBe(400);
    expect(readErrorMessage(fieldNoBlocksRes)).toContain('popup.saveAsTemplate requires explicit local popup.blocks');

    const sourceField = await addFieldData(rootAgent, {
      target: { uid: fieldBaseDetails.uid },
      fieldPath: 'name',
      popup: {
        blocks: [
          {
            key: 'fieldHitSourcePopup',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['name'],
          },
        ],
      },
    });
    const sourceFieldTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceField.fieldUid || sourceField.uid },
      name: `Popup try+save field source ${unique}`,
      description: 'Existing popup template for combined tryTemplate + saveAsTemplate hit coverage.',
      saveMode: 'duplicate',
    });

    const fieldHitIgnoredTemplateName = `Popup try+save field hit ignored ${unique}`;
    const fieldHit = await addFieldData(rootAgent, {
      target: { uid: fieldBaseDetails.uid },
      fieldPath: 'code',
      popup: {
        tryTemplate: true,
        saveAsTemplate: {
          name: fieldHitIgnoredTemplateName,
          description: 'Ignored on tryTemplate hit.',
        },
      },
    });
    await expectPopupTemplateReference(fieldHit.fieldUid || fieldHit.uid, sourceFieldTemplate.uid);
    expect(await findPopupTemplateByName(fieldHitIgnoredTemplateName)).toBeUndefined();

    const fieldMissTemplateName = `Popup try+save field miss ${unique}`;
    const fieldMiss = await addFieldData(rootAgent, {
      target: { uid: fieldMissDetails.uid },
      fieldPath: 'name',
      popup: {
        tryTemplate: true,
        blocks: [
          {
            key: 'fieldMissPopup',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['name'],
          },
        ],
        saveAsTemplate: {
          name: fieldMissTemplateName,
          description: 'Saved after tryTemplate miss fallback for addField.',
        },
      },
    });
    const fieldMissTemplate = await findPopupTemplateByName(fieldMissTemplateName);
    expect(fieldMissTemplate?.uid).toBeTruthy();
    await expectPopupTemplateReference(fieldMiss.fieldUid || fieldMiss.uid, fieldMissTemplate.uid);

    const actionNoBlocksRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: actionBaseTable.uid },
        type: 'popup',
        popup: {
          tryTemplate: true,
          saveAsTemplate: {
            name: `Popup try+save action no blocks ${unique}`,
            description: 'Combined mode must require local blocks after a tryTemplate miss.',
          },
        },
      },
    });
    expect(actionNoBlocksRes.status).toBe(400);
    expect(readErrorMessage(actionNoBlocksRes)).toContain('popup.saveAsTemplate requires explicit local popup.blocks');

    const sourceAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: actionBaseTable.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'actionHitSourcePopup',
                type: 'table',
                resource: {
                  binding: 'currentCollection',
                },
                defaultFilter: nameLabelCodeDefaultFilter(),
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const sourceActionTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceAction.uid },
      name: `Popup try+save action source ${unique}`,
      description: 'Existing popup template for combined tryTemplate + saveAsTemplate action hit coverage.',
      saveMode: 'duplicate',
    });

    const actionHitIgnoredTemplateName = `Popup try+save action hit ignored ${unique}`;
    const actionHit = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: actionBaseTable.uid },
          type: 'popup',
          popup: {
            tryTemplate: true,
            saveAsTemplate: {
              name: actionHitIgnoredTemplateName,
              description: 'Ignored on tryTemplate hit.',
            },
          },
        },
      }),
    );
    await expectPopupTemplateReference(actionHit.uid, sourceActionTemplate.uid);
    expect(await findPopupTemplateByName(actionHitIgnoredTemplateName)).toBeUndefined();

    const actionMissTemplateName = `Popup try+save action miss ${unique}`;
    const actionMiss = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: actionMissTable.uid },
          type: 'popup',
          popup: {
            tryTemplate: true,
            blocks: [
              {
                key: 'actionMissPopup',
                type: 'table',
                resource: {
                  binding: 'currentCollection',
                },
                defaultFilter: nameLabelCodeDefaultFilter(),
                fields: ['name'],
              },
            ],
            saveAsTemplate: {
              name: actionMissTemplateName,
              description: 'Saved after tryTemplate miss fallback for addAction.',
            },
          },
        },
      }),
    );
    const actionMissTemplate = await findPopupTemplateByName(actionMissTemplateName);
    expect(actionMissTemplate?.uid).toBeTruthy();
    await expectPopupTemplateReference(actionMiss.uid, actionMissTemplate.uid);

    const recordNoBlocksRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: recordNoBlocksDetails.uid },
        type: 'view',
        popup: {
          tryTemplate: true,
          saveAsTemplate: {
            name: `Popup try+save record no blocks ${unique}`,
            description: 'Combined mode must require local blocks after a tryTemplate miss.',
          },
        },
      },
    });
    expect(recordNoBlocksRes.status).toBe(400);
    expect(readErrorMessage(recordNoBlocksRes)).toContain('popup.saveAsTemplate requires explicit local popup.blocks');

    const sourceRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: recordBaseTable.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'recordHitSourcePopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const sourceRecordTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceRecordAction.uid },
      name: `Popup try+save record source ${unique}`,
      description: 'Existing popup template for combined tryTemplate + saveAsTemplate record hit coverage.',
      saveMode: 'duplicate',
    });

    const recordHitIgnoredTemplateName = `Popup try+save record hit ignored ${unique}`;
    const recordHit = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: recordBaseTable.uid },
          type: 'view',
          popup: {
            tryTemplate: true,
            saveAsTemplate: {
              name: recordHitIgnoredTemplateName,
              description: 'Ignored on tryTemplate hit.',
            },
          },
        },
      }),
    );
    await expectPopupTemplateReference(recordHit.uid, sourceRecordTemplate.uid);
    expect(await findPopupTemplateByName(recordHitIgnoredTemplateName)).toBeUndefined();

    const recordMissTemplateName = `Popup try+save record miss ${unique}`;
    const recordMiss = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: recordMissTable.uid },
          type: 'view',
          popup: {
            tryTemplate: true,
            blocks: [
              {
                key: 'recordMissPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
            saveAsTemplate: {
              name: recordMissTemplateName,
              description: 'Saved after tryTemplate miss fallback for addRecordAction.',
            },
          },
        },
      }),
    );
    const recordMissSurface = await getSurface(rootAgent, { uid: recordMiss.uid });
    const recordMissReusedTemplateUid = recordMissSurface.tree.popup?.template?.uid;
    expect(recordMissReusedTemplateUid).toBeTruthy();
    expect(await findPopupTemplateByName(recordMissTemplateName)).toBeUndefined();

    const addFieldsHitIgnoredTemplateName = `Popup try+save addFields hit ignored ${unique}`;
    const addFieldsHitRes = getData(
      await rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: { uid: fieldBaseDetails.uid },
          fields: [
            {
              key: 'batchHitField',
              fieldPath: 'label',
              popup: {
                tryTemplate: true,
                saveAsTemplate: {
                  name: addFieldsHitIgnoredTemplateName,
                  description: 'Ignored on tryTemplate hit through addFields.',
                },
              },
            },
          ],
        },
      }),
    );
    expect(addFieldsHitRes.successCount).toBe(1);
    await expectPopupTemplateReference(
      addFieldsHitRes.fields[0].result.fieldUid || addFieldsHitRes.fields[0].result.uid,
      sourceFieldTemplate.uid,
    );
    expect(await findPopupTemplateByName(addFieldsHitIgnoredTemplateName)).toBeUndefined();

    const addActionsHitIgnoredTemplateName = `Popup try+save addActions hit ignored ${unique}`;
    const addActionsHitRes = getData(
      await rootAgent.resource('flowSurfaces').addActions({
        values: {
          target: { uid: actionBaseTable.uid },
          actions: [
            {
              key: 'batchHitAction',
              type: 'popup',
              popup: {
                tryTemplate: true,
                saveAsTemplate: {
                  name: addActionsHitIgnoredTemplateName,
                  description: 'Ignored on tryTemplate hit through addActions.',
                },
              },
            },
          ],
        },
      }),
    );
    expect(addActionsHitRes.successCount).toBe(1);
    await expectPopupTemplateReference(addActionsHitRes.actions[0].result.uid, sourceActionTemplate.uid);
    expect(await findPopupTemplateByName(addActionsHitIgnoredTemplateName)).toBeUndefined();

    const addRecordActionsHitIgnoredTemplateName = `Popup try+save addRecordActions hit ignored ${unique}`;
    const addRecordActionsHitRes = getData(
      await rootAgent.resource('flowSurfaces').addRecordActions({
        values: {
          target: { uid: recordBaseTable.uid },
          recordActions: [
            {
              key: 'batchHitRecordAction',
              type: 'view',
              popup: {
                tryTemplate: true,
                saveAsTemplate: {
                  name: addRecordActionsHitIgnoredTemplateName,
                  description: 'Ignored on tryTemplate hit through addRecordActions.',
                },
              },
            },
          ],
        },
      }),
    );
    expect(addRecordActionsHitRes.successCount).toBe(1);
    await expectPopupTemplateReference(addRecordActionsHitRes.recordActions[0].result.uid, sourceRecordTemplate.uid);
    expect(await findPopupTemplateByName(addRecordActionsHitIgnoredTemplateName)).toBeUndefined();

    await expectTemplateUsage(rootAgent, sourceFieldTemplate.uid, 2);
    await expectTemplateUsage(rootAgent, sourceActionTemplate.uid, 2);
    await expectTemplateUsage(rootAgent, sourceRecordTemplate.uid, 2);
    await expectTemplateUsage(rootAgent, fieldMissTemplate.uid, 1);
    await expectTemplateUsage(rootAgent, actionMissTemplate.uid, 1);
  });

  it.skip('should prefer view scene popup templates over newer generic fallbacks for field popups', async () => {
    const unique = Date.now();
    const collection = `popup_scene_field_${unique}`;
    const viewTemplateName = `Popup scene field view ${unique}`;
    const genericTemplateName = `Popup scene field generic ${unique}`;
    await createPopupTestCollection(collection);

    const page = await createPage(rootAgent, {
      title: `Popup scene field page ${unique}`,
      tabTitle: 'Popup scene field tab',
    });
    const details = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: collection,
      },
    });

    const viewSourceField = await addFieldData(rootAgent, {
      target: { uid: details.uid },
      fieldPath: 'name',
      popup: {
        blocks: [
          {
            key: 'viewScenePopup',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['name'],
          },
        ],
      },
    });
    const viewTemplate = await saveTemplate(rootAgent, {
      target: { uid: viewSourceField.fieldUid || viewSourceField.uid },
      name: viewTemplateName,
      description: 'View scene popup template for field scene priority.',
      saveMode: 'duplicate',
    });

    const genericSourceField = await addFieldData(rootAgent, {
      target: { uid: details.uid },
      fieldPath: 'code',
      popup: {
        blocks: [
          {
            key: 'genericScenePopup',
            type: 'table',
            resource: {
              binding: 'otherRecords',
              collectionName: collection,
            },
            defaultFilter: nameCodeDefaultFilter(),
            fields: ['name'],
          },
        ],
      },
    });
    const genericTemplate = await saveTemplate(rootAgent, {
      target: { uid: genericSourceField.fieldUid || genericSourceField.uid },
      name: genericTemplateName,
      description: 'Generic popup template that should remain a fallback for field popups.',
      saveMode: 'duplicate',
    });
    getData(
      await rootAgent.resource('flowSurfaces').updateTemplate({
        values: {
          uid: genericTemplate.uid,
          name: genericTemplateName,
          description: 'Newer generic popup template that should remain a fallback for field popups.',
        },
      }),
    );

    const consumerField = await addFieldData(rootAgent, {
      target: { uid: details.uid },
      fieldPath: 'label',
      popup: {
        tryTemplate: true,
      },
    });

    await expectPopupTemplateReference(consumerField.fieldUid || consumerField.uid, viewTemplate.uid);
    const genericTemplateWithUsage = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: genericTemplate.uid,
        },
      }),
    );
    expect(genericTemplateWithUsage.usageCount).toBe(0);
  });

  it('should let implicit default view actions reuse field view templates without host priority', async () => {
    const unique = Date.now();
    const collection = `popup_scene_no_host_${unique}`;
    await createPopupTestCollection(collection);

    const page = await createPage(rootAgent, {
      title: `Popup scene no host page ${unique}`,
      tabTitle: 'Popup scene no host tab',
    });
    const details = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: collection,
      },
    });
    const sourceField = await addFieldData(rootAgent, {
      target: { uid: details.uid },
      fieldPath: 'name',
      popup: {
        blocks: [
          {
            key: 'fieldViewPopup',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['name', 'code'],
          },
        ],
      },
    });
    const fieldTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceField.fieldUid || sourceField.uid },
      name: `Popup scene no host source ${unique}`,
      description: 'Field-origin view popup template reusable by same-scene default actions.',
      saveMode: 'duplicate',
    });

    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: collection,
      },
    });
    const action = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
        },
      }),
    );

    await expectPopupTemplateReference(action.uid, fieldTemplate.uid);
  });

  it('should reuse popup templates created earlier in the same compose call via popup.template.local', async () => {
    const unique = Date.now();
    const fieldTemplateName = `Compose popup local field ${unique}`;
    const nestedTemplateName = `Compose popup local nested ${unique}`;
    const page = await createPage(rootAgent, {
      title: `Compose popup local page ${unique}`,
      tabTitle: 'Compose popup local tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.gridUid },
          blocks: [
            {
              key: 'sourceDetails',
              type: 'details',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: [
                {
                  key: 'producerField',
                  fieldPath: 'nickname',
                  popup: {
                    blocks: [
                      {
                        key: 'producerPopupDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: [
                          {
                            key: 'nestedProducerField',
                            fieldPath: 'status',
                            popup: {
                              blocks: [
                                {
                                  key: 'nestedPopupDetails',
                                  type: 'details',
                                  resource: {
                                    binding: 'currentRecord',
                                  },
                                  fields: ['status'],
                                },
                              ],
                              saveAsTemplate: {
                                name: nestedTemplateName,
                                description: 'Nested popup template created earlier in the same compose call.',
                                local: 'nestedPopupAlias',
                              },
                            },
                          },
                        ],
                      },
                    ],
                    saveAsTemplate: {
                      name: fieldTemplateName,
                      description: 'Popup template created earlier in the same compose call.',
                      local: 'fieldPopupAlias',
                    },
                  },
                },
                {
                  key: 'fieldConsumer',
                  fieldPath: 'status',
                  popup: {
                    template: {
                      local: 'fieldPopupAlias',
                      mode: 'reference',
                    },
                  },
                },
              ],
            },
            {
              key: 'employeeTable',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              defaultFilter: employeeDefaultFilter(),
              fields: ['nickname'],
              recordActions: [
                {
                  key: 'fieldPopupRecordConsumer',
                  type: 'view',
                  popup: {
                    template: {
                      local: 'fieldPopupAlias',
                      mode: 'reference',
                    },
                  },
                },
                {
                  key: 'recordActionConsumer',
                  type: 'view',
                  popup: {
                    template: {
                      local: 'nestedPopupAlias',
                      mode: 'reference',
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const listedTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          search: unique,
        },
      }),
    );
    const fieldTemplate = listedTemplates.rows.find((row: any) => row.name === fieldTemplateName);
    const nestedTemplate = listedTemplates.rows.find((row: any) => row.name === nestedTemplateName);
    expect(fieldTemplate?.uid).toBeTruthy();
    expect(nestedTemplate?.uid).toBeTruthy();

    const composedDetails = composeRes.blocks.find((item: any) => item.key === 'sourceDetails');
    const fieldConsumer = composedDetails.fields.find((item: any) => item.key === 'fieldConsumer');
    const composedTable = composeRes.blocks.find((item: any) => item.key === 'employeeTable');
    const fieldPopupRecordConsumer = composedTable.recordActions.find(
      (item: any) => item.key === 'fieldPopupRecordConsumer',
    );
    const recordActionConsumer = composedTable.recordActions.find((item: any) => item.key === 'recordActionConsumer');

    const fieldConsumerSurface = await getSurface(rootAgent, {
      uid: fieldConsumer.fieldUid || fieldConsumer.uid,
    });
    expect(fieldConsumerSurface.tree.popup?.template).toMatchObject({
      uid: fieldTemplate.uid,
      mode: 'reference',
    });

    const fieldPopupRecordConsumerSurface = await getSurface(rootAgent, {
      uid: fieldPopupRecordConsumer.uid,
    });
    expect(fieldPopupRecordConsumerSurface.tree.popup?.template).toMatchObject({
      uid: fieldTemplate.uid,
      mode: 'reference',
    });

    const recordActionConsumerSurface = await getSurface(rootAgent, {
      uid: recordActionConsumer.uid,
    });
    expect(recordActionConsumerSurface.tree.popup?.template).toMatchObject({
      uid: nestedTemplate.uid,
      mode: 'reference',
    });

    await expectTemplateUsage(rootAgent, fieldTemplate.uid, 3);
    await expectTemplateUsage(rootAgent, nestedTemplate.uid, 2);
  });

  it('should not treat popup.template.local as a generated popup requiring default fieldGroups', async () => {
    const unique = Date.now();
    const collectionName = `popup_local_large_${unique}`;
    const fieldNames = Array.from({ length: 11 }, (_item, index) => `field${index + 1}`);
    const templateName = `Compose popup local large ${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        fields: fieldNames.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [collectionName]: fieldNames,
    });

    const page = await createPage(rootAgent, {
      title: `Compose popup local large page ${unique}`,
      tabTitle: 'Compose popup local large tab',
    });
    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.gridUid },
          defaults: {
            collections: {
              [collectionName]: {
                fieldGroups: [
                  {
                    title: 'All fields',
                    fields: fieldNames,
                  },
                ],
              },
            },
          },
          blocks: [
            {
              key: 'producerDetails',
              type: 'details',
              resource: {
                dataSourceKey: 'main',
                collectionName,
              },
              fields: [
                {
                  key: 'producerField',
                  fieldPath: 'field1',
                  popup: {
                    blocks: [
                      {
                        key: 'producerPopupDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['field1', 'field2', 'field3'],
                      },
                    ],
                    saveAsTemplate: {
                      name: templateName,
                      description: 'Large collection popup template created earlier in the same compose call.',
                      local: 'largePopupAlias',
                    },
                  },
                },
                'field2',
                'field3',
              ],
            },
            {
              key: 'consumerTable',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName,
              },
              defaultFilter: defaultFilterFor(['field1', 'field2', 'field3', 'field4']),
              fields: ['field1', 'field2', 'field3'],
              recordActions: [
                {
                  key: 'consumerView',
                  type: 'view',
                  popup: {
                    template: {
                      local: 'largePopupAlias',
                      mode: 'reference',
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const template = await findPopupTemplateByName(templateName);
    const consumerTable = composeRes.blocks.find((item: any) => item.key === 'consumerTable');
    const consumerAction = consumerTable.recordActions.find((item: any) => item.key === 'consumerView');
    await expectPopupTemplateReference(consumerAction.uid, template.uid);
  });

  it('should let popup.template.local reuse the final bound template uid from combined tryTemplate + saveAsTemplate producers in compose', async () => {
    const unique = Date.now();
    const hitCollection = `popup_compose_hit_${unique}`;
    const missCollection = `popup_compose_miss_${unique}`;
    await createPopupTestCollection(hitCollection);
    await createPopupTestCollection(missCollection);

    const page = await createPage(rootAgent, {
      title: `Compose combined popup alias page ${unique}`,
      tabTitle: 'Compose combined popup alias tab',
    });

    const sourceDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: hitCollection,
      },
    });
    const sourceField = await addFieldData(rootAgent, {
      target: { uid: sourceDetails.uid },
      fieldPath: 'name',
      popup: {
        blocks: [
          {
            key: 'composeCombinedHitSourcePopup',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['name'],
          },
        ],
      },
    });
    const sourceTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceField.fieldUid || sourceField.uid },
      name: `Compose combined popup hit source ${unique}`,
      description: 'Existing template reused through a combined compose producer.',
      saveMode: 'duplicate',
    });

    const hitIgnoredTemplateName = `Compose combined popup hit ignored ${unique}`;
    const composeHitRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.gridUid },
          blocks: [
            {
              key: 'hitDetails',
              type: 'details',
              resource: {
                dataSourceKey: 'main',
                collectionName: hitCollection,
              },
              fields: [
                {
                  key: 'hitProducer',
                  fieldPath: 'code',
                  popup: {
                    tryTemplate: true,
                    saveAsTemplate: {
                      name: hitIgnoredTemplateName,
                      description: 'Ignored on tryTemplate hit inside compose.',
                      local: 'composeHitAlias',
                    },
                  },
                },
                {
                  key: 'hitConsumer',
                  fieldPath: 'label',
                  popup: {
                    template: {
                      local: 'composeHitAlias',
                      mode: 'reference',
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );
    const hitDetails = composeHitRes.blocks.find((item: any) => item.key === 'hitDetails');
    const hitProducer = hitDetails.fields.find((item: any) => item.key === 'hitProducer');
    const hitConsumer = hitDetails.fields.find((item: any) => item.key === 'hitConsumer');
    await expectPopupTemplateReference(hitProducer.fieldUid || hitProducer.uid, sourceTemplate.uid);
    await expectPopupTemplateReference(hitConsumer.fieldUid || hitConsumer.uid, sourceTemplate.uid);
    expect(await findPopupTemplateByName(hitIgnoredTemplateName)).toBeUndefined();
    await expectTemplateUsage(rootAgent, sourceTemplate.uid, 2);

    const missTemplateName = `Compose combined popup miss ${unique}`;
    const composeMissRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.gridUid },
          blocks: [
            {
              key: 'missDetails',
              type: 'details',
              resource: {
                dataSourceKey: 'main',
                collectionName: missCollection,
              },
              fields: [
                {
                  key: 'missProducer',
                  fieldPath: 'name',
                  popup: {
                    tryTemplate: true,
                    blocks: [
                      {
                        key: 'composeCombinedMissPopup',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name'],
                      },
                    ],
                    saveAsTemplate: {
                      name: missTemplateName,
                      description: 'Saved after tryTemplate miss inside compose.',
                      local: 'composeMissAlias',
                    },
                  },
                },
                {
                  key: 'missConsumer',
                  fieldPath: 'code',
                  popup: {
                    template: {
                      local: 'composeMissAlias',
                      mode: 'reference',
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    );
    const missTemplate = await findPopupTemplateByName(missTemplateName);
    expect(missTemplate?.uid).toBeTruthy();
    const missDetails = composeMissRes.blocks.find((item: any) => item.key === 'missDetails');
    const missProducer = missDetails.fields.find((item: any) => item.key === 'missProducer');
    const missConsumer = missDetails.fields.find((item: any) => item.key === 'missConsumer');
    await expectPopupTemplateReference(missProducer.fieldUid || missProducer.uid, missTemplate.uid);
    await expectPopupTemplateReference(missConsumer.fieldUid || missConsumer.uid, missTemplate.uid);
    await expectTemplateUsage(rootAgent, missTemplate.uid, 2);
  });

  it('should reject invalid compose popup local template alias usage and direct add local aliases', async () => {
    const unique = Date.now();
    const page = await createPage(rootAgent, {
      title: `Compose popup local validation page ${unique}`,
      tabTitle: 'Compose popup local validation tab',
    });

    const forwardReferenceRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'forwardRefTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            defaultFilter: employeeDefaultFilter(),
            fields: [
              {
                key: 'fieldBeforeActionProducer',
                fieldPath: 'nickname',
                popup: {
                  template: {
                    local: 'futureActionPopup',
                    mode: 'reference',
                  },
                },
              },
            ],
            actions: [
              {
                key: 'laterPopupProducer',
                type: 'popup',
                popup: {
                  blocks: [
                    {
                      key: 'futureActionPopupBlock',
                      type: 'table',
                      resource: {
                        binding: 'currentCollection',
                      },
                      defaultFilter: employeeDefaultFilter(),
                      fields: ['nickname'],
                    },
                  ],
                  saveAsTemplate: {
                    name: `Future action popup ${unique}`,
                    description: 'Created too late for field phase consumers.',
                    local: 'futureActionPopup',
                  },
                },
              },
            ],
          },
        ],
      },
    });
    expect(forwardReferenceRes.status).toBe(400);
    expect(readErrorMessage(forwardReferenceRes)).toContain(
      "flowSurfaces compose.blocks[0].fields[0].popup.template.local 'futureActionPopup' must reference an earlier popup.saveAsTemplate.local in the same request",
    );

    const duplicateAliasRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'duplicateAliasDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: [
              {
                key: 'duplicateAliasFieldA',
                fieldPath: 'nickname',
                popup: {
                  blocks: [
                    {
                      key: 'duplicateAliasPopupA',
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
                      },
                      fields: ['nickname'],
                    },
                  ],
                  saveAsTemplate: {
                    name: `Duplicate popup alias A ${unique}`,
                    description: 'First duplicate alias producer.',
                    local: 'duplicateAlias',
                  },
                },
              },
              {
                key: 'duplicateAliasFieldB',
                fieldPath: 'status',
                popup: {
                  blocks: [
                    {
                      key: 'duplicateAliasPopupB',
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
                      },
                      fields: ['status'],
                    },
                  ],
                  saveAsTemplate: {
                    name: `Duplicate popup alias B ${unique}`,
                    description: 'Second duplicate alias producer.',
                    local: 'duplicateAlias',
                  },
                },
              },
            ],
          },
        ],
      },
    });
    expect(duplicateAliasRes.status).toBe(400);
    expect(readErrorMessage(duplicateAliasRes)).toContain(
      "flowSurfaces compose.blocks[0].fields[1].popup.saveAsTemplate.local 'duplicateAlias' is duplicated in the same request",
    );

    const uidAndLocalConflictRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'uidAndLocalConflictDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: [
              {
                key: 'uidAndLocalConflictField',
                fieldPath: 'nickname',
                popup: {
                  template: {
                    uid: 'existing-popup-template',
                    local: 'unsupportedComposeAlias',
                    mode: 'reference',
                  },
                },
              },
            ],
          },
        ],
      },
    });
    expect(uidAndLocalConflictRes.status).toBe(400);
    expect(readErrorMessage(uidAndLocalConflictRes)).toContain(
      'flowSurfaces compose.blocks[0].fields[0].popup.template cannot combine uid and local',
    );

    const localTryTemplateConflictRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'localTryTemplateConflictDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: [
              {
                key: 'localTryTemplateConflictField',
                fieldPath: 'status',
                popup: {
                  template: {
                    local: 'composeAliasConflict',
                    mode: 'reference',
                  },
                  tryTemplate: true,
                },
              },
            ],
          },
        ],
      },
    });
    expect(localTryTemplateConflictRes.status).toBe(400);
    expect(readErrorMessage(localTryTemplateConflictRes)).toContain(
      'flowSurfaces compose.blocks[0].fields[0].popup.template.local cannot be combined with flowSurfaces compose.blocks[0].fields[0].popup.tryTemplate',
    );

    const detailsBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const tableBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const directAddFieldLocalTemplateRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: detailsBlock.uid },
        fieldPath: 'nickname',
        popup: {
          template: {
            local: 'unsupportedDirectAddAlias',
            mode: 'reference',
          },
        },
      },
    });
    expect(directAddFieldLocalTemplateRes.status).toBe(400);
    expect(readErrorMessage(directAddFieldLocalTemplateRes)).toContain(
      'flowSurfaces addField popup.template.local is only supported in compose and applyBlueprint',
    );

    const directAddFieldLocalSaveRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: detailsBlock.uid },
        fieldPath: 'status',
        popup: {
          blocks: [
            {
              key: 'unsupportedDirectAddSavePopup',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: ['status'],
            },
          ],
          saveAsTemplate: {
            name: `Unsupported direct add save ${unique}`,
            description: 'Direct add should reject local popup aliases.',
            local: 'unsupportedDirectAddAlias',
          },
        },
      },
    });
    expect(directAddFieldLocalSaveRes.status).toBe(400);
    expect(readErrorMessage(directAddFieldLocalSaveRes)).toContain(
      'flowSurfaces addField popup.saveAsTemplate.local is only supported in compose and applyBlueprint',
    );

    const directAddFieldNestedLocalTemplateRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: detailsBlock.uid },
        fieldPath: 'nickname',
        popup: {
          blocks: [
            {
              key: 'unsupportedDirectAddNestedPopup',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: [
                {
                  key: 'unsupportedDirectAddNestedField',
                  fieldPath: 'status',
                  popup: {
                    template: {
                      local: 'unsupportedNestedDirectAddAlias',
                      mode: 'reference',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    });
    expect(directAddFieldNestedLocalTemplateRes.status).toBe(400);
    expect(readErrorMessage(directAddFieldNestedLocalTemplateRes)).toContain(
      'flowSurfaces addField popup.blocks[0].fields[0].popup.template.local is only supported in compose and applyBlueprint',
    );

    const directAddActionLocalTemplateRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: tableBlock.uid },
        type: 'popup',
        popup: {
          template: {
            local: 'unsupportedDirectActionAlias',
            mode: 'reference',
          },
        },
      },
    });
    expect(directAddActionLocalTemplateRes.status).toBe(400);
    expect(readErrorMessage(directAddActionLocalTemplateRes)).toContain(
      'flowSurfaces addAction popup.template.local is only supported in compose and applyBlueprint',
    );

    const directAddRecordActionLocalTemplateRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: tableBlock.uid },
        type: 'view',
        popup: {
          template: {
            local: 'unsupportedDirectRecordActionAlias',
            mode: 'reference',
          },
        },
      },
    });
    expect(directAddRecordActionLocalTemplateRes.status).toBe(400);
    expect(readErrorMessage(directAddRecordActionLocalTemplateRes)).toContain(
      'flowSurfaces addRecordAction popup.template.local is only supported in compose and applyBlueprint',
    );

    const directAddRecordActionNestedLocalSaveRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: tableBlock.uid },
        type: 'view',
        popup: {
          blocks: [
            {
              key: 'unsupportedDirectRecordActionNestedPopup',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: [
                {
                  key: 'unsupportedDirectRecordActionNestedField',
                  fieldPath: 'nickname',
                  popup: {
                    blocks: [
                      {
                        key: 'unsupportedDirectRecordActionNestedSavePopup',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['nickname'],
                      },
                    ],
                    saveAsTemplate: {
                      name: `Unsupported direct record action nested save ${unique}`,
                      description: 'Direct add should reject nested local popup aliases too.',
                      local: 'unsupportedNestedDirectRecordActionAlias',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    });
    expect(directAddRecordActionNestedLocalSaveRes.status).toBe(400);
    expect(readErrorMessage(directAddRecordActionNestedLocalSaveRes)).toContain(
      'flowSurfaces addRecordAction popup.blocks[0].fields[0].popup.saveAsTemplate.local is only supported in compose and applyBlueprint',
    );
  });

  it('should reject invalid popup.saveAsTemplate inputs and unsupported save scenarios', async () => {
    const unique = Date.now();
    const page = await createPage(rootAgent, {
      title: `Popup saveAsTemplate validation page ${unique}`,
      tabTitle: 'Popup saveAsTemplate validation tab',
    });
    const detailsBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const tableBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const invalidShapeRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: detailsBlock.uid },
        fieldPath: 'nickname',
        popup: {
          blocks: [
            {
              key: 'invalidShapePopup',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: ['nickname'],
            },
          ],
          saveAsTemplate: 'bad',
        },
      },
    });
    expect(invalidShapeRes.status).toBe(400);
    expect(readErrorMessage(invalidShapeRes)).toContain('popup.saveAsTemplate must be an object');

    const missingNameRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: detailsBlock.uid },
        fieldPath: 'nickname',
        popup: {
          blocks: [
            {
              key: 'missingNamePopup',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: ['nickname'],
            },
          ],
          saveAsTemplate: {
            description: 'Missing name should fail.',
          },
        },
      },
    });
    expect(missingNameRes.status).toBe(400);
    expect(readErrorMessage(missingNameRes)).toContain('popup.saveAsTemplate.name');

    const missingDescriptionRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: detailsBlock.uid },
        fieldPath: 'nickname',
        popup: {
          blocks: [
            {
              key: 'missingDescriptionPopup',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: ['nickname'],
            },
          ],
          saveAsTemplate: {
            name: `Popup saveAsTemplate missing description ${unique}`,
          },
        },
      },
    });
    expect(missingDescriptionRes.status).toBe(400);
    expect(readErrorMessage(missingDescriptionRes)).toContain('popup.saveAsTemplate.description');

    const templateConflictRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: detailsBlock.uid },
        fieldPath: 'nickname',
        popup: {
          template: {
            uid: 'existing-popup-template',
            mode: 'reference',
          },
          saveAsTemplate: {
            name: `Popup saveAsTemplate template conflict ${unique}`,
            description: 'Should reject template conflict.',
          },
        },
      },
    });
    expect(templateConflictRes.status).toBe(400);
    expect(readErrorMessage(templateConflictRes)).toContain(
      'popup.saveAsTemplate cannot be combined with popup.template',
    );

    const missingLocalPopupRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: tableBlock.uid },
        type: 'view',
        popup: {
          saveAsTemplate: {
            name: `Popup saveAsTemplate no blocks ${unique}`,
            description: 'Default popup auto-completion must not be saved as a template.',
          },
        },
      },
    });
    expect(missingLocalPopupRes.status).toBe(400);
    expect(readErrorMessage(missingLocalPopupRes)).toContain(
      'popup.saveAsTemplate requires explicit local popup.blocks',
    );

    const sourcePopupAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: tableBlock.uid },
          type: 'popup',
        },
      }),
    );
    const externalOpenViewRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: tableBlock.uid },
        type: 'popup',
        settings: {
          openView: {
            uid: sourcePopupAction.uid,
          },
        },
        popup: {
          blocks: [
            {
              key: 'externalOpenViewPopup',
              type: 'table',
              resource: {
                binding: 'currentCollection',
              },
              defaultFilter: employeeDefaultFilter(),
              fields: ['nickname'],
            },
          ],
          saveAsTemplate: {
            name: `Popup saveAsTemplate external openView ${unique}`,
            description: 'External popup targets cannot be auto-saved as templates here.',
          },
        },
      },
    });
    expect(externalOpenViewRes.status).toBe(400);
    expect(readErrorMessage(externalOpenViewRes)).toContain(
      'popup.saveAsTemplate cannot be combined with external openView.uid',
    );
  });

  it('should keep current-record popup templates scoped to current-record openers during popup.tryTemplate', async () => {
    await rootAgent.resource('collections').create({
      values: {
        name: 'popup_try_template_record_context_targets',
        title: 'Popup Try Template Record Context Targets',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'label', type: 'string', interface: 'input' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      popup_try_template_record_context_targets: ['name', 'code', 'label', 'scope'],
    });

    const page = await createPage(rootAgent, {
      title: 'Popup tryTemplate record context page',
      tabTitle: 'Popup tryTemplate record context tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'popup_try_template_record_context_targets',
      },
    });
    const sourceRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'record-context-template-details',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const recordTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceRecordAction.uid },
      name: 'Record-context popup tryTemplate template',
      description: 'Popup template requiring a current record for popup.tryTemplate context coverage.',
      saveMode: 'duplicate',
    });
    expect(recordTemplate.filterByTk).toBe('{{ctx.record.id}}');
    const recordTemplateSurface = await getSurface(rootAgent, {
      uid: recordTemplate.targetUid,
    });
    const recordTemplateDetails = _.castArray(
      recordTemplateSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(recordTemplateDetails?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'popup_try_template_record_context_targets',
      filterByTk: '{{ctx.record.id}}',
    });
    const convertRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'record-context-convert-template-details',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const convertedRecordTemplate = await saveTemplate(rootAgent, {
      target: { uid: convertRecordAction.uid },
      name: 'Record-context popup convert template',
      description: 'Popup template converted from a current-record opener.',
      saveMode: 'convert',
    });
    expect(convertedRecordTemplate.filterByTk).toBe('{{ctx.record.id}}');
    const convertedRecordActionSurface = await getSurface(rootAgent, { uid: convertRecordAction.uid });
    expect(convertedRecordActionSurface.tree.popup?.template).toMatchObject({
      uid: convertedRecordTemplate.uid,
      mode: 'reference',
    });
    expect(getPopupOpenView(convertedRecordActionSurface.tree)).not.toHaveProperty('filterByTk');

    const blockAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
          popup: {
            tryTemplate: true,
          },
        },
      }),
    );
    const blockActionSurface = await getSurface(rootAgent, { uid: blockAction.uid });
    expect(blockActionSurface.tree.popup?.template).toBeUndefined();
    expect(blockActionSurface.tree.subModels?.page).toBeUndefined();

    const targetRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            tryTemplate: true,
          },
        },
      }),
    );
    const targetRecordActionSurface = await getSurface(rootAgent, { uid: targetRecordAction.uid });
    const targetRecordActionTemplate = targetRecordActionSurface.tree.popup.template;
    expect(targetRecordActionTemplate).toMatchObject({
      mode: 'reference',
    });
    const targetRecordActionPopupTemplate = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: targetRecordActionTemplate.uid,
        },
      }),
    );
    expect(targetRecordActionPopupTemplate.collectionName).toBe('popup_try_template_record_context_targets');
    expect(targetRecordActionPopupTemplate.filterByTk).toBe('{{ctx.record.id}}');
    expect(getPopupOpenView(targetRecordActionSurface.tree)).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'popup_try_template_record_context_targets',
    });
    expect(getPopupOpenView(targetRecordActionSurface.tree)).not.toHaveProperty('filterByTk');

    const legacyRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            template: {
              uid: recordTemplate.uid,
              mode: 'reference',
            },
            openView: {
              filterByTk: '{{ ctx.record.id }}',
            },
          },
        },
      }),
    );
    const legacyRecordActionSurface = await getSurface(rootAgent, { uid: legacyRecordAction.uid });
    expect(getPopupOpenView(legacyRecordActionSurface.tree)).not.toHaveProperty('filterByTk');

    const customRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            template: {
              uid: recordTemplate.uid,
              mode: 'reference',
            },
            openView: {
              filterByTk: '{{ ctx.record.code }}',
            },
          },
        },
      }),
    );
    const customRecordActionSurface = await getSurface(rootAgent, { uid: customRecordAction.uid });
    expect(getPopupOpenView(customRecordActionSurface.tree)?.filterByTk).toBe('{{ ctx.record.code }}');

    const customFilterTemplate = getData(
      await rootAgent.resource('flowModelTemplates').create({
        values: {
          name: 'Record-context popup custom filter template',
          description: 'Popup template with a custom current-record filterByTk expression.',
          targetUid: recordTemplate.targetUid,
          type: 'popup',
          dataSourceKey: 'main',
          collectionName: 'popup_try_template_record_context_targets',
          filterByTk: '{{ ctx.record.code }}',
        },
      }),
    );
    const customFilterTemplateAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            template: {
              uid: customFilterTemplate.uid,
              mode: 'reference',
            },
            openView: {
              filterByTk: '{{ ctx.record.id }}',
            },
          },
        },
      }),
    );
    const customFilterTemplateActionSurface = await getSurface(rootAgent, { uid: customFilterTemplateAction.uid });
    expect(getPopupOpenView(customFilterTemplateActionSurface.tree)?.filterByTk).toBe('{{ ctx.record.code }}');
  });

  it('should preserve custom record filter during referenced popup title sync', async () => {
    const service = new FlowSurfacesService(app.pm.get('flow-engine') as any) as any;
    const actionNode = {
      uid: 'record-action-title-sync',
      use: 'ViewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            uid: 'target-code-popup',
            popupTemplateUid: 'target-code-template',
            popupTemplateMode: 'reference',
            collectionName: 'target_code_records',
            filterByTk: '{{ ctx.record.code }}',
          },
        },
      },
    };
    const findSpy = vi.spyOn(service.repository, 'findModelById').mockResolvedValue(actionNode);
    const profileSpy = vi.spyOn(service, 'resolvePopupBlockProfile').mockResolvedValue({
      currentCollection: {
        filterTargetKey: 'code',
      },
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      popupKind: 'recordPopup',
    });
    const hostKeySpy = vi.spyOn(service, 'resolvePopupHostCurrentRecordFilterTargetKey').mockResolvedValue('id');
    const patchSpy = vi.spyOn(service, 'patchFlowSurfaceModelOptions').mockResolvedValue(undefined);

    try {
      await service.syncDefaultActionPopupOpenViewTitle(actionNode.uid, actionNode, {
        openViewTitle: 'Synced title',
      });

      expect(patchSpy).toHaveBeenCalledTimes(1);
      const patchedOpenView = patchSpy.mock.calls[0][0].stepParams.popupSettings.openView;
      expect(patchedOpenView.title).toBe('Synced title');
      expect(patchedOpenView.filterByTk).toBe('{{ ctx.record.code }}');
    } finally {
      findSpy.mockRestore();
      profileSpy.mockRestore();
      hostKeySpy.mockRestore();
      patchSpy.mockRestore();
    }
  });

  it('should replace legacy popup inputArgs filter during local record action title sync', async () => {
    const service = new FlowSurfacesService(app.pm.get('flow-engine') as any) as any;
    const actionNode = {
      uid: 'local-record-action-title-sync',
      use: 'ViewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            collectionName: 'target_code_records',
            filterByTk: '{{ ctx.view.inputArgs.filterByTk }}',
          },
        },
      },
    };
    const findSpy = vi.spyOn(service.repository, 'findModelById').mockResolvedValue(actionNode);
    const profileSpy = vi.spyOn(service, 'resolvePopupBlockProfile').mockResolvedValue({
      dataSourceKey: 'main',
      collectionName: 'target_code_records',
      currentCollection: {
        filterTargetKey: 'id',
      },
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      popupKind: 'recordPopup',
      hasCurrentRecord: true,
      hasAssociationContext: false,
      scene: 'one',
    });
    const patchSpy = vi.spyOn(service, 'patchFlowSurfaceModelOptions').mockResolvedValue(undefined);

    try {
      await service.syncDefaultActionPopupOpenViewTitle(actionNode.uid, actionNode, {
        openViewTitle: 'Synced title',
      });

      expect(patchSpy).toHaveBeenCalledTimes(1);
      const patchedOpenView = patchSpy.mock.calls[0][0].stepParams.popupSettings.openView;
      expect(patchedOpenView.title).toBe('Synced title');
      expect(patchedOpenView.filterByTk).toBe('{{ctx.record.id}}');
    } finally {
      findSpy.mockRestore();
      profileSpy.mockRestore();
      patchSpy.mockRestore();
    }
  });

  it('should not add record filter during new-record action title sync', async () => {
    const service = new FlowSurfacesService(app.pm.get('flow-engine') as any) as any;
    const actionNode = {
      uid: 'new-record-action-title-sync',
      use: 'AddNewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            collectionName: 'target_code_records',
          },
        },
      },
    };
    const findSpy = vi.spyOn(service.repository, 'findModelById').mockResolvedValue(actionNode);
    const profileSpy = vi.spyOn(service, 'resolvePopupBlockProfile').mockResolvedValue({
      dataSourceKey: 'main',
      collectionName: 'target_code_records',
      currentCollection: {
        filterTargetKey: 'id',
      },
      popupKind: 'plainPopup',
      hasCurrentRecord: false,
      hasAssociationContext: false,
      scene: 'new',
    });
    const patchSpy = vi.spyOn(service, 'patchFlowSurfaceModelOptions').mockResolvedValue(undefined);

    try {
      await service.syncDefaultActionPopupOpenViewTitle(actionNode.uid, actionNode, {
        openViewTitle: 'Create record',
      });

      expect(patchSpy).toHaveBeenCalledTimes(1);
      const patchedOpenView = patchSpy.mock.calls[0][0].stepParams.popupSettings.openView;
      expect(patchedOpenView.title).toBe('Create record');
      expect(patchedOpenView).not.toHaveProperty('filterByTk');
    } finally {
      findSpy.mockRestore();
      profileSpy.mockRestore();
      patchSpy.mockRestore();
    }
  });

  it('should preserve custom record filter when popup target key differs from opener key', async () => {
    const service = new FlowSurfacesService(app.pm.get('flow-engine') as any) as any;
    const template = {
      uid: 'target-code-template',
      targetUid: 'target-code-popup',
      type: 'popup',
      dataSourceKey: 'main',
      collectionName: 'target_code_records',
      filterByTk: '{{ ctx.record.code }}',
    };
    const spies = [
      vi.spyOn(service, 'getFlowTemplateOrThrow').mockResolvedValue(template),
      vi.spyOn(service, 'assertPopupTemplateCompatibility').mockResolvedValue(undefined),
      vi.spyOn(service, 'assertOpenViewUidTarget').mockResolvedValue(undefined),
      vi.spyOn(service, 'resolvePopupHostCurrentRecordFilterTargetKey').mockResolvedValue('id'),
      vi.spyOn(service, 'resolveOpenViewFilterTargetKey').mockReturnValue('code'),
    ];

    try {
      const normalized = await service.normalizeOpenView(
        'test',
        {
          template: {
            uid: template.uid,
            mode: 'reference',
          },
          filterByTk: '{{ ctx.record.code }}',
        },
        {
          popupTemplateHostUid: 'opener-record-action',
          popupActionContext: {
            hasCurrentRecord: true,
          },
        },
      );

      expect(normalized).toMatchObject({
        uid: 'target-code-popup',
        popupTemplateUid: 'target-code-template',
        filterByTk: '{{ ctx.record.code }}',
      });
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });

  it.skip('should keep popup.tryTemplate miss semantics silent for scalar fields and non-default actions while auto-saving default popup completion as templates', async () => {
    await rootAgent.resource('collections').create({
      values: {
        name: 'popup_try_template_miss_targets',
        title: 'Popup Try Template Miss Targets',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'label', type: 'string', interface: 'input' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      popup_try_template_miss_targets: ['name', 'code', 'label', 'scope'],
    });

    const page = await createPage(rootAgent, {
      title: 'Popup tryTemplate miss semantics page',
      tabTitle: 'Popup tryTemplate miss semantics tab',
    });

    const departmentsDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'departments',
      },
    });
    const departmentTemplateField = await addFieldData(rootAgent, {
      target: { uid: departmentsDetails.uid },
      fieldPath: 'title',
      popup: {
        blocks: [
          {
            key: 'department-template-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['title'],
          },
        ],
      },
    });
    await saveTemplate(rootAgent, {
      target: { uid: departmentTemplateField.fieldUid || departmentTemplateField.uid },
      name: 'Department popup template miss guard',
      description: 'Departments popup template used to verify popup.tryTemplate miss fallback semantics.',
      saveMode: 'duplicate',
    });

    const employeeDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const relationFallbackField = await addFieldData(rootAgent, {
      target: { uid: employeeDetails.uid },
      fieldPath: 'department',
      popup: {
        tryTemplate: true,
      },
    });
    expect(relationFallbackField.popupPageUid).toBeUndefined();
    expect(relationFallbackField.popupTabUid).toBeUndefined();
    expect(relationFallbackField.popupGridUid).toBeUndefined();
    const relationFallbackSurface = await getSurface(rootAgent, {
      uid: relationFallbackField.fieldUid || relationFallbackField.uid,
    });
    expect(relationFallbackSurface.tree.popup?.template).toMatchObject({
      mode: 'reference',
    });
    expect(relationFallbackSurface.tree.popup?.pageUid).toBeUndefined();
    expect(relationFallbackSurface.tree.popup?.tabUid).toBeUndefined();
    expect(relationFallbackSurface.tree.popup?.gridUid).toBeUndefined();

    const relationTemplate = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: relationFallbackSurface.tree.popup?.template?.uid,
        },
      }),
    );
    expect(relationTemplate.collectionName).toBe('departments');
    expect(relationTemplate.associationName).toBe('employees.department');

    const scalarDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'popup_try_template_miss_targets',
      },
    });
    const unmatchedField = await addFieldData(rootAgent, {
      target: { uid: scalarDetails.uid },
      fieldPath: 'name',
      popup: {
        tryTemplate: true,
      },
    });
    expect(unmatchedField.popupPageUid).toBeUndefined();
    expect(unmatchedField.popupTabUid).toBeUndefined();
    expect(unmatchedField.popupGridUid).toBeUndefined();
    const unmatchedFieldSurface = await getSurface(rootAgent, {
      uid: unmatchedField.fieldUid || unmatchedField.uid,
    });
    expect(unmatchedFieldSurface.tree.popup?.template).toBeUndefined();
    expect(unmatchedFieldSurface.tree.popup?.pageUid).toBeUndefined();
    expect(unmatchedFieldSurface.tree.popup?.tabUid).toBeUndefined();
    expect(unmatchedFieldSurface.tree.popup?.gridUid).toBeUndefined();
    expect(unmatchedFieldSurface.tree.subModels?.page).toBeUndefined();

    const employeeTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'popup_try_template_miss_targets',
      },
    });
    const unmatchedPopupAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: employeeTable.uid },
          type: 'popup',
          popup: {
            tryTemplate: true,
          },
        },
      }),
    );
    expect(unmatchedPopupAction.popupPageUid).toBeUndefined();
    expect(unmatchedPopupAction.popupTabUid).toBeUndefined();
    expect(unmatchedPopupAction.popupGridUid).toBeUndefined();
    const unmatchedPopupActionSurface = await getSurface(rootAgent, {
      uid: unmatchedPopupAction.uid,
    });
    expect(unmatchedPopupActionSurface.tree.popup?.template).toBeUndefined();
    expect(unmatchedPopupActionSurface.tree.popup?.pageUid).toBeUndefined();
    expect(unmatchedPopupActionSurface.tree.popup?.tabUid).toBeUndefined();
    expect(unmatchedPopupActionSurface.tree.popup?.gridUid).toBeUndefined();
    expect(unmatchedPopupActionSurface.tree.subModels?.page).toBeUndefined();

    const defaultViewAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: employeeTable.uid },
          type: 'view',
          popup: {
            tryTemplate: true,
          },
        },
      }),
    );
    expect(defaultViewAction.popupPageUid).toBeUndefined();
    expect(defaultViewAction.popupTabUid).toBeUndefined();
    expect(defaultViewAction.popupGridUid).toBeUndefined();
    const defaultViewActionSurface = await getSurface(rootAgent, {
      uid: defaultViewAction.uid,
    });
    expect(defaultViewActionSurface.tree.popup?.template).toMatchObject({
      mode: 'reference',
    });
    expect(defaultViewActionSurface.tree.popup?.pageUid).toBeUndefined();
    expect(defaultViewActionSurface.tree.popup?.tabUid).toBeUndefined();
    expect(defaultViewActionSurface.tree.popup?.gridUid).toBeUndefined();
    const defaultViewPopupTemplate = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: defaultViewActionSurface.tree.popup?.template?.uid,
        },
      }),
    );
    expect(defaultViewPopupTemplate.collectionName).toBe('popup_try_template_miss_targets');
    const defaultViewPopupSurface = await getSurface(rootAgent, {
      uid: defaultViewPopupTemplate.targetUid,
    });
    const defaultViewPopupBlock = _.castArray(
      defaultViewPopupSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(defaultViewPopupBlock?.use).toBe('DetailsBlockModel');

    const configurablePopupAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: employeeTable.uid },
          type: 'popup',
        },
      }),
    );
    const configureActionRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: configurablePopupAction.uid,
        },
        changes: {
          openView: {
            tryTemplate: true,
          },
        },
      },
    });
    expect(configureActionRes.status).toBe(200);
    let configurablePopupActionSurface = await getSurface(rootAgent, {
      uid: configurablePopupAction.uid,
    });
    expect(getPopupOpenView(configurablePopupActionSurface.tree)?.popupTemplateUid).toBeUndefined();
    expect(getPopupOpenView(configurablePopupActionSurface.tree)?.popupTemplateContext).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.template).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.pageUid).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.tabUid).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.gridUid).toBeUndefined();
    expect(configurablePopupActionSurface.tree.subModels?.page).toBeUndefined();

    const applyMissRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: configurablePopupAction.uid,
        },
        spec: {
          uid: configurablePopupAction.uid,
          use: configurablePopupActionSurface.tree.use,
          popup: {
            tryTemplate: true,
          },
        },
      },
    });
    expect(applyMissRes.status).toBe(200);
    configurablePopupActionSurface = await getSurface(rootAgent, {
      uid: configurablePopupAction.uid,
    });
    expect(getPopupOpenView(configurablePopupActionSurface.tree)?.popupTemplateUid).toBeUndefined();
    expect(getPopupOpenView(configurablePopupActionSurface.tree)?.popupTemplateContext).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.template).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.pageUid).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.tabUid).toBeUndefined();
    expect(configurablePopupActionSurface.tree.popup?.gridUid).toBeUndefined();
    expect(configurablePopupActionSurface.tree.subModels?.page).toBeUndefined();
  });

  it('should auto-template relation fields inside generated default details popups', async () => {
    const unique = Date.now();
    const sourceCollection = `generated_relation_employees_${unique}`;
    const targetCollection = `generated_relation_departments_${unique}`;
    const sourceDetailFields = [
      'nickname',
      'employeeNo',
      'role',
      'phone',
      'email',
      'status',
      'location',
      'startDate',
      'grade',
      'costCenter',
      'notes',
    ];
    const targetDetailFields = [
      'title',
      'code',
      'region',
      'manager',
      'location',
      'phone',
      'email',
      'status',
      'scope',
      'costCenter',
      'notes',
    ];
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        fields: sourceDetailFields.map((name) => ({ name, type: 'string', interface: 'input' })),
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: targetCollection,
        titleField: 'title',
        fields: targetDetailFields.map((name) => ({ name, type: 'string', interface: 'input' })),
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'department',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'departmentId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [sourceCollection]: [...sourceDetailFields, 'departmentId'],
      [targetCollection]: targetDetailFields,
    });

    const page = await createPage(rootAgent, {
      title: `Generated details relation popup page ${unique}`,
      tabTitle: 'Generated details relation popup tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: sourceCollection,
      },
      defaultFilter: {
        logic: '$and',
        items: [
          { path: 'nickname', operator: '$notEmpty' },
          { path: 'email', operator: '$notEmpty' },
          { path: 'status', operator: '$notEmpty' },
        ],
      },
      defaults: {
        collections: {
          [sourceCollection]: {
            fieldGroups: [
              {
                title: 'Employee profile',
                fields: [...sourceDetailFields, 'department'],
              },
            ],
            popups: {
              view: {
                name: 'Employee generated details',
                description: 'View one employee record from generated details popup.',
              },
              associations: {
                department: {
                  view: {
                    name: 'Generated department details',
                    description: 'View one related department from generated details popup.',
                  },
                },
              },
            },
          },
          [targetCollection]: {
            fieldGroups: [
              {
                title: 'Department profile',
                fields: targetDetailFields,
              },
            ],
          },
        },
      },
    });

    const { detailsItems: generatedDetailsItems } = await getDefaultViewActionTemplateDetailsItems(table.uid);
    const departmentItem = generatedDetailsItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    );
    const departmentField = departmentItem?.subModels?.field;

    expect(departmentField?.props?.clickToOpen).toBe(true);
    expect(departmentField?.popup?.template).toMatchObject({
      mode: 'reference',
    });

    const relationTemplate = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: departmentField.popup.template.uid,
        },
      }),
    );
    expect(relationTemplate.name).toBe('Generated department details');
    expect(relationTemplate.description).toBe('View one related department from generated details popup.');
    expect(relationTemplate.collectionName).toBe(targetCollection);
    expect(relationTemplate.associationName).toBe(`${sourceCollection}.department`);

    const relationTemplateSurface = await getSurface(rootAgent, { uid: relationTemplate.targetUid });
    const relationDetailsBlock = _.castArray(
      relationTemplateSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    const relationDetailsItems = _.castArray(relationDetailsBlock?.subModels?.grid?.subModels?.items || []);
    expect(relationDetailsBlock?.use).toBe('DetailsBlockModel');
    expect(
      relationDetailsItems.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean),
    ).toEqual(targetDetailFields);

    const secondPage = await createPage(rootAgent, {
      title: `Generated details relation popup reuse page ${unique}`,
      tabTitle: 'Generated details relation popup reuse tab',
    });
    const secondTable = await addBlockData(rootAgent, {
      target: { uid: secondPage.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: sourceCollection,
      },
      defaults: {
        collections: {
          [sourceCollection]: {
            fieldGroups: [
              {
                title: 'Employee profile',
                fields: [...sourceDetailFields, 'department'],
              },
            ],
            popups: {
              view: {
                name: 'Employee generated details',
                description: 'View one employee record from generated details popup.',
              },
              associations: {
                department: {
                  view: {
                    name: 'Generated department details',
                    description: 'View one related department from generated details popup.',
                  },
                },
              },
            },
          },
          [targetCollection]: {
            fieldGroups: [
              {
                title: 'Department profile',
                fields: targetDetailFields,
              },
            ],
          },
        },
      },
    });
    const { detailsItems: reusedDetailsItems } = await getDefaultViewActionTemplateDetailsItems(secondTable.uid);
    const reusedDepartmentItem = reusedDetailsItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    );
    const reusedDepartmentField = reusedDepartmentItem?.subModels?.field;
    expect(reusedDepartmentField?.popup?.template).toMatchObject({
      uid: relationTemplate.uid,
      mode: 'reference',
    });
  });

  it('should auto-template relation fields in generated default details popups without fieldGroups', async () => {
    const unique = Date.now();
    const sourceCollection = `generated_relation_small_employees_${unique}`;
    const targetCollection = `generated_relation_small_departments_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        fields: [
          { name: 'nickname', type: 'string', interface: 'input' },
          { name: 'email', type: 'string', interface: 'email' },
          { name: 'phone', type: 'string', interface: 'phone' },
          { name: 'status', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: targetCollection,
        titleField: 'title',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'department',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'departmentId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [sourceCollection]: ['nickname', 'email', 'phone', 'status', 'departmentId'],
      [targetCollection]: ['title', 'code'],
    });

    const page = await createPage(rootAgent, {
      title: `Generated small details relation popup page ${unique}`,
      tabTitle: 'Generated small details relation popup tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: sourceCollection,
      },
      defaults: {
        collections: {
          [sourceCollection]: {
            popups: {
              associations: {
                department: {
                  view: {
                    name: 'Generated small department details',
                    description: 'View one small related department from generated details popup.',
                  },
                },
              },
            },
          },
        },
      },
    });

    const { detailsItems } = await getDefaultViewActionTemplateDetailsItems(table.uid);
    const departmentItem = detailsItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    );
    const departmentField = departmentItem?.subModels?.field;
    expect(departmentField?.props?.clickToOpen).toBe(true);
    expect(departmentField?.popup?.template).toMatchObject({
      mode: 'reference',
    });

    const { template: relationTemplate, surface: relationTemplateSurface } = await getPopupTemplateSurface(
      departmentField.popup.template.uid,
    );
    expect(relationTemplate.name).toBe('Generated small department details');
    expect(relationTemplate.description).toBe('View one small related department from generated details popup.');
    expect(relationTemplate.collectionName).toBe(targetCollection);
    expect(relationTemplate.associationName).toBe(`${sourceCollection}.department`);
    const relationDetailsBlock = getFirstPopupDetailsBlock(relationTemplateSurface);
    expect(relationDetailsBlock?.use).toBe('DetailsBlockModel');
    expect(getDetailsFieldItems(relationDetailsBlock).length).toBeGreaterThan(0);
  });

  it('should support popup.tryTemplate through flowSurfaces apply on existing popup-capable child nodes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup tryTemplate apply page',
      tabTitle: 'Popup tryTemplate apply tab',
    });

    const sourceTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const sourceAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: sourceTable.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'apply-popup-template-table',
                type: 'table',
                resource: {
                  binding: 'currentCollection',
                  collectionName: 'employees',
                },
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname', 'status'],
              },
            ],
          },
        },
      }),
    );
    const popupTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceAction.uid },
      name: 'Apply popup tryTemplate template',
      description: 'Reusable popup template used to verify flowSurfaces apply popup.tryTemplate coverage.',
      saveMode: 'duplicate',
    });

    const targetTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const targetAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: targetTable.uid },
          type: 'popup',
        },
      }),
    );
    const targetActionBeforeApply = await getSurface(rootAgent, {
      uid: targetAction.uid,
    });

    const applyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: targetTable.uid,
        },
        spec: {
          subModels: {
            actions: [
              {
                uid: targetAction.uid,
                use: targetActionBeforeApply.tree.use,
                popup: {
                  tryTemplate: true,
                },
              },
            ],
          },
        },
      },
    });
    expect(applyRes.status).toBe(200);
    const targetActionAfterApply = await getSurface(rootAgent, {
      uid: targetAction.uid,
    });
    expect(targetActionAfterApply.tree.popup.template).toMatchObject({
      uid: popupTemplate.uid,
      mode: 'reference',
    });
  });

  it('should preserve current-record opener context when flowSurfaces apply uses popup.tryTemplate on existing child nodes', async () => {
    await rootAgent.resource('collections').create({
      values: {
        name: 'popup_try_template_apply_record_context_targets',
        title: 'Popup Try Template Apply Record Context Targets',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'label', type: 'string', interface: 'input' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      popup_try_template_apply_record_context_targets: ['name', 'code', 'label', 'scope'],
    });

    const page = await createPage(rootAgent, {
      title: 'Popup tryTemplate apply record context page',
      tabTitle: 'Popup tryTemplate apply record context tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'popup_try_template_apply_record_context_targets',
      },
    });
    const sourceRecordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'apply-record-context-template-details',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const recordTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourceRecordAction.uid },
      name: 'Apply record-context popup tryTemplate template',
      description: 'Popup template requiring a current record for flowSurfaces apply popup.tryTemplate coverage.',
      saveMode: 'duplicate',
    });

    const blockAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'popup',
        },
      }),
    );
    const recordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
        },
      }),
    );
    const blockActionBeforeApply = await getSurface(rootAgent, {
      uid: blockAction.uid,
    });
    const recordActionBeforeApply = await getSurface(rootAgent, {
      uid: recordAction.uid,
    });

    const blockApplyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: blockAction.uid,
        },
        spec: {
          uid: blockAction.uid,
          use: blockActionBeforeApply.tree.use,
          popup: {
            tryTemplate: true,
          },
        },
      },
    });
    expect(blockApplyRes.status).toBe(200);

    const recordApplyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: recordAction.uid,
        },
        spec: {
          uid: recordAction.uid,
          use: recordActionBeforeApply.tree.use,
          popup: {
            tryTemplate: true,
          },
        },
      },
    });
    expect(recordApplyRes.status).toBe(200);

    const blockActionSurface = await getSurface(rootAgent, {
      uid: blockAction.uid,
    });
    expect(getPopupOpenView(blockActionSurface.tree)?.popupTemplateUid).toBeUndefined();
    expect(getPopupOpenView(blockActionSurface.tree)?.popupTemplateContext).toBeUndefined();
    expect(blockActionSurface.tree.popup?.template).toBeUndefined();
    expect(blockActionSurface.tree.subModels?.page).toBeUndefined();

    const recordActionSurface = await getSurface(rootAgent, {
      uid: recordAction.uid,
    });
    const recordActionTemplate = recordActionSurface.tree.popup.template;
    expect(recordActionTemplate).toMatchObject({
      mode: 'reference',
    });
    const recordActionPopupTemplate = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: recordActionTemplate.uid,
        },
      }),
    );
    expect(recordActionPopupTemplate.collectionName).toBe('popup_try_template_apply_record_context_targets');
    expect(recordActionPopupTemplate.filterByTk).toBe('{{ctx.record.id}}');
    expect(getPopupOpenView(recordActionSurface.tree)).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'popup_try_template_apply_record_context_targets',
    });
    expect(getPopupOpenView(recordActionSurface.tree)).not.toHaveProperty('filterByTk');
  });

  it('should clear template usages through removePopupTab removeTab and destroyPage', async () => {
    const page = await createPage(rootAgent, {
      title: 'Template cleanup page',
      tabTitle: 'Template cleanup tab',
    });
    const sourceBlock = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    await addFieldData(rootAgent, {
      target: { uid: sourceBlock.uid },
      fieldPath: 'nickname',
    });
    const template = await saveTemplate(rootAgent, {
      target: { uid: sourceBlock.uid },
      name: 'Template cleanup block',
      description: 'Reusable employee form used to verify tab and page cleanup paths.',
      saveMode: 'duplicate',
    });

    await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      template: {
        uid: template.uid,
        mode: 'reference',
      },
    });
    await expectTemplateUsage(rootAgent, template.uid, 1);

    const tab = getData(
      await rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: { uid: page.pageUid },
          title: 'Cleanup extra tab',
        },
      }),
    );
    await addBlockData(rootAgent, {
      target: { uid: tab.gridUid },
      template: {
        uid: template.uid,
        mode: 'reference',
      },
    });
    await expectTemplateUsage(rootAgent, template.uid, 2);

    const popupTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const popupAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: popupTable.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'cleanup-popup-details',
                type: 'details',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );
    await addBlockData(rootAgent, {
      target: { uid: popupAction.popupGridUid },
      template: {
        uid: template.uid,
        mode: 'reference',
      },
    });
    await expectTemplateUsage(rootAgent, template.uid, 3);

    getData(
      await rootAgent.resource('flowSurfaces').removePopupTab({
        values: {
          target: { uid: popupAction.popupTabUid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 2);

    getData(
      await rootAgent.resource('flowSurfaces').removeTab({
        values: {
          uid: tab.tabSchemaUid,
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 1);

    getData(
      await rootAgent.resource('flowSurfaces').destroyPage({
        values: {
          uid: page.pageUid,
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 0);
  });

  it('should track nested template dependencies stored inside another template target tree', async () => {
    const page = await createPage(rootAgent, {
      title: 'Nested template dependency page',
      tabTitle: 'Nested template dependency tab',
    });
    const popupSourceDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const popupSourceField = await addFieldData(rootAgent, {
      target: { uid: popupSourceDetails.uid },
      fieldPath: 'nickname',
      popup: {
        blocks: [
          {
            key: 'nested-template-popup-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname', 'status'],
          },
        ],
      },
    });
    const popupTemplate = await saveTemplate(rootAgent, {
      target: { uid: popupSourceField.fieldUid || popupSourceField.uid },
      name: 'Nested dependency popup template',
      description: 'Popup template used inside another saved block template to verify nested usage tracking.',
      saveMode: 'duplicate',
    });
    await expectTemplateUsage(rootAgent, popupTemplate.uid, 0);

    const blockSourceDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    await addFieldData(rootAgent, {
      target: { uid: blockSourceDetails.uid },
      fieldPath: 'status',
      popup: {
        template: {
          uid: popupTemplate.uid,
          mode: 'reference',
        },
      },
    });
    await expectTemplateUsage(rootAgent, popupTemplate.uid, 1);

    const blockTemplate = await saveTemplate(rootAgent, {
      target: { uid: blockSourceDetails.uid },
      name: 'Nested dependency block template',
      description: 'Block template that internally references a popup template.',
      saveMode: 'duplicate',
    });
    await expectTemplateUsage(rootAgent, popupTemplate.uid, 2);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: blockSourceDetails.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, popupTemplate.uid, 1);

    const blockedDestroyPopupTemplate = await rootAgent.resource('flowSurfaces').destroyTemplate({
      values: {
        uid: popupTemplate.uid,
      },
    });
    expect(blockedDestroyPopupTemplate.status).toBe(400);
    expect(readErrorMessage(blockedDestroyPopupTemplate)).toContain('still in use');

    const destroyBlockTemplateRes = await rootAgent.resource('flowSurfaces').destroyTemplate({
      values: {
        uid: blockTemplate.uid,
      },
    });
    expect(destroyBlockTemplateRes.status).toBe(200);
    await expectTemplateUsage(rootAgent, popupTemplate.uid, 0);
  });

  it('should keep listTemplates target-aware for association block templates and pre-add popup action contexts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Target aware template list page',
      tabTitle: 'Target aware template list tab',
    });

    const employeeDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const popupField = await addFieldData(rootAgent, {
      target: { uid: employeeDetails.uid },
      fieldPath: 'nickname',
      popup: {
        blocks: [
          {
            key: 'employee-record-popup-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname'],
          },
        ],
      },
    });

    const associationBlock = await addBlockData(rootAgent, {
      target: { uid: popupField.fieldUid || popupField.uid },
      type: 'table',
      resource: {
        binding: 'associatedRecords',
        associationField: 'department',
      },
      fields: ['title'],
      defaultFilter: departmentDefaultFilter(),
    });
    const associationBlockTemplate = await saveTemplate(rootAgent, {
      target: { uid: associationBlock.uid },
      name: 'Employee department association table',
      description: 'Association block template bound to employees.department for target-aware listTemplates checks.',
      saveMode: 'duplicate',
    });

    const mismatchedAssociationTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          target: { uid: page.gridUid },
          type: 'block',
          search: 'Employee department association table',
        },
      }),
    );
    const mismatchedAssociationTemplate = mismatchedAssociationTemplates.rows.find(
      (row: any) => row.uid === associationBlockTemplate.uid,
    );
    expect(mismatchedAssociationTemplate).toMatchObject({
      uid: associationBlockTemplate.uid,
      available: false,
    });
    expect(mismatchedAssociationTemplate?.disabledReason).toContain('association mismatch');

    const incompatibleAssociationBlock = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        template: {
          uid: associationBlockTemplate.uid,
          mode: 'reference',
        },
      },
    });
    expect(incompatibleAssociationBlock.status).toBe(400);
    expect(readErrorMessage(incompatibleAssociationBlock)).toContain('association mismatch');

    const popupTemplate = await saveTemplate(rootAgent, {
      target: { uid: popupField.fieldUid || popupField.uid },
      name: 'Employee record popup action context template',
      description: 'Popup template requiring current record context for pre-add listTemplates checks.',
      saveMode: 'duplicate',
    });
    const employeeTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const addNewPopupTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          target: { uid: employeeTable.uid },
          type: 'popup',
          actionType: 'addNew',
          actionScope: 'block',
          search: 'Employee record popup action context template',
        },
      }),
    );
    expect(addNewPopupTemplates.rows.find((row: any) => row.uid === popupTemplate.uid)).toMatchObject({
      uid: popupTemplate.uid,
      available: false,
    });
    expect(addNewPopupTemplates.rows.find((row: any) => row.uid === popupTemplate.uid)?.disabledReason).toContain(
      'filterByTk',
    );

    const viewPopupTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          target: { uid: employeeTable.uid },
          type: 'popup',
          actionType: 'view',
          actionScope: 'record',
          search: 'Employee record popup action context template',
        },
      }),
    );
    expect(viewPopupTemplates.rows.find((row: any) => row.uid === popupTemplate.uid)).toMatchObject({
      uid: popupTemplate.uid,
      available: true,
    });
  });

  it('should reject incompatible fields templates popup templates and unsupported popup template sources', async () => {
    const page = await createPage(rootAgent, {
      title: 'Template validation page',
      tabTitle: 'Template validation tab',
    });

    const employeeForm = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    await addFieldData(rootAgent, {
      target: { uid: employeeForm.uid },
      fieldPath: 'nickname',
    });
    const fieldsTemplate = await saveTemplate(rootAgent, {
      target: { uid: employeeForm.uid },
      name: 'Employee fields validation template',
      description: 'Fields template used to validate collection compatibility on the server side.',
      saveMode: 'duplicate',
    });
    const fieldsTemplateUid =
      fieldsTemplate?.uid ||
      getListData(
        await rootAgent.resource('flowSurfaces').listTemplates({
          values: {
            target: { uid: employeeForm.uid },
            type: 'block',
            usage: 'fields',
            search: 'Employee fields validation template',
          },
        }),
      ).rows.find((row: any) => row.name === 'Employee fields validation template')?.uid;
    expect(fieldsTemplateUid).toBeTruthy();

    const departmentForm = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'departments',
      },
    });
    const incompatibleFields = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: departmentForm.uid },
        template: {
          uid: fieldsTemplateUid,
          mode: 'reference',
        },
      },
    });
    expect(incompatibleFields.status).toBe(400);
    expect(readErrorMessage(incompatibleFields)).toContain('collection mismatch');

    const listedFieldsTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          target: { uid: departmentForm.uid },
          type: 'block',
          usage: 'fields',
          search: 'Employee fields validation template',
        },
      }),
    );
    const listedFieldsTemplate = listedFieldsTemplates.rows.find((row: any) => row.uid === fieldsTemplateUid);
    expect(listedFieldsTemplate).toMatchObject({
      uid: fieldsTemplateUid,
      available: false,
    });
    expect(listedFieldsTemplate?.disabledReason).toContain('collection mismatch');

    const listedCompatibleFieldsTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          target: { uid: employeeForm.uid },
          type: 'block',
          usage: 'fields',
          search: 'Employee fields validation template',
        },
      }),
    );
    expect(listedCompatibleFieldsTemplates.rows.find((row: any) => row.uid === fieldsTemplateUid)).toMatchObject({
      uid: fieldsTemplateUid,
      available: true,
    });

    const employeeTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const sourcePopupAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: employeeTable.uid },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'employee-details',
                type: 'details',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );
    const popupTemplate = await saveTemplate(rootAgent, {
      target: { uid: sourcePopupAction.uid },
      name: 'Employee popup validation template',
      description: 'Popup template used to validate action-side collection compatibility on the server side.',
      saveMode: 'duplicate',
    });
    const hiddenInternalPopupField = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: sourcePopupAction.uid },
        changes: {
          openView: {
            popupTemplateUid: popupTemplate.uid,
          },
        },
      },
    });
    expect(hiddenInternalPopupField.status).toBe(400);
    expect(readErrorMessage(hiddenInternalPopupField)).toContain('openView.popupTemplateUid');

    const departmentTable = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'departments',
      },
    });
    const incompatiblePopup = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: departmentTable.uid },
        type: 'popup',
        popup: {
          template: {
            uid: popupTemplate.uid,
            mode: 'reference',
          },
        },
      },
    });
    expect(incompatiblePopup.status).toBe(400);
    expect(readErrorMessage(incompatiblePopup)).toContain('collection mismatch');
    expect(readErrorMessage(incompatiblePopup)).not.toContain('popup invalid');
    expect(readErrorMessage(incompatiblePopup)).not.toContain('configure action');

    const listedPopupTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          target: { uid: departmentTable.uid },
          type: 'popup',
          search: 'Employee popup validation template',
        },
      }),
    );
    const listedPopupTemplate = listedPopupTemplates.rows.find((row: any) => row.uid === popupTemplate.uid);
    expect(listedPopupTemplate).toMatchObject({
      uid: popupTemplate.uid,
      available: false,
    });
    expect(listedPopupTemplate?.disabledReason).toContain('collection mismatch');

    const departmentDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'departments',
      },
    });
    const incompatibleFieldPopup = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: departmentDetails.uid },
        fieldPath: 'title',
        popup: {
          template: {
            uid: popupTemplate.uid,
            mode: 'reference',
          },
        },
      },
    });
    expect(incompatibleFieldPopup.status).toBe(400);
    expect(readErrorMessage(incompatibleFieldPopup)).toContain('collection mismatch');
    expect(readErrorMessage(incompatibleFieldPopup)).not.toContain('popup invalid');
    expect(readErrorMessage(incompatibleFieldPopup)).not.toContain('configure field');

    const popupSourceDetails = await addBlockData(rootAgent, {
      target: { uid: page.gridUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const popupSourceField = await addFieldData(rootAgent, {
      target: { uid: popupSourceDetails.uid },
      fieldPath: 'nickname',
      popup: {
        blocks: [
          {
            key: 'employee-field-popup-validation-details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname'],
          },
        ],
      },
    });
    const filterByTkPopupTemplate = await saveTemplate(rootAgent, {
      target: { uid: popupSourceField.fieldUid || popupSourceField.uid },
      name: 'Employee filterByTk popup template',
      description: 'Popup template requiring filterByTk for validation listTemplates coverage.',
      saveMode: 'duplicate',
    });
    const addNewAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: employeeTable.uid },
          type: 'addNew',
        },
      }),
    );
    const listedContextPopupTemplates = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          target: { uid: addNewAction.uid },
          type: 'popup',
          search: 'Employee filterByTk popup template',
        },
      }),
    );
    const listedContextPopupTemplate = listedContextPopupTemplates.rows.find(
      (row: any) => row.uid === filterByTkPopupTemplate.uid,
    );
    expect(listedContextPopupTemplate).toMatchObject({
      uid: filterByTkPopupTemplate.uid,
      available: false,
    });
    expect(listedContextPopupTemplate?.disabledReason).toContain('filterByTk');

    const plainField = await addFieldData(rootAgent, {
      target: { uid: employeeForm.uid },
      fieldPath: 'status',
    });
    const unsupportedPopupSource = await rootAgent.resource('flowSurfaces').saveTemplate({
      values: {
        target: { uid: plainField.fieldUid || plainField.uid },
        name: 'Employee plain field should fail',
        description: 'This should fail because only supported block sources and popup openers can be saved.',
        saveMode: 'duplicate',
      },
    });
    expect(unsupportedPopupSource.status).toBe(400);
    expect(readErrorMessage(unsupportedPopupSource)).toContain('supported block or popup template source');
  });
});
