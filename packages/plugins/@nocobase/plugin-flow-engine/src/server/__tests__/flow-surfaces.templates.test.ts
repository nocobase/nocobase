/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import {
  loginFlowSurfacesRootAgent,
  syncFlowSurfacesEnabledPlugins,
} from './flow-surfaces.mock-server';
import {
  FLOW_SURFACES_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_TEST_PLUGINS,
} from './flow-surfaces.test-plugins';

const FLOW_SURFACES_TEMPLATE_TEST_PLUGINS = [...FLOW_SURFACES_TEST_PLUGINS, 'ui-templates'] as const;
const FLOW_SURFACES_TEMPLATE_TEST_PLUGIN_INSTALLS = [...FLOW_SURFACES_TEST_PLUGIN_INSTALLS, 'ui-templates'] as const;

describe('flowSurfaces templates', () => {
  let app: MockServer;
  let rootAgent: any;

  beforeAll(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: FLOW_SURFACES_TEMPLATE_TEST_PLUGIN_INSTALLS as any,
      skipStart: true,
      beforeInstall: async (app) => {
        await app.cleanDb();
      },
    });
    await syncFlowSurfacesEnabledPlugins(
      app,
      FLOW_SURFACES_TEMPLATE_TEST_PLUGINS,
      FLOW_SURFACES_TEMPLATE_TEST_PLUGINS,
    );
    await app.runCommandThrowError('start');
    expect(app.pm.get('ui-templates')).toBeTruthy();
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupFixtureCollections(rootAgent);
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
    let fieldImportSurface = await getSurface(rootAgent, { uid: fieldImportBlock.uid });
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
    let sourceActionSurface = await getSurface(rootAgent, { uid: sourceAction.uid });
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
    await expectTemplateUsage(rootAgent, template.uid, 3);

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
    await expectTemplateUsage(rootAgent, template.uid, 3);
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
    await expectTemplateUsage(rootAgent, template.uid, 4);

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
    await expectTemplateUsage(rootAgent, template.uid, 3);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: sourceAction.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 2);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: referencedRecordAction.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 1);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: configurableAction.uid },
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
    let sourceFieldSurface = await getSurface(rootAgent, { uid: sourceField.fieldUid || sourceField.uid });
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
    await expectTemplateUsage(rootAgent, template.uid, 2);
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
    await expectTemplateUsage(rootAgent, template.uid, 3);

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
    await expectTemplateUsage(rootAgent, template.uid, 2);
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
    await expectTemplateUsage(rootAgent, template.uid, 1);

    getData(
      await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: { uid: sourceField.fieldUid || sourceField.uid },
        },
      }),
    );
    await expectTemplateUsage(rootAgent, template.uid, 0);
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
          uid: fieldsTemplate.uid,
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
    const listedFieldsTemplate = listedFieldsTemplates.rows.find((row: any) => row.uid === fieldsTemplate.uid);
    expect(listedFieldsTemplate).toMatchObject({
      uid: fieldsTemplate.uid,
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
    expect(
      listedCompatibleFieldsTemplates.rows.find((row: any) => row.uid === fieldsTemplate.uid),
    ).toMatchObject({
      uid: fieldsTemplate.uid,
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

function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body?.data?.data ?? response.body?.data;
}

function getListData(response: any) {
  expect(response.status).toBe(200);
  let current = response.body;
  let meta = response.body?.meta;
  if (current && typeof current === 'object' && 'data' in current) {
    current = current.data;
  }
  for (let i = 0; i < 4; i += 1) {
    if (current && typeof current === 'object' && Array.isArray(current.rows)) {
      return {
        ...current,
        count: current.count ?? meta?.count ?? meta?.total ?? meta?.totalCount,
        page: current.page ?? meta?.page,
        pageSize: current.pageSize ?? meta?.pageSize,
        totalPage: current.totalPage ?? meta?.totalPage,
      };
    }
    if (current && typeof current === 'object' && 'data' in current) {
      meta = current.meta ?? meta;
      current = current.data;
      continue;
    }
    break;
  }
  return {
    rows: Array.isArray(current) ? current : [],
    count: meta?.count ?? meta?.total ?? meta?.totalCount,
    page: meta?.page,
    pageSize: meta?.pageSize,
    totalPage: meta?.totalPage,
  };
}

function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || '';
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values,
    }),
  );
}

async function addBlockData(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values,
    }),
  );
}

async function addFieldData(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addField({
      values,
    }),
  );
}

async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').get(target),
  );
}

async function saveTemplate(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').saveTemplate({
      values,
    }),
  );
}

async function expectTemplateUsage(rootAgent: any, templateUid: string, usageCount: number) {
  const template = getData(
    await rootAgent.resource('flowSurfaces').getTemplate({
      values: {
        uid: templateUid,
      },
    }),
  );
  expect(template.usageCount).toBe(usageCount);
}

function getPopupGridItems(tree: any) {
  return tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [];
}

function getPopupOpenView(tree: any) {
  return tree?.stepParams?.popupSettings?.openView || tree?.stepParams?.selectExitRecordSettings?.openView;
}

async function setupFixtureCollections(rootAgent: any) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'employees',
      title: 'Employees',
      fields: [
        { name: 'nickname', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });
  await rootAgent.resource('collections').create({
    values: {
      name: 'departments',
      title: 'Departments',
      fields: [{ name: 'title', type: 'string', interface: 'input' }],
    },
  });
}
