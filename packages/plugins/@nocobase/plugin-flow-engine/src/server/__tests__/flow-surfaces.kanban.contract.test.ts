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
import { FlowSurfacesService } from '../flow-surfaces/service';
import { ensureKanbanBlockPopupHosts } from '../flow-surfaces/hidden-popup-kanban';

function kanbanDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'title', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'priority', operator: '$notEmpty' },
      { path: 'scope', operator: '$notEmpty' },
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
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'priority', 'scope', 'status_sort'],
    });
  }

  async function createLargeAddNewTemplateCollection(collectionName: string) {
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        filterTargetKey: 'id',
        createdAt: true,
        updatedAt: true,
        fields: [
          { name: 'createdAt', type: 'date', interface: 'createdAt', field: 'createdAt' },
          { name: 'updatedAt', type: 'date', interface: 'updatedAt', field: 'updatedAt' },
          { name: 'title', type: 'string', interface: 'input' },
          {
            name: 'status_sort',
            type: 'sort',
            interface: 'sort',
            scopeKey: 'status',
            hidden: true,
          },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'owner', type: 'string', interface: 'input' },
          { name: 'email', type: 'string', interface: 'email' },
          { name: 'phone', type: 'string', interface: 'input' },
          { name: 'city', type: 'string', interface: 'input' },
          { name: 'country', type: 'string', interface: 'input' },
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'category', type: 'string', interface: 'select' },
          { name: 'score', type: 'integer', interface: 'integer' },
          { name: 'notes', type: 'text', interface: 'textarea' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: [
        'createdAt',
        'updatedAt',
        'title',
        'status',
        'status_sort',
        'owner',
        'email',
        'phone',
        'city',
        'country',
        'priority',
        'category',
        'score',
        'notes',
      ],
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
      fields: ['title'],
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

  it('should reapply explicit kanban hidden popup local content when a host already has content', async () => {
    const quickCreateActionUid = 'kanban-test-quick-create-action';
    const cardActionUid = 'kanban-test-card-view-action';
    const models = new Map<string, any>();
    const quickCreateAction = {
      uid: quickCreateActionUid,
      use: 'KanbanQuickCreateActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            uid: quickCreateActionUid,
            collectionName: 'kanban_tasks',
            dataSourceKey: 'main',
          },
        },
      },
    };
    const cardAction = {
      uid: cardActionUid,
      use: 'KanbanCardViewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            uid: cardActionUid,
            collectionName: 'kanban_tasks',
            dataSourceKey: 'main',
          },
        },
      },
      subModels: {
        page: {
          uid: 'existing-local-popup-page',
          subModels: {
            tabs: [
              {
                subModels: {
                  grid: {
                    uid: 'existing-local-popup-grid',
                    subModels: {
                      items: [{ uid: 'old-local-details', use: 'DetailsBlockModel' }],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    };
    models.set(quickCreateActionUid, quickCreateAction);
    models.set(cardActionUid, cardAction);

    const appliedPopups: any[] = [];
    const runtime: any = {
      repository: {
        findModelById: async (uid: string) => models.get(uid) || null,
        patch: async (payload: any) => {
          models.set(payload.uid, _.merge({}, models.get(payload.uid) || {}, payload));
        },
        upsertModel: async (payload: any) => {
          models.set(payload.uid, _.merge({}, models.get(payload.uid) || {}, payload));
        },
      },
      applyPopupHostLocalContent: async (input: any) => {
        appliedPopups.push(input.popupSettings);
        const action = models.get(input.actionUid);
        _.set(
          action,
          ['subModels', 'page', 'subModels', 'tabs', 0, 'subModels', 'grid', 'subModels', 'items'],
          [{ uid: input.popupSettings.blocks[0].key, use: 'DetailsBlockModel' }],
        );
      },
      buildPopupOpenViewWithTemplate: async (input: any) => input.openView,
      clearFlowTemplateUsagesForNodeTree: async () => undefined,
      ensurePopupHostDefaultContent: async () => false,
      reconcilePopupOpenViewTransition: async () => undefined,
      removeNodeTreeWithBindings: async () => undefined,
      syncFlowTemplateUsagesForNodeTree: async () => undefined,
    };
    const blockNode: any = {
      uid: 'kanban-test',
      use: 'KanbanBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'kanban_tasks',
          },
        },
      },
      subModels: {
        quickCreateAction,
        cardViewAction: cardAction,
      },
    };

    await ensureKanbanBlockPopupHosts(runtime, blockNode, undefined, {
      cardViewAction: {
        tryTemplate: false,
        blocks: [{ key: 'new-local-details', type: 'details', fields: ['scope'] }],
      },
    });

    expect(appliedPopups).toHaveLength(1);
    expect(appliedPopups[0].blocks[0].key).toBe('new-local-details');
    expect(
      models.get(cardActionUid)?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items?.[0]?.uid,
    ).toBe('new-local-details');
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
            fields: ['title', 'priority', 'scope'],
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
    expect(kanbanBlock.fields.map((item: any) => item.fieldPath)).toEqual(['title', 'priority', 'scope']);
    expect(kanbanBlock.actions.map((item: any) => item.type)).toEqual(['filter', 'refresh', 'addNew', 'popup', 'js']);

    const readback = await getSurface(rootAgent, {
      uid: kanbanBlock.uid,
    });
    expect(readback.tree.use).toBe('KanbanBlockModel');
    expect(readback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'fullHeight',
    });
    expect(readback.tree.props?.dragEnabled).toBe(false);
    expect(readback.tree.props?.dragSortBy).toBeUndefined();
    expect(readback.tree.subModels?.item?.use).toBe('KanbanCardItemModel');
    expect(readback.tree.subModels?.item?.subModels?.grid?.use).toBe('DetailsGridModel');
    expect(readKanbanFieldPaths(readback.tree)).toEqual(['title', 'priority', 'scope']);
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
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'priority', 'scope', 'status_sort'],
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
                fields: ['title', 'scope'],
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
        dragEnabled: true,
        dragSortBy: 'status_sort',
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
    expect(readKanbanFieldPaths(kanbanBlock)).toEqual(['title', 'scope']);

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

  it('should materialize applyBlueprint kanban drag sorting and respect explicit opt-out', async () => {
    const unique = Date.now();
    const autoCollectionName = `kanban_blueprint_auto_sort_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: autoCollectionName,
        title: 'Kanban blueprint auto sort',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [autoCollectionName]: ['title', 'status', 'priority', 'scope'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint auto sort ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint auto sort ${unique}`,
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                collection: autoCollectionName,
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title', 'scope'],
                settings: {
                  groupField: 'status',
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
    expect(kanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    const createdSortField = context.app.db.getCollection(autoCollectionName)?.getField('status_sort');
    expect(createdSortField?.options).toMatchObject({
      type: 'sort',
      interface: 'sort',
      scopeKey: 'status',
      hidden: true,
    });

    const optOutCollectionName = `kanban_blueprint_drag_disabled_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: optOutCollectionName,
        title: 'Kanban blueprint drag disabled',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [optOutCollectionName]: ['title', 'status', 'priority', 'scope'],
    });

    const disabledRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint drag disabled ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint drag disabled ${unique}`,
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                collection: optOutCollectionName,
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                settings: {
                  groupField: 'status',
                  dragEnabled: false,
                },
              },
            ],
          },
        ],
      },
    });
    expect(disabledRes.status, readErrorMessage(disabledRes)).toBe(200);
    const disabledBlock = collectDescendantNodes(
      getData(disabledRes).surface.tree,
      (item) => item?.use === 'KanbanBlockModel',
    )[0];
    expect(disabledBlock.props?.dragEnabled).toBe(false);
    expect(disabledBlock.props?.dragSortBy).toBeNull();
    expect(context.app.db.getCollection(optOutCollectionName)?.getField('status_sort')).toBeUndefined();
  });

  it.skip('should remove applyBlueprint kanban auto-created sort fields when a caller transaction rolls back', async () => {
    const unique = Date.now();
    const collectionName = `kanban_blueprint_external_tx_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Kanban blueprint external tx',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'priority', 'scope'],
    });

    const service = new FlowSurfacesService(context.app.pm.get('flow-engine') as any);
    const transaction = await context.app.db.sequelize.transaction();
    await service.applyBlueprint(
      {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint external tx ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint external tx ${unique}`,
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
                settings: {
                  groupField: 'status',
                },
              },
            ],
          },
        ],
      },
      { transaction },
    );
    expect(context.app.db.getCollection(collectionName)?.getField('status_sort')).toBeTruthy();

    await transaction.rollback();

    expect(context.app.db.getCollection(collectionName)?.getField('status_sort')).toBeUndefined();
    await expect(
      context.app.db.getRepository('collections.fields', collectionName).count({
        filter: {
          name: 'status_sort',
        },
      }),
    ).resolves.toBe(0);
  });

  it.skip('should retry caller transaction kanban sort field cleanup after rollback when pre-rollback cleanup fails', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const collectionName = `kanban_blueprint_external_retry_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Kanban blueprint external tx retry',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'priority'],
    });

    const service = new FlowSurfacesService(context.app.pm.get('flow-engine') as any);
    const originalGetRepository = context.app.db.getRepository.bind(context.app.db);
    let destroyAttempts = 0;
    (context.app.db as any).getRepository = (name: string, ...args: any[]) => {
      const repository = originalGetRepository(name, ...args);
      if (name !== 'collections.fields' || args[0] !== collectionName) {
        return repository;
      }
      return new Proxy(repository, {
        get(target, property, receiver) {
          if (property !== 'destroy') {
            return Reflect.get(target, property, receiver);
          }
          return async (...destroyArgs: any[]) => {
            destroyAttempts += 1;
            if (destroyAttempts === 1) {
              throw new Error('simulated locked kanban sort field cleanup');
            }
            return target.destroy(...destroyArgs);
          };
        },
      });
    };

    const transaction = await context.app.db.sequelize.transaction();
    try {
      await expect(
        service.applyBlueprint(
          {
            mode: 'create',
            navigation: {
              item: {
                title: `Kanban blueprint external tx retry ${unique}`,
              },
            },
            page: {
              title: `Kanban blueprint external tx retry ${unique}`,
            },
            tabs: [
              {
                title: 'Board',
                blocks: [
                  {
                    key: 'taskBoard',
                    type: 'kanban',
                    collection: collectionName,
                    fields: ['title'],
                    settings: {
                      groupField: 'status',
                    },
                  },
                  {
                    key: 'invalidTaskBoard',
                    type: 'kanban',
                    collection: collectionName,
                    fields: ['title'],
                    settings: {
                      groupField: 'priority',
                      dragSortBy: '',
                    },
                  },
                ],
              },
            ],
          },
          { transaction },
        ),
      ).rejects.toThrow('kanban dragSortBy must be a non-empty field name');
      expect(context.app.db.getCollection(collectionName)?.getField('status_sort')).toBeTruthy();

      await transaction.rollback();

      expect(destroyAttempts).toBeGreaterThanOrEqual(2);
      expect(context.app.db.getCollection(collectionName)?.getField('status_sort')).toBeUndefined();
      await expect(
        context.app.db.getRepository('collections.fields', collectionName).count({
          filter: {
            name: 'status_sort',
          },
        }),
      ).resolves.toBe(0);
    } finally {
      (context.app.db as any).getRepository = originalGetRepository;
      if (!(transaction as any).finished) {
        await transaction.rollback().catch(() => {});
      }
    }
  });

  it('should clean up applyBlueprint kanban auto sort fields inside caller transaction before rethrowing', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const collectionName = `kanban_blueprint_external_commit_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Kanban blueprint external tx commit',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'priority'],
    });

    const service = new FlowSurfacesService(context.app.pm.get('flow-engine') as any);
    const transaction = await context.app.db.sequelize.transaction();
    try {
      await expect(
        service.applyBlueprint(
          {
            mode: 'create',
            navigation: {
              item: {
                title: `Kanban blueprint external tx commit ${unique}`,
              },
            },
            page: {
              title: `Kanban blueprint external tx commit ${unique}`,
            },
            tabs: [
              {
                title: 'Board',
                blocks: [
                  {
                    key: 'taskBoard',
                    type: 'kanban',
                    collection: collectionName,
                    fields: ['title'],
                    settings: {
                      groupField: 'status',
                    },
                  },
                  {
                    key: 'invalidTaskBoard',
                    type: 'kanban',
                    collection: collectionName,
                    fields: ['title'],
                    settings: {
                      groupField: 'priority',
                      dragSortBy: '',
                    },
                  },
                ],
              },
            ],
          },
          { transaction },
        ),
      ).rejects.toThrow('kanban dragSortBy must be a non-empty field name');

      await transaction.commit();

      expect(context.app.db.getCollection(collectionName)?.getField('status_sort')).toBeUndefined();
      await expect(
        context.app.db.getRepository('collections.fields', collectionName).count({
          filter: {
            name: 'status_sort',
          },
        }),
      ).resolves.toBe(0);
    } finally {
      if (!(transaction as any).finished) {
        await transaction.rollback().catch(() => {});
      }
    }
  });

  it('should roll back applyBlueprint kanban auto-created sort fields when later preparation fails', async () => {
    const unique = Date.now();
    const collectionName = `kanban_blueprint_rollback_sort_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Kanban blueprint rollback sort',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'priority'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint rollback sort ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint rollback sort ${unique}`,
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                collection: collectionName,
                fields: ['title'],
                settings: {
                  groupField: 'status',
                },
              },
              {
                key: 'invalidTaskBoard',
                type: 'kanban',
                collection: collectionName,
                fields: ['title'],
                settings: {
                  groupField: 'priority',
                  dragSortBy: '',
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('kanban dragSortBy must be a non-empty field name');
    expect(context.app.db.getCollection(collectionName)?.getField('status_sort')).toBeUndefined();
    await expect(
      context.app.db.getRepository('collections.fields', collectionName).count({
        filter: {
          name: 'status_sort',
        },
      }),
    ).resolves.toBe(0);
  });

  it('should reject applyBlueprint kanban auto sort creation on read-only main view collections', async () => {
    const unique = Date.now();
    const sourceCollectionName = `kanban_blueprint_view_source_${unique}`;
    const viewName = `kanban_blueprint_view_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollectionName,
        title: 'Kanban blueprint view source',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [sourceCollectionName]: ['title', 'status', 'priority', 'scope'],
    });

    const schema = context.app.db.options.schema;
    const createViewName = schema ? `${schema}.${viewName}` : viewName;
    await context.app.db.sequelize.query(
      `CREATE VIEW ${createViewName} AS SELECT id, title, status, priority, scope FROM ${context.app.db
        .getCollection(sourceCollectionName)
        .quotedTableName()}`,
    );
    await context.app.db.getCollection('collections').repository.create({
      values: {
        name: viewName,
        title: 'Kanban blueprint read-only view',
        filterTargetKey: 'id',
        view: true,
        viewName,
        writableView: false,
        fields: [
          { name: 'id', type: 'bigInt', interface: 'id' },
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
        schema: context.app.db.inDialect('postgres') ? schema || 'public' : undefined,
      },
      context: {
        app: context.app,
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [viewName]: ['title', 'status', 'priority', 'scope'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint read-only view ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint read-only view ${unique}`,
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskBoard',
                type: 'kanban',
                collection: viewName,
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                settings: {
                  groupField: 'status',
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain(
      `kanban collection 'main.${viewName}' requires a compatible drag-sort field or settings.dragEnabled=false`,
    );
    expect(context.app.db.getCollection(viewName)?.getField('status_sort')).toBeUndefined();
  });

  it('should materialize applyBlueprint kanban drag sorting inside inline popup block trees', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Kanban blueprint nested popup drag sort',
          },
        },
        page: {
          title: 'Kanban blueprint nested popup drag sort',
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'taskTable',
                type: 'table',
                collection: 'kanban_tasks',
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          key: 'nestedTaskBoard',
                          type: 'kanban',
                          resource: {
                            binding: 'otherRecords',
                            collectionName: 'kanban_tasks',
                          },
                          defaultFilter: kanbanDefaultFilter(),
                          fields: ['title'],
                          settings: {
                            groupField: 'status',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    const { popupSurface } = await readPrimaryPopupBlock(viewAction.uid);
    const nestedKanbanBlock = collectDescendantNodes(popupSurface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(nestedKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
  });

  it('should materialize applyBlueprint kanban drag sorting inside field-group field popups', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Kanban blueprint field-group popup drag sort',
          },
        },
        page: {
          title: 'Kanban blueprint field-group popup drag sort',
        },
        tabs: [
          {
            title: 'Details',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fieldGroups: [
                  {
                    title: 'Main',
                    fields: [
                      { key: 'nicknameField', field: 'nickname' },
                      {
                        key: 'departmentPopupField',
                        field: 'department',
                        popup: {
                          blocks: [
                            {
                              key: 'departmentTaskBoard',
                              type: 'kanban',
                              collection: 'kanban_tasks',
                              defaultFilter: kanbanDefaultFilter(),
                              fields: ['title'],
                              settings: {
                                groupField: 'status',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const departmentField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'department' &&
        !!(item?.popup?.template?.uid || item?.stepParams?.popupSettings?.openView?.popupTemplateUid),
    )[0];
    expect(departmentField?.uid).toBeTruthy();

    const { popupSurface } = await readPrimaryPopupBlock(departmentField.uid);
    const nestedKanbanBlock = collectDescendantNodes(popupSurface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(nestedKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
  });

  it('should resolve applyBlueprint kanban drag sorting inside association field popup display paths', async () => {
    const unique = Date.now();
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint association display popup drag sort ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint association display popup drag sort ${unique}`,
        },
        tabs: [
          {
            title: 'Details',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fieldGroups: [
                  {
                    title: 'Main',
                    fields: [
                      { key: 'nicknameField', field: 'nickname' },
                      {
                        key: 'departmentTitlePopupField',
                        field: 'title',
                        associationPathName: 'department',
                        popup: {
                          tryTemplate: false,
                          blocks: [
                            {
                              key: 'departmentBoard',
                              type: 'kanban',
                              defaultFilter: {
                                logic: '$and',
                                items: [
                                  { path: 'title', operator: '$notEmpty' },
                                  { path: 'status', operator: '$notEmpty' },
                                  { path: 'scope', operator: '$notEmpty' },
                                ],
                              },
                              fields: ['title'],
                              settings: {
                                groupField: 'status',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const departmentTitleField = collectDescendantNodes(data.surface.tree, (item) => {
      const fieldInit =
        item?.stepParams?.fieldSettings?.init || item?.subModels?.field?.stepParams?.fieldSettings?.init;
      return (
        fieldInit?.fieldPath === 'department.title' &&
        fieldInit?.associationPathName === 'department' &&
        !!(item?.popup?.template?.uid || item?.stepParams?.popupSettings?.openView?.popupTemplateUid)
      );
    })[0];
    expect(departmentTitleField?.uid).toBeTruthy();

    const { popupSurface } = await readPrimaryPopupBlock(departmentTitleField.uid);
    const nestedKanbanBlock = collectDescendantNodes(popupSurface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(nestedKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(nestedKanbanBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'departments',
    });
    expect(context.app.db.getCollection('departments')?.getField('status_sort')?.options).toMatchObject({
      type: 'sort',
      interface: 'sort',
      scopeKey: 'status',
      hidden: true,
    });
    expect(context.app.db.getCollection('employees')?.getField('status_sort')).toBeUndefined();
  });

  it.skip('should resolve applyBlueprint kanban drag sorting inside multi-hop association field popups', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rootCollection = `kanban_multi_root_${unique}`;
    const employeeCollection = `kanban_multi_employee_${unique}`;
    const departmentCollection = `kanban_multi_department_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: rootCollection,
        title: 'Kanban multi-hop roots',
        filterTargetKey: 'id',
        fields: [{ name: 'title', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: employeeCollection,
        title: 'Kanban multi-hop employees',
        filterTargetKey: 'id',
        fields: [{ name: 'title', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: departmentCollection,
        title: 'Kanban multi-hop departments',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'status_sort', type: 'sort', interface: 'sort', scopeKey: 'status', hidden: true },
        ],
      },
    });
    await rootAgent.resource('collections.fields', rootCollection).create({
      values: {
        name: 'employee',
        type: 'belongsTo',
        target: employeeCollection,
        foreignKey: 'employeeId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections.fields', employeeCollection).create({
      values: {
        name: 'department',
        type: 'belongsTo',
        target: departmentCollection,
        foreignKey: 'departmentId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [rootCollection]: ['title', 'employeeId'],
      [employeeCollection]: ['title', 'departmentId'],
      [departmentCollection]: ['title', 'status', 'status_sort'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint multi-hop popup ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint multi-hop popup ${unique}`,
        },
        tabs: [
          {
            title: 'Details',
            blocks: [
              {
                key: 'rootDetails',
                type: 'details',
                collection: rootCollection,
                fieldGroups: [
                  {
                    title: 'Main',
                    fields: [
                      { key: 'titleField', field: 'title' },
                      {
                        key: 'departmentTitlePopupField',
                        field: 'title',
                        associationPathName: 'employee.department',
                        popup: {
                          tryTemplate: false,
                          blocks: [
                            {
                              key: 'departmentBoard',
                              type: 'kanban',
                              defaultFilter: {
                                logic: '$and',
                                items: [
                                  { path: 'title', operator: '$notEmpty' },
                                  { path: 'status', operator: '$notEmpty' },
                                ],
                              },
                              fields: ['title'],
                              settings: {
                                groupField: 'status',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const departmentTitleField = collectDescendantNodes(data.surface.tree, (item) => {
      const fieldInit =
        item?.stepParams?.fieldSettings?.init || item?.subModels?.field?.stepParams?.fieldSettings?.init;
      return (
        fieldInit?.fieldPath === 'employee.department.title' &&
        fieldInit?.associationPathName === 'employee.department' &&
        !!(item?.popup?.template?.uid || item?.stepParams?.popupSettings?.openView?.popupTemplateUid)
      );
    })[0];
    expect(departmentTitleField?.uid).toBeTruthy();

    const { popupSurface } = await readPrimaryPopupBlock(departmentTitleField.uid);
    const nestedKanbanBlock = collectDescendantNodes(popupSurface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(nestedKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(nestedKanbanBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: departmentCollection,
    });
    expect(context.app.db.getCollection(rootCollection)?.getField('status_sort')).toBeUndefined();
    expect(context.app.db.getCollection(employeeCollection)?.getField('status_sort')).toBeUndefined();
  });

  it('should resolve applyBlueprint kanban popup sort fields from association targetCollection metadata', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sourceCollection = `kanban_graph_source_${unique}`;
    const targetCollection = `kanban_graph_target_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: 'Kanban graph source',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: 'Kanban graph target',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'linkedRecord',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'linkedRecordId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [sourceCollection]: ['title', 'status', 'linkedRecordId'],
      [targetCollection]: ['title', 'status'],
    });

    const source = context.app.db.getCollection(sourceCollection);
    const target = context.app.db.getCollection(targetCollection);
    const linkedRecordField = source?.getField('linkedRecord') as any;
    Object.defineProperty(linkedRecordField, 'target', {
      configurable: true,
      value: `missing_target_${unique}`,
    });
    linkedRecordField.targetCollection = () => target;

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint graph target ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint graph target ${unique}`,
        },
        tabs: [
          {
            title: 'Details',
            blocks: [
              {
                key: 'sourceDetails',
                type: 'details',
                collection: sourceCollection,
                fieldGroups: [
                  {
                    title: 'Main',
                    fields: [
                      { key: 'titleField', field: 'title' },
                      {
                        key: 'linkedRecordPopupField',
                        field: 'title',
                        associationPathName: 'linkedRecord',
                        popup: {
                          tryTemplate: false,
                          blocks: [
                            {
                              key: 'linkedRecordBoard',
                              type: 'kanban',
                              fields: ['title'],
                              settings: {
                                groupField: 'status',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const linkedRecordFieldNode = collectDescendantNodes(data.surface.tree, (item) => {
      const fieldInit =
        item?.stepParams?.fieldSettings?.init || item?.subModels?.field?.stepParams?.fieldSettings?.init;
      return (
        fieldInit?.fieldPath === 'linkedRecord.title' &&
        fieldInit?.associationPathName === 'linkedRecord' &&
        !!(item?.popup?.template?.uid || item?.stepParams?.popupSettings?.openView?.popupTemplateUid)
      );
    })[0];
    const { popupSurface } = await readPrimaryPopupBlock(linkedRecordFieldNode.uid);
    const nestedKanbanBlock = collectDescendantNodes(popupSurface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(nestedKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(nestedKanbanBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: targetCollection,
    });
    expect(context.app.db.getCollection(sourceCollection)?.getField('status_sort')).toBeUndefined();
    expect(context.app.db.getCollection(targetCollection)?.getField('status_sort')).toBeTruthy();
  });

  it.skip('should materialize applyBlueprint kanban drag sorting in record popups using associatedRecords context', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const parentCollection = `kanban_popup_parent_${unique}`;
    const childCollection = `kanban_popup_child_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: parentCollection,
        title: 'Kanban record popup parents',
        filterTargetKey: 'id',
        fields: [{ name: 'title', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: childCollection,
        title: 'Kanban record popup children',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', childCollection).create({
      values: {
        name: 'parent',
        type: 'belongsTo',
        target: parentCollection,
        foreignKey: 'parentId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections.fields', parentCollection).create({
      values: {
        name: 'items',
        type: 'hasMany',
        target: childCollection,
        foreignKey: 'parentId',
        interface: 'o2m',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [parentCollection]: ['title'],
      [childCollection]: ['title', 'status', 'priority', 'scope', 'parentId'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint record popup associated ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint record popup associated ${unique}`,
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'parentTable',
                type: 'table',
                collection: parentCollection,
                fields: ['title'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'childBoard',
                          type: 'kanban',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'items',
                          },
                          defaultFilter: kanbanDefaultFilter(),
                          fields: ['title'],
                          settings: {
                            groupField: 'status',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(viewAction?.uid).toBeTruthy();
    const { popupSurface } = await readPrimaryPopupBlock(viewAction.uid);
    const nestedKanbanBlock = collectDescendantNodes(popupSurface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(nestedKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(nestedKanbanBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: childCollection,
      associationName: `${parentCollection}.items`,
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });
    expect(context.app.db.getCollection(childCollection)?.getField('status_sort')?.options).toMatchObject({
      type: 'sort',
      interface: 'sort',
      scopeKey: 'status',
      hidden: true,
    });
  });

  it.skip('should materialize applyBlueprint kanban drag sorting in hidden popups using nested associatedRecords context', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const parentCollection = `kanban_hidden_parent_${unique}`;
    const childCollection = `kanban_hidden_child_${unique}`;
    const taskCollection = `kanban_hidden_task_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: parentCollection,
        title: 'Kanban hidden popup parents',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'status_sort', type: 'sort', interface: 'sort', scopeKey: 'status', hidden: true },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: childCollection,
        title: 'Kanban hidden popup children',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'priority', type: 'string', interface: 'select' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: taskCollection,
        title: 'Kanban hidden popup tasks',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'scope', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', childCollection).create({
      values: {
        name: 'parent',
        type: 'belongsTo',
        target: parentCollection,
        foreignKey: 'parentId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections.fields', parentCollection).create({
      values: {
        name: 'items',
        type: 'hasMany',
        target: childCollection,
        foreignKey: 'parentId',
        interface: 'o2m',
      },
    });
    await rootAgent.resource('collections.fields', taskCollection).create({
      values: {
        name: 'owner',
        type: 'belongsTo',
        target: childCollection,
        foreignKey: 'ownerId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections.fields', childCollection).create({
      values: {
        name: 'tasks',
        type: 'hasMany',
        target: taskCollection,
        foreignKey: 'ownerId',
        interface: 'o2m',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [parentCollection]: ['title', 'status', 'status_sort'],
      [childCollection]: ['title', 'status', 'priority', 'parentId'],
      [taskCollection]: ['title', 'status', 'scope', 'ownerId'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Kanban blueprint hidden popup associated ${unique}`,
          },
        },
        page: {
          title: `Kanban blueprint hidden popup associated ${unique}`,
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'parentBoard',
                type: 'kanban',
                collection: parentCollection,
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'title', operator: '$notEmpty' },
                    { path: 'status', operator: '$notEmpty' },
                  ],
                },
                fields: ['title'],
                settings: {
                  groupField: 'status',
                  cardPopup: {
                    tryTemplate: false,
                    blocks: [
                      {
                        key: 'childBoard',
                        type: 'kanban',
                        resource: {
                          binding: 'associatedRecords',
                          associationField: 'items',
                        },
                        fields: ['title'],
                        settings: {
                          groupField: 'status',
                          cardPopup: {
                            tryTemplate: false,
                            blocks: [
                              {
                                key: 'taskBoard',
                                type: 'kanban',
                                resource: {
                                  binding: 'associatedRecords',
                                  associationField: 'tasks',
                                },
                                fields: ['title'],
                                settings: {
                                  groupField: 'status',
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
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
    const parentKanbanBlock = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.use === 'KanbanBlockModel' &&
        item?.stepParams?.resourceSettings?.init?.collectionName === parentCollection,
    )[0];
    const { popupSurface: parentPopupSurface } = await readPrimaryPopupBlock(
      `${parentKanbanBlock.uid}-card-view-action`,
    );
    const childKanbanBlock = collectDescendantNodes(
      parentPopupSurface.tree,
      (item) =>
        item?.use === 'KanbanBlockModel' &&
        item?.stepParams?.resourceSettings?.init?.collectionName === childCollection,
    )[0];
    expect(childKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(childKanbanBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: childCollection,
      associationName: `${parentCollection}.items`,
    });

    const { popupSurface: childPopupSurface } = await readPrimaryPopupBlock(`${childKanbanBlock.uid}-card-view-action`);
    const taskKanbanBlock = collectDescendantNodes(
      childPopupSurface.tree,
      (item) =>
        item?.use === 'KanbanBlockModel' && item?.stepParams?.resourceSettings?.init?.collectionName === taskCollection,
    )[0];
    expect(taskKanbanBlock.props).toMatchObject({
      groupField: 'status',
      dragEnabled: true,
      dragSortBy: 'status_sort',
    });
    expect(taskKanbanBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: taskCollection,
      associationName: `${childCollection}.tasks`,
    });
    expect(context.app.db.getCollection(taskCollection)?.getField('status_sort')?.options).toMatchObject({
      type: 'sort',
      interface: 'sort',
      scopeKey: 'status',
      hidden: true,
    });
  });

  it('should ignore kanban fallback blocks inside template-backed applyBlueprint popups', async () => {
    const sourcePage = await createPage(rootAgent, {
      title: `Kanban fallback popup template source ${Date.now()}`,
      tabTitle: 'Source',
    });
    const sourceDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: sourcePage.gridUid },
          type: 'details',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
          fields: ['nickname'],
        },
      }),
    );
    const sourceField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: { uid: sourceDetails.uid },
          fieldPath: 'nickname',
          popup: {
            blocks: [
              {
                key: 'sourcePopupDetails',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['nickname', 'status'],
              },
            ],
          },
        },
      }),
    );
    const popupTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceField.fieldUid || sourceField.uid },
          name: `Kanban fallback popup template ${Date.now()}`,
          description: 'Reusable popup template used to ensure local Kanban fallback blocks are ignored.',
          saveMode: 'duplicate',
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Kanban fallback template popup',
          },
        },
        page: {
          title: 'Kanban fallback template popup',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    field: 'nickname',
                    popup: {
                      template: {
                        uid: popupTemplate.uid,
                        mode: 'reference',
                      },
                      blocks: [
                        {
                          key: 'ignoredKanbanFallback',
                          type: 'kanban',
                          collection: 'kanban_tasks',
                          defaultFilter: kanbanDefaultFilter(),
                          fields: ['title', 'priority', 'scope'],
                          settings: {
                            groupField: 'status',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const templatedField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'nickname' &&
        item?.popup?.template?.uid === popupTemplate.uid,
    )[0];
    expect(templatedField?.popup?.template).toMatchObject({
      uid: popupTemplate.uid,
      mode: 'reference',
    });
    expect(collectDescendantNodes(data.surface.tree, (item) => item?.use === 'KanbanBlockModel')).toHaveLength(0);
  });

  it('should not apply the applyBlueprint kanban field cap to template-backed blocks', async () => {
    const templateSourceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Kanban template source page',
          },
        },
        page: {
          title: 'Kanban template source page',
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'templateSourceTaskBoard',
                type: 'kanban',
                collection: 'kanban_tasks',
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title', 'priority'],
                settings: {
                  groupField: 'status',
                },
              },
            ],
          },
        ],
      },
    });
    expect(templateSourceRes.status, readErrorMessage(templateSourceRes)).toBe(200);
    const templateSourceData = getData(templateSourceRes);
    const sourceKanban = collectDescendantNodes(
      templateSourceData.surface.tree,
      (item) => item?.use === 'KanbanBlockModel',
    )[0];
    expect(sourceKanban?.uid).toBeTruthy();
    const saveTemplateRes = await rootAgent.resource('flowSurfaces').saveTemplate({
      values: {
        target: {
          uid: sourceKanban.uid,
        },
        name: `Kanban field cap template ${Date.now()}`,
        description: 'Kanban template used to ensure explicit fields are not capped on template-backed blocks.',
        saveMode: 'duplicate',
      },
    });
    expect(saveTemplateRes.status, readErrorMessage(saveTemplateRes)).toBe(200);
    const template = getData(saveTemplateRes);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Kanban template-backed field cap consumer',
          },
        },
        page: {
          title: 'Kanban template-backed field cap consumer',
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'templateBackedTaskBoard',
                type: 'kanban',
                template: {
                  uid: template.uid,
                  mode: 'copy',
                },
                fields: ['title', 'priority', 'scope'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
  });

  it('should reject applyBlueprint kanban field overflow and invalid dragSortBy', async () => {
    const tooManyFieldsRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid kanban blueprint field overflow',
          },
        },
        page: {
          title: 'Invalid kanban blueprint field overflow',
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
                fields: ['title', 'priority', 'scope'],
                settings: {
                  groupField: 'status',
                },
              },
            ],
          },
        ],
      },
    });
    expect(tooManyFieldsRes.status).toBe(400);
    expect(tooManyFieldsRes.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].fields',
          ruleId: 'kanban-main-fields-too-many',
          details: expect.objectContaining({
            repairHint: expect.stringContaining('Keep at most 2 fields'),
          }),
        }),
      ]),
    );

    const invalidDragSortRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid kanban blueprint drag sort field',
          },
        },
        page: {
          title: 'Invalid kanban blueprint drag sort field',
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
                  dragSortBy: 'department_sort',
                },
              },
            ],
          },
        ],
      },
    });
    expect(invalidDragSortRes.status).toBe(400);
    expect(readErrorMessage(invalidDragSortRes)).toContain(
      "kanban dragSortBy 'department_sort' is not compatible with the current groupField",
    );

    const invalidDisabledDragSortRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid disabled kanban blueprint drag sort field',
          },
        },
        page: {
          title: 'Invalid disabled kanban blueprint drag sort field',
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
                  dragEnabled: false,
                  dragSortBy: 'department_sort',
                },
              },
            ],
          },
        ],
      },
    });
    expect(invalidDisabledDragSortRes.status).toBe(400);
    expect(readErrorMessage(invalidDisabledDragSortRes)).toContain(
      "kanban dragSortBy 'department_sort' is not compatible with the current groupField",
    );

    for (const dragSortBy of [null, '']) {
      const emptyDragSortRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          mode: 'create',
          navigation: {
            item: {
              title: `Invalid empty kanban blueprint drag sort field ${String(dragSortBy)}`,
            },
          },
          page: {
            title: `Invalid empty kanban blueprint drag sort field ${String(dragSortBy)}`,
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
                    dragSortBy,
                  },
                },
              ],
            },
          ],
        },
      });
      expect(emptyDragSortRes.status).toBe(400);
      expect(readErrorMessage(emptyDragSortRes)).toContain('kanban dragSortBy must be a non-empty field name');
    }
  });

  it('should reject explicit empty applyBlueprint kanban groupField in block and popup contexts', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid empty kanban blueprint group field',
          },
        },
        page: {
          title: 'Invalid empty kanban blueprint group field',
        },
        tabs: [
          {
            title: 'Board',
            blocks: [
              {
                key: 'topLevelTaskBoard',
                type: 'kanban',
                collection: 'kanban_tasks',
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                settings: {
                  groupField: '',
                },
              },
              {
                key: 'taskTable',
                type: 'table',
                collection: 'kanban_tasks',
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                popup: {
                  blocks: [
                    {
                      key: 'popupTaskBoard',
                      type: 'kanban',
                      collection: 'kanban_tasks',
                      defaultFilter: kanbanDefaultFilter(),
                      fields: ['title'],
                      settings: {
                        groupField: '',
                      },
                    },
                  ],
                },
              },
              {
                key: 'hiddenPopupTaskBoardHost',
                type: 'kanban',
                collection: 'kanban_tasks',
                defaultFilter: kanbanDefaultFilter(),
                fields: ['title'],
                settings: {
                  groupField: 'status',
                  cardPopup: {
                    blocks: [
                      {
                        key: 'hiddenPopupTaskBoard',
                        type: 'kanban',
                        collection: 'kanban_tasks',
                        defaultFilter: kanbanDefaultFilter(),
                        fields: ['title'],
                        settings: {
                          groupField: '',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(executeRes.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].settings.groupField',
          ruleId: 'kanban-group-field-required',
        }),
        expect.objectContaining({
          path: '$.tabs[0].blocks[1].popup.blocks[0].settings.groupField',
          ruleId: 'kanban-group-field-required',
        }),
        expect.objectContaining({
          path: '$.tabs[0].blocks[2].settings.cardPopup.blocks[0].settings.groupField',
          ruleId: 'kanban-group-field-required',
        }),
      ]),
    );
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

  it('should apply default field groups to omitted calendar and kanban quick-create popup settings', async () => {
    const unique = Date.now();
    const collectionName = `omitted_quick_create_groups_${unique}`;
    await createLargeAddNewTemplateCollection(collectionName);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Omitted quick create groups ${unique}`,
          },
        },
        page: {
          title: `Omitted quick create groups ${unique}`,
        },
        defaults: {
          collections: {
            [collectionName]: {
              fieldGroups: [
                {
                  key: 'identity',
                  title: 'Identity',
                  fields: ['title', 'owner', 'email', 'phone'],
                },
                {
                  key: 'profile',
                  title: 'Profile',
                  fields: ['city', 'country', 'priority', 'category'],
                },
                {
                  key: 'activity',
                  title: 'Activity',
                  fields: ['status', 'score', 'notes'],
                },
              ],
              popups: {
                addNew: {
                  name: 'Create grouped task without explicit popup settings',
                  description: 'Create one grouped task without explicit popup settings.',
                },
                view: {
                  name: 'Grouped task details without explicit popup settings',
                  description: 'View one grouped task without explicit popup settings.',
                },
                edit: {
                  name: 'Edit grouped task without explicit popup settings',
                  description: 'Edit one grouped task without explicit popup settings.',
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Planning',
            layout: {
              rows: [
                [
                  { key: 'taskCalendar', span: 12 },
                  { key: 'taskBoard', span: 12 },
                ],
              ],
            },
            blocks: [
              {
                key: 'taskCalendar',
                type: 'calendar',
                title: 'Task calendar',
                collection: collectionName,
                settings: {
                  titleField: 'title',
                  startField: 'createdAt',
                  endField: 'updatedAt',
                },
              },
              {
                key: 'taskBoard',
                type: 'kanban',
                title: 'Task board',
                collection: collectionName,
                fields: ['title', 'owner'],
                settings: {
                  groupField: 'status',
                },
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const calendarBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CalendarBlockModel')[0];
    const kanbanBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    expect(calendarBlock.subModels?.quickCreateAction?.popup?.template?.uid).toBeTruthy();
    expect(kanbanBlock.subModels?.quickCreateAction?.popup?.template?.uid).toBeTruthy();

    for (const actionUid of [`${calendarBlock.uid}-quickCreateAction`, `${kanbanBlock.uid}-quick-create-action`]) {
      const popup = await readPrimaryPopupBlock(actionUid);
      expect(popup.popupBlock?.use).toBe('CreateFormModel');
      const formItems = _.castArray(popup.popupBlock?.subModels?.grid?.subModels?.items || []);
      expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Identity')).toBe(
        true,
      );
      expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Profile')).toBe(
        true,
      );
      expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Activity')).toBe(
        true,
      );
    }
  });

  it('should reuse one grouped add new template across calendar and kanban add-new hosts', async () => {
    const unique = Date.now();
    const collectionName = `add_new_template_tasks_${unique}`;
    await createLargeAddNewTemplateCollection(collectionName);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Add new template reuse ${unique}`,
          },
        },
        page: {
          title: `Add new template reuse ${unique}`,
        },
        defaults: {
          collections: {
            [collectionName]: {
              fieldGroups: [
                {
                  key: 'identity',
                  title: 'Identity',
                  fields: ['title', 'owner', 'email', 'phone'],
                },
                {
                  key: 'profile',
                  title: 'Profile',
                  fields: ['city', 'country', 'priority', 'category'],
                },
                {
                  key: 'activity',
                  title: 'Activity',
                  fields: ['status', 'score', 'notes'],
                },
              ],
              popups: {
                addNew: {
                  name: 'Create grouped task',
                  description: 'Create one grouped task.',
                },
                view: {
                  name: 'Grouped task details',
                  description: 'View one grouped task.',
                },
                edit: {
                  name: 'Edit grouped task',
                  description: 'Edit one grouped task.',
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Planning',
            layout: {
              rows: [
                [
                  { key: 'taskCalendar', span: 12 },
                  { key: 'taskBoard', span: 12 },
                ],
              ],
            },
            blocks: [
              {
                key: 'taskCalendar',
                type: 'calendar',
                title: 'Task calendar',
                collection: collectionName,
                actions: ['addNew', 'refresh'],
                settings: {
                  titleField: 'title',
                  startField: 'createdAt',
                  endField: 'updatedAt',
                  quickCreateEvent: true,
                  quickCreatePopup: {
                    tryTemplate: true,
                  },
                },
              },
              {
                key: 'taskBoard',
                type: 'kanban',
                title: 'Task board',
                collection: collectionName,
                fields: ['title', 'owner'],
                actions: ['addNew', 'refresh'],
                settings: {
                  groupField: 'status',
                  quickCreateEnabled: true,
                  quickCreatePopup: {
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
    const calendarBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CalendarBlockModel')[0];
    const kanbanBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'KanbanBlockModel')[0];
    const templateUids = [
      calendarBlock.subModels?.quickCreateAction?.popup?.template?.uid,
      _.castArray(calendarBlock.subModels?.actions || []).find((item: any) => item?.use === 'AddNewActionModel')?.popup
        ?.template?.uid,
      kanbanBlock.subModels?.quickCreateAction?.popup?.template?.uid,
      _.castArray(kanbanBlock.subModels?.actions || []).find((item: any) => item?.use === 'AddNewActionModel')?.popup
        ?.template?.uid,
    ];
    expect(templateUids.every(Boolean)).toBe(true);
    expect(new Set(templateUids).size).toBe(1);

    const popup = await readPrimaryPopupBlock(`${calendarBlock.uid}-quickCreateAction`);
    expect(popup.popupBlock?.use).toBe('CreateFormModel');
    const formItems = _.castArray(popup.popupBlock?.subModels?.grid?.subModels?.items || []);
    expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Identity')).toBe(
      true,
    );
    expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Profile')).toBe(
      true,
    );
    expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Activity')).toBe(
      true,
    );
    await expectTemplateUsageAtLeast(templateUids[0], 4);
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
