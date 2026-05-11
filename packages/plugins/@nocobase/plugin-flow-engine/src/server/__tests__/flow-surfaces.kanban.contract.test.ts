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
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';

function kanbanDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'title', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
    ],
  };
}

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

  async function readPrimaryPopupBlock(actionUid: string) {
    const actionSurface = await getSurface(rootAgent, {
      uid: actionUid,
    });
    const popupTemplateUid = actionSurface.tree?.popup?.template?.uid;
    if (popupTemplateUid) {
      const popupTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: popupTemplateUid,
          },
        }),
      );
      const popupSurface = await getSurface(rootAgent, {
        uid: popupTemplate.targetUid,
      });
      return {
        actionSurface,
        popupSurface,
        popupBlock: _.castArray(
          popupSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
        )[0],
      };
    }
    return {
      actionSurface,
      popupSurface: actionSurface,
      popupBlock: _.castArray(
        actionSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0],
    };
  }

  async function expectPersistedKanbanPopupOpenView(
    kanbanUid: string,
    actionKey: 'quickCreateAction' | 'cardViewAction',
    openView: Record<string, any>,
  ) {
    const suffix = actionKey === 'quickCreateAction' ? '-quick-create-action' : '-card-view-action';
    const action = await flowRepo.findModelById(`${kanbanUid}${suffix}`, { includeAsyncNode: true });
    expect(action?.stepParams?.popupSettings?.openView).toMatchObject(openView);
  }

  async function patchKanbanPopupOpenView(
    kanbanUid: string,
    actionKey: 'quickCreateAction' | 'cardViewAction',
    openView: Record<string, any>,
  ) {
    const suffix = actionKey === 'quickCreateAction' ? '-quick-create-action' : '-card-view-action';
    const actionUid = `${kanbanUid}${suffix}`;
    const action = await flowRepo.findModelById(actionUid, { includeAsyncNode: true });
    await flowRepo.patch({
      uid: actionUid,
      stepParams: _.merge({}, action?.stepParams || {}, {
        popupSettings: {
          openView,
        },
      }),
    });
  }

  async function expectTemplateUsageAtLeast(templateUid: string, usageCount: number) {
    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: templateUid,
        },
      }),
    );
    expect(template.usageCount).toBeGreaterThanOrEqual(usageCount);
  }

  async function createKanbanTestCollection(collectionName: string) {
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          {
            name: 'status_sort',
            type: 'sort',
            interface: 'sort',
            scopeKey: 'status',
            hidden: true,
          },
          { name: 'status', type: 'string', interface: 'select' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'status_sort'],
    });
  }

  async function createExternalKanbanPopupTargets(collectionName = 'kanban_tasks') {
    const page = await createPage(rootAgent, {
      title: `Kanban popup source page ${collectionName}`,
      tabTitle: `Kanban popup source tab ${collectionName}`,
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      defaultFilter: kanbanDefaultFilter(),
    });
    const quickCreateTarget = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'addNew',
          popup: {
            blocks: [
              {
                key: 'externalQuickCreateKanbanPopupBlock',
                type: 'createForm',
                resource: {
                  binding: 'currentCollection',
                },
                fields: ['title'],
              },
            ],
          },
        },
      }),
    );
    const cardTarget = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'externalCardKanbanPopupBlock',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['title'],
              },
            ],
          },
        },
      }),
    );
    return {
      quickCreateTargetUid: quickCreateTarget.uid,
      cardTargetUid: cardTarget.uid,
    };
  }

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
      defaultFilter: kanbanDefaultFilter(),
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
      'RefreshActionModel',
      'AddNewActionModel',
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
            dataSourceKey: 'main',
            collectionName: 'kanban_tasks',
          },
        },
      },
    });
    const quickCreatePopup = await readPrimaryPopupBlock(`${kanban.uid}-quick-create-action`);
    const cardPopup = await readPrimaryPopupBlock(`${kanban.uid}-card-view-action`);
    expect(quickCreatePopup.actionSurface.tree?.popup?.template?.uid).toBeTruthy();
    expect(cardPopup.actionSurface.tree?.popup?.template?.uid).toBeTruthy();
    expect(quickCreatePopup.popupBlock?.use).toBe('CreateFormModel');
    expect(cardPopup.popupBlock?.use).toBe('DetailsBlockModel');
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'quickCreateAction', {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: quickCreatePopup.popupSurface.tree.uid,
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'cardViewAction', {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: cardPopup.popupSurface.tree.uid,
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
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
      defaultFilter: kanbanDefaultFilter(),
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
      defaultFilter: kanbanDefaultFilter(),
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
    expect(persistedReadback.tree.subModels?.quickCreateAction).toMatchObject({
      uid: quickCreateActionUid,
      use: 'KanbanQuickCreateActionModel',
    });
    const persistedQuickCreatePopup = await readPrimaryPopupBlock(quickCreateActionUid);
    expect(persistedQuickCreatePopup.popupBlock).toMatchObject({
      use: 'CreateFormModel',
    });
  });

  it('should preserve kanban action-level popup display overrides and partial popup template updates', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban partial popup page',
      tabTitle: 'Kanban partial popup tab',
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
      defaultFilter: kanbanDefaultFilter(),
    });
    const initialReadback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    const quickCreateTemplateUid = initialReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid;
    const cardTemplateUid = initialReadback.tree.subModels?.cardViewAction?.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(cardTemplateUid).toBeTruthy();

    await patchKanbanPopupOpenView(kanban.uid, 'quickCreateAction', {
      ...(initialReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Kanban quick create override',
      pageModelClass: 'ChildPageModel',
    });
    await patchKanbanPopupOpenView(kanban.uid, 'cardViewAction', {
      ...(initialReadback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Kanban card view override',
      pageModelClass: 'ChildPageModel',
    });

    const actionOverrideReadback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(actionOverrideReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject(
      {
        mode: 'dialog',
        size: 'large',
        title: 'Kanban quick create override',
      },
    );
    expect(actionOverrideReadback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      title: 'Kanban card view override',
    });
    expect(actionOverrideReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid).toBe(quickCreateTemplateUid);
    expect(actionOverrideReadback.tree.subModels?.cardViewAction?.popup?.template?.uid).toBe(cardTemplateUid);

    const bindBlockTemplateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: kanban.uid,
        },
        stepParams: {
          kanbanSettings: {
            popup: {
              popupTemplateUid: quickCreateTemplateUid,
            },
          },
        },
      },
    });
    expect(bindBlockTemplateRes.status, readErrorMessage(bindBlockTemplateRes)).toBe(200);
    const bindCardTemplateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: initialReadback.tree.subModels?.item?.uid,
        },
        stepParams: {
          cardSettings: {
            popup: {
              popupTemplateUid: cardTemplateUid,
            },
          },
        },
      },
    });
    expect(bindCardTemplateRes.status, readErrorMessage(bindCardTemplateRes)).toBe(200);

    const blockUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: kanban.uid,
        },
        stepParams: {
          kanbanSettings: {
            popup: {
              mode: 'drawer',
            },
          },
        },
      },
    });
    expect(blockUpdateRes.status, readErrorMessage(blockUpdateRes)).toBe(200);
    const itemUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: initialReadback.tree.subModels?.item?.uid,
        },
        stepParams: {
          cardSettings: {
            popup: {
              size: 'small',
            },
          },
        },
      },
    });
    expect(itemUpdateRes.status, readErrorMessage(itemUpdateRes)).toBe(200);

    const partialUpdateReadback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(partialUpdateReadback.tree.stepParams?.kanbanSettings?.popup).toMatchObject({
      mode: 'drawer',
      popupTemplateUid: quickCreateTemplateUid,
    });
    expect(partialUpdateReadback.tree.subModels?.item?.stepParams?.cardSettings?.popup).toMatchObject({
      size: 'small',
      popupTemplateUid: cardTemplateUid,
    });
    expect(partialUpdateReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid).toBe(quickCreateTemplateUid);
    expect(partialUpdateReadback.tree.subModels?.cardViewAction?.popup?.template?.uid).toBe(cardTemplateUid);
    expect(partialUpdateReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      title: 'Kanban quick create override',
    });
    expect(partialUpdateReadback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      title: 'Kanban card view override',
    });
  });

  it('should rebuild kanban hidden popup targets when the block resource changes', async () => {
    const targetCollectionName = `kanban_resource_popup_target_${Date.now()}`;
    await createKanbanTestCollection(targetCollectionName);

    const page = await createPage(rootAgent, {
      title: 'Kanban resource popup page',
      tabTitle: 'Kanban resource popup tab',
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
      defaultFilter: kanbanDefaultFilter(),
    });
    const initialReadback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    const quickCreateTemplateUid = initialReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid;
    const cardTemplateUid = initialReadback.tree.subModels?.cardViewAction?.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(cardTemplateUid).toBeTruthy();

    await patchKanbanPopupOpenView(kanban.uid, 'quickCreateAction', {
      ...(initialReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Kanban quick resource override',
    });
    await patchKanbanPopupOpenView(kanban.uid, 'cardViewAction', {
      ...(initialReadback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Kanban card resource override',
    });

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: kanban.uid,
        },
        changes: {
          resource: {
            dataSourceKey: 'main',
            collectionName: targetCollectionName,
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    const quickCreateOpenView = readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView;
    const cardOpenView = readback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView;
    expect(quickCreateOpenView).toMatchObject({
      collectionName: targetCollectionName,
      dataSourceKey: 'main',
      mode: 'dialog',
      size: 'large',
      title: 'Kanban quick resource override',
    });
    expect(cardOpenView).toMatchObject({
      collectionName: targetCollectionName,
      dataSourceKey: 'main',
      mode: 'dialog',
      size: 'large',
      title: 'Kanban card resource override',
    });
    expect(quickCreateOpenView?.popupTemplateUid).not.toBe(quickCreateTemplateUid);
    expect(cardOpenView?.popupTemplateUid).not.toBe(cardTemplateUid);
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template?.uid).not.toBe(quickCreateTemplateUid);
    expect(readback.tree.subModels?.cardViewAction?.popup?.template?.uid).not.toBe(cardTemplateUid);
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
      defaultFilter: kanbanDefaultFilter(),
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
      expect.arrayContaining(['filter', 'addNew', 'popup', 'refresh', 'js', 'jsItem']),
    );
    expect(catalog.actions.find((item: any) => item.key === 'link')).toBeUndefined();
    expect(catalog.actions.find((item: any) => item.key === 'triggerWorkflow')).toBeUndefined();
    expect(catalog.recordActions || []).toEqual([]);

    for (const type of ['popup', 'js', 'jsItem']) {
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
        'JSItemActionModel',
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
      defaultFilter: kanbanDefaultFilter(),
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
    });
    expect(readback.tree.props).not.toHaveProperty('popupMode');
    expect(readback.tree.props).not.toHaveProperty('popupSize');
    expect(readback.tree.props).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.props).not.toHaveProperty('popupTargetUid');
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
      popup: {
        mode: 'dialog',
        size: 'large',
      },
    });
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    expect(readback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'small',
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'quickCreateAction', {
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'cardViewAction', {
      mode: 'drawer',
      size: 'small',
      pageModelClass: 'ChildPageModel',
      dataSourceKey: 'main',
      collectionName: 'kanban_tasks',
    });
    expect(readback.tree.subModels?.item?.props).toMatchObject({
      enableCardClick: true,
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 120,
      labelWrap: true,
      colon: false,
    });
    expect(readback.tree.subModels?.item?.props).not.toHaveProperty('openMode');
    expect(readback.tree.subModels?.item?.props).not.toHaveProperty('popupSize');
    expect(readback.tree.subModels?.item?.props).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.subModels?.item?.props).not.toHaveProperty('popupTargetUid');
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

  it('should mirror direct kanban popup props writes into stepParams and hidden popup hosts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban direct popup props page',
      tabTitle: 'Kanban direct popup props tab',
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
      defaultFilter: kanbanDefaultFilter(),
    });
    const initialReadback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(initialReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid).toBeTruthy();
    expect(initialReadback.tree.subModels?.cardViewAction?.popup?.template?.uid).toBeTruthy();

    const blockUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: kanban.uid,
        },
        props: {
          popupMode: 'dialog',
          popupSize: 'large',
          popupTemplateUid: null,
        },
      },
    });
    expect(blockUpdateRes.status, readErrorMessage(blockUpdateRes)).toBe(200);

    const itemUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: initialReadback.tree.subModels?.item?.uid,
        },
        props: {
          openMode: 'drawer',
          popupSize: 'small',
          popupTemplateUid: null,
        },
      },
    });
    expect(itemUpdateRes.status, readErrorMessage(itemUpdateRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(readback.tree.stepParams?.kanbanSettings?.popup).toMatchObject({
      mode: 'dialog',
      size: 'large',
      tryTemplate: false,
    });
    expect(readback.tree.stepParams?.kanbanSettings?.popup).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.props).not.toHaveProperty('popupMode');
    expect(readback.tree.props).not.toHaveProperty('popupSize');
    expect(readback.tree.props).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.subModels?.item?.stepParams?.cardSettings?.popup).toMatchObject({
      mode: 'drawer',
      size: 'small',
      tryTemplate: false,
    });
    expect(readback.tree.subModels?.item?.stepParams?.cardSettings?.popup).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.subModels?.item?.props).not.toHaveProperty('openMode');
    expect(readback.tree.subModels?.item?.props).not.toHaveProperty('popupSize');
    expect(readback.tree.subModels?.item?.props).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.cardViewAction?.popup?.template).toBeUndefined();
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'quickCreateAction', {
      mode: 'dialog',
      size: 'large',
      collectionName: 'kanban_tasks',
    });
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'cardViewAction', {
      mode: 'drawer',
      size: 'small',
      collectionName: 'kanban_tasks',
    });
  });

  it('should canonicalize initial kanban popup settings into stepParams on create', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban initial popup settings page',
      tabTitle: 'Kanban initial popup settings tab',
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
      defaultFilter: kanbanDefaultFilter(),
      settings: {
        quickCreatePopup: {
          mode: 'dialog',
          size: 'large',
        },
        cardPopup: {
          mode: 'drawer',
          size: 'small',
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(readback.tree.stepParams?.kanbanSettings?.popup).toMatchObject({
      mode: 'dialog',
      size: 'large',
    });
    expect(readback.tree.subModels?.item?.stepParams?.cardSettings?.popup).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'quickCreateAction', {
      mode: 'dialog',
      size: 'large',
      collectionName: 'kanban_tasks',
    });
    await expectPersistedKanbanPopupOpenView(kanban.uid, 'cardViewAction', {
      mode: 'drawer',
      size: 'small',
      collectionName: 'kanban_tasks',
    });
  });

  it('should preserve external kanban popup target uids instead of auto-binding popup templates', async () => {
    const page = await createPage(rootAgent, {
      title: 'Kanban external popup target page',
      tabTitle: 'Kanban external popup target tab',
    });
    const { quickCreateTargetUid, cardTargetUid } = await createExternalKanbanPopupTargets();
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
      defaultFilter: kanbanDefaultFilter(),
      settings: {
        quickCreatePopup: {
          uid: quickCreateTargetUid,
          mode: 'dialog',
        },
        cardPopup: {
          uid: cardTargetUid,
          mode: 'drawer',
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: kanban.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.cardViewAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: quickCreateTargetUid,
      mode: 'dialog',
    });
    expect(readback.tree.subModels?.cardViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: cardTargetUid,
      mode: 'drawer',
    });
    const persistedKanban = await flowRepo.findModelById(kanban.uid, { includeAsyncNode: true });
    expect(persistedKanban?.stepParams?.kanbanSettings?.popup).toMatchObject({
      uid: quickCreateTargetUid,
      mode: 'dialog',
    });
    expect(persistedKanban?.stepParams?.kanbanSettings?.popup).not.toHaveProperty('popupTemplateUid');
    const persistedKanbanItem = _.castArray(persistedKanban?.subModels?.item || [])[0];
    expect(persistedKanbanItem?.stepParams?.cardSettings?.popup).toMatchObject({
      uid: cardTargetUid,
      mode: 'drawer',
    });
    expect(persistedKanbanItem?.stepParams?.cardSettings?.popup).not.toHaveProperty('popupTemplateUid');
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
      defaultFilter: kanbanDefaultFilter(),
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
            defaultFilter: kanbanDefaultFilter(),
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
    expect(kanbanBlock.actions.map((item: any) => item.type)).toEqual(['filter', 'refresh', 'addNew', 'popup', 'js']);

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
    const unique = Date.now();
    const collectionName = `kanban_blueprint_tasks_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Kanban blueprint tasks',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          {
            name: 'status_sort',
            type: 'sort',
            interface: 'sort',
            scopeKey: 'status',
            hidden: true,
          },
          { name: 'status', type: 'string', interface: 'select' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'status_sort'],
    });

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
        defaults: {
          collections: {
            [collectionName]: {
              popups: {
                addNew: {
                  name: 'Create kanban task',
                  description: 'Create one kanban task.',
                },
                view: {
                  name: 'Kanban task details',
                  description: 'View one kanban task.',
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                collection: collectionName,
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                actions: [
                  'popup',
                  'js',
                  {
                    type: 'jsItem',
                    settings: {
                      code: 'ctx.render(null);',
                    },
                  },
                ],
                settings: {
                  groupField: 'status',
                  quickCreateEnabled: true,
                  enableCardClick: true,
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
      props: {
        groupField: 'status',
        quickCreateEnabled: true,
      },
      stepParams: {
        cardSettings: {
          blockHeight: {
            heightMode: 'fullHeight',
          },
        },
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName,
          },
        },
      },
      subModels: {
        item: {
          use: 'KanbanCardItemModel',
          props: {
            enableCardClick: true,
          },
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
    expect(kanbanBlock.stepParams?.kanbanSettings?.popup).toMatchObject({
      mode: 'dialog',
      size: 'large',
    });
    expect(kanbanBlock.stepParams?.kanbanSettings?.quickCreate).toMatchObject({
      quickCreateEnabled: true,
    });
    expect(kanbanBlock.subModels?.item?.stepParams?.cardSettings?.popup).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    expect(kanbanBlock.subModels?.item?.stepParams?.cardSettings?.click).toMatchObject({
      enableCardClick: true,
    });
    expect(kanbanBlock.subModels.quickCreateAction.uid).toBe(`${kanbanBlock.uid}-quick-create-action`);
    expect(kanbanBlock.subModels.cardViewAction.uid).toBe(`${kanbanBlock.uid}-card-view-action`);
    const quickCreateTemplateUid = kanbanBlock.subModels.quickCreateAction.popup?.template?.uid;
    const cardTemplateUid = kanbanBlock.subModels.cardViewAction.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(cardTemplateUid).toBeTruthy();
    expect(quickCreateTemplateUid).not.toBe(cardTemplateUid);
    expect(kanbanBlock.subModels.quickCreateAction.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName,
    });
    expect(kanbanBlock.subModels.cardViewAction.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName,
    });
    expect(readKanbanActionUses(kanbanBlock)).toEqual(
      expect.arrayContaining([
        'FilterActionModel',
        'AddNewActionModel',
        'PopupCollectionActionModel',
        'RefreshActionModel',
        'JSCollectionActionModel',
        'JSItemActionModel',
      ]),
    );
    expect(readKanbanFieldPaths(kanbanBlock)).toEqual(['title']);

    const quickCreatePopup = await readPrimaryPopupBlock(`${kanbanBlock.uid}-quick-create-action`);
    const cardPopup = await readPrimaryPopupBlock(`${kanbanBlock.uid}-card-view-action`);
    expect(quickCreatePopup.popupBlock?.use).toBe('CreateFormModel');
    expect(cardPopup.popupBlock?.use).toBe('DetailsBlockModel');
    await expectPersistedKanbanPopupOpenView(kanbanBlock.uid, 'quickCreateAction', {
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
      uid: quickCreatePopup.popupSurface.tree.uid,
      popupTemplateUid: quickCreateTemplateUid,
      collectionName,
    });
    await expectPersistedKanbanPopupOpenView(kanbanBlock.uid, 'cardViewAction', {
      mode: 'drawer',
      size: 'small',
      pageModelClass: 'ChildPageModel',
      uid: cardPopup.popupSurface.tree.uid,
      popupTemplateUid: cardTemplateUid,
      collectionName,
    });
    await expectTemplateUsageAtLeast(quickCreateTemplateUid, 1);
    await expectTemplateUsageAtLeast(cardTemplateUid, 1);

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
        message: 'kanban main blocks do not support fieldGroups',
      },
      {
        key: 'recordActions',
        payload: {
          recordActions: ['view'],
        },
        message: 'kanban main blocks do not support recordActions',
      },
      {
        key: 'fieldsLayout',
        payload: {
          fieldsLayout: {
            rows: [[{ field: 'title' }]],
          },
        },
        message: 'kanban main blocks do not support fieldsLayout',
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
        message: 'kanban main blocks do not support fieldGroups',
      },
      {
        key: 'compose-recordActions',
        compose: true,
        payload: {
          recordActions: ['view'],
        },
        message: 'kanban main blocks do not support recordActions',
      },
      {
        key: 'compose-fieldsLayout',
        compose: true,
        payload: {
          fieldsLayout: {
            rows: [[{ field: 'title' }]],
          },
        },
        message: 'kanban main blocks do not support fieldsLayout',
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
                defaultFilter: kanbanDefaultFilter(),
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
                    defaultFilter: kanbanDefaultFilter(),
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

  it('should persist implicit kanban hidden popup template settings', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Kanban implicit popup blueprint',
          },
        },
        page: {
          title: 'Kanban implicit popup blueprint',
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                collection: 'kanban_tasks',
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                settings: {
                  groupField: 'status',
                  quickCreateEnabled: true,
                  enableCardClick: true,
                  quickCreatePopup: {
                    tryTemplate: true,
                  },
                  cardPopup: {
                    tryTemplate: true,
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
    expect(kanbanBlock.props?.quickCreateEnabled).toBe(true);
    expect(kanbanBlock.subModels?.item?.props?.enableCardClick).toBe(true);
    expect(kanbanBlock.stepParams?.kanbanSettings?.quickCreate).toMatchObject({
      quickCreateEnabled: true,
    });
    expect(kanbanBlock.subModels?.item?.stepParams?.cardSettings?.click).toMatchObject({
      enableCardClick: true,
    });

    const quickCreateTemplateUid = kanbanBlock.subModels?.quickCreateAction?.popup?.template?.uid;
    const cardTemplateUid = kanbanBlock.subModels?.cardViewAction?.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(cardTemplateUid).toBeTruthy();
    expect(quickCreateTemplateUid).not.toBe(cardTemplateUid);
    expect(kanbanBlock.stepParams?.kanbanSettings?.popup).toMatchObject({
      popupTemplateUid: quickCreateTemplateUid,
    });
    expect(kanbanBlock.subModels?.item?.stepParams?.cardSettings?.popup).toMatchObject({
      popupTemplateUid: cardTemplateUid,
    });

    const quickCreatePopup = await readPrimaryPopupBlock(`${kanbanBlock.uid}-quick-create-action`);
    const cardPopup = await readPrimaryPopupBlock(`${kanbanBlock.uid}-card-view-action`);
    expect(quickCreatePopup.popupBlock?.use).toBe('CreateFormModel');
    expect(cardPopup.popupBlock?.use).toBe('DetailsBlockModel');
    await expectPersistedKanbanPopupOpenView(kanbanBlock.uid, 'quickCreateAction', {
      popupTemplateUid: quickCreateTemplateUid,
      collectionName: 'kanban_tasks',
    });
    await expectPersistedKanbanPopupOpenView(kanbanBlock.uid, 'cardViewAction', {
      popupTemplateUid: cardTemplateUid,
      collectionName: 'kanban_tasks',
    });
    const persistedKanban = await flowRepo.findModelById(kanbanBlock.uid, { includeAsyncNode: true });
    expect(persistedKanban?.stepParams?.kanbanSettings?.popup).toMatchObject({
      popupTemplateUid: quickCreateTemplateUid,
    });
    const persistedKanbanItem = _.castArray(persistedKanban?.subModels?.item || [])[0];
    expect(persistedKanbanItem?.stepParams?.cardSettings?.popup).toMatchObject({
      popupTemplateUid: cardTemplateUid,
    });
  });

  it('should recursively backfill persisted kanban popup hosts in nested managed popup trees', async () => {
    const page = await createPage(rootAgent, {
      title: 'Nested kanban popup host backfill page',
      tabTitle: 'Nested kanban popup host backfill tab',
    });
    const outerKanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
      defaultFilter: kanbanDefaultFilter(),
    });
    const outerReadback = await getSurface(rootAgent, {
      uid: outerKanban.uid,
    });
    expect(outerReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid).toBeTruthy();

    const nestedKanban = await addBlockData(rootAgent, {
      target: {
        uid: `${outerKanban.uid}-quick-create-action`,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
      defaultFilter: kanbanDefaultFilter(),
    });
    const nestedQuickCreateActionUid = `${nestedKanban.uid}-quick-create-action`;
    const nestedCardViewActionUid = `${nestedKanban.uid}-card-view-action`;
    await flowRepo.remove(nestedQuickCreateActionUid);
    await flowRepo.remove(nestedCardViewActionUid);
    expect(await flowRepo.findModelById(nestedQuickCreateActionUid, { includeAsyncNode: true })).toBeNull();
    expect(await flowRepo.findModelById(nestedCardViewActionUid, { includeAsyncNode: true })).toBeNull();

    await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'markdown',
      settings: {
        content: 'Trigger a page-tree write preflight.',
      },
    });

    expect(await flowRepo.findModelById(nestedQuickCreateActionUid, { includeAsyncNode: true })).toMatchObject({
      uid: nestedQuickCreateActionUid,
      use: 'KanbanQuickCreateActionModel',
    });
    expect(await flowRepo.findModelById(nestedCardViewActionUid, { includeAsyncNode: true })).toMatchObject({
      uid: nestedCardViewActionUid,
      use: 'KanbanCardViewActionModel',
    });
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
