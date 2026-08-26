/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { uid } from '@nocobase/utils';
import {
  addBlockData,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getComposeBlock,
  getData,
  getSurface,
  readErrorItem,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { syncFlowSurfacesEnabledPlugins } from './flow-surfaces.mock-server';
import {
  FLOW_SURFACES_RECORD_HISTORY_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_TEST_PLUGINS,
} from './flow-surfaces.test-plugins';

const RECORD_HISTORY_TEST_PLUGINS = [...FLOW_SURFACES_TEST_PLUGINS, 'record-history'] as const;
const COMMENT_COLLECTION = 'fs_flow_comments';
const RECORD_HISTORY_COLLECTION = 'fs_flow_history_posts';
const DEFAULT_COMMENT_ACTION_USES = [
  'EditCommentActionModel',
  'DeleteCommentActionModel',
  'QuoteReplyActionModel',
] as const;
const DEFAULT_RECORD_HISTORY_ACTION_USES = [
  'FilterActionModel',
  'RefreshActionModel',
  'RecordHistoryExpandActionModel',
  'RecordHistoryCollapseActionModel',
] as const;

function expectCommentActionDefaults(commentsBlock: any) {
  const actions = _.castArray(commentsBlock?.subModels?.items?.[0]?.subModels?.actions || []);
  expect(actions.map((item: any) => item.use)).toEqual(DEFAULT_COMMENT_ACTION_USES);
  const deleteAction = actions.find((item: any) => item.use === 'DeleteCommentActionModel');
  expect(deleteAction?.stepParams?.deleteSettings).toMatchObject({
    confirm: {
      enable: true,
    },
  });
}

function expectRecordHistoryActionDefaults(recordHistoryBlock: any) {
  const actions = _.castArray(recordHistoryBlock?.subModels?.actions || []);
  expect(actions.map((item: any) => item.use)).toEqual(DEFAULT_RECORD_HISTORY_ACTION_USES);
  expect(actions.find((item: any) => item.use === 'RecordHistoryExpandActionModel')?.props).toMatchObject({
    title: '{{t("Expand all")}}',
    icon: 'NodeExpandOutlined',
  });
  expect(actions.find((item: any) => item.use === 'RecordHistoryCollapseActionModel')?.props).toMatchObject({
    title: '{{t("Collapse all")}}',
    icon: 'NodeCollapseOutlined',
  });
}

describe('flowSurfaces comments and recordHistory blocks', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: any;

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      enabledPluginAliases: RECORD_HISTORY_TEST_PLUGINS,
      plugins: FLOW_SURFACES_RECORD_HISTORY_TEST_PLUGIN_INSTALLS,
    });
    rootAgent = context.rootAgent;
    await syncFlowSurfacesEnabledPlugins(context.app, RECORD_HISTORY_TEST_PLUGINS, RECORD_HISTORY_TEST_PLUGINS);
    await setupCommentsAndRecordHistoryFixtures(context);
  }, 120000);

  beforeEach(async () => {
    rootAgent = context.rootAgent;
  });

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should create and configure comments and recordHistory through applyBlueprint, compose, addBlock and addBlocks', async () => {
    const blueprintRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Comments and history blueprint',
          },
        },
        page: {
          title: 'Comments and history blueprint',
        },
        tabs: [
          {
            title: 'Main',
            blocks: [
              {
                key: 'commentsFromBlueprint',
                type: 'comments',
                collection: COMMENT_COLLECTION,
                settings: {
                  title: 'Blueprint comments',
                  pageSize: 5,
                },
              },
              {
                key: 'historyFromBlueprint',
                type: 'recordHistory',
                collection: RECORD_HISTORY_COLLECTION,
                settings: {
                  title: 'Blueprint history',
                  sortOrder: { order: 'asc' },
                  expand: { expand: true },
                  template: { apply: 'current' },
                },
              },
            ],
          },
        ],
      },
    });
    expect(blueprintRes.status, readErrorMessage(blueprintRes)).toBe(200);
    const blueprintTree = getData(blueprintRes).surface.tree;
    const blueprintCommentsBlock = findNodeByUse(blueprintTree, 'CommentsBlockModel');
    expect(blueprintCommentsBlock?.subModels?.items?.[0]?.use).toBe('CommentItemModel');
    expectCommentActionDefaults(blueprintCommentsBlock);
    const blueprintRecordHistoryBlock = findNodeByUse(blueprintTree, 'RecordHistoryBlockModel');
    expectRecordHistoryActionDefaults(blueprintRecordHistoryBlock);
    expect(blueprintRecordHistoryBlock?.stepParams?.recordHistorySettings).toMatchObject({
      sortOrder: { order: 'asc' },
      expand: { expand: true },
      template: { apply: 'current' },
    });

    const page = await createPage(rootAgent, {
      title: 'Comments record history contract page',
      tabTitle: 'Main',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: { uid: page.tabSchemaUid },
          blocks: [
            {
              key: 'commentsFromCompose',
              type: 'comments',
              resource: {
                dataSourceKey: 'main',
                collectionName: COMMENT_COLLECTION,
              },
              settings: {
                title: 'Compose comments',
                pageSize: 10,
              },
            },
            {
              key: 'historyFromCompose',
              type: 'recordHistory',
              resource: {
                dataSourceKey: 'main',
                collectionName: RECORD_HISTORY_COLLECTION,
              },
              settings: {
                title: 'Compose history',
                sortOrder: { order: 'desc' },
              },
            },
          ],
        },
      }),
    );
    expect(getComposeBlock(composeRes, 'commentsFromCompose').uid).toBeTruthy();
    expect(getComposeBlock(composeRes, 'commentsFromCompose').recordActions.map((item: any) => item.type)).toEqual([
      'edit',
      'delete',
      'quoteReply',
    ]);
    expect(getComposeBlock(composeRes, 'historyFromCompose').uid).toBeTruthy();
    expect(getComposeBlock(composeRes, 'historyFromCompose').actions.map((item: any) => item.type)).toEqual([
      'filter',
      'refresh',
      'expandAll',
      'collapseAll',
    ]);
    expectCommentActionDefaults(
      (await getSurface(rootAgent, { uid: getComposeBlock(composeRes, 'commentsFromCompose').uid })).tree,
    );
    expectRecordHistoryActionDefaults(
      (await getSurface(rootAgent, { uid: getComposeBlock(composeRes, 'historyFromCompose').uid })).tree,
    );

    const comments = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'comments',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: COMMENT_COLLECTION,
      },
      settings: {
        title: 'Block comments',
        pageSize: 20,
      },
    });
    const commentsReadback = await getSurface(rootAgent, { uid: comments.uid });
    expect(commentsReadback.tree.use).toBe('CommentsBlockModel');
    expect(commentsReadback.tree.subModels?.items?.[0]?.use).toBe('CommentItemModel');
    expectCommentActionDefaults(commentsReadback.tree);
    expect(commentsReadback.tree.stepParams).toMatchObject({
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: COMMENT_COLLECTION,
        },
      },
      commentsSettings: {
        pageSize: {
          pageSize: 20,
        },
      },
    });

    const commentsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: comments.uid },
          sections: ['recordActions'],
        },
      }),
    );
    expect(commentsCatalog.recordActions.map((item: any) => ({ key: item.key, use: item.use }))).toEqual([
      { key: 'edit', use: 'EditCommentActionModel' },
      { key: 'delete', use: 'DeleteCommentActionModel' },
      { key: 'quoteReply', use: 'QuoteReplyActionModel' },
    ]);
    const existingQuoteReplyAction = commentsReadback.tree.subModels.items[0].subModels.actions.find(
      (item: any) => item.use === 'QuoteReplyActionModel',
    );
    const reusedQuoteReplyAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: comments.uid },
          type: 'quoteReply',
        },
      }),
    );
    expect(reusedQuoteReplyAction.uid).toBe(existingQuoteReplyAction.uid);
    const commentsAfterReadd = await getSurface(rootAgent, { uid: comments.uid });
    expect(
      commentsAfterReadd.tree.subModels.items[0].subModels.actions.filter(
        (item: any) => item.use === 'QuoteReplyActionModel',
      ),
    ).toHaveLength(1);

    const legacyCommentsUid = uid();
    const legacyCommentItemUid = uid();
    await context.flowRepo.upsertModel({
      uid: legacyCommentsUid,
      parentId: page.gridUid,
      subKey: 'items',
      subType: 'array',
      use: 'CommentsBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: COMMENT_COLLECTION,
          },
        },
      },
      subModels: {
        items: [
          {
            uid: legacyCommentItemUid,
            use: 'CommentItemModel',
          },
        ],
      },
    });

    for (const type of ['edit', 'delete', 'quoteReply']) {
      const createdAction = getData(
        await rootAgent.resource('flowSurfaces').addRecordAction({
          values: {
            target: { uid: legacyCommentsUid },
            type,
          },
        }),
      );
      expect(createdAction.parentUid).toBe(legacyCommentItemUid);
    }
    const legacyCommentsReadback = await getSurface(rootAgent, { uid: legacyCommentsUid });
    expect(legacyCommentsReadback.tree.subModels.items[0].subModels.actions.map((item: any) => item.use)).toEqual(
      DEFAULT_COMMENT_ACTION_USES,
    );

    const recordHistory = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'recordHistory',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: RECORD_HISTORY_COLLECTION,
      },
      settings: {
        title: 'Block history',
        sortOrder: { order: 'asc' },
        dataScope: { logic: '$and', items: [] },
        expand: { expand: true },
        template: { apply: 'current' },
      },
    });
    const recordHistoryReadback = await getSurface(rootAgent, { uid: recordHistory.uid });
    expect(recordHistoryReadback.tree.use).toBe('RecordHistoryBlockModel');
    expectRecordHistoryActionDefaults(recordHistoryReadback.tree);
    expect(recordHistoryReadback.tree.stepParams).toMatchObject({
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: RECORD_HISTORY_COLLECTION,
        },
      },
      recordHistorySettings: {
        sortOrder: { order: 'asc' },
        dataScope: { filter: { logic: '$and', items: [] } },
        expand: { expand: true },
        template: { apply: 'current' },
      },
    });

    const recordHistoryCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: recordHistory.uid },
          sections: ['actions'],
        },
      }),
    );
    expect(recordHistoryCatalog.actions.map((item: any) => ({ key: item.key, use: item.use }))).toEqual([
      { key: 'filter', use: 'FilterActionModel' },
      { key: 'refresh', use: 'RefreshActionModel' },
      { key: 'expandAll', use: 'RecordHistoryExpandActionModel' },
      { key: 'collapseAll', use: 'RecordHistoryCollapseActionModel' },
    ]);
    const existingExpandAllAction = recordHistoryReadback.tree.subModels.actions.find(
      (item: any) => item.use === 'RecordHistoryExpandActionModel',
    );
    const reusedExpandAllAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: recordHistory.uid },
          type: 'expandAll',
        },
      }),
    );
    expect(reusedExpandAllAction.uid).toBe(existingExpandAllAction.uid);
    const recordHistoryAfterReadd = await getSurface(rootAgent, { uid: recordHistory.uid });
    expect(
      recordHistoryAfterReadd.tree.subModels.actions.filter(
        (item: any) => item.use === 'RecordHistoryExpandActionModel',
      ),
    ).toHaveLength(1);

    const legacyRecordHistoryUid = uid();
    await context.flowRepo.upsertModel({
      uid: legacyRecordHistoryUid,
      parentId: page.gridUid,
      subKey: 'items',
      subType: 'array',
      use: 'RecordHistoryBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: RECORD_HISTORY_COLLECTION,
          },
        },
      },
    });

    for (const type of ['filter', 'refresh', 'expandAll', 'collapseAll']) {
      const createdAction = getData(
        await rootAgent.resource('flowSurfaces').addAction({
          values: {
            target: { uid: legacyRecordHistoryUid },
            type,
          },
        }),
      );
      expect(createdAction.parentUid).toBe(legacyRecordHistoryUid);
    }
    const legacyRecordHistoryReadback = await getSurface(rootAgent, { uid: legacyRecordHistoryUid });
    expectRecordHistoryActionDefaults(legacyRecordHistoryReadback.tree);

    const configureCommentsRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: comments.uid },
        changes: {
          title: 'Configured comments',
          description: 'Configured comments description',
          pageSize: 5,
          dataScope: { logic: '$and', items: [] },
        },
      },
    });
    expect(configureCommentsRes.status, readErrorMessage(configureCommentsRes)).toBe(200);
    const configuredComments = await getSurface(rootAgent, { uid: comments.uid });
    expect(configuredComments.tree.stepParams).toMatchObject({
      cardSettings: {
        titleDescription: {
          title: 'Configured comments',
          description: 'Configured comments description',
        },
      },
      commentsSettings: {
        pageSize: { pageSize: 5 },
        dataScope: { filter: { logic: '$and', items: [] } },
      },
    });

    const configureRecordHistoryRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: recordHistory.uid },
        changes: {
          title: 'Configured history',
          description: 'Configured history description',
          sortOrder: { order: 'desc' },
          dataScope: { logic: '$and', items: [] },
          expand: { expand: false },
          template: { apply: 'current' },
        },
      },
    });
    expect(configureRecordHistoryRes.status, readErrorMessage(configureRecordHistoryRes)).toBe(200);
    const configuredRecordHistory = await getSurface(rootAgent, { uid: recordHistory.uid });
    expect(configuredRecordHistory.tree.stepParams).toMatchObject({
      cardSettings: {
        titleDescription: {
          title: 'Configured history',
          description: 'Configured history description',
        },
      },
      recordHistorySettings: {
        sortOrder: { order: 'desc' },
        dataScope: { filter: { logic: '$and', items: [] } },
        expand: { expand: false },
        template: { apply: 'current' },
      },
    });

    const addBlocksRes = getData(
      await rootAgent.resource('flowSurfaces').addBlocks({
        values: {
          target: { uid: page.tabSchemaUid },
          blocks: [
            {
              key: 'commentsFromBatch',
              type: 'comments',
              resourceInit: {
                dataSourceKey: 'main',
                collectionName: COMMENT_COLLECTION,
              },
            },
            {
              key: 'historyFromBatch',
              type: 'recordHistory',
              resourceInit: {
                dataSourceKey: 'main',
                collectionName: RECORD_HISTORY_COLLECTION,
              },
            },
          ],
        },
      }),
    );
    expect(addBlocksRes.successCount).toBe(2);
    expect(addBlocksRes.blocks.map((item: any) => item.ok)).toEqual([true, true]);
    const batchRecordHistory = addBlocksRes.blocks.find((item: any) => item.key === 'historyFromBatch');
    expect(batchRecordHistory?.result?.uid).toBeTruthy();
    expectRecordHistoryActionDefaults((await getSurface(rootAgent, { uid: batchRecordHistory.result.uid })).tree);
  });

  it('should expose and create comments only for comment-template associations in record popups', async () => {
    const page = await createPage(rootAgent, {
      title: 'Comments popup contract page',
      tabTitle: 'Main',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const recordPopup = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
        },
      }),
    );

    const catalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: recordPopup.uid },
          sections: ['blocks'],
        },
      }),
    );
    const commentsCatalogItem = catalog.blocks.find((item: any) => item.use === 'CommentsBlockModel');
    expect(commentsCatalogItem?.resourceBindings.map((item: any) => item.key)).toEqual(['associatedRecords']);
    expect(commentsCatalogItem.resourceBindings[0].associationFields).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'flowComments', collectionName: COMMENT_COLLECTION })]),
    );

    const comments = await addBlockData(rootAgent, {
      target: { uid: recordPopup.uid },
      type: 'comments',
      resource: {
        binding: 'associatedRecords',
        associationField: 'flowComments',
      },
      settings: {
        title: 'Popup comments',
        pageSize: 5,
      },
    });
    const commentsReadback = await getSurface(rootAgent, { uid: comments.uid });
    expect(commentsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: COMMENT_COLLECTION,
      associationName: 'employees.flowComments',
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const configurePopupCommentsRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: comments.uid },
        changes: {
          resource: {
            binding: 'associatedRecords',
            associationField: 'flowComments',
          },
          pageSize: 10,
        },
      },
    });
    expect(configurePopupCommentsRes.status, readErrorMessage(configurePopupCommentsRes)).toBe(200);
    const configuredPopupComments = await getSurface(rootAgent, { uid: comments.uid });
    expect(configuredPopupComments.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: COMMENT_COLLECTION,
      associationName: 'employees.flowComments',
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });
    expect(configuredPopupComments.tree.stepParams?.commentsSettings?.pageSize?.pageSize).toBe(10);

    const currentRecordRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: recordPopup.uid },
        type: 'comments',
        resource: {
          binding: 'currentRecord',
        },
      },
    });
    expect(currentRecordRes.status).toBe(400);
    expectStructuredError(readErrorItem(currentRecordRes), { status: 400, type: 'bad_request' });
    expect(readErrorMessage(currentRecordRes)).toContain(`resource.binding='currentRecord'`);

    const belongsToRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: recordPopup.uid },
        type: 'comments',
        resource: {
          binding: 'associatedRecords',
          associationField: 'primaryFlowComment',
        },
      },
    });
    expect(belongsToRes.status).toBe(400);
    expect(readErrorMessage(belongsToRes)).toContain(`associationField 'primaryFlowComment' is not available`);

    const nonCommentTargetRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: recordPopup.uid },
        type: 'comments',
        resource: {
          binding: 'associatedRecords',
          associationField: 'skills',
        },
      },
    });
    expect(nonCommentTargetRes.status).toBe(400);
    expect(readErrorMessage(nonCommentTargetRes)).toContain(`associationField 'skills' is not available`);
  });

  it('should reject invalid comments and recordHistory resources without creating unusable blocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Invalid comments history page',
      tabTitle: 'Main',
    });

    const invalidCommentsRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'comments',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });
    expect(invalidCommentsRes.status).toBe(400);
    expectStructuredError(readErrorItem(invalidCommentsRes), { status: 400, type: 'bad_request' });
    expect(readErrorMessage(invalidCommentsRes)).toContain(`requires a comment template collection`);

    const invalidPageSizeRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'comments',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: COMMENT_COLLECTION,
        },
        settings: {
          pageSize: 7,
        },
      },
    });
    expect(invalidPageSizeRes.status).toBe(400);
    expect(readErrorMessage(invalidPageSizeRes)).toContain('pageSize');

    const invalidRecordHistoryCollection = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'recordHistory',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'recordHistories',
        },
      },
    });
    expect(invalidRecordHistoryCollection.status).toBe(400);
    expect(readErrorMessage(invalidRecordHistoryCollection)).toContain(`does not support internal collection`);

    const missingFilterTargetRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'recordHistory',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'fs_history_missing_filter_target',
        },
      },
    });
    expect(missingFilterTargetRes.status).toBe(400);
    expect(readErrorMessage(missingFilterTargetRes)).toContain(`requires a real filterTargetKey`);

    const pageHistory = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'recordHistory',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: RECORD_HISTORY_COLLECTION,
      },
    });
    const invalidRecordIdSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: pageHistory.uid },
        stepParams: {
          recordHistorySettings: {
            recordId: {
              recordId: '{{ctx.view.inputArgs.filterByTk}}',
            },
          },
        },
      },
    });
    expect(invalidRecordIdSettings.status).toBe(400);
    expect(readErrorMessage(invalidRecordIdSettings)).toContain(
      `current-record history is only supported in one-record popup/details scenes`,
    );

    const table = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: RECORD_HISTORY_COLLECTION,
      },
    });
    const recordPopup = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
        },
      }),
    );

    const popupHistory = await addBlockData(rootAgent, {
      target: { uid: recordPopup.uid },
      type: 'recordHistory',
      resource: {
        binding: 'otherRecords',
        collectionName: RECORD_HISTORY_COLLECTION,
      },
    });
    const configurePopupHistoryCurrent = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: popupHistory.uid },
        changes: {
          resource: {
            binding: 'currentRecord',
          },
        },
      },
    });
    expect(configurePopupHistoryCurrent.status, readErrorMessage(configurePopupHistoryCurrent)).toBe(200);
    const configuredCurrentHistory = await getSurface(rootAgent, { uid: popupHistory.uid });
    expect(configuredCurrentHistory.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: RECORD_HISTORY_COLLECTION,
    });
    expect(configuredCurrentHistory.tree.stepParams?.resourceSettings?.init?.filterByTk).toBeUndefined();
    expect(configuredCurrentHistory.tree.stepParams?.recordHistorySettings?.recordId?.recordId).toBe(
      '{{ctx.view.inputArgs.filterByTk}}',
    );

    const configurePopupHistoryOther = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: popupHistory.uid },
        changes: {
          resource: {
            binding: 'otherRecords',
            collectionName: RECORD_HISTORY_COLLECTION,
          },
        },
      },
    });
    expect(configurePopupHistoryOther.status, readErrorMessage(configurePopupHistoryOther)).toBe(200);
    const configuredOtherHistory = await getSurface(rootAgent, { uid: popupHistory.uid });
    expect(configuredOtherHistory.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: RECORD_HISTORY_COLLECTION,
    });
    expect(configuredOtherHistory.tree.stepParams?.recordHistorySettings?.recordId).toBeUndefined();

    const currentRecordHistory = await addBlockData(rootAgent, {
      target: { uid: recordPopup.uid },
      type: 'recordHistory',
      resource: {
        binding: 'currentRecord',
      },
    });
    const currentReadback = await getSurface(rootAgent, { uid: currentRecordHistory.uid });
    expect(currentReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: RECORD_HISTORY_COLLECTION,
    });
    expect(currentReadback.tree.stepParams?.resourceSettings?.init?.filterByTk).toBeUndefined();
    expect(currentReadback.tree.stepParams?.recordHistorySettings?.recordId?.recordId).toBe(
      '{{ctx.view.inputArgs.filterByTk}}',
    );

    const currentRecordOutsidePopup = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'recordHistory',
        resource: {
          binding: 'currentRecord',
        },
      },
    });
    expect(currentRecordOutsidePopup.status).toBe(400);
    expect(readErrorMessage(currentRecordOutsidePopup)).toContain(
      `recordHistory resource.binding='currentRecord' is only supported in one-record popup/details scenes`,
    );

    const associationHistory = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: recordPopup.uid },
        type: 'recordHistory',
        resource: {
          binding: 'associatedRecords',
          associationField: 'flowComments',
        },
      },
    });
    expect(associationHistory.status).toBe(400);
    expect(readErrorMessage(associationHistory)).toContain(`resource.binding='associatedRecords'`);
  });
});

async function setupCommentsAndRecordHistoryFixtures(context: FlowSurfacesContractContext) {
  const { rootAgent, app } = context;
  await rootAgent.resource('collections').create({
    values: {
      name: COMMENT_COLLECTION,
      title: 'Flow surface comments',
      fields: [{ name: 'content', type: 'text', interface: 'textarea' }],
    },
  });
  await rootAgent.resource('collections').create({
    values: {
      name: RECORD_HISTORY_COLLECTION,
      title: 'Flow surface history posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'select' },
      ],
    },
  });
  await rootAgent.resource('collections').create({
    values: {
      name: 'fs_history_missing_filter_target',
      title: 'History missing filter target',
      fields: [{ name: 'title', type: 'string', interface: 'input' }],
    },
  });
  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'flowComments',
      type: 'hasMany',
      target: COMMENT_COLLECTION,
      foreignKey: 'employeeId',
      interface: 'o2m',
    },
  });
  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'primaryFlowComment',
      type: 'belongsTo',
      target: COMMENT_COLLECTION,
      foreignKey: 'primaryFlowCommentId',
      interface: 'm2o',
    },
  });

  await waitForFixtureCollectionsReady(app.db, {
    [COMMENT_COLLECTION]: ['content'],
    [RECORD_HISTORY_COLLECTION]: ['title', 'status'],
    fs_history_missing_filter_target: ['title'],
  });

  const commentCollection: any = app.db.getCollection(COMMENT_COLLECTION);
  commentCollection.template = 'comment';
  commentCollection.options = {
    ...(commentCollection.options || {}),
    template: 'comment',
  };

  const missingFilterTargetCollection: any = app.db.getCollection('fs_history_missing_filter_target');
  Object.defineProperty(missingFilterTargetCollection, 'filterTargetKey', {
    configurable: true,
    value: 'missingKey',
  });
  missingFilterTargetCollection.options = {
    ...(missingFilterTargetCollection.options || {}),
    filterTargetKey: 'missingKey',
  };
}

function findNodeByUse(root: any, use: string) {
  return collectNodes(root).find((node: any) => node?.use === use);
}

function collectNodes(root: any) {
  const nodes: any[] = [];
  const visit = (node: any) => {
    if (!_.isPlainObject(node)) {
      return;
    }
    nodes.push(node);
    Object.values(node.subModels || {}).forEach((child: any) => {
      _.castArray(child).forEach(visit);
    });
  };
  visit(root);
  return nodes;
}
