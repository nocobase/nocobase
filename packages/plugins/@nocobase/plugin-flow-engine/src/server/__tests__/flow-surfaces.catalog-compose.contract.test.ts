/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  addBlockData,
  getComposeBlock,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getData,
  getSurface,
  readErrorItem,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { loginFlowSurfacesRootAgent, syncFlowSurfacesEnabledPlugins } from './flow-surfaces.mock-server';
import { FLOW_SURFACES_MINIMAL_TEST_PLUGINS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

describe('flowSurfaces catalog + compose contract', () => {
  let context: FlowSurfacesContractContext;
  let app: FlowSurfacesContractContext['app'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ app, flowRepo, rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should expose full public action catalog variants without collapsing cross-scope action keys', async () => {
    const globalCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {},
      }),
    );
    expect(globalCatalog.selectedSections).toEqual(['blocks', 'actions', 'recordActions']);

    const popupVariants = globalCatalog.actions
      .filter((item: any) => item.key === 'popup')
      .map((item: any) => `${item.scope}:${item.use}`);
    expect(popupVariants).toEqual(expect.arrayContaining(['block:PopupCollectionActionModel']));
    const recordPopupVariants = globalCatalog.recordActions
      .filter((item: any) => item.key === 'popup')
      .map((item: any) => `${item.scope}:${item.use}`);
    expect(recordPopupVariants).toEqual(expect.arrayContaining(['record:PopupCollectionActionModel']));

    const submitVariants = globalCatalog.actions
      .filter((item: any) => item.key === 'submit')
      .map((item: any) => `${item.scope}:${item.use}`);
    expect(submitVariants).toEqual(
      expect.arrayContaining(['form:FormSubmitActionModel', 'filterForm:FilterFormSubmitActionModel']),
    );

    const jsVariants = globalCatalog.actions.filter((item: any) => item.key === 'js').map((item: any) => item.scope);
    expect(jsVariants).toEqual(expect.arrayContaining(['block', 'form', 'filterForm', 'actionPanel']));
    const recordJsVariants = globalCatalog.recordActions
      .filter((item: any) => item.key === 'js')
      .map((item: any) => item.scope);
    expect(recordJsVariants).toEqual(expect.arrayContaining(['record']));
  });

  it('should treat explicit empty catalog sections as an empty response instead of falling back to defaults', async () => {
    const emptyCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          sections: [],
        },
      }),
    );

    expect(emptyCatalog.selectedSections).toEqual([]);
    expect(emptyCatalog.blocks).toBeUndefined();
    expect(emptyCatalog.fields).toBeUndefined();
    expect(emptyCatalog.actions).toBeUndefined();
    expect(emptyCatalog.recordActions).toBeUndefined();
    expect(emptyCatalog.node).toBeUndefined();
  });

  it('should only expose catalog blocks and actions backed by plugins enabled in the current app instance', async () => {
    await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_MINIMAL_TEST_PLUGINS);
    try {
      const minimalRootAgent: any = await loginFlowSurfacesRootAgent(app);

      const page = await createPage(minimalRootAgent, {
        title: 'Minimal catalog page',
        tabTitle: 'Minimal catalog tab',
      });
      const pageCatalog = getData(
        await minimalRootAgent.resource('flowSurfaces').catalog({
          values: {
            target: {
              uid: page.tabSchemaUid,
            },
          },
        }),
      );
      expect(pageCatalog.blocks.map((item: any) => item.use)).toEqual(
        expect.arrayContaining([
          'TableBlockModel',
          'CreateFormModel',
          'EditFormModel',
          'DetailsBlockModel',
          'FilterFormBlockModel',
          'JSBlockModel',
        ]),
      );
      expect(pageCatalog.blocks.find((item: any) => item.use === 'ListBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'GridCardBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'MarkdownBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'IframeBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'MapBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'ChartBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'CommentsBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'ActionPanelBlockModel')).toBeUndefined();

      const table = await addBlockData(minimalRootAgent, {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      });
      const tableCatalog = getData(
        await minimalRootAgent.resource('flowSurfaces').catalog({
          values: {
            target: {
              uid: table.uid,
            },
          },
        }),
      );
      expect(tableCatalog.actions.map((item: any) => item.key)).toEqual(
        expect.arrayContaining(['filter', 'addNew', 'popup', 'refresh', 'expandCollapse', 'bulkDelete', 'link', 'js']),
      );
      expect(tableCatalog.actions.find((item: any) => item.key === 'bulkEdit')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'bulkUpdate')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'export')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'exportAttachments')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'import')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'upload')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'composeEmail')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'templatePrint')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'triggerWorkflow')).toBeUndefined();

      expect(tableCatalog.recordActions.map((item: any) => item.key)).toEqual(
        expect.arrayContaining(['view', 'edit', 'popup', 'delete', 'updateRecord', 'js']),
      );
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'duplicate')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'composeEmail')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'templatePrint')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'triggerWorkflow')).toBeUndefined();
    } finally {
      await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_TEST_PLUGINS);
    }
  });

  it('should expose public catalog action keys for representative block targets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Catalog contract page',
      tabTitle: 'Catalog contract tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const createForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const details = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const filterForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'filterForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: '',
      },
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: table.uid,
          },
          expand: ['item.configureOptions'],
        },
      }),
    );
    expect(tableCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'filter',
        'addNew',
        'popup',
        'refresh',
        'expandCollapse',
        'bulkDelete',
        'bulkEdit',
        'bulkUpdate',
        'export',
        'exportAttachments',
        'import',
        'link',
        'upload',
        'js',
        'composeEmail',
        'templatePrint',
        'triggerWorkflow',
      ]),
    );
    expect(tableCatalog.node.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      pageSize: {
        type: 'number',
      },
      density: {
        type: 'string',
        enum: expect.arrayContaining(['large', 'middle', 'small']),
      },
      dataScope: {
        type: 'object',
      },
    });
    expect(tableCatalog.rowActions).toBeUndefined();
    expect(tableCatalog.actions.map((item: any) => item.key)).not.toEqual(expect.arrayContaining(['view', 'edit']));
    expect(tableCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'duplicate',
        'view',
        'edit',
        'popup',
        'composeEmail',
        'delete',
        'updateRecord',
        'js',
        'templatePrint',
        'triggerWorkflow',
      ]),
    );
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();
    expect(tableCatalog.recordActions.length).toBeGreaterThan(0);
    expect(tableCatalog.actions.find((item: any) => item.key === 'addNew')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      openView: {
        type: 'object',
      },
    });
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'view')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      openView: {
        type: 'object',
      },
    });

    const createFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: createForm.uid,
          },
        },
      }),
    );
    expect(createFormCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['submit', 'js', 'triggerWorkflow']),
    );

    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: details.uid,
          },
        },
      }),
    );
    expect(detailsCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'view',
        'edit',
        'popup',
        'composeEmail',
        'delete',
        'updateRecord',
        'js',
        'templatePrint',
        'triggerWorkflow',
      ]),
    );

    const filterFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: filterForm.uid,
          },
        },
      }),
    );
    expect(filterFormCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['submit', 'reset', 'collapse', 'js']),
    );
  });

  it('should only expose addChild in target-specific catalog when a table uses a tree collection with treeTable enabled', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree table catalog contract page',
      tabTitle: 'Tree table catalog contract tab',
    });
    const employeesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const categoriesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'categories',
      },
    });

    const employeesCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: employeesTable.uid,
          },
        },
      }),
    );
    expect(employeesCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();

    const categoriesCatalogBeforeEnable = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: categoriesTable.uid,
          },
        },
      }),
    );
    expect(categoriesCatalogBeforeEnable.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: categoriesTable.uid,
            },
            changes: {
              treeTable: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    const categoriesCatalogAfterEnable = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: categoriesTable.uid,
          },
        },
      }),
    );
    expect(categoriesCatalogAfterEnable.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['addChild', 'view', 'edit', 'delete']),
    );
  });

  it('should expose popup block resourceBindings and reject invalid popup record block bindings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup catalog contract page',
      tabTitle: 'Popup catalog contract tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const plainPopup = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const plainPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: plainPopup.uid,
          },
        },
      }),
    );
    expect(plainPopupCatalog.blocks.find((item: any) => item.use === 'CreateFormModel')?.resourceBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'currentCollection' }),
        expect.objectContaining({ key: 'otherRecords' }),
      ]),
    );
    expect(plainPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')).toBeUndefined();

    const recordPopup = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'view',
        },
      }),
    );
    const recordPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: recordPopup.uid,
          },
        },
      }),
    );
    const recordPopupDetailsBindings =
      recordPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(recordPopupDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'associatedRecords', 'otherRecords']),
    );
    expect(recordPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
    );

    const recordScopedPopup = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const recordScopedPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: recordScopedPopup.uid,
          },
        },
      }),
    );
    const recordScopedPopupDetailsBindings =
      recordScopedPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(recordScopedPopupDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'associatedRecords', 'otherRecords']),
    );
    expect(recordScopedPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
    );

    const invalidRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: recordPopup.uid,
        },
        type: 'details',
        resource: {
          binding: 'currentCollection',
        },
      },
    });
    expect(invalidRaw.status).toBe(400);
    expect(readErrorMessage(invalidRaw)).toContain(`resource.binding='currentCollection'`);
    expect(readErrorMessage(invalidRaw)).toContain('supported bindings:');
    expect(readErrorMessage(invalidRaw)).toContain('currentRecord');

    const associationPopup = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const configureAssociationPopup = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: associationPopup.uid,
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
            associationName: 'tasks',
            sourceId: '{{ctx.record.id}}',
            filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
          },
        },
      },
    });
    expect(configureAssociationPopup.status).toBe(200);

    const invalidAssociationCurrentRecordRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: associationPopup.uid,
        },
        type: 'details',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
          filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
          associationName: 'tasks',
          sourceId: '{{ctx.custom.badSourceId}}',
        },
      },
    });
    expect(invalidAssociationCurrentRecordRaw.status).toBe(400);
    expect(readErrorMessage(invalidAssociationCurrentRecordRaw)).toContain(
      `does not support resourceInit binding 'currentRecord'`,
    );
  });

  it('should hide collection block popup bindings on unsupported popup scenes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup unsupported scene page',
      tabTitle: 'Popup unsupported scene tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const popup = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const configurePopup = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: popup.uid,
        },
        changes: {
          openView: {
            scene: 'select',
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      },
    });
    expect(configurePopup.status).toBe(200);

    const popupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: popup.uid,
          },
        },
      }),
    );
    expect(popupCatalog.blocks.find((item: any) => item.use === 'CreateFormModel')).toBeUndefined();
    expect(popupCatalog.blocks.find((item: any) => item.use === 'TableBlockModel')).toBeUndefined();
    expect(popupCatalog.blocks.find((item: any) => item.use === 'MarkdownBlockModel')).toBeTruthy();

    const addCollectionBlock = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: popup.uid,
        },
        type: 'table',
        resource: {
          binding: 'otherRecords',
          dataSourceKey: 'main',
          collectionName: 'departments',
        },
      },
    });
    expect(addCollectionBlock.status).toBe(400);
    expect(readErrorMessage(addCollectionBlock)).toContain(`scene 'select'`);
  });

  it('should reject direct addAction types that do not match the public action scope of the target container', async () => {
    const page = await createPage(rootAgent, {
      title: 'Action visibility page',
      tabTitle: 'Action visibility tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const createForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const tableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    const actionsColumnUid = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    )?.uid;

    const rowActionOnTableBlock = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'view',
      },
    });
    expect(rowActionOnTableBlock.status).toBe(400);
    expect(readErrorMessage(rowActionOnTableBlock)).toContain(`use addRecordAction`);

    const blockActionOnRowContainer = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        type: 'refresh',
      },
    });
    expect(blockActionOnRowContainer.status).toBe(400);
    expect(readErrorMessage(blockActionOnRowContainer)).toContain(`record action surface`);

    const directRecordActionOnInternalContainer = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        type: 'view',
      },
    });
    expect(directRecordActionOnInternalContainer.status).toBe(400);
    expect(readErrorMessage(directRecordActionOnInternalContainer)).toContain(`internal record action container`);

    const hiddenDeleteOnForm = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: createForm.uid,
        },
        type: 'delete',
      },
    });
    expect(hiddenDeleteOnForm.status).toBe(400);
    expect(readErrorMessage(hiddenDeleteOnForm)).toContain(`is not allowed under 'CreateFormModel'`);
  });

  it('should compose a filter-form and table under a page grid with simple 3:7 layout semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose users page',
      tabTitle: 'Compose users tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'filter',
            type: 'filterForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: [
              {
                fieldPath: 'username',
                target: 'table',
              },
              {
                fieldPath: 'nickname',
                target: 'table',
              },
            ],
            actions: ['submit', 'reset'],
          },
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname'],
            actions: [
              'filter',
              {
                type: 'addNew',
                popup: {
                  mode: 'replace',
                },
              },
              'refresh',
            ],
            recordActions: [
              {
                type: 'view',
                popup: {
                  blocks: [],
                },
              },
              {
                type: 'edit',
                popup: {
                  layout: {
                    rows: [[{ key: 'defaultEditForm', span: 10 }]],
                  },
                },
              },
              'delete',
            ],
          },
        ],
        layout: {
          rows: [
            [
              { key: 'filter', span: 3 },
              { key: 'table', span: 7 },
            ],
          ],
        },
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const filterBlock = getComposeBlock(composed, 'filter');
    const tableBlock = getComposeBlock(composed, 'table');
    expect(filterBlock.uid).toBeTruthy();
    expect(tableBlock.uid).toBeTruthy();
    expect(composed.layout.sizes.row1).toEqual([7, 17]);

    const tabGrid = await flowRepo.findModelByParentId(page.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(tabGrid?.props?.sizes?.row1).toEqual([7, 17]);
    expect(tabGrid?.props?.rowOrder).toEqual(['row1']);

    const tableReadback = await getSurface(rootAgent, {
      uid: tableBlock.uid,
    });
    expect(tableReadback.tree.use).toBe('TableBlockModel');
    expect(tableReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
    });
    expect(_.castArray(tableReadback.tree.subModels?.columns || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['TableActionsColumnModel', 'TableColumnModel']),
    );
    expect(
      _.castArray(tableReadback.tree.subModels?.columns || [])
        .filter((item: any) => item?.use === 'TableColumnModel')
        .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(expect.arrayContaining(['username', 'nickname']));
    expect(_.castArray(tableReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['FilterActionModel', 'AddNewActionModel', 'RefreshActionModel']),
    );

    const actionsColumnUid = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    )?.uid;
    const rowActionsReadback = await getSurface(rootAgent, {
      uid: actionsColumnUid,
    });
    expect(_.castArray(rowActionsReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'DeleteActionModel']),
    );

    const composedTableBlock = getComposeBlock(composed, 'table');
    const composedAddNewAction = composedTableBlock?.actions?.find((item: any) => item.type === 'addNew');
    const composedViewAction = composedTableBlock?.recordActions?.find((item: any) => item.type === 'view');
    const composedEditAction = composedTableBlock?.recordActions?.find((item: any) => item.type === 'edit');

    const addNewPopupReadback = await getSurface(rootAgent, {
      uid: composedAddNewAction.uid,
    });
    const addNewPopupBlock = _.castArray(
      addNewPopupReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(addNewPopupBlock?.use).toBe('CreateFormModel');
    expect(addNewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(addNewPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const viewPopupReadback = await getSurface(rootAgent, {
      uid: composedViewAction.uid,
    });
    const viewPopupBlock = _.castArray(
      viewPopupReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(viewPopupBlock?.use).toBe('DetailsBlockModel');
    expect(viewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');

    const editPopupReadback = await getSurface(rootAgent, {
      uid: composedEditAction.uid,
    });
    const editPopupBlock = _.castArray(
      editPopupReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(editPopupBlock?.use).toBe('EditFormModel');
    expect(editPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(editPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const filterReadback = await getSurface(rootAgent, {
      uid: filterBlock.uid,
    });
    expect(filterReadback.tree.use).toBe('FilterFormBlockModel');
    expect(_.castArray(filterReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['FilterFormSubmitActionModel', 'FilterFormResetActionModel']),
    );

    const usernameFilter = composed.blocks
      .find((item: any) => item.key === 'filter')
      ?.fields?.find((item: any) => item.fieldPath === 'username');
    expect(usernameFilter?.wrapperUid).toBeTruthy();
    const usernameFilterReadback = await getSurface(rootAgent, {
      uid: usernameFilter.wrapperUid,
    });
    expect(usernameFilterReadback.tree.stepParams?.filterFormItemSettings?.init?.defaultTargetUid).toBe(tableBlock.uid);
  });

  it('should compose a list block with item fields block actions and record actions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose list page',
      tabTitle: 'Compose list tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesList',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname'],
            actions: ['addNew', 'refresh'],
            recordActions: [
              'view',
              'edit',
              {
                type: 'popup',
                popup: {
                  mode: 'replace',
                  blocks: [
                    {
                      key: 'details',
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
                      },
                      fields: ['username'],
                    },
                  ],
                },
              },
              'delete',
            ],
            settings: {
              pageSize: 20,
              layout: 'vertical',
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const listBlock = composed.blocks.find((item: any) => item.key === 'employeesList');
    expect(listBlock.uid).toBeTruthy();
    expect(listBlock.itemUid).toBeTruthy();
    expect(listBlock.itemGridUid).toBeTruthy();
    expect(listBlock.fields.map((item: any) => item.fieldPath)).toEqual(['username', 'nickname']);
    expect(listBlock.actions.map((item: any) => item.type)).toEqual(['addNew', 'refresh']);
    expect(listBlock.recordActions.map((item: any) => item.type)).toEqual(['view', 'edit', 'popup', 'delete']);
    const popupActionResult = listBlock.recordActions.find((item: any) => item.type === 'popup');
    expect(popupActionResult.popupPageUid).toBeTruthy();
    expect(popupActionResult.popupTabUid).toBeTruthy();
    expect(popupActionResult.popupGridUid).toBeTruthy();

    const listReadback = await getSurface(rootAgent, {
      uid: listBlock.uid,
    });
    expect(listReadback.tree.use).toBe('ListBlockModel');
    expect(listReadback.tree.subModels?.item?.use).toBe('ListItemModel');
    expect(listReadback.tree.subModels?.item?.subModels?.grid?.use).toBe('DetailsGridModel');
    expect(_.castArray(listReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['AddNewActionModel', 'RefreshActionModel']),
    );
    expect(
      _.castArray(listReadback.tree.subModels?.item?.subModels?.grid?.subModels?.items || []).map(
        (item: any) => item?.subModels?.field?.stepParams?.fieldSettings?.init?.fieldPath,
      ),
    ).toEqual(expect.arrayContaining(['username', 'nickname']));
    expect(
      _.castArray(listReadback.tree.subModels?.item?.subModels?.actions || []).map((item: any) => item?.use),
    ).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'PopupCollectionActionModel', 'DeleteActionModel']),
    );

    const popupActionUid = popupActionResult?.uid;
    const popupReadback = await getSurface(rootAgent, {
      uid: popupActionUid,
    });
    expect(popupReadback.tree.subModels?.page?.use).toBe('ChildPageModel');
    expect(
      _.castArray(
        popupReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      ).map((item: any) => item?.use),
    ).toEqual(expect.arrayContaining(['DetailsBlockModel']));

    const defaultViewAction = listBlock.recordActions.find((item: any) => item.type === 'view');
    const defaultEditAction = listBlock.recordActions.find((item: any) => item.type === 'edit');
    const defaultViewReadback = await getSurface(rootAgent, {
      uid: defaultViewAction.uid,
    });
    const defaultViewPopupBlock = _.castArray(
      defaultViewReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(defaultViewPopupBlock?.use).toBe('DetailsBlockModel');

    const defaultEditReadback = await getSurface(rootAgent, {
      uid: defaultEditAction.uid,
    });
    const defaultEditPopupBlock = _.castArray(
      defaultEditReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(defaultEditPopupBlock?.use).toBe('EditFormModel');
    expect(_.castArray(defaultEditPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
  });

  it('should compose a grid-card block with item fields block actions and record actions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose grid-card page',
      tabTitle: 'Compose grid-card tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeeCards',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname'],
            actions: ['addNew', 'refresh'],
            recordActions: ['view', 'edit', 'updateRecord', 'delete'],
            settings: {
              columns: 3,
              rowCount: 2,
              layout: 'vertical',
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const gridCardBlock = composed.blocks.find((item: any) => item.key === 'employeeCards');
    expect(gridCardBlock.uid).toBeTruthy();
    expect(gridCardBlock.itemUid).toBeTruthy();
    expect(gridCardBlock.itemGridUid).toBeTruthy();
    expect(gridCardBlock.fields.map((item: any) => item.fieldPath)).toEqual(['username', 'nickname']);
    expect(gridCardBlock.actions.map((item: any) => item.type)).toEqual(['addNew', 'refresh']);
    expect(gridCardBlock.recordActions.map((item: any) => item.type)).toEqual([
      'view',
      'edit',
      'updateRecord',
      'delete',
    ]);
    const updateRecordResult = gridCardBlock.recordActions.find((item: any) => item.type === 'updateRecord');
    expect(updateRecordResult.assignFormUid).toBeTruthy();
    expect(updateRecordResult.assignFormGridUid).toBeTruthy();

    const gridCardReadback = await getSurface(rootAgent, {
      uid: gridCardBlock.uid,
    });
    expect(gridCardReadback.tree.use).toBe('GridCardBlockModel');
    expect(gridCardReadback.tree.subModels?.item?.use).toBe('GridCardItemModel');
    expect(gridCardReadback.tree.subModels?.item?.subModels?.grid?.use).toBe('DetailsGridModel');
    expect(_.castArray(gridCardReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['AddNewActionModel', 'RefreshActionModel']),
    );
    expect(
      _.castArray(gridCardReadback.tree.subModels?.item?.subModels?.grid?.subModels?.items || []).map(
        (item: any) => item?.subModels?.field?.stepParams?.fieldSettings?.init?.fieldPath,
      ),
    ).toEqual(expect.arrayContaining(['username', 'nickname']));
    expect(
      _.castArray(gridCardReadback.tree.subModels?.item?.subModels?.actions || []).map((item: any) => item?.use),
    ).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'UpdateRecordActionModel', 'DeleteActionModel']),
    );
  });

  it('should support recordActions grouping on all record-capable blocks while still rejecting unsupported action containers', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose record action validation page',
      tabTitle: 'Compose record action validation tab',
    });

    const tableRecordActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            actions: ['addNew', 'refresh'],
            recordActions: ['view', 'delete'],
          },
        ],
      },
    });
    expect(tableRecordActionsRes.status).toBe(200);

    const tableBlock = getData(tableRecordActionsRes).blocks.find((item: any) => item.key === 'table');
    expect(tableBlock.actions.map((item: any) => item.type)).toEqual(['addNew', 'refresh']);
    expect(tableBlock.recordActions.map((item: any) => item.type)).toEqual(['view', 'delete']);
    expect(tableBlock.actionsColumnUid).toBeTruthy();

    const tableRecordActionReadback = await getSurface(rootAgent, {
      uid: tableBlock.actionsColumnUid,
    });
    expect(_.castArray(tableRecordActionReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['ViewActionModel', 'DeleteActionModel']),
    );

    const detailsRecordActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'details',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            recordActions: ['view'],
          },
        ],
      },
    });
    expect(detailsRecordActionsRes.status).toBe(200);
    const detailsBlock = getData(detailsRecordActionsRes).blocks.find((item: any) => item.key === 'details');
    expect(detailsBlock.recordActions.map((item: any) => item.type)).toEqual(['view']);

    const listBlockOnlyRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesList',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            actions: ['view'],
          },
        ],
      },
    });
    expect(listBlockOnlyRes.status).toBe(400);
    expect(readErrorMessage(listBlockOnlyRes)).toContain(`must be placed under recordActions`);

    const gridCardRecordOnlyRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeeCards',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            recordActions: ['addNew'],
          },
        ],
      },
    });
    expect(gridCardRecordOnlyRes.status).toBe(400);
    expect(readErrorMessage(gridCardRecordOnlyRes)).toContain(`must be placed under actions`);
  });

  it('should only compose addChild when the target table enables treeTable on a tree collection', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose addChild page',
      tabTitle: 'Compose addChild tab',
    });

    const invalidComposeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoriesTableWithoutTree',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            recordActions: ['addChild'],
          },
        ],
      },
    });
    expect(invalidComposeRes.status).toBe(400);
    expect(readErrorMessage(invalidComposeRes)).toContain('tree table');

    const validComposeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoriesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            fields: ['title'],
            recordActions: ['addChild'],
            settings: {
              treeTable: true,
            },
          },
        ],
      },
    });
    expect(validComposeRes.status).toBe(200);

    const categoriesTable = getData(validComposeRes).blocks.find((item: any) => item.key === 'categoriesTable');
    expect(categoriesTable.recordActions.map((item: any) => item.type)).toEqual(['addChild']);

    const addChildReadback = await getSurface(rootAgent, {
      uid: categoriesTable.recordActions[0].uid,
    });
    expect(addChildReadback.tree.use).toBe('AddChildActionModel');
    expect(addChildReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'medium',
    });
  });

  it('should reject legacy scope overrides mixed into compose actions and recordActions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose scope validation page',
      tabTitle: 'Compose scope validation tab',
    });

    const legacyScopeOnBlockActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            actions: [
              {
                type: 'addNew',
                scope: 'block',
              },
            ],
          },
        ],
      },
    });
    expect(legacyScopeOnBlockActionsRes.status).toBe(400);
    expect(readErrorMessage(legacyScopeOnBlockActionsRes)).toContain(
      'does not support scope, use actions or recordActions',
    );

    const legacyScopeOnRecordActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            recordActions: [
              {
                type: 'view',
                scope: 'row',
              },
            ],
          },
        ],
      },
    });
    expect(legacyScopeOnRecordActionsRes.status).toBe(400);
    expect(readErrorMessage(legacyScopeOnRecordActionsRes)).toContain(
      'does not support scope, use actions or recordActions',
    );
  });

  it('should support compose replace and configure simple changes while rejecting raw patch keys', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose replace page',
      tabTitle: 'Compose replace tab',
    });

    const initialCompose = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: ['username', 'nickname'],
              actions: ['filter', 'addNew'],
              recordActions: ['view', 'delete'],
            },
          ],
        },
      }),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'replace',
        blocks: [
          {
            key: 'form',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname'],
            actions: ['submit'],
          },
        ],
      },
    });
    expect(replaceRes.status).toBe(200);
    const replaced = getData(replaceRes);
    const replacedFormBlock = getComposeBlock(replaced, 'form');
    const initialTableBlock = getComposeBlock(initialCompose, 'table');
    expect(replacedFormBlock.uid).toBeTruthy();

    const tabGrid = await flowRepo.findModelByParentId(page.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(_.castArray(tabGrid?.subModels?.items || []).map((item: any) => item.uid)).toEqual([replacedFormBlock.uid]);
    expect(_.castArray(tabGrid?.subModels?.items || []).some((item: any) => item.uid === initialTableBlock.uid)).toBe(
      false,
    );
    expect(tabGrid?.props?.sizes?.row1).toEqual([24]);

    const pageConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: page.pageUid },
        changes: {
          title: 'Users console',
          documentTitle: 'Users browser title',
          displayTitle: false,
          enableTabs: true,
        },
      },
    });
    expect(pageConfigure.status).toBe(200);

    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(pageReadback.tree.stepParams?.pageSettings?.general).toMatchObject({
      title: 'Users console',
      documentTitle: 'Users browser title',
      displayTitle: false,
      enableTabs: true,
    });

    const formUid = replacedFormBlock.uid;
    const formGrid = await flowRepo.findModelById(formUid, { includeAsyncNode: true });
    const formFieldWrapperUid = _.castArray(formGrid?.subModels?.grid?.subModels?.items || [])[0]?.uid;
    const formFieldInnerUid = _.castArray(formGrid?.subModels?.grid?.subModels?.items || [])[0]?.subModels?.field?.uid;
    const formActionUid = _.castArray(formGrid?.subModels?.actions || [])[0]?.uid;

    const blockConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formUid,
        },
        changes: {
          layout: 'vertical',
          labelAlign: 'left',
          labelWidth: 180,
          labelWrap: true,
        },
      },
    });
    expect(blockConfigure.status).toBe(200);

    const wrapperConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formFieldWrapperUid,
        },
        changes: {
          label: 'User name',
          tooltip: 'Primary login name',
          extra: 'Used for sign-in',
          showLabel: false,
        },
      },
    });
    expect(wrapperConfigure.status).toBe(200);

    const fieldConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formFieldInnerUid,
        },
        changes: {
          clickToOpen: true,
          openView: {
            dataSourceKey: 'main',
            collectionName: 'users',
            mode: 'drawer',
          },
        },
      },
    });
    expect(fieldConfigure.status).toBe(200);

    const actionConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formActionUid,
        },
        changes: {
          title: 'Submit now',
          tooltip: 'Create the record',
          confirm: {
            enable: true,
            title: 'Please confirm',
            content: 'Submit the form now?',
          },
        },
      },
    });
    expect(actionConfigure.status).toBe(200);

    const formReadback = await getSurface(rootAgent, {
      uid: formUid,
    });
    expect(formReadback.tree.stepParams?.formModelSettings?.layout).toMatchObject({
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 180,
      labelWrap: true,
    });

    const wrapperReadback = await getSurface(rootAgent, {
      uid: formFieldWrapperUid,
    });
    expect(wrapperReadback.tree.props).toMatchObject({
      label: 'User name',
      tooltip: 'Primary login name',
      extra: 'Used for sign-in',
      showLabel: false,
    });

    const fieldReadback = await getSurface(rootAgent, {
      uid: formFieldInnerUid,
    });
    expect(fieldReadback.tree.props?.clickToOpen).toBe(true);
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName: 'users',
      mode: 'drawer',
    });

    const actionReadback = await getSurface(rootAgent, {
      uid: formActionUid,
    });
    expect(actionReadback.tree.props).toMatchObject({
      title: 'Submit now',
      tooltip: 'Create the record',
    });
    expect(actionReadback.tree.stepParams?.submitSettings?.confirm).toMatchObject({
      enable: true,
      title: 'Please confirm',
      content: 'Submit the form now?',
    });

    const rawPathConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formUid,
        },
        changes: {
          stepParams: {
            formModelSettings: {
              layout: {
                layout: 'horizontal',
              },
            },
          },
        },
      },
    });
    expect(rawPathConfigure.status).toBe(400);
    expect(readErrorMessage(rawPathConfigure)).toContain('does not accept raw keys');
    expect(readErrorMessage(rawPathConfigure)).toContain('configureOptions');

    const rawUseCompose = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'bad',
            type: 'table',
            use: 'TableBlockModel',
          },
        ],
      },
    });
    expect(rawUseCompose.status).toBe(400);
    expect(readErrorMessage(rawUseCompose)).toContain('public semantic block fields');

    const unknownSimpleField = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formUid,
        },
        changes: {
          unknown: true,
        },
      },
    });
    expect(unknownSimpleField.status).toBe(400);
    expect(readErrorMessage(unknownSimpleField)).toContain('does not support');
  });

  it('should support inline settings and popup on direct add and batch add APIs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Direct add inline page',
      tabTitle: 'Direct add inline tab',
    });

    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            settings: {
              title: 'Employees table',
              pageSize: 50,
            },
          },
          {
            key: 'notes',
            type: 'markdown',
            settings: {
              content: '# Team notes',
            },
          },
        ],
      },
    });
    expect(addBlocksRes.status).toBe(200);
    const addBlocksData = getData(addBlocksRes);
    expect(addBlocksData.successCount).toBe(2);
    expect(addBlocksData.errorCount).toBe(0);
    const tableUid = addBlocksData.blocks.find((item: any) => item.key === 'table')?.result?.uid;
    expect(tableUid).toBeTruthy();

    const addFieldsRes = await rootAgent.resource('flowSurfaces').addFields({
      values: {
        target: {
          uid: tableUid,
        },
        fields: [
          {
            key: 'username',
            fieldPath: 'username',
            settings: {
              title: 'Username',
              width: 220,
            },
          },
          {
            key: 'bad-field',
            fieldPath: 'nickname',
            settings: {
              badSetting: true,
            },
          },
        ],
      },
    });
    expect(addFieldsRes.status).toBe(200);
    const addFieldsData = getData(addFieldsRes);
    expect(addFieldsData.successCount).toBe(1);
    expect(addFieldsData.errorCount).toBe(1);
    expect(addFieldsData.fields[0].ok).toBe(true);
    expect(addFieldsData.fields[1].ok).toBe(false);
    expectStructuredError(addFieldsData.fields[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addFieldsData.fields[1].error.message).toContain('settings invalid');
    expect(addFieldsData.fields[1].error.message).toContain('supported configureOptions');

    const fieldReadback = await getSurface(rootAgent, {
      uid: addFieldsData.fields[0].result.wrapperUid,
    });
    expect(fieldReadback.tree.props?.title).toBe('Username');
    expect(fieldReadback.tree.props?.width).toBe(220);

    const addActionsRes = await rootAgent.resource('flowSurfaces').addActions({
      values: {
        target: {
          uid: tableUid,
        },
        actions: [
          {
            key: 'addNew',
            type: 'addNew',
            settings: {
              title: 'Create employee',
            },
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'form',
                  type: 'createForm',
                  resource: {
                    binding: 'currentCollection',
                  },
                  fields: ['username'],
                  actions: ['submit'],
                },
              ],
            },
          },
          {
            key: 'implicitAddNew',
            type: 'addNew',
            popup: {
              blocks: [],
            },
          },
          {
            key: 'implicitAddNewWithMode',
            type: 'addNew',
            popup: {
              mode: 'replace',
            },
          },
          {
            key: 'refresh-with-popup',
            type: 'refresh',
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'details',
                  type: 'details',
                  resource: {
                    binding: 'currentRecord',
                  },
                  fields: ['username'],
                },
              ],
            },
          },
        ],
      },
    });
    expect(addActionsRes.status).toBe(200);
    const addActionsData = getData(addActionsRes);
    expect(addActionsData.successCount).toBe(3);
    expect(addActionsData.errorCount).toBe(1);
    expect(addActionsData.actions[0].result.popupPageUid).toBeTruthy();
    expect(addActionsData.actions[1].result.popupGridUid).toBeTruthy();
    expect(addActionsData.actions[2].result.popupGridUid).toBeTruthy();
    expectStructuredError(addActionsData.actions[3].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addActionsData.actions[3].error.message).toContain(`type 'refresh' does not support popup`);

    const implicitAddNewReadback = await getSurface(rootAgent, {
      uid: addActionsData.actions[1].result.uid,
    });
    const implicitAddNewPopupTab = _.castArray(implicitAddNewReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const implicitAddNewPopupBlock = _.castArray(implicitAddNewPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    expect(implicitAddNewPopupBlock?.use).toBe('CreateFormModel');
    expect(implicitAddNewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(implicitAddNewPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
    const implicitAddNewWithModeReadback = await getSurface(rootAgent, {
      uid: addActionsData.actions[2].result.uid,
    });
    const implicitAddNewWithModePopupBlock = _.castArray(
      implicitAddNewWithModeReadback.tree.subModels?.page?.subModels?.tabs || [],
    )[0]?.subModels?.grid?.subModels?.items?.[0];
    expect(implicitAddNewWithModePopupBlock?.use).toBe('CreateFormModel');

    const addRecordActionsRes = await rootAgent.resource('flowSurfaces').addRecordActions({
      values: {
        target: {
          uid: tableUid,
        },
        recordActions: [
          {
            key: 'view',
            type: 'view',
            settings: {
              title: 'View employee',
              openView: {
                dataSourceKey: 'main',
                collectionName: 'users',
                mode: 'drawer',
              },
            },
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'details',
                  type: 'details',
                  resource: {
                    binding: 'currentRecord',
                  },
                  fields: ['username'],
                },
              ],
            },
          },
          {
            key: 'delete',
            type: 'delete',
            settings: {
              confirm: true,
            },
          },
          {
            key: 'implicitEdit',
            type: 'edit',
            popup: {},
          },
          {
            key: 'implicitViewWithLayout',
            type: 'view',
            popup: {
              layout: {
                rows: [[{ key: 'defaultDetails', span: 10 }]],
              },
            },
          },
        ],
      },
    });
    expect(addRecordActionsRes.status).toBe(200);
    const addRecordActionsData = getData(addRecordActionsRes);
    expect(addRecordActionsData.successCount).toBe(4);
    expect(addRecordActionsData.errorCount).toBe(0);
    expect(addRecordActionsData.recordActions[0].result.popupGridUid).toBeTruthy();
    expect(addRecordActionsData.recordActions[2].result.popupGridUid).toBeTruthy();
    expect(addRecordActionsData.recordActions[3].result.popupGridUid).toBeTruthy();

    const implicitEditReadback = await getSurface(rootAgent, {
      uid: addRecordActionsData.recordActions[2].result.uid,
    });
    const implicitEditPopupTab = _.castArray(implicitEditReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const implicitEditPopupBlock = _.castArray(implicitEditPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    expect(implicitEditPopupBlock?.use).toBe('EditFormModel');
    expect(implicitEditPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(implicitEditPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const implicitViewWithLayoutReadback = await getSurface(rootAgent, {
      uid: addRecordActionsData.recordActions[3].result.uid,
    });
    const implicitViewWithLayoutPopupBlock = _.castArray(
      implicitViewWithLayoutReadback.tree.subModels?.page?.subModels?.tabs || [],
    )[0]?.subModels?.grid?.subModels?.items?.[0];
    expect(implicitViewWithLayoutPopupBlock?.use).toBe('DetailsBlockModel');

    const addFieldRawUnknownRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: tableUid,
        },
        fieldPath: 'nickname',
        settings: {
          badSetting: true,
        },
      },
    });
    expect(addFieldRawUnknownRes.status).toBe(400);
    expect(readErrorMessage(addFieldRawUnknownRes)).toContain('settings invalid');
    expect(readErrorMessage(addFieldRawUnknownRes)).toContain('supported configureOptions');
  });

  it('should auto-complete omitted popup payloads in batch action APIs and inherit custom popup tab titles', async () => {
    const page = await createPage(rootAgent, {
      title: 'Implicit batch popup page',
      tabTitle: 'Implicit batch popup tab',
    });

    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const addActionsRes = await rootAgent.resource('flowSurfaces').addActions({
      values: {
        target: {
          uid: table.uid,
        },
        actions: [
          {
            key: 'implicitAddNew',
            type: 'addNew',
            settings: {
              title: 'Create employee',
            },
          },
        ],
      },
    });
    expect(addActionsRes.status).toBe(200);
    const addActionsData = getData(addActionsRes);
    expect(addActionsData.successCount).toBe(1);
    expect(addActionsData.errorCount).toBe(0);
    expect(addActionsData.actions[0].result.popupPageUid).toBeTruthy();
    expect(addActionsData.actions[0].result.popupTabUid).toBeTruthy();
    expect(addActionsData.actions[0].result.popupGridUid).toBeTruthy();

    const implicitAddNewReadback = await getSurface(rootAgent, {
      uid: addActionsData.actions[0].result.uid,
    });
    const implicitAddNewPopupTab = _.castArray(implicitAddNewReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const implicitAddNewPopupBlock = _.castArray(implicitAddNewPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    expect(implicitAddNewPopupTab?.props?.title).toBe('Create employee');
    expect(implicitAddNewPopupBlock?.use).toBe('CreateFormModel');
    expect(implicitAddNewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(implicitAddNewPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const addRecordActionsRes = await rootAgent.resource('flowSurfaces').addRecordActions({
      values: {
        target: {
          uid: table.uid,
        },
        recordActions: [
          {
            key: 'implicitView',
            type: 'view',
            settings: {
              title: 'Inspect employee',
            },
          },
          {
            key: 'implicitEdit',
            type: 'edit',
            settings: {
              title: 'Modify employee',
            },
          },
        ],
      },
    });
    expect(addRecordActionsRes.status).toBe(200);
    const addRecordActionsData = getData(addRecordActionsRes);
    expect(addRecordActionsData.successCount).toBe(2);
    expect(addRecordActionsData.errorCount).toBe(0);
    expect(addRecordActionsData.recordActions[0].result.popupPageUid).toBeTruthy();
    expect(addRecordActionsData.recordActions[1].result.popupPageUid).toBeTruthy();

    const implicitViewReadback = await getSurface(rootAgent, {
      uid: addRecordActionsData.recordActions[0].result.uid,
    });
    const implicitViewPopupTab = _.castArray(implicitViewReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const implicitViewPopupBlock = _.castArray(implicitViewPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    expect(implicitViewPopupTab?.props?.title).toBe('Inspect employee');
    expect(implicitViewPopupBlock?.use).toBe('DetailsBlockModel');
    expect(implicitViewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');

    const implicitEditReadback = await getSurface(rootAgent, {
      uid: addRecordActionsData.recordActions[1].result.uid,
    });
    const implicitEditPopupTab = _.castArray(implicitEditReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const implicitEditPopupBlock = _.castArray(implicitEditPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    expect(implicitEditPopupTab?.props?.title).toBe('Modify employee');
    expect(implicitEditPopupBlock?.use).toBe('EditFormModel');
    expect(implicitEditPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(implicitEditPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
  });

  it('should keep batch addBlocks partial-success semantics when filter payload is invalid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Batch filter contract page',
      tabTitle: 'Batch filter contract tab',
    });

    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'valid-table',
            type: 'table',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            settings: {
              title: 'Valid employees table',
            },
          },
          {
            key: 'invalid-filter-table',
            type: 'table',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            settings: {
              dataScope: {
                foo: 'bar',
              },
            },
          },
        ],
      },
    });
    expect(addBlocksRes.status).toBe(200);
    const addBlocksData = getData(addBlocksRes);
    expect(addBlocksData.successCount).toBe(1);
    expect(addBlocksData.errorCount).toBe(1);
    expect(addBlocksData.blocks[0].ok).toBe(true);
    expect(addBlocksData.blocks[1].ok).toBe(false);
    expectStructuredError(addBlocksData.blocks[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addBlocksData.blocks[1].error.message).toContain('settings invalid');
    expect(addBlocksData.blocks[1].error.message).toContain('stepParams.tableSettings.dataScope.filter');
    expect(addBlocksData.blocks[1].error.message).toContain('FilterGroup');
    expect(addBlocksData.blocks[1].error.message).toContain('{"logic":"$and","items":[]}');

    const validTableReadback = await getSurface(rootAgent, {
      uid: addBlocksData.blocks[0].result.uid,
    });
    expect(validTableReadback.tree.props?.title).toBe('Valid employees table');
  });

  it('should require dataSourceKey when addBlock creates a collection block from raw resourceInit', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource addBlock page',
      tabTitle: 'Missing datasource addBlock tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'table',
        resourceInit: {
          collectionName: 'employees',
        },
      },
    });

    expect(response.status).toBe(400);
    expectStructuredError(readErrorItem(response), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(response)).toContain(
      `flowSurfaces addBlock block 'table' requires resourceInit.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(_.castArray(readback.tree.subModels?.grid?.subModels?.items || [])).toHaveLength(0);
  });

  it('should keep batch addBlocks partial-success semantics when collection resource misses dataSourceKey', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource addBlocks page',
      tabTitle: 'Missing datasource addBlocks tab',
    });

    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'notes',
            type: 'markdown',
            settings: {
              content: '# Team notes',
            },
          },
          {
            key: 'employeesTable',
            type: 'table',
            resourceInit: {
              collectionName: 'employees',
            },
          },
        ],
      },
    });

    expect(addBlocksRes.status).toBe(200);
    const addBlocksData = getData(addBlocksRes);
    expect(addBlocksData.successCount).toBe(1);
    expect(addBlocksData.errorCount).toBe(1);
    expect(addBlocksData.blocks[0].ok).toBe(true);
    expect(addBlocksData.blocks[1].ok).toBe(false);
    expectStructuredError(addBlocksData.blocks[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addBlocksData.blocks[1].error.message).toContain(
      `flowSurfaces addBlock block 'table' requires resourceInit.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    const items = _.castArray(readback.tree.subModels?.grid?.subModels?.items || []);
    expect(items).toHaveLength(1);
    expect(items[0]?.use).toBe('MarkdownBlockModel');
  });

  it('should reject compose when a collection block raw resource misses dataSourceKey', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource compose page',
      tabTitle: 'Missing datasource compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              collectionName: 'employees',
            },
          },
        ],
      },
    });

    expect(composeRes.status).toBe(400);
    expectStructuredError(readErrorItem(composeRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(composeRes)).toContain(
      `flowSurfaces compose block #1 ("employeesTable", type="table") requires resource.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(_.castArray(readback.tree.subModels?.grid?.subModels?.items || [])).toHaveLength(0);
  });

  it('should reject mutate addBlock ops when collection resource misses dataSourceKey', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource mutate page',
      tabTitle: 'Missing datasource mutate tab',
    });

    const mutateRes = await rootAgent.resource('flowSurfaces').mutate({
      values: {
        atomic: true,
        ops: [
          {
            type: 'addBlock',
            target: {
              uid: page.tabSchemaUid,
            },
            values: {
              type: 'table',
              resourceInit: {
                collectionName: 'employees',
              },
            },
          },
        ],
      },
    });

    expect(mutateRes.status).toBe(400);
    expectStructuredError(readErrorItem(mutateRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(mutateRes)).toContain(
      `flowSurfaces addBlock block 'table' requires resourceInit.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(_.castArray(readback.tree.subModels?.grid?.subModels?.items || [])).toHaveLength(0);
  });

  it('should allow addBlock to create filterForm without block-level resourceInit', async () => {
    const page = await createPage(rootAgent, {
      title: 'FilterForm addBlock without resource page',
      tabTitle: 'FilterForm addBlock without resource tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'filterForm',
      },
    });

    expect(response.status).toBe(200);
    const block = getData(response);
    expect(block.uid).toBeTruthy();

    const readback = await getSurface(rootAgent, {
      uid: block.uid,
    });
    expect(readback.tree.use).toBe('FilterFormBlockModel');
    expect(readback.tree.stepParams?.resourceSettings?.init).toBeUndefined();
  });

  it('should allow compose to create filterForm without block-level resource', async () => {
    const page = await createPage(rootAgent, {
      title: 'FilterForm compose without resource page',
      tabTitle: 'FilterForm compose without resource tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'filterForm',
            type: 'filterForm',
            actions: ['submit', 'reset'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    expect(composed.blocks).toHaveLength(1);
    expect(composed.blocks[0]).toMatchObject({
      key: 'filterForm',
      type: 'filterForm',
    });
    expect(composed.blocks[0].uid).toBeTruthy();
    expect(getComposeBlock(composed, 'filterForm').uid).toBe(composed.blocks[0].uid);

    const readback = await getSurface(rootAgent, {
      uid: composed.blocks[0].uid,
    });
    expect(readback.tree.use).toBe('FilterFormBlockModel');
    expect(readback.tree.stepParams?.resourceSettings?.init).toBeUndefined();
  });

  it('should reject raw direct-add payload keys and require settings/configureOptions instead', async () => {
    const page = await createPage(rootAgent, {
      title: 'Raw direct add contract page',
      tabTitle: 'Raw direct add contract tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const rawBlockRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'markdown',
        stepParams: {
          markdownBlockSettings: {
            editMarkdown: {
              content: 'legacy markdown',
            },
          },
        },
      },
    });
    expect(rawBlockRes.status).toBe(400);
    expect(readErrorMessage(rawBlockRes)).toContain('does not accept raw keys');

    const rawFieldRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'jsColumn',
        props: {
          title: 'Legacy JS column',
        },
      },
    });
    expect(rawFieldRes.status).toBe(400);
    expect(readErrorMessage(rawFieldRes)).toContain('does not accept raw keys');

    const rawActionRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'addNew',
        stepParams: {
          buttonSettings: {
            general: {
              title: 'Legacy action',
            },
          },
        },
      },
    });
    expect(rawActionRes.status).toBe(400);
    expect(readErrorMessage(rawActionRes)).toContain('does not accept raw keys');

    const batchActionRes = await rootAgent.resource('flowSurfaces').addActions({
      values: {
        target: {
          uid: table.uid,
        },
        actions: [
          {
            key: 'valid',
            type: 'addNew',
            settings: {
              title: 'Create employee',
            },
          },
          {
            key: 'invalid-raw',
            type: 'refresh',
            stepParams: {
              buttonSettings: {
                general: {
                  title: 'Legacy refresh',
                },
              },
            },
          },
        ],
      },
    });
    expect(batchActionRes.status).toBe(200);
    const batchActionData = getData(batchActionRes);
    expect(batchActionData.successCount).toBe(1);
    expect(batchActionData.errorCount).toBe(1);
    expect(batchActionData.actions[0].ok).toBe(true);
    expect(batchActionData.actions[1].ok).toBe(false);
    expectStructuredError(batchActionData.actions[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(batchActionData.actions[1].error.message).toContain('does not accept raw keys');
  });

  it('should compose and configure list grid-card and static blocks with simple semantic settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose static page',
      tabTitle: 'Compose static tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'list',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            settings: {
              pageSize: 20,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'nickname',
                    operator: '$eq',
                    value: 'alpha',
                  },
                ],
              },
              sorting: [
                {
                  field: 'username',
                  direction: 'asc',
                },
              ],
              layout: 'vertical',
            },
          },
          {
            key: 'grid',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            settings: {
              columns: 3,
              rowCount: 2,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'username',
                    operator: '$eq',
                    value: 'grid-user',
                  },
                ],
              },
              sorting: [
                {
                  field: 'nickname',
                  direction: 'desc',
                },
              ],
              layout: 'vertical',
            },
          },
          {
            key: 'markdown',
            type: 'markdown',
            settings: {
              content: '# Users handbook',
            },
          },
          {
            key: 'iframe',
            type: 'iframe',
            settings: {
              mode: 'url',
              url: 'https://example.com/users',
              height: 360,
              allow: 'fullscreen',
            },
          },
          {
            key: 'chart',
            type: 'chart',
            settings: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                measures: [
                  {
                    field: 'id',
                    aggregation: 'count',
                    alias: 'employeeCount',
                  },
                ],
                dimensions: [{ field: 'status' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'status',
                  y: 'employeeCount',
                },
              },
            },
          },
          {
            key: 'panel',
            type: 'actionPanel',
            settings: {
              layout: 'list',
              ellipsis: false,
            },
          },
        ],
        layout: {
          rows: [
            ['list', 'grid'],
            ['markdown', 'iframe'],
            ['chart', 'panel'],
          ],
        },
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    expect(composed.layout.rowOrder).toEqual(['row1', 'row2', 'row3']);
    expect(composed.layout.sizes.row1).toEqual([12, 12]);
    expect(composed.layout.sizes.row2).toEqual([12, 12]);
    expect(composed.layout.sizes.row3).toEqual([12, 12]);

    const listUid = getComposeBlock(composed, 'list').uid;
    const gridUid = getComposeBlock(composed, 'grid').uid;
    const markdownUid = getComposeBlock(composed, 'markdown').uid;
    const iframeUid = getComposeBlock(composed, 'iframe').uid;
    const chartUid = getComposeBlock(composed, 'chart').uid;
    const panelUid = getComposeBlock(composed, 'panel').uid;

    const listInitial = await getSurface(rootAgent, { uid: listUid });
    expect(listInitial.tree.stepParams?.listSettings).toMatchObject({
      pageSize: {
        pageSize: 20,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'nickname',
              operator: '$eq',
              value: 'alpha',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'username',
            direction: 'asc',
          },
        ],
      },
      layout: {
        layout: 'vertical',
      },
    });

    const gridInitial = await getSurface(rootAgent, { uid: gridUid });
    expect(gridInitial.tree.stepParams?.GridCardSettings).toMatchObject({
      columnCount: {
        columnCount: {
          xs: 3,
          sm: 3,
          md: 3,
          lg: 3,
          xl: 3,
          xxl: 3,
        },
      },
      rowCount: {
        rowCount: 2,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'username',
              operator: '$eq',
              value: 'grid-user',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'nickname',
            direction: 'desc',
          },
        ],
      },
    });

    const markdownInitial = await getSurface(rootAgent, { uid: markdownUid });
    expect(markdownInitial.tree.stepParams?.markdownBlockSettings?.editMarkdown?.content).toBe('# Users handbook');

    const iframeInitial = await getSurface(rootAgent, { uid: iframeUid });
    expect(iframeInitial.tree.stepParams?.iframeBlockSettings?.editIframe).toMatchObject({
      mode: 'url',
      url: 'https://example.com/users',
      height: 360,
      allow: 'fullscreen',
    });

    const chartInitial = await getSurface(rootAgent, { uid: chartUid });
    expect(chartInitial.tree.stepParams?.chartSettings?.configure?.query?.mode).toBe('builder');

    const panelInitial = await getSurface(rootAgent, { uid: panelUid });
    expect(panelInitial.tree.stepParams?.actionPanelBlockSetting).toMatchObject({
      layout: {
        layout: 'list',
      },
      ellipsis: {
        ellipsis: false,
      },
    });

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: listUid },
            changes: {
              pageSize: 50,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'nickname',
                    operator: '$eq',
                    value: 'beta',
                  },
                ],
              },
              sorting: [
                {
                  field: 'nickname',
                  direction: 'asc',
                },
              ],
              layout: 'horizontal',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: gridUid },
            changes: {
              columns: {
                xs: 1,
                sm: 1,
                md: 2,
                lg: 4,
                xl: 4,
                xxl: 5,
              },
              rowCount: 4,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'username',
                    operator: '$eq',
                    value: 'grid-updated',
                  },
                ],
              },
              sorting: [
                {
                  field: 'username',
                  direction: 'desc',
                },
              ],
              layout: 'horizontal',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: markdownUid },
            changes: {
              content: '## Updated users handbook',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: iframeUid },
            changes: {
              mode: 'html',
              html: '<div>Users iframe</div>',
              htmlId: 'users-iframe',
              height: 420,
            },
          },
        })
      ).status,
    ).toBe(200);

    const chartConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
        changes: {
          query: {
            mode: 'sql',
            // Keep this preview SQL cross-dialect and metadata-stable:
            // - literal row avoids relying on fixture data
            // - lowercase alias matches PG/MySQL preview alias behavior consistently
            sql: "select 'active' as status, 1 as employeecount",
            sqlDatasource: 'main',
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'status',
              y: 'employeecount',
            },
          },
        },
      },
    });
    expect(chartConfigureRes.status).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: panelUid },
            changes: {
              layout: 'grid',
              ellipsis: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    const listUpdated = await getSurface(rootAgent, { uid: listUid });
    expect(listUpdated.tree.stepParams?.listSettings).toMatchObject({
      pageSize: {
        pageSize: 50,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'nickname',
              operator: '$eq',
              value: 'beta',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'nickname',
            direction: 'asc',
          },
        ],
      },
      layout: {
        layout: 'horizontal',
      },
    });

    const gridUpdated = await getSurface(rootAgent, { uid: gridUid });
    expect(gridUpdated.tree.stepParams?.GridCardSettings).toMatchObject({
      columnCount: {
        columnCount: {
          xs: 1,
          sm: 1,
          md: 2,
          lg: 4,
          xl: 4,
          xxl: 5,
        },
      },
      rowCount: {
        rowCount: 4,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'username',
              operator: '$eq',
              value: 'grid-updated',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'username',
            direction: 'desc',
          },
        ],
      },
      layout: {
        layout: 'horizontal',
      },
    });

    const markdownUpdated = await getSurface(rootAgent, { uid: markdownUid });
    expect(markdownUpdated.tree.stepParams?.markdownBlockSettings?.editMarkdown?.content).toBe(
      '## Updated users handbook',
    );

    const iframeUpdated = await getSurface(rootAgent, { uid: iframeUid });
    expect(iframeUpdated.tree.stepParams?.iframeBlockSettings?.editIframe).toMatchObject({
      mode: 'html',
      html: '<div>Users iframe</div>',
      htmlId: 'users-iframe',
      height: 420,
    });

    const chartUpdated = await getSurface(rootAgent, { uid: chartUid });
    expect(chartUpdated.tree.stepParams?.chartSettings?.configure?.query?.mode).toBe('sql');

    const panelUpdated = await getSurface(rootAgent, { uid: panelUid });
    expect(panelUpdated.tree.stepParams?.actionPanelBlockSetting).toMatchObject({
      layout: {
        layout: 'grid',
      },
      ellipsis: {
        ellipsis: true,
      },
    });
  });

  it('should reject partial responsive grid card columns in simple configure', async () => {
    const page = await createPage(rootAgent, {
      title: 'Configure grid card columns validation',
      tabTitle: 'Configure grid card columns validation',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'grid',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            settings: {
              columns: 3,
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const gridUid = getComposeBlock(composed, 'grid').uid;
    expect(gridUid).toBeTruthy();

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: gridUid },
        changes: {
          columns: {
            xs: 1,
            md: 2,
            lg: 3,
          },
        },
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('must include xs, sm, md, lg, xl, xxl');
    expect(readErrorMessage(response)).toContain('missing: sm, xl, xxl');
  });

  it('should configure richer field and action semantics with simple changes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Configure rich page',
      tabTitle: 'Configure rich tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'form',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'flow_surface_profiles',
              },
              fields: ['bio'],
              actions: ['submit'],
            },
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['nickname', 'manager'],
              actions: ['refresh'],
              recordActions: ['updateRecord'],
            },
          ],
        },
      }),
    );

    const formBlock = composeRes.blocks.find((item: any) => item.key === 'form');
    const tableBlock = composeRes.blocks.find((item: any) => item.key === 'table');
    const formField = formBlock.fields.find((item: any) => item.fieldPath === 'bio');
    const formSubmitAction = formBlock.actions.find((item: any) => item.type === 'submit');
    const tableField = tableBlock.fields.find((item: any) => item.fieldPath === 'manager');
    const updateRecordAction = tableBlock.recordActions.find((item: any) => item.type === 'updateRecord');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: formField.wrapperUid },
            changes: {
              label: 'Biography',
              initialValue: 'n/a',
              required: true,
              labelWidth: 180,
              labelWrap: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: formField.fieldUid },
            changes: {
              title: 'Biography field',
              icon: 'EditOutlined',
              autoSize: {
                minRows: 2,
                maxRows: 6,
              },
              allowClear: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: formSubmitAction.uid },
            changes: {
              title: 'Save profile',
              tooltip: 'Submit the create form',
              type: 'primary',
              color: 'blue',
              htmlType: 'submit',
              position: 'right',
              confirm: {
                enable: true,
                title: 'Confirm submit',
                content: 'Save this record now?',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: tableField.wrapperUid },
            changes: {
              title: 'Employee manager',
              width: 280,
              fixed: 'left',
              editable: true,
              dataIndex: 'manager',
              titleField: 'nickname',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: updateRecordAction.uid },
            changes: {
              title: 'Quick update',
              type: 'primary',
              color: 'gold',
              htmlType: 'button',
              position: 'end',
              confirm: {
                enable: true,
                title: 'Confirm update',
                content: 'Apply assigned values?',
              },
              assignValues: {
                status: 'active',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    const formWrapperReadback = await getSurface(rootAgent, { uid: formField.wrapperUid });
    expect(formWrapperReadback.tree.props).toMatchObject({
      label: 'Biography',
      initialValue: 'n/a',
      required: true,
    });
    expect(formWrapperReadback.tree.decoratorProps).toMatchObject({
      labelWidth: 180,
      labelWrap: true,
    });

    const formFieldReadback = await getSurface(rootAgent, { uid: formField.fieldUid });
    expect(formFieldReadback.tree.props).toMatchObject({
      title: 'Biography field',
      icon: 'EditOutlined',
      autoSize: {
        minRows: 2,
        maxRows: 6,
      },
      allowClear: true,
    });

    const formActionReadback = await getSurface(rootAgent, { uid: formSubmitAction.uid });
    expect(formActionReadback.tree.props).toMatchObject({
      title: 'Save profile',
      tooltip: 'Submit the create form',
      type: 'primary',
      color: 'blue',
      htmlType: 'submit',
      position: 'right',
    });
    expect(formActionReadback.tree.stepParams?.submitSettings?.confirm).toMatchObject({
      enable: true,
      title: 'Confirm submit',
      content: 'Save this record now?',
    });

    const tableWrapperReadback = await getSurface(rootAgent, { uid: tableField.wrapperUid });
    expect(tableWrapperReadback.tree.props).toMatchObject({
      title: 'Employee manager',
      width: 280,
      fixed: 'left',
      editable: true,
      dataIndex: 'manager',
      titleField: 'nickname',
    });
    expect(tableWrapperReadback.tree.stepParams?.tableColumnSettings?.title?.title).toBe('Employee manager');

    const updateActionReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expect(updateActionReadback.tree.props).toMatchObject({
      title: 'Quick update',
      type: 'primary',
      color: 'gold',
      htmlType: 'button',
      position: 'end',
    });
    expect(updateActionReadback.tree.stepParams?.assignSettings).toMatchObject({
      confirm: {
        enable: true,
        title: 'Confirm update',
        content: 'Apply assigned values?',
      },
      assignFieldValues: {
        assignedValues: {
          status: 'active',
        },
      },
    });
    expect(updateActionReadback.tree.stepParams?.apply?.apply?.assignedValues).toMatchObject({
      status: 'active',
    });
  });
});
