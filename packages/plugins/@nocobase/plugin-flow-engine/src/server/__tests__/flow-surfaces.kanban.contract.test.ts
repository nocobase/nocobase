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
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getComposeBlock,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces kanban contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent, flowRepo } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should create kanban blocks with card grids default actions and hidden popup hosts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban contract page',
      tabTitle: 'Kanban contract tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });

    expect(readback.tree.use).toBe('KanbanBlockModel');
    expect(readback.tree.props).toMatchObject({
      groupField: 'status',
      styleVariant: 'color',
      quickCreateEnabled: false,
      dragEnabled: false,
    });
    expect(readback.tree.props?.groupOptions).toEqual([
      { value: 'todo', label: 'To do', color: 'blue' },
      { value: 'doing', label: 'Doing', color: 'gold' },
      { value: 'done', label: 'Done', color: 'green' },
    ]);
    expect(readback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    expect(readback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'fullHeight',
    });
    expect(readKanbanActionUses(readback.tree)).toEqual([
      'FilterActionModel',
      'AddNewActionModel',
      'RefreshActionModel',
    ]);
    expect(readback.tree.subModels?.item).toMatchObject({
      use: 'KanbanCardItemModel',
      subModels: {
        grid: {
          use: 'DetailsGridModel',
        },
      },
    });
    expect(readback.tree.subModels?.quickCreateAction).toMatchObject({
      uid: `${kanban.uid}-quick-create-action`,
      use: 'KanbanQuickCreateActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            uid: `${kanban.uid}-quick-create-action`,
            mode: 'drawer',
            size: 'medium',
            pageModelClass: 'ChildPageModel',
            dataSourceKey: 'main',
            collectionName: 'kanban_tasks',
          },
        },
      },
    });
    expect(readback.tree.subModels?.cardViewAction).toMatchObject({
      uid: `${kanban.uid}-card-view-action`,
      use: 'KanbanCardViewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            uid: `${kanban.uid}-card-view-action`,
            mode: 'drawer',
            size: 'medium',
            pageModelClass: 'ChildPageModel',
            dataSourceKey: 'main',
            collectionName: 'kanban_tasks',
          },
        },
      },
    });
  });

  it('should let explicit kanban block height settings override the full-height creation default', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban explicit height page',
      tabTitle: 'Kanban explicit height tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
      settings: {
        height: 420,
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });

    expect(readback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'specifyValue',
      height: 420,
    });
  });

  it('should project missing kanban popup hosts on readback and backfill them before writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban popup host page',
      tabTitle: 'Kanban popup host tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
    });

    const quickCreateActionUid = `${kanban.uid}-quick-create-action`;
    const cardViewActionUid = `${kanban.uid}-card-view-action`;
    await flowRepo.remove(quickCreateActionUid);
    await flowRepo.remove(cardViewActionUid);

    expect(await flowRepo.findModelById(quickCreateActionUid, { includeAsyncNode: true })).toBeNull();
    expect(await flowRepo.findModelById(cardViewActionUid, { includeAsyncNode: true })).toBeNull();

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction).toMatchObject({
      uid: quickCreateActionUid,
      use: 'KanbanQuickCreateActionModel',
    });
    expect(readback.tree.subModels?.cardViewAction).toMatchObject({
      uid: cardViewActionUid,
      use: 'KanbanCardViewActionModel',
    });
    expect(await flowRepo.findModelById(quickCreateActionUid, { includeAsyncNode: true })).toBeNull();
    expect(await flowRepo.findModelById(cardViewActionUid, { includeAsyncNode: true })).toBeNull();

    const quickCreateForm = await addBlockData(rootAgent, {
      target: {
        uid: quickCreateActionUid,
      },
      type: 'createForm',
      resource: {
        binding: 'currentCollection',
      },
    });

    expect(quickCreateForm.uid).toBeTruthy();
    expect(await flowRepo.findModelById(quickCreateActionUid, { includeAsyncNode: true })).toMatchObject({
      uid: quickCreateActionUid,
      use: 'KanbanQuickCreateActionModel',
    });

    const persistedReadback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(
      _.castArray(
        persistedReadback.tree.subModels?.quickCreateAction?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid
          ?.subModels?.items || [],
      )[0],
    ).toMatchObject({
      uid: quickCreateForm.uid,
      use: 'CreateFormModel',
    });
  });

  it('should route kanban fields to the card grid and only expose supported block actions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban field page',
      tabTitle: 'Kanban field tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
    });

    const addFieldRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: kanban.uid,
        },
        fieldPath: 'title',
      },
    });
    expect(addFieldRes.status, readErrorMessage(addFieldRes)).toBe(200);

    const catalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: kanban.uid,
          },
        },
      }),
    );
    expect(catalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['filter', 'addNew', 'popup', 'refresh', 'js']),
    );
    expect(catalog.actions.find((item: any) => item.key === 'link')).toBeUndefined();
    expect(catalog.actions.find((item: any) => item.key === 'triggerWorkflow')).toBeUndefined();
    expect(catalog.recordActions || []).toEqual([]);

    for (const type of ['popup', 'js']) {
      const actionRes = await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: kanban.uid,
          },
          type,
        },
      });
      expect(actionRes.status, `${type}: ${readErrorMessage(actionRes)}`).toBe(200);
    }

    for (const type of ['link', 'triggerWorkflow']) {
      const invalidActionRes = await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: kanban.uid,
          },
          type,
        },
      });
      expect(invalidActionRes.status).toBe(400);
      expect(readErrorMessage(invalidActionRes)).toContain(
        `flowSurfaces addAction '${type}' is not allowed under 'KanbanBlockModel'`,
      );
    }

    const invalidRecordActionRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: kanban.uid,
        },
        type: 'view',
      },
    });
    expect(invalidRecordActionRes.status).toBe(400);
    expect(readErrorMessage(invalidRecordActionRes)).toContain(
      'kanban record actions are not exposed in the public API v1',
    );

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(readKanbanFieldPaths(readback.tree)).toEqual(['title']);
    expect(readKanbanActionUses(readback.tree)).toEqual(
      expect.arrayContaining([
        'FilterActionModel',
        'AddNewActionModel',
        'PopupCollectionActionModel',
        'RefreshActionModel',
        'JSCollectionActionModel',
      ]),
    );
  });

  it('should configure kanban block and card semantic settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban configure page',
      tabTitle: 'Kanban configure tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
    });

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: kanban.uid,
        },
        changes: {
          title: 'Team board',
          description: 'Ship work',
          height: 480,
          heightMode: 'specifyValue',
          groupField: 'department',
          groupTitleField: 'title',
          groupColorField: 'title',
          groupOptions: [{ value: 'dept-rd', label: 'R&D', color: 'blue' }],
          styleVariant: 'filled',
          sorting: [{ field: 'title', direction: 'asc' }],
          dragEnabled: true,
          dragSortBy: 'department_sort',
          quickCreateEnabled: true,
          quickCreatePopup: {
            mode: 'dialog',
            size: 'large',
          },
          enableCardClick: true,
          cardPopup: {
            mode: 'drawer',
            size: 'small',
          },
          cardLayout: 'vertical',
          cardLabelAlign: 'left',
          cardLabelWidth: 120,
          cardLabelWrap: true,
          cardColon: false,
          pageSize: 20,
          columnWidth: 320,
          dataScope: {
            logic: '$and',
            items: [
              {
                path: 'status',
                operator: '$eq',
                value: 'doing',
              },
            ],
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(readback.tree.decoratorProps || {}).not.toHaveProperty('height');
    expect(readback.tree.decoratorProps || {}).not.toHaveProperty('heightMode');
    expect(readback.tree.props).toMatchObject({
      groupField: 'department',
      groupTitleField: 'title',
      groupColorField: 'title',
      groupOptions: [{ value: 'dept-rd', label: 'R&D', color: 'blue' }],
      styleVariant: 'color',
      globalSort: [{ field: 'title', direction: 'asc' }],
      dragEnabled: true,
      dragSortBy: 'department_sort',
      quickCreateEnabled: true,
      pageSize: 20,
      columnWidth: 320,
      popupMode: 'dialog',
      popupSize: 'large',
    });
    expect(readback.tree.stepParams?.cardSettings?.titleDescription).toMatchObject({
      title: 'Team board',
      description: 'Ship work',
    });
    expect(readback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'specifyValue',
      height: 480,
    });
    expect(readback.tree.stepParams?.kanbanSettings).toMatchObject({
      grouping: {
        groupField: 'department',
        groupTitleField: 'title',
        groupColorField: 'title',
        groupOptions: [{ value: 'dept-rd', label: 'R&D', color: 'blue' }],
      },
      styleVariant: {
        styleVariant: 'filled',
      },
      defaultSorting: {
        sort: [{ field: 'title', direction: 'asc' }],
      },
      dragEnabled: {
        dragEnabled: true,
      },
      dragSortBy: {
        dragSortBy: 'department_sort',
      },
      quickCreate: {
        quickCreateEnabled: true,
      },
      pageSize: {
        pageSize: 20,
      },
      columnWidth: {
        columnWidth: 320,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [{ path: 'status', operator: '$eq', value: 'doing' }],
        },
      },
    });
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: `${kanban.uid}-quick-create-action`,
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    expect(readback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: `${kanban.uid}-card-view-action`,
      mode: 'drawer',
      size: 'small',
      pageModelClass: 'ChildPageModel',
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    expect(readback.tree.subModels?.item?.props).toMatchObject({
      enableCardClick: true,
      openMode: 'drawer',
      popupSize: 'small',
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 120,
      labelWrap: true,
      colon: false,
    });
    expect(readback.tree.subModels?.item?.stepParams?.cardSettings).toMatchObject({
      click: {
        enableCardClick: true,
      },
      popup: {
        mode: 'drawer',
        size: 'small',
      },
      layout: {
        layout: 'vertical',
        labelAlign: 'left',
        labelWidth: 120,
        labelWrap: true,
        colon: false,
      },
    });
  });

  it('should clear incompatible kanban grouping dependencies when groupField changes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban dependency page',
      tabTitle: 'Kanban dependency tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
    });

    const initialConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: kanban.uid,
        },
        changes: {
          groupField: 'department',
          groupTitleField: 'title',
          groupColorField: 'title',
          groupOptions: [{ value: 'dept-rd', label: 'R&D', color: 'blue' }],
          dragEnabled: true,
          dragSortBy: 'department_sort',
        },
      },
    });
    expect(initialConfigureRes.status, readErrorMessage(initialConfigureRes)).toBe(200);

    const resetConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: kanban.uid,
        },
        changes: {
          groupField: 'status',
        },
      },
    });
    expect(resetConfigureRes.status, readErrorMessage(resetConfigureRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(readback.tree.props).toMatchObject({
      groupField: 'status',
      groupTitleField: null,
      groupColorField: null,
      dragEnabled: false,
      dragSortBy: null,
    });
    expect(readback.tree.props?.groupOptions).toEqual([
      { value: 'todo', label: 'To do', color: 'blue' },
      { value: 'doing', label: 'Doing', color: 'gold' },
      { value: 'done', label: 'Done', color: 'green' },
    ]);
  });

  it('should compose kanban blocks with card fields and block actions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose kanban page',
      tabTitle: 'Compose kanban tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'taskBoard',
            type: 'kanban',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'kanban_tasks',
            },
            fields: ['title'],
            actions: ['popup', 'js'],
            settings: {
              groupField: 'status',
            },
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const composed = getData(composeRes);
    const kanbanBlock = getComposeBlock(composed, 'taskBoard');
    expect(kanbanBlock.uid).toBeTruthy();
    expect(kanbanBlock.itemUid).toBeTruthy();
    expect(kanbanBlock.itemGridUid).toBeTruthy();
    expect(kanbanBlock.fields.map((item: any) => item.fieldPath)).toEqual(['title']);
    expect(kanbanBlock.actions.map((item: any) => item.type)).toEqual(['filter', 'addNew', 'refresh', 'popup', 'js']);

    const readback = await getSurface(rootAgent, {
      uid: kanbanBlock.uid,
    });
    expect(readback.tree.use).toBe('KanbanBlockModel');
    expect(readback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'fullHeight',
    });
    expect(readback.tree.subModels?.item?.use).toBe('KanbanCardItemModel');
    expect(readback.tree.subModels?.item?.subModels?.grid?.use).toBe('DetailsGridModel');
    expect(readKanbanFieldPaths(readback.tree)).toEqual(['title']);
    expect(readKanbanActionUses(readback.tree)).toEqual(
      expect.arrayContaining([
        'FilterActionModel',
        'AddNewActionModel',
        'RefreshActionModel',
        'PopupCollectionActionModel',
        'JSCollectionActionModel',
      ]),
    );
  });

  it('should create kanban blocks through applyBlueprint and reject unsupported kanban sections', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Kanban blueprint',
          },
        },
        page: {
          title: 'Kanban blueprint',
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                collection: 'kanban_tasks',
                fields: ['title'],
                actions: ['popup', 'js'],
                settings: {
                  groupField: 'status',
                  quickCreatePopup: {
                    mode: 'dialog',
                    size: 'large',
                  },
                  cardPopup: {
                    mode: 'drawer',
                    size: 'small',
                  },
                },
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const kanbanBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(kanbanBlock).toMatchObject({
      use: 'KanbanBlockModel',
      stepParams: {
        cardSettings: {
          blockHeight: {
            heightMode: 'fullHeight',
          },
        },
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'kanban_tasks',
          },
        },
      },
      subModels: {
        item: {
          use: 'KanbanCardItemModel',
          subModels: {
            grid: {
              use: 'DetailsGridModel',
            },
          },
        },
        quickCreateAction: {
          uid: expect.any(String),
          use: 'KanbanQuickCreateActionModel',
        },
        cardViewAction: {
          uid: expect.any(String),
          use: 'KanbanCardViewActionModel',
        },
      },
    });
    expect(kanbanBlock.subModels.quickCreateAction.uid).toBe(`${kanbanBlock.uid}-quick-create-action`);
    expect(kanbanBlock.subModels.cardViewAction.uid).toBe(`${kanbanBlock.uid}-card-view-action`);
    expect(readKanbanActionUses(kanbanBlock)).toEqual(
      expect.arrayContaining([
        'FilterActionModel',
        'AddNewActionModel',
        'PopupCollectionActionModel',
        'RefreshActionModel',
        'JSCollectionActionModel',
      ]),
    );
    expect(readKanbanFieldPaths(kanbanBlock)).toEqual(['title']);

    const invalidCases = [
      {
        key: 'fieldGroups',
        payload: {
          fieldGroups: [
            {
              title: 'Task fields',
              fields: ['title'],
            },
          ],
        },
        message: '.fieldGroups is not supported on kanban main blocks',
      },
      {
        key: 'recordActions',
        payload: {
          recordActions: ['view'],
        },
        message: '.recordActions is not supported on kanban main blocks in v1',
      },
      {
        key: 'fieldsLayout',
        payload: {
          fieldsLayout: {
            rows: [[{ field: 'title' }]],
          },
        },
        message: '.fieldsLayout is not supported on kanban main blocks; use fields[] only',
      },
      {
        key: 'compose-fieldGroups',
        compose: true,
        payload: {
          fieldGroups: [
            {
              title: 'Task fields',
              fields: ['title'],
            },
          ],
        },
        message: 'kanban does not support fieldGroups[] on the main block',
      },
      {
        key: 'compose-recordActions',
        compose: true,
        payload: {
          recordActions: ['view'],
        },
        message: 'kanban does not support recordActions[] on the main block',
      },
      {
        key: 'compose-fieldsLayout',
        compose: true,
        payload: {
          fieldsLayout: {
            rows: [[{ field: 'title' }]],
          },
        },
        message: 'kanban does not support fieldsLayout on the main block',
      },
    ];

    for (const item of invalidCases) {
      if (item.compose) {
        const pageForCompose = await createPage(rootAgent, {
          title: `Invalid kanban compose ${item.key}`,
          tabTitle: `Invalid kanban compose ${item.key}`,
        });
        const composeRes = await rootAgent.resource('flowSurfaces').compose({
          values: {
            target: {
              uid: pageForCompose.tabSchemaUid,
            },
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'kanban_tasks',
                },
                ...item.payload,
              },
            ],
          },
        });
        expect(composeRes.status).toBe(400);
        expect(readErrorMessage(composeRes)).toContain(item.message);
      } else {
        const invalidBlueprintRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
          values: {
            mode: 'create',
            navigation: {
              item: {
                title: `Invalid kanban blueprint ${item.key}`,
              },
            },
            page: {
              title: `Invalid kanban blueprint ${item.key}`,
            },
            tabs: [
              {
                title: 'Board',
                blocks: [
                  {
                    key: 'taskBoard',
                    type: 'kanban',
                    collection: 'kanban_tasks',
                    ...item.payload,
                  },
                ],
              },
            ],
          },
        });
        expect(invalidBlueprintRes.status).toBe(400);
        expect(readErrorMessage(invalidBlueprintRes)).toContain(item.message);
      }
    }
  });
});

function collectDescendantNodes(node: any, predicate: (input: any) => boolean, bucket: any[] = []) {
  if (!node || typeof node !== 'object') {
    return bucket;
  }
  if (predicate(node)) {
    bucket.push(node);
  }
  const subModels = _.isPlainObject(node.subModels) ? Object.values(node.subModels) : [];
  subModels.forEach((subModel) => {
    _.castArray(subModel).forEach((child) => {
      collectDescendantNodes(child, predicate, bucket);
    });
  });
  return bucket;
}

function readKanbanActionUses(node: any) {
  return _.castArray(node?.subModels?.actions || []).map((item: any) => item?.use);
}

function readKanbanFieldPaths(node: any) {
  return _.castArray(node?.subModels?.item?.subModels?.grid?.subModels?.items || []).map(
    (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath,
  );
}
