/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Plugin } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import _ from 'lodash';
import FlowModelRepository from '../repository';
import {
  getEditableDomainsForUse,
  getAvailableActionCatalogItems,
  getNodeContract,
  getSettingsSchemaForUse,
  resolveSupportedFieldCapability,
  resolveSupportedActionCatalogItem,
  resolveSupportedBlockCatalogItem,
} from './catalog';
import { assertRequestedActionScope, getActionContainerScope, normalizeActionScope } from './action-scope';
import {
  buildActionTree,
  buildBlockTree,
  buildCanonicalTableActionsColumnNode,
  buildFieldTree,
  buildStandaloneFieldNode,
  buildPersistedRootPageModel,
  buildPopupPageTree,
} from './builder';
import { compileApplySpec } from './compiler';
import { FlowSurfaceContractGuard } from './contract-guard';
import { FlowSurfaceBadRequestError } from './errors';
import { executeMutateOps } from './executor';
import { SurfaceLocator } from './locator';
import { FlowSurfaceRouteSync } from './route-sync';
import { FlowSurfaceContextResolver } from './surface-context';
import {
  getConfigureOptionKeysForResolvedNode,
  getConfigureOptionKeysForUse,
  getConfigureOptionsForCatalogItem,
  getConfigureOptionsForResolvedNode,
  getConfigureOptionsForUse,
} from './configure-options';
import type {
  FlowSurfaceApplyMode,
  FlowSurfaceApplySpec,
  FlowSurfaceApplyValues,
  FlowSurfaceAtomicFlag,
  FlowSurfaceComposeMode,
  FlowSurfaceComposeValues,
  FlowSurfaceConfigureValues,
  FlowSurfaceExecutorContext,
  FlowSurfaceMutateOp,
  FlowSurfaceMutateValues,
  FlowSurfaceNodeDomain,
  FlowSurfaceNodeSpec,
  FlowSurfaceNodeSubModel,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
  FlowSurfaceWriteTarget,
} from './types';

const FORM_BLOCK_USES = new Set(['FormBlockModel', 'CreateFormModel', 'EditFormModel']);
const DETAILS_BLOCK_USES = new Set(['DetailsBlockModel']);
const SIMPLE_FORM_BLOCK_USES = new Set(['FormBlockModel', 'CreateFormModel', 'EditFormModel']);
const LIST_BLOCK_USES = new Set(['ListBlockModel']);
const GRID_CARD_BLOCK_USES = new Set(['GridCardBlockModel']);
const LIST_LIKE_COMPOSE_BLOCK_TYPES = new Set(['list', 'gridCard']);
const STATIC_CONTENT_BLOCK_USES = new Set([
  'MarkdownBlockModel',
  'IframeBlockModel',
  'ChartBlockModel',
  'ActionPanelBlockModel',
  'JSBlockModel',
]);
const FILTER_TARGET_BLOCK_USES = new Set([
  'TableBlockModel',
  'DetailsBlockModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'ChartBlockModel',
  'MapBlockModel',
  'CommentsBlockModel',
]);
const FIELD_WRAPPER_USES = new Set(['FormItemModel', 'DetailsItemModel', 'FilterFormItemModel', 'TableColumnModel']);
const STANDALONE_FIELD_NODE_USES = new Set(['JSColumnModel', 'JSItemModel']);
const DISPLAY_FIELD_WRAPPER_USES = new Set(['DetailsItemModel', 'TableColumnModel']);
const TITLE_FIELD_SUPPORTED_WRAPPER_USES = new Set(['FormItemModel', 'DetailsItemModel', 'TableColumnModel']);
const AUTO_TITLE_FIELD_BINDING_WRAPPER_USES = new Set(['DetailsItemModel', 'TableColumnModel']);
const ACTION_BUTTON_USES = new Set([
  'AddNewActionModel',
  'ViewActionModel',
  'EditActionModel',
  'PopupCollectionActionModel',
  'DeleteActionModel',
  'BulkDeleteActionModel',
  'BulkEditActionModel',
  'UpdateRecordActionModel',
  'BulkUpdateActionModel',
  'DuplicateActionModel',
  'AddChildActionModel',
  'FilterActionModel',
  'ExpandCollapseActionModel',
  'FormSubmitActionModel',
  'FilterFormSubmitActionModel',
  'FilterFormResetActionModel',
  'FilterFormCollapseActionModel',
  'RefreshActionModel',
  'LinkActionModel',
  'ExportActionModel',
  'ExportAttachmentActionModel',
  'ImportActionModel',
  'UploadActionModel',
  'TemplatePrintCollectionActionModel',
  'TemplatePrintRecordActionModel',
  'CollectionTriggerWorkflowActionModel',
  'RecordTriggerWorkflowActionModel',
  'FormTriggerWorkflowActionModel',
  'WorkbenchTriggerWorkflowActionModel',
  'MailSendActionModel',
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
  'JSActionModel',
]);
const JS_BLOCK_USES = new Set(['JSBlockModel']);
const JS_ACTION_USES = new Set([
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
  'JSActionModel',
]);
const POPUP_ACTION_USES = new Set([
  'AddNewActionModel',
  'ViewActionModel',
  'EditActionModel',
  'PopupCollectionActionModel',
  'DuplicateActionModel',
  'AddChildActionModel',
  'MailSendActionModel',
]);
const DELETE_ACTION_USES = new Set(['DeleteActionModel', 'BulkDeleteActionModel']);
const CONFIRMABLE_SUBMIT_ACTION_USES = new Set(['FormSubmitActionModel']);
const MULTI_VALUE_ASSOCIATION_INTERFACES = new Set(['m2m', 'o2m', 'mbm']);

type FlowSurfaceAddFieldResult = {
  uid?: string;
  parentUid?: string;
  subKey?: string;
  fieldUse?: string;
  type?: string;
  renderer?: string;
  defaultTargetUid?: string;
  associationPathName?: string;
  fieldPath?: string;
  wrapperUid?: string;
  fieldUid?: string;
  innerFieldUid?: string;
};

export class FlowSurfacesService {
  constructor(private readonly plugin: Plugin) {}

  get db() {
    return this.plugin.db;
  }

  get repository() {
    return this.db.getCollection('flowModels').repository as FlowModelRepository;
  }

  get locator() {
    return new SurfaceLocator(this.db, this.repository);
  }

  private get routeSync() {
    return new FlowSurfaceRouteSync(this.db, this.repository);
  }

  private get contractGuard() {
    return new FlowSurfaceContractGuard();
  }

  private get surfaceContext() {
    return new FlowSurfaceContextResolver(this.repository, this.locator, {
      hydrateRoute: (routeLike, transaction) => this.routeSync.hydrateRoute(routeLike, transaction),
      ensureGridChild: (parentUid, use, transaction) => this.ensureGridChild(parentUid, use, transaction),
      ensurePopupSurface: (parentUid, transaction) => this.ensurePopupSurface(parentUid, transaction),
      getCollection: (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
    });
  }

  private allocateRouteSortValue(offset = 0) {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000) + offset;
  }

  async catalog(input: { target?: FlowSurfaceWriteTarget }, options: { transaction?: any } = {}) {
    if (
      _.isUndefined(input?.target) &&
      hasLegacyLocatorFields(input || {}, {
        allowRootUid: true,
      })
    ) {
      throwBadRequest(
        `flowSurfaces catalog only accepts target.uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    const target = _.isUndefined(input?.target)
      ? undefined
      : this.normalizeWriteTarget('catalog', input?.target, input);
    const resolved = target ? await this.locator.resolve(target, options) : null;
    const node = resolved ? await this.loadResolvedNode(resolved, options.transaction) : null;
    const fieldCatalog = target ? await this.buildFieldCatalog(target, options.transaction) : [];
    const availableBlocks = this.surfaceContext.filterBlocksByTarget(node, resolved);
    const recordActionContainerUse = getCatalogRecordActionContainerUse(node?.use);
    const availableActions = node
      ? getAvailableActionCatalogItems(node?.use).filter((item) => item.scope !== 'record')
      : getAvailableActionCatalogItems().filter((item) => item.scope !== 'record');
    const availableRecordActions = node
      ? recordActionContainerUse
        ? getAvailableActionCatalogItems(recordActionContainerUse, 'record')
        : []
      : getAvailableActionCatalogItems(undefined, 'record');

    return {
      target: resolved || null,
      blocks: availableBlocks.map((item) => ({
        ...item,
        configureOptions: getConfigureOptionsForCatalogItem(item),
      })),
      fields: fieldCatalog.map((item) => ({
        ...item,
        configureOptions: getConfigureOptionsForCatalogItem(item),
      })),
      actions: availableActions.map((item) => ({
        ...item,
        configureOptions: getConfigureOptionsForCatalogItem(item),
      })),
      recordActions: availableRecordActions.map((item) => ({
        ...item,
        configureOptions: getConfigureOptionsForCatalogItem(item),
      })),
      editableDomains: this.getEditableDomains(node?.use),
      configureOptions: getConfigureOptionsForResolvedNode({
        kind: resolved?.kind,
        use: node?.use,
      }),
      settingsSchema: getSettingsSchemaForUse(node?.use),
      settingsContract: getNodeContract(node?.use).domains,
      eventCapabilities: getNodeContract(node?.use).eventCapabilities,
      layoutCapabilities: getNodeContract(node?.use).layoutCapabilities,
    };
  }

  async get(input: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeGetTarget(input);
    const resolved = await this.locator.resolve(target, options);
    const node = await this.loadResolvedNode(resolved, options.transaction);
    const nodeMap = flattenModel(node);
    const result: Record<string, any> = {
      target: this.buildReadTargetSummary(target, resolved),
      tree: node,
      nodeMap,
    };

    if (resolved.pageRoute) {
      const pageRoute = await this.routeSync.hydrateRoute(resolved.pageRoute, options.transaction);
      result.pageRoute = pageRoute;
      result.tabs = _.sortBy(
        _.castArray(pageRoute?.get?.('children') || pageRoute?.children || []).map((item) => item?.toJSON?.() || item),
        'sort',
      );
      result.tabTrees = await Promise.all(
        result.tabs.map(async (tabRoute) => ({
          route: tabRoute,
          tree: await this.routeSync.buildTabAnchor(tabRoute, options.transaction),
        })),
      );
    } else if (resolved.route) {
      result.route = await this.routeSync.hydrateRoute(resolved.route, options.transaction);
    }

    return result;
  }

  async compose(values: FlowSurfaceComposeValues, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('compose', values?.target, values);
    const mode = this.assertComposeMode(values?.mode);
    const normalizedBlocks = _.castArray(values?.blocks || []).map((item, index) =>
      this.normalizeComposeBlock(item, index),
    );
    const blockParent = await this.surfaceContext.resolveBlockParent(target, options.transaction);
    const gridUid = blockParent.parentUid;
    const initialGrid = await this.repository.findModelById(gridUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const existingItems = _.castArray(initialGrid?.subModels?.items || []).filter((item: any) => item?.uid);

    if (mode === 'replace') {
      for (const item of existingItems) {
        await this.removeNodeTreeWithBindings(item.uid, options.transaction);
      }
    }

    const createdBlocks: Array<Record<string, any>> = [];
    const keyRefs: Record<string, any> = {};

    for (const blockSpec of normalizedBlocks) {
      const created = await this.addBlock(
        {
          target: {
            uid: gridUid,
          },
          type: blockSpec.type,
          resourceInit: blockSpec.resource,
        },
        options,
      );

      createdBlocks.push({
        spec: blockSpec,
        result: created,
      });
      keyRefs[blockSpec.key] = {
        uid: created.uid,
        type: blockSpec.type,
        gridUid: created.gridUid,
        itemUid: created.itemUid,
        itemGridUid: created.itemGridUid,
        actionsColumnUid: created.actionsColumnUid,
      };
    }

    for (const block of createdBlocks) {
      await this.applyInlineNodeSettings('compose block', block.result.uid, block.spec.settings, options);
    }

    for (const block of createdBlocks) {
      const fieldResults: Array<Record<string, any>> = [];
      for (const fieldSpec of block.spec.fields) {
        const createdField = await this.addField(
          {
            target: {
              uid: this.resolveComposeFieldContainerUid(block.spec, block.result),
            },
            ...(fieldSpec.fieldPath ? { fieldPath: fieldSpec.fieldPath } : {}),
            ...(fieldSpec.associationPathName ? { associationPathName: fieldSpec.associationPathName } : {}),
            ...(fieldSpec.renderer ? { renderer: fieldSpec.renderer } : {}),
            ...(fieldSpec.type ? { type: fieldSpec.type } : {}),
            ...(fieldSpec.target
              ? { defaultTargetUid: this.resolveComposeTargetRef(fieldSpec.target, keyRefs, 'field') }
              : {}),
          },
          options,
        );

        await this.applyInlineFieldSettings('compose field', createdField, fieldSpec.settings, options);

        fieldResults.push({
          key: fieldSpec.key,
          uid: createdField.uid,
          ...(fieldSpec.type ? { type: fieldSpec.type } : {}),
          ...(fieldSpec.renderer ? { renderer: fieldSpec.renderer } : {}),
          fieldPath: fieldSpec.fieldPath,
          associationPathName: fieldSpec.associationPathName,
          wrapperUid: createdField.wrapperUid,
          fieldUid: createdField.fieldUid,
          innerFieldUid: createdField.innerFieldUid,
          ...(fieldSpec.target ? { target: fieldSpec.target } : {}),
        });
      }
      block.fieldResults = fieldResults;
    }

    for (const block of createdBlocks) {
      const actionResults: Array<Record<string, any>> = [];
      for (const actionSpec of block.spec.actions) {
        const containerUid = this.resolveComposeActionContainerUid(block.spec, block.result);
        const createdAction = await this.addAction(
          {
            target: {
              uid: containerUid,
            },
            type: actionSpec.type,
          },
          options,
        );

        await this.applyInlineNodeSettings('compose action', createdAction.uid, actionSpec.settings, options);
        await this.applyInlineActionPopup('compose action', createdAction.uid, actionSpec.popup, options);

        const actionRefs = await this.collectComposeActionRefs(createdAction.uid, options.transaction);

        actionResults.push({
          key: actionSpec.key,
          type: actionSpec.type,
          scope: createdAction.scope,
          uid: createdAction.uid,
          parentUid: createdAction.parentUid,
          ...actionRefs,
        });
      }
      block.actionResults = actionResults;
    }

    for (const block of createdBlocks) {
      const recordActionResults: Array<Record<string, any>> = [];
      for (const actionSpec of block.spec.recordActions) {
        const createdAction = await this.addRecordAction(
          {
            target: {
              uid: block.result.uid,
            },
            type: actionSpec.type,
          },
          options,
        );
        if (block.spec.type === 'table' && !block.result.actionsColumnUid) {
          block.result.actionsColumnUid = createdAction.parentUid;
        }

        await this.applyInlineNodeSettings('compose recordAction', createdAction.uid, actionSpec.settings, options);
        await this.applyInlineActionPopup('compose recordAction', createdAction.uid, actionSpec.popup, options);

        const actionRefs = await this.collectComposeActionRefs(createdAction.uid, options.transaction);

        recordActionResults.push({
          key: actionSpec.key,
          type: actionSpec.type,
          scope: createdAction.scope,
          uid: createdAction.uid,
          parentUid: createdAction.parentUid,
          ...actionRefs,
        });
      }
      block.recordActionResults = recordActionResults;
    }

    let layoutResult: any = null;
    const finalGrid = await this.repository.findModelById(gridUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const finalItems = _.castArray(finalGrid?.subModels?.items || []).filter((item: any) => item?.uid);
    if (values.layout?.rows || mode === 'replace') {
      const layoutPayload = this.buildComposeLayoutPayload({
        layout: values.layout,
        createdByKey: keyRefs,
        finalItems,
      });
      layoutResult = await this.setLayout(
        {
          target: {
            uid: gridUid,
          },
          ...layoutPayload,
        },
        options,
      );
    }

    return {
      target: {
        uid: gridUid,
      },
      mode,
      keyToUid: Object.fromEntries(Object.entries(keyRefs).map(([key, value]) => [key, value.uid])),
      blocks: createdBlocks.map((item) => ({
        key: item.spec.key,
        type: item.spec.type,
        uid: item.result.uid,
        gridUid: item.result.gridUid,
        itemUid: item.result.itemUid,
        itemGridUid: item.result.itemGridUid,
        actionsColumnUid: item.result.actionsColumnUid,
        fields: item.fieldResults || [],
        actions: item.actionResults || [],
        recordActions: item.recordActionResults || [],
      })),
      ...(layoutResult ? { layout: layoutResult } : {}),
    };
  }

  async configure(values: FlowSurfaceConfigureValues, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('configure', values?.target, values);
    if (!_.isPlainObject(values.changes) || !Object.keys(values.changes).length) {
      throwBadRequest('flowSurfaces configure requires a non-empty changes object');
    }
    ensureNoRawSimpleChangeKeys(values.changes);

    const resolved = await this.locator.resolve(target, options);
    const current = await this.loadResolvedNode(resolved, options.transaction);

    if (resolved.kind === 'page' && resolved.pageRoute) {
      return this.configurePage(target, values.changes, options);
    }
    if (resolved.kind === 'tab' && resolved.tabRoute) {
      return this.configureTab(target, values.changes, options);
    }
    if (current?.use === 'TableBlockModel') {
      return this.configureTableBlock(target, values.changes, options);
    }
    if (SIMPLE_FORM_BLOCK_USES.has(current?.use || '')) {
      return this.configureFormBlock(target, current.use, values.changes, options);
    }
    if (current?.use === 'DetailsBlockModel') {
      return this.configureDetailsBlock(target, values.changes, options);
    }
    if (current?.use === 'FilterFormBlockModel') {
      return this.configureFilterFormBlock(target, values.changes, options);
    }
    if (LIST_BLOCK_USES.has(current?.use || '')) {
      return this.configureListBlock(target, values.changes, options);
    }
    if (GRID_CARD_BLOCK_USES.has(current?.use || '')) {
      return this.configureGridCardBlock(target, values.changes, options);
    }
    if (JS_BLOCK_USES.has(current?.use || '')) {
      return this.configureJSBlock(target, values.changes, options);
    }
    if (current?.use === 'MarkdownBlockModel') {
      return this.configureMarkdownBlock(target, values.changes, options);
    }
    if (current?.use === 'IframeBlockModel') {
      return this.configureIframeBlock(target, values.changes, options);
    }
    if (current?.use === 'ChartBlockModel') {
      return this.configureChartBlock(target, values.changes, options);
    }
    if (current?.use === 'ActionPanelBlockModel') {
      return this.configureActionPanelBlock(target, values.changes, options);
    }
    if (current?.use === 'TableActionsColumnModel') {
      return this.configureActionColumn(target, values.changes, options);
    }
    if (FIELD_WRAPPER_USES.has(current?.use || '')) {
      return this.configureFieldWrapper(target, current, values.changes, options);
    }
    if (STANDALONE_FIELD_NODE_USES.has(current?.use || '')) {
      return current?.use === 'JSColumnModel'
        ? this.configureJSColumn(target, values.changes, options)
        : this.configureJSItem(target, values.changes, options);
    }
    if (isFieldNodeUse(current?.use)) {
      return this.configureFieldNode(target, values.changes, options);
    }
    if (ACTION_BUTTON_USES.has(current?.use || '')) {
      return this.configureActionNode(target, current.use, values.changes, options);
    }

    throwBadRequest(`flowSurfaces configure does not support configureOptions on '${current?.use || resolved.uid}'`);
  }

  async createPage(values: Record<string, any>, options: { transaction?: any } = {}) {
    const pageSchemaUid = values.pageSchemaUid || uid();
    const tabSchemaUid = values.tabSchemaUid || uid();
    const tabSchemaName = values.tabSchemaName || uid();
    const title = values.title || pageSchemaUid;
    const tabTitle = values.tabTitle || 'Untitled';
    const enableTabs = !!values.enableTabs;
    const displayTitle = values.displayTitle !== false;
    const pageSort = this.allocateRouteSortValue();
    const initialTabSort = this.allocateRouteSortValue(1);

    const desktopRoutes = this.db.getRepository('desktopRoutes');
    await desktopRoutes.create({
      values: {
        type: 'flowPage',
        sort: pageSort,
        title,
        icon: values.icon,
        schemaUid: pageSchemaUid,
        hideInMenu: false,
        enableTabs,
        enableHeader: values.enableHeader,
        displayTitle,
        options: values.routeOptions || {},
        children: [
          {
            type: 'tabs',
            sort: initialTabSort,
            title: tabTitle,
            icon: values.tabIcon,
            schemaUid: tabSchemaUid,
            tabSchemaName,
            hidden: !enableTabs,
            parentId: null,
            options: {
              documentTitle: values.tabDocumentTitle,
              flowRegistry: values.tabFlowRegistry || {},
            },
          },
        ],
      },
      transaction: options.transaction,
    });

    const route = await desktopRoutes.findOne({
      filter: {
        schemaUid: pageSchemaUid,
      },
      appends: ['children'],
      transaction: options.transaction,
    });
    const tabRoute = _.sortBy(_.castArray(route?.get?.('children') || []), 'sort')[0];
    await this.ensureFlowRoutePageSchemaShell(pageSchemaUid, options.transaction);

    const pageTree = buildPersistedRootPageModel({
      pageUid: values.pageUid || uid(),
      pageTitle: title,
      routeId: route.get('id'),
      enableTabs,
      displayTitle,
      pageDocumentTitle: values.documentTitle,
    });

    const pageUid = await this.repository.upsertModel(
      {
        parentId: pageSchemaUid,
        subKey: 'page',
        subType: 'object',
        ...pageTree,
      },
      { transaction: options.transaction },
    );
    const gridUid = await this.ensureGridChild(tabSchemaUid, 'BlockGridModel', options.transaction);

    return {
      routeId: route.get('id'),
      pageSchemaUid,
      pageUid,
      tabSchemaUid,
      tabRouteId: tabRoute?.get?.('id') || tabRoute?.id,
      tabSchemaName,
      gridUid,
    };
  }

  async destroyPage(values: Record<string, any>, options: { transaction?: any } = {}) {
    const uid = this.normalizeRootUidValue('destroyPage', values);
    const resolved = await this.locator.resolve({ uid }, options);
    const { pageSchemaUid } = await this.assertPageRootUidTarget('destroyPage', resolved, options.transaction);
    const pageRoute = await this.db.getRepository('desktopRoutes').findOne({
      filter: {
        schemaUid: pageSchemaUid,
      },
      appends: ['children'],
      transaction: options.transaction,
    });
    const pageModel = await this.repository.findModelByParentId(pageSchemaUid, {
      transaction: options.transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });
    if (pageModel?.uid) {
      await this.repository.remove(pageModel.uid, { transaction: options.transaction });
    }
    const tabRoutes = _.castArray(pageRoute?.get?.('children') || pageRoute?.children || []);
    for (const tabRoute of tabRoutes) {
      await this.routeSync.removeTabAnchorTree(
        tabRoute?.get?.('schemaUid') || tabRoute?.schemaUid,
        options.transaction,
      );
    }
    await this.db.getRepository('desktopRoutes').destroy({
      filter: {
        schemaUid: pageSchemaUid,
      },
      transaction: options.transaction,
    });
    await this.removeFlowRoutePageSchemaShell(pageSchemaUid, options.transaction);
    return { uid: resolved.uid };
  }

  async addTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const pageTarget = await this.locator.resolve(this.normalizeWriteTarget('addTab', values?.target, values), options);
    await this.assertPageRootUidTarget('addTab', pageTarget, options.transaction);
    const pageRoute = pageTarget.pageRoute;
    if (!pageRoute) {
      throw new Error('flowSurfaces addTab page route not found');
    }
    const tabSchemaUid = values.tabSchemaUid || uid();
    const tabSchemaName = values.tabSchemaName || uid();
    const title = values.title || 'Untitled';
    const sort = this.allocateRouteSortValue();
    const route = await this.db.getRepository('desktopRoutes').create({
      values: {
        type: 'tabs',
        sort,
        title,
        icon: values.icon,
        parentId: pageRoute.get('id'),
        schemaUid: tabSchemaUid,
        tabSchemaName,
        hidden: !pageRoute.get('enableTabs'),
        options: {
          documentTitle: values.documentTitle,
          flowRegistry: values.flowRegistry || {},
        },
      },
      transaction: options.transaction,
    });

    // Modern page tabs are route-backed synthetic anchors.
    // Keep the persisted subtree aligned with frontend semantics by storing only the async grid child under the tab schema uid.
    const gridUid = await this.ensureGridChild(tabSchemaUid, 'BlockGridModel', options.transaction);

    return {
      pageUid: pageTarget.uid,
      tabSchemaUid,
      tabRouteId: route.get('id'),
      tabSchemaName,
      gridUid,
    };
  }

  async updateTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = await this.locator.resolve(this.normalizeWriteTarget('updateTab', values?.target, values), options);
    if (target.kind !== 'tab') {
      throwBadRequest(
        `flowSurfaces updateTab only accepts target.uid for a tab; if you only have tabSchemaUid, call flowSurfaces:get first`,
      );
    }
    const tabUid = target.uid;
    const route = target.tabRoute || (await this.locator.findRouteBySchemaUid(tabUid, options.transaction));
    if (!route) {
      throw new Error('flowSurfaces updateTab route not found');
    }
    const current = await this.loadResolvedNode(target, options.transaction);
    const nextPayload = buildDefinedPayload({
      props: _.pickBy(
        {
          title: values.title,
          icon: values.icon,
        },
        (value) => !_.isUndefined(value),
      ),
      stepParams:
        !_.isUndefined(values.title) || !_.isUndefined(values.icon) || !_.isUndefined(values.documentTitle)
          ? {
              pageTabSettings: {
                tab: _.pickBy(
                  {
                    title: values.title,
                    icon: values.icon,
                    documentTitle: values.documentTitle,
                  },
                  (value) => !_.isUndefined(value),
                ),
              },
            }
          : undefined,
      flowRegistry: !_.isUndefined(values.flowRegistry) ? values.flowRegistry : undefined,
    });
    await this.routeSync.persistTabSettings(target, current, nextPayload, options.transaction);

    return {
      uid: tabUid,
      routeId: route.get('id'),
      title: values.title,
      icon: values.icon,
    };
  }

  async moveTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    if (
      Object.prototype.hasOwnProperty.call(values || {}, 'sourceTabSchemaUid') ||
      Object.prototype.hasOwnProperty.call(values || {}, 'targetTabSchemaUid')
    ) {
      throwBadRequest(
        `flowSurfaces moveTab only accepts sourceUid and targetUid; if you only have tabSchemaUid, call flowSurfaces:get first`,
      );
    }
    const sourceUid = String(values.sourceUid || '').trim();
    const targetUid = String(values.targetUid || '').trim();
    const position = values.position === 'before' ? 'before' : 'after';
    if (!sourceUid || !targetUid) {
      throwBadRequest('flowSurfaces moveTab requires sourceUid and targetUid');
    }
    const sourceTarget = await this.locator.resolve({ uid: sourceUid }, options);
    const targetTarget = await this.locator.resolve({ uid: targetUid }, options);
    if (sourceTarget.kind !== 'tab' || targetTarget.kind !== 'tab') {
      throwBadRequest('flowSurfaces moveTab only supports tab uid values');
    }
    const sourceRoute = await this.locator.findRouteBySchemaUid(sourceUid, options.transaction);
    const targetRoute = await this.locator.findRouteBySchemaUid(targetUid, options.transaction);
    if (!sourceRoute || !targetRoute) {
      throw new Error('flowSurfaces moveTab route not found');
    }
    const sourceParentId = sourceRoute.get?.('parentId') ?? sourceRoute.parentId;
    const targetParentId = targetRoute.get?.('parentId') ?? targetRoute.parentId;
    if (!sourceParentId || !targetParentId || String(sourceParentId) !== String(targetParentId)) {
      throw new Error('flowSurfaces moveTab only supports sibling tabs under the same page route');
    }

    const desktopRoutesRepo = this.db.getRepository('desktopRoutes');
    const siblingRoutes = _.sortBy(
      _.castArray(
        await desktopRoutesRepo.find({
          filter: {
            parentId: sourceParentId,
          },
          transaction: options.transaction,
        }),
      ).map((route: any) => route?.toJSON?.() || route),
      (route: any) => route?.sort ?? 0,
    );
    const sourceIndex = siblingRoutes.findIndex((route: any) => String(route?.id) === String(sourceRoute.get('id')));
    const targetIndex = siblingRoutes.findIndex((route: any) => String(route?.id) === String(targetRoute.get('id')));
    if (sourceIndex === -1 || targetIndex === -1) {
      throw new Error('flowSurfaces moveTab cannot resolve sibling route order');
    }

    const [sourceItem] = siblingRoutes.splice(sourceIndex, 1);
    const nextTargetIndex = siblingRoutes.findIndex(
      (route: any) => String(route?.id) === String(targetRoute.get('id')),
    );
    siblingRoutes.splice(position === 'before' ? nextTargetIndex : nextTargetIndex + 1, 0, sourceItem);

    await Promise.all(
      siblingRoutes.map((route: any, index: number) =>
        desktopRoutesRepo.update({
          filterByTk: String(route.id),
          values: {
            sort: index + 1,
          },
          transaction: options.transaction,
        }),
      ),
    );

    return { sourceUid, targetUid, position };
  }

  async removeTab(values: Record<string, any>, options: { transaction?: any } = {}) {
    const uid = this.normalizeRootUidValue('removeTab', values);
    const resolved = await this.locator.resolve({ uid }, options);
    if (resolved.kind !== 'tab') {
      throwBadRequest(
        `flowSurfaces removeTab requires a tab uid; if you only have tabSchemaUid, call flowSurfaces:get first`,
      );
    }
    await this.routeSync.removeTabAnchorTree(resolved.uid, options.transaction);
    await this.db.getRepository('desktopRoutes').destroy({
      filter: {
        schemaUid: resolved.uid,
      },
      transaction: options.transaction,
    });
    return { uid: resolved.uid };
  }

  async addBlock(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('addBlock', values?.target, values);
    ensureNoRawDirectAddKeys('addBlock', values, ['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
    const inlineSettings = this.normalizeInlineSettings('addBlock', values.settings);
    const catalogItem = resolveSupportedBlockCatalogItem(
      {
        type: values.type,
        use: values.use,
      },
      {
        requireCreateSupported: true,
      },
    );
    const { parentUid, subKey, subType, popupSurface } = await this.surfaceContext.resolveBlockParent(
      target,
      options.transaction,
    );
    const tree = buildBlockTree({
      use: catalogItem.use,
      resourceInit: values.resourceInit,
      props: values.props,
      decoratorProps: values.decoratorProps,
      stepParams: values.stepParams,
    });
    this.contractGuard.validateNodeTreeAgainstContract(tree);
    const created = await this.repository.upsertModel(
      {
        parentId: parentUid,
        subKey,
        subType,
        ...tree,
      },
      { transaction: options.transaction },
    );
    const gridNode = getSingleNodeSubModel(tree.subModels?.grid);
    const itemNode = getSingleNodeSubModel(tree.subModels?.item);
    const itemGridNode = getSingleNodeSubModel(itemNode?.subModels?.grid);
    const columnNodes = getNodeSubModelList(tree.subModels?.columns);
    const blockGridUid = gridNode?.uid || itemGridNode?.uid;
    const popupGridUid = popupSurface?.gridUid;
    const actionsColumnUid =
      catalogItem.use === 'TableBlockModel'
        ? await this.ensureTableActionsColumn(created, options.transaction)
        : columnNodes.find((item) => item.use === 'TableActionsColumnModel')?.uid;
    const result = {
      uid: created,
      parentUid,
      subKey,
      ...(blockGridUid || popupGridUid ? { gridUid: blockGridUid || popupGridUid } : {}),
      ...(blockGridUid ? { blockGridUid } : {}),
      ...(itemNode?.uid ? { itemUid: itemNode.uid } : {}),
      ...(itemGridNode?.uid ? { itemGridUid: itemGridNode.uid } : {}),
      ...(actionsColumnUid ? { actionsColumnUid } : {}),
      ...(popupSurface
        ? {
            pageUid: popupSurface.pageUid,
            tabUid: popupSurface.tabUid,
            popupPageUid: popupSurface.pageUid,
            popupTabUid: popupSurface.tabUid,
            popupGridUid: popupSurface.gridUid,
          }
        : {}),
    };
    await this.applyInlineNodeSettings('addBlock', created, inlineSettings, options);
    return result;
  }

  async addField(values: Record<string, any>, options: { transaction?: any } = {}): Promise<FlowSurfaceAddFieldResult> {
    const target = this.normalizeWriteTarget('addField', values?.target, values);
    ensureNoRawDirectAddKeys('addField', values, [
      'wrapperProps',
      'fieldProps',
      'props',
      'decoratorProps',
      'stepParams',
      'flowRegistry',
    ]);
    const inlineSettings = this.normalizeInlineSettings('addField', values.settings);
    const resolvedTarget = await this.locator.resolve(target, options);
    const container = await this.surfaceContext.resolveFieldContainer(resolvedTarget.uid, options.transaction);
    const isFilterFormItem = container.wrapperUse === 'FilterFormItemModel';
    const requestedStandaloneType =
      typeof values.type === 'string' && values.type.trim().length ? values.type.trim() : undefined;
    const fieldCapability = resolveSupportedFieldCapability({
      containerUse: container.ownerUse,
      requestedWrapperUse: requestedStandaloneType ? undefined : container.wrapperUse,
      requestedRenderer: values.renderer,
      requestedType: requestedStandaloneType,
      allowUnresolvedFieldUse: true,
    });

    if (fieldCapability.standaloneUse) {
      if (isFilterFormItem) {
        throwBadRequest(`flowSurfaces addField type '${values.type}' is not allowed under filter-form`);
      }
      const node = buildStandaloneFieldNode({
        use: fieldCapability.standaloneUse as 'JSColumnModel' | 'JSItemModel',
        props: values.props || values.wrapperProps,
        decoratorProps: values.decoratorProps,
        stepParams: values.stepParams,
      });
      this.contractGuard.validateNodeTreeAgainstContract(node);
      await this.repository.upsertModel(
        {
          parentId: container.parentUid,
          subKey: container.subKey,
          subType: container.subType,
          ...node,
        },
        { transaction: options.transaction },
      );

      const result = {
        uid: node.uid,
        parentUid: container.parentUid,
        subKey: container.subKey,
        fieldUse: fieldCapability.standaloneUse,
        type: values.type,
      };
      await this.applyInlineStandaloneFieldSettings('addField', result.uid, inlineSettings, options);
      return result;
    }

    const requestedFilterTargetUid = values.defaultTargetUid || values.targetBlockUid || values.targetUid;
    const filterTargets = isFilterFormItem
      ? await this.surfaceContext.collectFilterFormTargets(container.ownerUid, options.transaction)
      : [];
    const selectedFilterTarget =
      isFilterFormItem && filterTargets.length
        ? await this.surfaceContext.resolveFilterFormTarget(
            container.ownerUid,
            requestedFilterTargetUid,
            options.transaction,
          )
        : null;
    if (isFilterFormItem && !filterTargets.length && requestedFilterTargetUid) {
      throwBadRequest(
        `flowSurfaces addField filter target '${requestedFilterTargetUid}' is not available on the current surface`,
      );
    }
    const resourceContext = isFilterFormItem
      ? selectedFilterTarget ||
        (await this.locator.resolveCollectionContext(container.ownerUid, options.transaction).catch(() => null))
      : await this.locator.resolveCollectionContext(container.ownerUid, options.transaction);
    if (!resourceContext?.resourceInit) {
      throwBadRequest('flowSurfaces addField cannot infer collection context');
    }

    const resolvedField = await this.resolveFieldDefinition({
      dataSourceKey: isFilterFormItem
        ? resourceContext.resourceInit.dataSourceKey
        : values.dataSourceKey || resourceContext.resourceInit.dataSourceKey,
      collectionName: isFilterFormItem
        ? resourceContext.resourceInit.collectionName
        : values.collectionName || resourceContext.resourceInit.collectionName,
      associationPathName: values.associationPathName,
      fieldPath: values.fieldPath,
    });

    const filterFormInit = isFilterFormItem
      ? {
          filterField: buildFilterFieldMeta(resolvedField.field),
          ...(selectedFilterTarget?.ownerUid ? { defaultTargetUid: selectedFilterTarget.ownerUid } : {}),
        }
      : undefined;
    const boundFieldCapability = resolveSupportedFieldCapability({
      containerUse: container.ownerUse,
      field: resolvedField.field,
      requestedFieldUse: values.fieldUse,
      requestedWrapperUse: container.wrapperUse,
      requestedRenderer: values.renderer,
    });
    const defaultFieldState = buildDefaultFieldState(
      container.ownerUse,
      boundFieldCapability.fieldUse,
      resolvedField.field,
    );
    const normalizedFieldBinding = this.normalizeDisplayFieldBinding({
      wrapperUse: boundFieldCapability.wrapperUse,
      dataSourceKey: resolvedField.dataSourceKey,
      collectionName: resolvedField.collectionName,
      fieldPath: resolvedField.fieldPath,
      associationPathName: resolvedField.associationPathName,
    });

    const tree = buildFieldTree({
      wrapperUse: boundFieldCapability.wrapperUse,
      fieldUse: boundFieldCapability.fieldUse,
      fieldPath: normalizedFieldBinding.fieldPath,
      dataSourceKey: normalizedFieldBinding.dataSourceKey,
      collectionName: normalizedFieldBinding.collectionName,
      associationPathName: normalizedFieldBinding.associationPathName,
      filterFormInit,
      wrapperProps: _.merge(
        {},
        defaultFieldState.wrapperProps || {},
        !_.isUndefined(normalizedFieldBinding.defaultTitleField)
          ? { titleField: normalizedFieldBinding.defaultTitleField }
          : {},
        values.wrapperProps || {},
      ),
      fieldProps: _.merge(
        {},
        defaultFieldState.fieldProps || {},
        !_.isUndefined(normalizedFieldBinding.defaultTitleField)
          ? { titleField: normalizedFieldBinding.defaultTitleField }
          : {},
        values.fieldProps || {},
      ),
    });
    this.contractGuard.validateNodeTreeAgainstContract(tree.model);

    await this.repository.upsertModel(
      {
        parentId: container.parentUid,
        subKey: container.subKey,
        subType: container.subType,
        ...tree.model,
      },
      { transaction: options.transaction },
    );

    if (isFilterFormItem && selectedFilterTarget?.ownerUid) {
      await this.persistFilterFormConnectConfig(
        {
          filterModelUid: tree.wrapperUid,
          filterFormOwnerUid: container.ownerUid,
          targetBlockUid: selectedFilterTarget.ownerUid,
          resourceInit: resourceContext.resourceInit,
          fieldPath: normalizedFieldBinding.fieldPath,
          associationPathName: normalizedFieldBinding.associationPathName,
        },
        options.transaction,
      );
    }

    const result = {
      uid: tree.wrapperUid,
      wrapperUid: tree.wrapperUid,
      fieldUid: tree.innerUid,
      innerFieldUid: tree.innerUid,
      parentUid: container.parentUid,
      subKey: container.subKey,
      fieldUse: boundFieldCapability.fieldUse,
      ...(boundFieldCapability.renderer ? { renderer: boundFieldCapability.renderer } : {}),
      ...(isFilterFormItem && selectedFilterTarget?.ownerUid
        ? { defaultTargetUid: selectedFilterTarget.ownerUid }
        : {}),
      associationPathName: normalizedFieldBinding.associationPathName,
      fieldPath: normalizedFieldBinding.fieldPath,
    };
    await this.applyInlineFieldSettings('addField', result, inlineSettings, options);
    return result;
  }

  async addAction(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('addAction', values?.target, values);
    ensureNoDirectActionScopeKey('addAction', values);
    ensureNoRawDirectAddKeys('addAction', values, ['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
    const inlineSettings = this.normalizeInlineSettings('addAction', values.settings);
    const inlinePopup = this.normalizeInlinePopup('addAction', values.popup);
    const container = await this.surfaceContext.resolveActionContainer(target, options.transaction);
    if (getActionContainerScope(container.ownerUse) === 'record') {
      throwBadRequest(
        `flowSurfaces addAction target '${container.ownerUse}' is a record action surface, use addRecordAction`,
      );
    }
    const actionCatalogItem = this.resolveAddActionCatalogItem({
      type: values.type,
      use: values.use,
      containerUse: container.ownerUse,
    });
    const resolvedScope = actionCatalogItem.scope;
    if (!resolvedScope) {
      throw new Error(`flowSurfaces addAction '${actionCatalogItem.use}' is missing a resolved action scope`);
    }
    if (inlinePopup && !POPUP_ACTION_USES.has(actionCatalogItem.use)) {
      throwBadRequest(`flowSurfaces addAction type '${actionCatalogItem.key}' does not support popup`);
    }
    assertRequestedActionScope({
      requestedScope: undefined,
      resolvedScope,
      containerUse: container.ownerUse,
      context: 'addAction',
    });
    const resourceContext = container.ownerUid
      ? await this.locator.resolveCollectionContext(container.ownerUid, options.transaction).catch(() => null)
      : null;
    const action = buildActionTree({
      use: actionCatalogItem.use,
      containerUse: container.ownerUse,
      resourceInit: values.resourceInit || resourceContext?.resourceInit,
      props: values.props,
      decoratorProps: values.decoratorProps,
      stepParams: values.stepParams,
      flowRegistry: values.flowRegistry,
    });
    this.contractGuard.validateNodeTreeAgainstContract(action);
    const created = await this.repository.upsertModel(
      {
        parentId: container.parentUid,
        subKey: container.subKey,
        subType: container.subType,
        ...action,
      },
      { transaction: options.transaction },
    );
    await this.applyInlineNodeSettings('addAction', created, inlineSettings, options);
    await this.applyInlineActionPopup('addAction', created, inlinePopup, options);
    return {
      uid: created,
      parentUid: container.parentUid,
      subKey: container.subKey,
      scope: actionCatalogItem.scope,
      ...(await this.collectComposeActionRefs(created, options.transaction)),
    };
  }

  async addRecordAction(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('addRecordAction', values?.target, values);
    ensureNoDirectActionScopeKey('addRecordAction', values);
    ensureNoRawDirectAddKeys('addRecordAction', values, ['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
    const inlineSettings = this.normalizeInlineSettings('addRecordAction', values.settings);
    const inlinePopup = this.normalizeInlinePopup('addRecordAction', values.popup);
    const container = await this.resolveRecordActionContainer(target, options.transaction);
    const actionCatalogItem = this.resolveAddRecordActionCatalogItem({
      type: values.type,
      use: values.use,
      containerUse: container.containerUse,
      ownerUse: container.ownerUse,
    });
    const resolvedScope = actionCatalogItem.scope;
    if (inlinePopup && !POPUP_ACTION_USES.has(actionCatalogItem.use)) {
      throwBadRequest(`flowSurfaces addRecordAction type '${actionCatalogItem.key}' does not support popup`);
    }
    assertRequestedActionScope({
      requestedScope: undefined,
      resolvedScope,
      containerUse: container.containerUse,
      context: 'addRecordAction',
    });
    const resourceContext = container.ownerUid
      ? await this.locator.resolveCollectionContext(container.ownerUid, options.transaction).catch(() => null)
      : null;
    const action = buildActionTree({
      use: actionCatalogItem.use,
      containerUse: container.containerUse,
      resourceInit: values.resourceInit || resourceContext?.resourceInit,
      props: values.props,
      decoratorProps: values.decoratorProps,
      stepParams: values.stepParams,
      flowRegistry: values.flowRegistry,
    });
    this.contractGuard.validateNodeTreeAgainstContract(action);
    const created = await this.repository.upsertModel(
      {
        parentId: container.parentUid,
        subKey: container.subKey,
        subType: container.subType,
        ...action,
      },
      { transaction: options.transaction },
    );
    await this.applyInlineNodeSettings('addRecordAction', created, inlineSettings, options);
    await this.applyInlineActionPopup('addRecordAction', created, inlinePopup, options);
    return {
      uid: created,
      parentUid: container.parentUid,
      subKey: container.subKey,
      scope: actionCatalogItem.scope,
      ...(await this.collectComposeActionRefs(created, options.transaction)),
    };
  }

  async addBlocks(values: Record<string, any>) {
    return this.runBatchCreate({
      actionName: 'addBlocks',
      values,
      itemField: 'blocks',
      resultField: 'blocks',
      invoke: (itemValues, options) => this.addBlock(itemValues, options),
    });
  }

  async addFields(values: Record<string, any>) {
    return this.runBatchCreate({
      actionName: 'addFields',
      values,
      itemField: 'fields',
      resultField: 'fields',
      invoke: (itemValues, options) => this.addField(itemValues, options),
    });
  }

  async addActions(values: Record<string, any>) {
    return this.runBatchCreate({
      actionName: 'addActions',
      values,
      itemField: 'actions',
      resultField: 'actions',
      invoke: (itemValues, options) => this.addAction(itemValues, options),
    });
  }

  async addRecordActions(values: Record<string, any>) {
    return this.runBatchCreate({
      actionName: 'addRecordActions',
      values,
      itemField: 'recordActions',
      resultField: 'recordActions',
      invoke: (itemValues, options) => this.addRecordAction(itemValues, options),
    });
  }

  private normalizeInlineSettings(actionName: string, settings: any) {
    if (_.isUndefined(settings)) {
      return undefined;
    }
    if (!_.isPlainObject(settings)) {
      throwBadRequest(`flowSurfaces ${actionName} settings must be an object`);
    }
    return settings;
  }

  private normalizeInlinePopup(actionName: string, popup: any) {
    if (_.isUndefined(popup)) {
      return undefined;
    }
    if (!_.isPlainObject(popup)) {
      throwBadRequest(`flowSurfaces ${actionName} popup must be an object`);
    }
    return popup;
  }

  private async applyInlineNodeSettings(
    actionName: string,
    targetUid: string | undefined,
    settings: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    if (!targetUid || !settings || !Object.keys(settings).length) {
      return;
    }
    try {
      await this.configure(
        {
          target: {
            uid: targetUid,
          },
          changes: settings,
        },
        options,
      );
    } catch (error: any) {
      rethrowInlineConfigurationError(error, `flowSurfaces ${actionName} settings invalid`);
    }
  }

  private async applyInlineFieldSettings(
    actionName: string,
    result: FlowSurfaceAddFieldResult,
    settings: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    if (!settings || !Object.keys(settings).length) {
      return;
    }
    if (!result.wrapperUid || !result.fieldUid) {
      await this.applyInlineStandaloneFieldSettings(actionName, result.uid, settings, options);
      return;
    }
    try {
      const wrapperNode = await this.repository.findModelById(result.wrapperUid, {
        transaction: options.transaction,
        includeAsyncNode: true,
      });
      const { wrapperChanges, fieldChanges } = splitComposeFieldChanges(settings, wrapperNode?.use);
      if (Object.keys(wrapperChanges).length) {
        await this.configure(
          {
            target: {
              uid: result.wrapperUid,
            },
            changes: wrapperChanges,
          },
          options,
        );
      }
      if (Object.keys(fieldChanges).length) {
        await this.configure(
          {
            target: {
              uid: result.fieldUid,
            },
            changes: fieldChanges,
          },
          options,
        );
      }
    } catch (error: any) {
      rethrowInlineConfigurationError(error, `flowSurfaces ${actionName} settings invalid`);
    }
  }

  private async applyInlineStandaloneFieldSettings(
    actionName: string,
    targetUid: string | undefined,
    settings: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    await this.applyInlineNodeSettings(actionName, targetUid, settings, options);
  }

  private async applyInlineActionPopup(
    actionName: string,
    actionUid: string,
    popup: Record<string, any> | undefined,
    options: { transaction?: any },
  ) {
    if (!popup) {
      return;
    }
    try {
      await this.compose(
        {
          target: {
            uid: actionUid,
          },
          mode: popup.mode || 'replace',
          blocks: popup.blocks || [],
          layout: popup.layout,
        },
        options,
      );
    } catch (error: any) {
      rethrowInlineConfigurationError(error, `flowSurfaces ${actionName} popup invalid`);
    }
  }

  async updateSettings(values: Record<string, any>, options: { transaction?: any } = {}) {
    const writeTarget = this.normalizeWriteTarget('updateSettings', values?.target, values);
    const target = await this.locator.resolve(writeTarget, options);
    const current = await this.loadResolvedNode(target, options.transaction);
    const contract = getNodeContract(current.use);
    const nextPayload: Record<string, any> = { uid: current.uid };

    (['props', 'decoratorProps', 'stepParams', 'flowRegistry'] as FlowSurfaceNodeDomain[]).forEach((domain) => {
      if (typeof values[domain] === 'undefined') {
        return;
      }
      if (!contract.editableDomains.includes(domain)) {
        throw new Error(`flowSurfaces updateSettings domain '${domain}' is not editable`);
      }
      const domainContract = contract.domains[domain];
      if (!domainContract) {
        throw new Error(`flowSurfaces updateSettings domain '${domain}' is not supported by '${current.use}'`);
      }
      nextPayload[domain] = this.contractGuard.mergeDomainValue(
        domain,
        current[domain],
        values[domain],
        domainContract,
        current.use,
      );
    });

    const effectiveNode = {
      ...current,
      props: nextPayload.props ?? current.props,
      decoratorProps: nextPayload.decoratorProps ?? current.decoratorProps,
      stepParams: nextPayload.stepParams ?? current.stepParams,
      flowRegistry: nextPayload.flowRegistry ?? current.flowRegistry,
    };
    const shouldValidateFlowRegistry =
      !_.isUndefined(nextPayload.flowRegistry) || !_.isUndefined(nextPayload.stepParams);

    if (
      shouldValidateFlowRegistry &&
      _.isPlainObject(effectiveNode.flowRegistry) &&
      Object.keys(effectiveNode.flowRegistry).length
    ) {
      this.contractGuard.validateFlowRegistry(effectiveNode, effectiveNode.flowRegistry);
    }

    if (Object.keys(nextPayload).length === 1) {
      return { uid: current.uid };
    }

    if (target.kind === 'tab' && target.tabRoute) {
      await this.routeSync.persistTabSettings(target, current, nextPayload, options.transaction);
      return {
        uid: current.uid,
        updated: Object.keys(_.omit(nextPayload, ['uid'])),
      };
    }

    if (target.kind === 'page' && target.pageRoute) {
      await this.routeSync.persistPageSettings(target, current, nextPayload, options.transaction);
      return {
        uid: current.uid,
        updated: Object.keys(_.omit(nextPayload, ['uid'])),
      };
    }

    await this.repository.patch(nextPayload, { transaction: options.transaction });
    if (!_.isUndefined(nextPayload.stepParams?.fieldSettings)) {
      await this.syncFieldBindingSettingsForNode(current, effectiveNode, options.transaction);
    } else if (current.use === 'FilterFormItemModel') {
      await this.syncFilterFormConnectConfigForNode(effectiveNode, options.transaction);
    }
    return {
      uid: current.uid,
      updated: Object.keys(_.omit(nextPayload, ['uid'])),
    };
  }

  async setEventFlows(values: Record<string, any>, options: { transaction?: any } = {}) {
    const writeTarget = this.normalizeWriteTarget('setEventFlows', values?.target, values);
    const target = await this.locator.resolve(writeTarget, options);
    const current = await this.loadResolvedNode(target, options.transaction);
    const contract = getNodeContract(current?.use);
    if (!contract.editableDomains.includes('flowRegistry')) {
      throw new Error(`flowSurfaces setEventFlows is not supported on '${current?.use || target.uid}'`);
    }
    const flows = values.flowRegistry || values.flows || {};
    this.contractGuard.validateFlowRegistry(current, flows);

    if (target.kind === 'tab' && target.tabRoute) {
      await this.routeSync.persistTabSettings(
        target,
        current,
        {
          uid: current.uid,
          flowRegistry: flows,
        },
        options.transaction,
      );
      return {
        uid: target.uid,
        flowRegistry: flows,
      };
    }

    await this.repository.patch(
      {
        uid: target.uid,
        flowRegistry: flows,
      },
      { transaction: options.transaction },
    );
    return {
      uid: target.uid,
      flowRegistry: flows,
    };
  }

  async setLayout(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeWriteTarget('setLayout', values?.target, values);
    const resolved = await this.locator.resolve(target, options);
    const grid = await this.surfaceContext.resolveGridNode(resolved.uid, options.transaction);
    const contract = getNodeContract(grid?.use);
    if (!contract.layoutCapabilities?.supported) {
      throw new Error(`flowSurfaces setLayout is not supported on '${grid?.use || resolved.uid}'`);
    }
    const rows = values.rows || {};
    const sizes = values.sizes || {};
    const rowOrder = values.rowOrder || Object.keys(rows);
    this.contractGuard.validateLayout(grid, { rows, sizes, rowOrder });
    await this.repository.patch(
      {
        uid: grid.uid,
        props: {
          ...(grid.props || {}),
          rows,
          sizes,
          rowOrder,
        },
      },
      { transaction: options.transaction },
    );
    return {
      uid: grid.uid,
      rows,
      sizes,
      rowOrder,
    };
  }

  async moveNode(values: Record<string, any>, options: { transaction?: any } = {}) {
    const sourceUid = String(values.sourceUid || '').trim();
    const targetUid = String(values.targetUid || '').trim();
    const position = values.position === 'before' ? 'before' : 'after';
    if (!sourceUid || !targetUid) {
      throw new Error('flowSurfaces moveNode requires sourceUid and targetUid');
    }
    const sourceModel = await this.repository.findModelById(sourceUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const targetModel = await this.repository.findModelById(targetUid, {
      transaction: options.transaction,
      includeAsyncNode: true,
    });
    const sourceParentUid = await this.locator.findParentUid(sourceUid, options.transaction);
    const targetParentUid = await this.locator.findParentUid(targetUid, options.transaction);
    if (!sourceModel?.subKey || !targetModel?.subKey || !sourceParentUid || !targetParentUid) {
      throw new Error('flowSurfaces moveNode requires sibling nodes with persisted parent relationship');
    }
    if (
      sourceParentUid !== targetParentUid ||
      sourceModel.subKey !== targetModel.subKey ||
      sourceModel.subType !== targetModel.subType
    ) {
      throw new Error('flowSurfaces moveNode only supports siblings under the same parent/subKey');
    }
    await this.repository.attach(
      sourceUid,
      {
        parentId: sourceParentUid,
        subKey: sourceModel.subKey,
        subType: sourceModel.subType,
        position: { type: position, target: targetUid },
      },
      { transaction: options.transaction },
    );
    return { sourceUid, targetUid, position };
  }

  async removeNode(values: Record<string, any>, options: { transaction?: any } = {}) {
    const target = this.normalizeRemoveNodeTarget(values);
    const resolved = await this.locator.resolve(target, options);
    const node =
      resolved.node ||
      (await this.repository.findModelById(resolved.uid, {
        transaction: options.transaction,
        includeAsyncNode: true,
      }));
    this.assertRemoveNodeResolvedTarget(resolved, node);
    if (node?.use === 'FilterFormItemModel') {
      await this.removeFilterFormConnectConfig(resolved.uid, options.transaction);
    }
    if (FILTER_TARGET_BLOCK_USES.has(node?.use || '')) {
      await this.removeFilterFormTargetBindings(resolved.uid, options.transaction);
    }
    await this.repository.remove(resolved.uid, { transaction: options.transaction });
    return { uid: resolved.uid };
  }

  async mutate(values: FlowSurfaceMutateValues, options: { transaction?: any } = {}) {
    this.assertMutateAtomicFlag(values.atomic);
    const ops = _.castArray(values.ops || []) as FlowSurfaceMutateOp[];
    const ctx: FlowSurfaceExecutorContext = {
      transaction: options.transaction,
      refs: new Map(),
      clientKeyToUid: {},
    };
    const results = await executeMutateOps(ops, ctx, async (op, resolvedValues, execCtx) => {
      return this.dispatchOp(op, resolvedValues, execCtx);
    });
    return {
      results,
      clientKeyToUid: ctx.clientKeyToUid,
    };
  }

  async apply(values: FlowSurfaceApplyValues, options: { transaction?: any } = {}) {
    this.assertApplyMode(values.mode);
    const target = this.normalizeWriteTarget('apply', values?.target, values);
    const spec = values.spec as FlowSurfaceApplySpec;
    const readback = await this.get(target, options);
    const compiled = compileApplySpec(target, readback.tree, spec);
    const mutateRes = await this.mutate({ ops: compiled.ops, atomic: true }, options);
    return {
      ...mutateRes,
      clientKeyToUid: {
        ...compiled.clientKeyToUid,
        ...(mutateRes?.clientKeyToUid || {}),
      },
    };
  }

  async transaction<T>(callback: (transaction: any) => Promise<T>) {
    const transaction = await this.db.sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async dispatchOp(
    op: FlowSurfaceMutateOp,
    resolvedValues: Record<string, any>,
    ctx: FlowSurfaceExecutorContext,
  ) {
    const options = { transaction: ctx.transaction };
    let result: any;
    switch (op.type) {
      case 'createPage':
        result = await this.createPage(resolvedValues, options);
        break;
      case 'destroyPage':
        result = await this.destroyPage(resolvedValues, options);
        break;
      case 'addTab':
        result = await this.addTab(resolvedValues, options);
        break;
      case 'updateTab':
        result = await this.updateTab(resolvedValues, options);
        break;
      case 'moveTab':
        result = await this.moveTab(resolvedValues, options);
        break;
      case 'removeTab':
        result = await this.removeTab(resolvedValues, options);
        break;
      case 'addBlock':
        result = await this.addBlock(resolvedValues, options);
        break;
      case 'addField':
        result = await this.addField(resolvedValues, options);
        break;
      case 'addAction':
        result = await this.addAction(resolvedValues, options);
        break;
      case 'addRecordAction':
        result = await this.addRecordAction(resolvedValues, options);
        break;
      case 'updateSettings':
        result = await this.updateSettings(resolvedValues, options);
        break;
      case 'setEventFlows':
        result = await this.setEventFlows(resolvedValues, options);
        break;
      case 'setLayout':
        result = await this.setLayout(resolvedValues, options);
        break;
      case 'moveNode':
        result = await this.moveNode(resolvedValues, options);
        break;
      case 'removeNode':
        result = await this.removeNode(resolvedValues, options);
        break;
      default:
        throw new Error(`flowSurfaces mutate op '${op.type}' is not supported`);
    }
    if (resolvedValues.clientKey) {
      ctx.clientKeyToUid[resolvedValues.clientKey] =
        result?.wrapperUid ||
        result?.uid ||
        result?.tabSchemaUid ||
        result?.fieldUid ||
        result?.gridUid ||
        result?.pageUid;
    }
    return result;
  }

  private assertApplyMode(mode?: FlowSurfaceApplyMode) {
    if (!_.isUndefined(mode) && mode !== 'replace') {
      throwBadRequest(`flowSurfaces apply only supports mode='replace' in v1`);
    }
  }

  private assertComposeMode(mode?: FlowSurfaceComposeMode) {
    if (_.isUndefined(mode)) {
      return 'append' as const;
    }
    if (mode !== 'append' && mode !== 'replace') {
      throwBadRequest(`flowSurfaces compose only supports mode='append' or mode='replace'`);
    }
    return mode;
  }

  private assertMutateAtomicFlag(atomic: FlowSurfaceAtomicFlag | undefined) {
    if (!_.isUndefined(atomic) && atomic !== true) {
      throwBadRequest(`flowSurfaces mutate only supports atomic=true in v1`);
    }
  }

  private normalizeWriteTarget(actionName: string, target: any, values?: Record<string, any>): FlowSurfaceWriteTarget {
    if (hasLegacyLocatorFields(values || {}, { allowRootUid: true })) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts target.uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    if (!_.isPlainObject(target)) {
      throwBadRequest(`flowSurfaces ${actionName} requires target.uid`);
    }
    const targetKeys = Object.keys(target);
    if (!targetKeys.length || targetKeys.some((key) => key !== 'uid') || hasLegacyLocatorFields(target)) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts target.uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    const uid = String(target.uid || '').trim();
    if (!uid) {
      throwBadRequest(`flowSurfaces ${actionName} requires target.uid`);
    }
    return { uid };
  }

  private normalizeRootUidValue(actionName: string, values: Record<string, any>): string {
    if (_.isPlainObject(values?.target)) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts root uid; do not wrap it in target. If you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    if (hasLegacyLocatorFields(values || {})) {
      throwBadRequest(
        `flowSurfaces ${actionName} only accepts root uid; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    const uid = String(values?.uid || '').trim();
    if (!uid) {
      throwBadRequest(`flowSurfaces ${actionName} requires uid`);
    }
    return uid;
  }

  private async assertPageRootUidTarget(
    actionName: 'addTab' | 'destroyPage',
    resolved: FlowSurfaceResolvedTarget,
    transaction?: any,
  ) {
    const pageSchemaUid = resolved.pageRoute?.get?.('schemaUid') || resolved.pageRoute?.schemaUid;
    const node =
      resolved.node ||
      (await this.repository.findModelById(resolved.uid, {
        transaction,
        includeAsyncNode: true,
      }));
    if (resolved.kind !== 'page' || !pageSchemaUid || !['RootPageModel', 'ChildPageModel'].includes(node?.use || '')) {
      throwBadRequest(
        `flowSurfaces ${actionName} requires a page uid; if you only have pageSchemaUid or routeId, call flowSurfaces:get first`,
      );
    }
    return {
      pageSchemaUid,
      node,
    };
  }

  private normalizeRemoveNodeTarget(values: Record<string, any>): FlowSurfaceWriteTarget {
    if (!_.isPlainObject(values?.target)) {
      throwBadRequest(
        `flowSurfaces removeNode only accepts target.uid for regular nodes; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first. Page use destroyPage and tab use removeTab`,
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(values, 'uid') ||
      Object.prototype.hasOwnProperty.call(values, 'pageSchemaUid') ||
      Object.prototype.hasOwnProperty.call(values, 'tabSchemaUid') ||
      Object.prototype.hasOwnProperty.call(values, 'routeId')
    ) {
      throwBadRequest(
        `flowSurfaces removeNode only accepts target.uid for regular nodes; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first. Page use destroyPage and tab use removeTab`,
      );
    }
    const target = values.target || {};
    if (
      Object.prototype.hasOwnProperty.call(target, 'pageSchemaUid') ||
      Object.prototype.hasOwnProperty.call(target, 'tabSchemaUid') ||
      Object.prototype.hasOwnProperty.call(target, 'routeId')
    ) {
      throwBadRequest(
        `flowSurfaces removeNode only accepts target.uid for regular nodes; if you only have pageSchemaUid, tabSchemaUid or routeId, call flowSurfaces:get first. Page use destroyPage and tab use removeTab`,
      );
    }
    const uid = String(target.uid || '').trim();
    if (!uid) {
      throwBadRequest(`flowSurfaces removeNode requires target.uid`);
    }
    return { uid };
  }

  private assertRemoveNodeResolvedTarget(resolved: FlowSurfaceResolvedTarget, node?: any) {
    if (resolved.kind === 'page' || ['RootPageModel', 'ChildPageModel'].includes(node?.use || '')) {
      throwBadRequest(`flowSurfaces removeNode does not support page surfaces; use destroyPage`);
    }
    if (resolved.kind === 'tab' || ['RootPageTabModel', 'ChildPageTabModel'].includes(node?.use || '')) {
      throwBadRequest(`flowSurfaces removeNode does not support tab surfaces; use removeTab`);
    }
    if (node?.use === 'RouteModel' || (resolved.route && !resolved.node)) {
      throwBadRequest(
        `flowSurfaces removeNode only supports block / field / action / popup subtree nodes; page use destroyPage and tab use removeTab`,
      );
    }
  }

  private normalizeGetTarget(input: Record<string, any>): FlowSurfaceReadLocator {
    if (!_.isPlainObject(input)) {
      throw new FlowSurfaceBadRequestError(`flowSurfaces:get requires root locator fields`);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'target')) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces:get only accepts root locator fields; do not wrap them in 'target'`,
      );
    }
    if (hasNonEmptyGetWrapperValue(input.values)) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces:get only accepts root locator fields; do not wrap them in 'values'`,
      );
    }
    const target = buildDefinedPayload({
      uid: input.uid,
      pageSchemaUid: input.pageSchemaUid,
      tabSchemaUid: input.tabSchemaUid,
      routeId: _.isNil(input.routeId) ? undefined : String(input.routeId),
    });
    if (!Object.keys(target).length) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces:get requires one of uid, pageSchemaUid, tabSchemaUid or routeId`,
      );
    }
    return target;
  }

  private buildReadTargetSummary(
    target: FlowSurfaceReadLocator,
    resolved: { uid: string; kind: string },
  ): FlowSurfaceReadTarget {
    return {
      locator: buildDefinedPayload({
        uid: target.uid,
        pageSchemaUid: target.pageSchemaUid,
        tabSchemaUid: target.tabSchemaUid,
        routeId: target.routeId,
      }),
      uid: resolved.uid,
      kind: resolved.kind as FlowSurfaceReadTarget['kind'],
    };
  }

  private tryResolveActionCatalogItem(
    input: {
      type?: string;
      use?: string;
      containerUse?: string;
    },
    options: {
      requireCreateSupported?: boolean;
    } = {},
  ) {
    try {
      return resolveSupportedActionCatalogItem(input, options);
    } catch (error) {
      return null;
    }
  }

  private resolveAddActionCatalogItem(input: { type?: string; use?: string; containerUse: string }) {
    const item = this.tryResolveActionCatalogItem(input, {
      requireCreateSupported: true,
    });
    if (item) {
      if (item.scope === 'record') {
        throwBadRequest(
          `flowSurfaces addAction does not support record action '${item.key}' under '${input.containerUse}', use addRecordAction`,
        );
      }
      return item;
    }

    const recordContainerUse = getCatalogRecordActionContainerUse(input.containerUse);
    const recordItem = recordContainerUse
      ? this.tryResolveActionCatalogItem(
          {
            ...input,
            containerUse: recordContainerUse,
          },
          {
            requireCreateSupported: true,
          },
        )
      : null;
    if (recordItem?.scope === 'record') {
      throwBadRequest(
        `flowSurfaces addAction does not support record action '${recordItem.key}' under '${input.containerUse}', use addRecordAction`,
      );
    }

    return resolveSupportedActionCatalogItem(input, {
      requireCreateSupported: true,
    });
  }

  private resolveAddRecordActionCatalogItem(input: {
    type?: string;
    use?: string;
    containerUse: string;
    ownerUse: string;
  }) {
    const item = this.tryResolveActionCatalogItem(
      {
        type: input.type,
        use: input.use,
        containerUse: input.containerUse,
      },
      {
        requireCreateSupported: true,
      },
    );
    if (item) {
      if (item.scope !== 'record') {
        throwBadRequest(
          `flowSurfaces addRecordAction only supports record actions; '${item.key}' should use addAction`,
        );
      }
      return item;
    }

    const ownerItem = this.tryResolveActionCatalogItem(
      {
        type: input.type,
        use: input.use,
        containerUse: input.ownerUse,
      },
      {
        requireCreateSupported: true,
      },
    );
    if (ownerItem && ownerItem.scope !== 'record') {
      throwBadRequest(
        `flowSurfaces addRecordAction only supports record actions; '${ownerItem.key}' should use addAction`,
      );
    }

    return resolveSupportedActionCatalogItem(
      {
        type: input.type,
        use: input.use,
        containerUse: input.containerUse,
      },
      {
        requireCreateSupported: true,
      },
    );
  }

  private resolveComposeBlockActionCatalogItem(blockUse: string, actionType: string) {
    const item = this.tryResolveActionCatalogItem(
      {
        type: actionType,
        containerUse: blockUse,
      },
      {
        requireCreateSupported: true,
      },
    );
    if (item) {
      if (item.scope === 'record') {
        throwBadRequest(
          `flowSurfaces compose action '${actionType}' on '${blockUse}' must be placed under recordActions`,
        );
      }
      return item;
    }

    const recordContainerUse = getCatalogRecordActionContainerUse(blockUse);
    const recordItem = recordContainerUse
      ? this.tryResolveActionCatalogItem(
          {
            type: actionType,
            containerUse: recordContainerUse,
          },
          {
            requireCreateSupported: true,
          },
        )
      : null;
    if (recordItem?.scope === 'record') {
      throwBadRequest(
        `flowSurfaces compose action '${actionType}' on '${blockUse}' must be placed under recordActions`,
      );
    }

    return resolveSupportedActionCatalogItem(
      {
        type: actionType,
        containerUse: blockUse,
      },
      {
        requireCreateSupported: true,
      },
    );
  }

  private resolveComposeRecordActionCatalogItem(blockUse: string, actionType: string) {
    const recordContainerUse = getCatalogRecordActionContainerUse(blockUse);
    if (!recordContainerUse) {
      throwBadRequest(
        `flowSurfaces compose recordActions only support 'table', 'details', 'list' or 'gridCard' blocks`,
      );
    }

    const item = this.tryResolveActionCatalogItem(
      {
        type: actionType,
        containerUse: recordContainerUse,
      },
      {
        requireCreateSupported: true,
      },
    );
    if (item) {
      if (item.scope !== 'record') {
        throwBadRequest(
          `flowSurfaces compose record action '${actionType}' on '${blockUse}' must be placed under actions`,
        );
      }
      return item;
    }

    const blockItem = this.tryResolveActionCatalogItem(
      {
        type: actionType,
        containerUse: blockUse,
      },
      {
        requireCreateSupported: true,
      },
    );
    if (blockItem && blockItem.scope !== 'record') {
      throwBadRequest(
        `flowSurfaces compose record action '${actionType}' on '${blockUse}' must be placed under actions`,
      );
    }

    return resolveSupportedActionCatalogItem(
      {
        type: actionType,
        containerUse: recordContainerUse,
      },
      {
        requireCreateSupported: true,
      },
    );
  }

  private async resolveRecordActionContainer(target: FlowSurfaceWriteTarget, transaction?: any) {
    const resolved = await this.locator.resolve(target, { transaction });
    const node =
      resolved.node || (await this.repository.findModelById(resolved.uid, { transaction, includeAsyncNode: true }));
    const use = node?.use;

    if (use === 'TableBlockModel') {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        containerUse: 'TableActionsColumnModel',
        parentUid: await this.ensureTableActionsColumn(node.uid, transaction),
        subKey: 'actions',
        subType: 'array',
      };
    }
    if (use === 'DetailsBlockModel') {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        containerUse: use,
        parentUid: node.uid,
        subKey: 'actions',
        subType: 'array',
      };
    }
    if (use === 'ListBlockModel' || use === 'GridCardBlockModel') {
      const itemUid = node.subModels?.item?.uid;
      if (!itemUid) {
        throw new Error(`flowSurfaces addRecordAction target '${use}' is missing its item subtree`);
      }
      return {
        ownerUid: node.uid,
        ownerUse: use,
        containerUse: use === 'ListBlockModel' ? 'ListItemModel' : 'GridCardItemModel',
        parentUid: itemUid,
        subKey: 'actions',
        subType: 'array',
      };
    }
    if (use === 'TableActionsColumnModel') {
      throwBadRequest(
        `flowSurfaces addRecordAction target '${use}' is an internal record action container; pass the owning table block uid instead`,
      );
    }
    if (use === 'ListItemModel' || use === 'GridCardItemModel') {
      throwBadRequest(
        `flowSurfaces addRecordAction target '${use}' is an internal record action container; pass the owning ${
          use === 'ListItemModel' ? 'list' : 'gridCard'
        } block uid instead`,
      );
    }

    throwBadRequest(
      `flowSurfaces addRecordAction target '${use || resolved.uid}' is not a supported record action surface`,
    );
  }

  private async runBatchCreate(options: {
    actionName: string;
    values: Record<string, any>;
    itemField: string;
    resultField: string;
    invoke: (itemValues: Record<string, any>, options: { transaction?: any }) => Promise<any>;
  }) {
    const target = this.normalizeWriteTarget(options.actionName, options.values?.target, options.values);
    const items = options.values?.[options.itemField];
    if (!Array.isArray(items)) {
      throwBadRequest(`flowSurfaces ${options.actionName} requires ${options.itemField}[]`);
    }

    const results: Array<Record<string, any>> = [];
    let successCount = 0;
    let errorCount = 0;

    for (const [index, rawItem] of items.entries()) {
      const result: Record<string, any> = { index, ok: false };
      if (_.isPlainObject(rawItem) && typeof rawItem.key === 'string' && rawItem.key.trim()) {
        result.key = rawItem.key.trim();
      }
      try {
        if (!_.isPlainObject(rawItem)) {
          throw new Error(`flowSurfaces ${options.actionName} item #${index + 1} must be an object`);
        }
        if (Object.prototype.hasOwnProperty.call(rawItem, 'target')) {
          throw new Error(
            `flowSurfaces ${options.actionName} item #${
              index + 1
            } must not include target; use the shared top-level target`,
          );
        }
        const itemValues = {
          target,
          ..._.omit(rawItem, ['key']),
        };
        result.result = await this.transaction((transaction) => options.invoke(itemValues, { transaction }));
        result.ok = true;
        successCount += 1;
      } catch (error: any) {
        result.error = {
          message: error?.message || String(error),
        };
        errorCount += 1;
      }
      results.push(result);
    }

    return {
      [options.resultField]: results,
      successCount,
      errorCount,
    };
  }

  private normalizeComposeBlock(input: any, index: number) {
    if (!_.isPlainObject(input)) {
      throwBadRequest(`flowSurfaces compose block #${index + 1} must be an object`);
    }
    if (input.use || input.fieldUse || input.stepParams || input.props || input.decoratorProps || input.flowRegistry) {
      throwBadRequest('flowSurfaces compose only accepts public semantic block fields');
    }
    const key = String(input.key || '').trim();
    const type = String(input.type || '').trim();
    if (!key || !type) {
      throwBadRequest(`flowSurfaces compose block #${index + 1} requires key and type`);
    }
    const blockCatalogItem = resolveSupportedBlockCatalogItem({ type }, { requireCreateSupported: true });
    const actions = _.castArray(input.actions || []).map((action, actionIndex) =>
      normalizeComposeActionSpec(action, actionIndex),
    );
    const recordActions = _.castArray(input.recordActions || []).map((action, actionIndex) =>
      normalizeComposeActionSpec(action, actionIndex),
    );
    this.validateComposeActionGroups(blockCatalogItem.use, actions, recordActions);
    return {
      key,
      type,
      resource: normalizeSimpleResourceInit(input.resource),
      settings: _.isPlainObject(input.settings) ? input.settings : {},
      fields: _.castArray(input.fields || []).map((field, fieldIndex) => normalizeComposeFieldSpec(field, fieldIndex)),
      actions,
      recordActions,
    };
  }

  private resolveComposeTargetRef(targetRef: string, keyRefs: Record<string, any>, kind: 'field' | 'layout') {
    const ref = String(targetRef || '').trim();
    if (!ref) {
      throwBadRequest(`flowSurfaces compose ${kind} target reference cannot be empty`);
    }
    if (!keyRefs[ref]?.uid) {
      throwBadRequest(`flowSurfaces compose ${kind} target '${ref}' was not created in the current compose call`);
    }
    return keyRefs[ref].uid;
  }

  private resolveComposeActionContainerUid(blockSpec: any, blockResult: any) {
    return blockResult.uid;
  }

  private resolveComposeFieldContainerUid(blockSpec: any, blockResult: any) {
    if (LIST_LIKE_COMPOSE_BLOCK_TYPES.has(blockSpec.type)) {
      return blockResult.itemUid || blockResult.uid;
    }
    return blockResult.uid;
  }

  private async resolveComposeRecordActionContainerUid(blockSpec: any, blockResult: any, transaction?: any) {
    if (blockSpec.type === 'table') {
      return this.ensureTableActionsColumn(blockResult.uid, transaction);
    }
    if (blockSpec.type === 'details') {
      return blockResult.uid;
    }
    if (!LIST_LIKE_COMPOSE_BLOCK_TYPES.has(blockSpec.type)) {
      throwBadRequest(
        `flowSurfaces compose recordActions only support 'table', 'details', 'list' or 'gridCard' blocks`,
      );
    }
    if (!blockResult.itemUid) {
      throw new Error(`flowSurfaces compose block '${blockSpec.key}' is missing its item subtree`);
    }
    return blockResult.itemUid;
  }

  private validateComposeActionGroups(blockUse: string, actions: any[], recordActions: any[]) {
    const recordContainerUse = getCatalogRecordActionContainerUse(blockUse);

    if (recordActions.length && !recordContainerUse) {
      throwBadRequest(
        `flowSurfaces compose recordActions only support 'table', 'details', 'list' or 'gridCard' blocks`,
      );
    }

    actions.forEach((action) => {
      this.resolveComposeBlockActionCatalogItem(blockUse, action.type);
    });

    if (recordContainerUse) {
      recordActions.forEach((action) => {
        this.resolveComposeRecordActionCatalogItem(blockUse, action.type);
      });
    }
  }

  private buildComposeLayoutPayload(input: {
    layout?: Record<string, any>;
    createdByKey: Record<string, any>;
    finalItems: any[];
  }) {
    const declaredRows = _.castArray(input.layout?.rows || []);
    const finalUids = input.finalItems.map((item) => item.uid);
    const mentioned = new Set<string>();
    const rows: Record<string, string[][]> = {};
    const sizes: Record<string, number[]> = {};
    const rowOrder: string[] = [];
    let rowIndex = 0;

    const pushRow = (cells: Array<{ uid: string; span?: number }>) => {
      if (!cells.length) {
        return;
      }
      rowIndex += 1;
      const rowKey = `row${rowIndex}`;
      rows[rowKey] = cells.map((cell) => [cell.uid]);
      sizes[rowKey] = normalizeRowSpans(cells.map((cell) => cell.span));
      rowOrder.push(rowKey);
      cells.forEach((cell) => mentioned.add(cell.uid));
    };

    declaredRows.forEach((row: any, index: number) => {
      if (!Array.isArray(row) || !row.length) {
        throwBadRequest(`flowSurfaces compose layout row #${index + 1} must be a non-empty array`);
      }
      const cells = row.map((cell: any) => {
        if (_.isPlainObject(cell)) {
          const refKey = String(cell.key || '').trim();
          if (!refKey) {
            throwBadRequest(`flowSurfaces compose layout row #${index + 1} contains an empty key`);
          }
          const uid = input.createdByKey[refKey]?.uid || (finalUids.includes(refKey) ? refKey : null);
          if (!uid) {
            throwBadRequest(
              `flowSurfaces compose layout key '${refKey}' does not match a created block key or existing uid`,
            );
          }
          return {
            uid,
            span: _.isNumber(cell.span) ? cell.span : undefined,
          };
        }
        const refKey = String(cell || '').trim();
        const uid = input.createdByKey[refKey]?.uid || (finalUids.includes(refKey) ? refKey : null);
        if (!uid) {
          throwBadRequest(
            `flowSurfaces compose layout key '${refKey}' does not match a created block key or existing uid`,
          );
        }
        return { uid };
      });
      pushRow(cells);
    });

    finalUids
      .filter((uid) => !mentioned.has(uid))
      .forEach((uid) => {
        pushRow([{ uid, span: 24 }]);
      });

    return {
      rows,
      sizes,
      rowOrder,
    };
  }

  private async collectComposeActionRefs(actionUid: string, transaction?: any) {
    const actionNode = await this.repository.findModelById(actionUid, {
      transaction,
      includeAsyncNode: true,
    });
    const popupPage = actionNode?.subModels?.page;
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    const popupGrid = popupTab?.subModels?.grid;
    const assignForm = actionNode?.subModels?.assignForm;
    const assignFormGrid = assignForm?.subModels?.grid;
    return _.pickBy(
      {
        assignFormUid: assignForm?.uid,
        assignFormGridUid: assignFormGrid?.uid,
        popupPageUid: popupPage?.uid,
        popupTabUid: popupTab?.uid,
        popupGridUid: popupGrid?.uid,
      },
      (value) => !!value,
    );
  }

  private async removeNodeTreeWithBindings(uid: string, transaction?: any) {
    const node = await this.repository.findModelById(uid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!node?.uid) {
      return;
    }
    await this.cleanupNodeBindings(node, transaction);
    await this.repository.remove(uid, { transaction });
  }

  private async cleanupNodeBindings(node: any, transaction?: any) {
    if (!node?.uid) {
      return;
    }
    for (const child of Object.values(node.subModels || {})) {
      for (const item of _.castArray(child as any)) {
        await this.cleanupNodeBindings(item, transaction);
      }
    }
    if (node.use === 'FilterFormItemModel') {
      await this.removeFilterFormConnectConfig(node.uid, transaction);
    }
    if (FILTER_TARGET_BLOCK_USES.has(node.use || '')) {
      await this.removeFilterFormTargetBindings(node.uid, transaction);
    }
  }

  private async configurePage(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForResolvedNode({
      kind: 'page',
    });
    assertSupportedSimpleChanges('page', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          enableTabs: changes.enableTabs,
          icon: changes.icon,
          enableHeader: changes.enableHeader,
        }),
        stepParams: hasDefinedValue(changes, [
          'title',
          'documentTitle',
          'displayTitle',
          'enableTabs',
          'icon',
          'enableHeader',
        ])
          ? {
              pageSettings: {
                general: buildDefinedPayload({
                  title: changes.title,
                  documentTitle: changes.documentTitle,
                  displayTitle: changes.displayTitle,
                  enableTabs: changes.enableTabs,
                  icon: changes.icon,
                  enableHeader: changes.enableHeader,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureTab(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForResolvedNode({
      kind: 'tab',
    });
    assertSupportedSimpleChanges('tab', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          icon: changes.icon,
        }),
        stepParams: hasDefinedValue(changes, ['title', 'icon', 'documentTitle'])
          ? {
              pageTabSettings: {
                tab: buildDefinedPayload({
                  title: changes.title,
                  icon: changes.icon,
                  documentTitle: changes.documentTitle,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureTableBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('TableBlockModel');
    assertSupportedSimpleChanges('table', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
        }),
        decoratorProps: buildDefinedPayload({
          height: changes.height,
          heightMode: changes.heightMode,
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, [
            'pageSize',
            'density',
            'showRowNumbers',
            'sorting',
            'dataScope',
            'quickEdit',
            'treeTable',
            'defaultExpandAllRows',
            'dragSort',
            'dragSortBy',
          ])
            ? {
                tableSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'pageSize') ? { pageSize: { pageSize: changes.pageSize } } : {}),
                  ...(hasOwnDefined(changes, 'density') ? { tableDensity: { size: changes.density } } : {}),
                  ...(hasOwnDefined(changes, 'quickEdit') ? { quickEdit: { editable: changes.quickEdit } } : {}),
                  ...(hasOwnDefined(changes, 'showRowNumbers')
                    ? { showRowNumbers: { showIndex: changes.showRowNumbers } }
                    : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'treeTable') ? { treeTable: { treeTable: changes.treeTable } } : {}),
                  ...(hasOwnDefined(changes, 'defaultExpandAllRows')
                    ? { defaultExpandAllRows: { defaultExpandAllRows: changes.defaultExpandAllRows } }
                    : {}),
                  ...(hasOwnDefined(changes, 'dragSort') ? { dragSort: { dragSort: changes.dragSort } } : {}),
                  ...(hasOwnDefined(changes, 'dragSortBy') ? { dragSortBy: { dragSortBy: changes.dragSortBy } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureFormBlock(
    target: FlowSurfaceWriteTarget,
    use: string,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse(use);
    assertSupportedSimpleChanges('form', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    const nextStepParams: Record<string, any> = {};
    if (changes.resource) {
      nextStepParams.resourceSettings = {
        init: normalizeSimpleResourceInit(changes.resource),
      };
    }
    if (hasDefinedValue(changes, ['layout', 'labelAlign', 'labelWidth', 'labelWrap', 'assignRules', 'colon'])) {
      nextStepParams.formModelSettings = buildDefinedPayload({
        ...(hasOwnDefined(changes, 'layout') ||
        hasOwnDefined(changes, 'labelAlign') ||
        hasOwnDefined(changes, 'labelWidth') ||
        hasOwnDefined(changes, 'labelWrap') ||
        hasOwnDefined(changes, 'colon')
          ? {
              layout: buildDefinedPayload({
                layout: layoutValue,
                labelAlign: changes.labelAlign,
                labelWidth: changes.labelWidth,
                labelWrap: changes.labelWrap,
                colon: changes.colon,
              }),
            }
          : {}),
        ...(hasOwnDefined(changes, 'assignRules') ? { assignRules: { value: changes.assignRules } } : {}),
      });
    }
    if (use === 'EditFormModel' && hasOwnDefined(changes, 'dataScope')) {
      nextStepParams.formSettings = {
        dataScope: {
          filter: changes.dataScope,
        },
      };
    }

    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        decoratorProps: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        stepParams: Object.keys(nextStepParams).length ? nextStepParams : undefined,
      },
      options,
    );
  }

  private async configureDetailsBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('DetailsBlockModel');
    assertSupportedSimpleChanges('details', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        decoratorProps: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, [
            'layout',
            'labelAlign',
            'labelWidth',
            'labelWrap',
            'colon',
            'sorting',
            'dataScope',
            'linkageRules',
          ])
            ? {
                detailsSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'layout') ||
                  hasOwnDefined(changes, 'labelAlign') ||
                  hasOwnDefined(changes, 'labelWidth') ||
                  hasOwnDefined(changes, 'labelWrap') ||
                  hasOwnDefined(changes, 'colon')
                    ? {
                        layout: buildDefinedPayload({
                          layout: layoutValue,
                          labelAlign: changes.labelAlign,
                          labelWidth: changes.labelWidth,
                          labelWrap: changes.labelWrap,
                          colon: changes.colon,
                        }),
                      }
                    : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'linkageRules') ? { linkageRules: { value: changes.linkageRules } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureFilterFormBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('FilterFormBlockModel');
    assertSupportedSimpleChanges('filterForm', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        decoratorProps: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'labelWidth') ? { labelWidth: changes.labelWidth } : {}),
          ...(hasOwnDefined(changes, 'labelWrap') ? { labelWrap: changes.labelWrap } : {}),
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['layout', 'labelAlign', 'labelWidth', 'labelWrap', 'defaultValues'])
            ? {
                formFilterBlockModelSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'layout') ||
                  hasOwnDefined(changes, 'labelAlign') ||
                  hasOwnDefined(changes, 'labelWidth') ||
                  hasOwnDefined(changes, 'labelWrap')
                    ? {
                        layout: buildDefinedPayload({
                          layout: layoutValue,
                          labelAlign: changes.labelAlign,
                          labelWidth: changes.labelWidth,
                          labelWrap: changes.labelWrap,
                        }),
                      }
                    : {}),
                  ...(hasOwnDefined(changes, 'defaultValues')
                    ? { defaultValues: { value: changes.defaultValues } }
                    : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureListBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('ListBlockModel');
    assertSupportedSimpleChanges('list', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
        }),
        decoratorProps: buildDefinedPayload({
          height: changes.height,
          heightMode: changes.heightMode,
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['pageSize', 'dataScope', 'sorting', 'layout'])
            ? {
                listSettings: buildDefinedPayload({
                  ...(hasOwnDefined(changes, 'pageSize') ? { pageSize: { pageSize: changes.pageSize } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'layout') ? { layout: { layout: layoutValue } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureGridCardBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('GridCardBlockModel');
    assertSupportedSimpleChanges('gridCard', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    const columns = normalizeGridCardColumns(changes.columns);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
        }),
        decoratorProps: buildDefinedPayload({
          height: changes.height,
          heightMode: changes.heightMode,
        }),
        stepParams: {
          ...(changes.resource
            ? {
                resourceSettings: {
                  init: normalizeSimpleResourceInit(changes.resource),
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['columns', 'rowCount', 'dataScope', 'sorting', 'layout'])
            ? {
                GridCardSettings: buildDefinedPayload({
                  ...(columns ? { columnCount: { columnCount: columns } } : {}),
                  ...(hasOwnDefined(changes, 'rowCount') ? { rowCount: { rowCount: changes.rowCount } } : {}),
                  ...(hasOwnDefined(changes, 'dataScope') ? { dataScope: { filter: changes.dataScope } } : {}),
                  ...(hasOwnDefined(changes, 'sorting') ? { defaultSorting: { sort: changes.sorting } } : {}),
                  ...(hasOwnDefined(changes, 'layout') ? { layout: { layout: layoutValue } } : {}),
                }),
              }
            : {}),
        },
      },
      options,
    );
  }

  private async configureMarkdownBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('MarkdownBlockModel');
    assertSupportedSimpleChanges('markdown', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          content: changes.content,
          value: changes.content,
        }),
        stepParams: hasOwnDefined(changes, 'content')
          ? {
              markdownBlockSettings: {
                editMarkdown: {
                  content: changes.content,
                },
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureIframeBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('IframeBlockModel');
    assertSupportedSimpleChanges('iframe', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          height: changes.height,
          heightMode: changes.heightMode,
          mode: changes.mode,
          url: changes.url,
          html: changes.html,
          params: changes.params,
          allow: changes.allow,
          htmlId: changes.htmlId,
        }),
        stepParams: hasDefinedValue(changes, ['height', 'mode', 'url', 'html', 'params', 'allow', 'htmlId'])
          ? {
              iframeBlockSettings: {
                editIframe: buildDefinedPayload({
                  height: changes.height,
                  mode: changes.mode,
                  url: changes.url,
                  html: changes.html,
                  params: changes.params,
                  allow: changes.allow,
                  htmlId: changes.htmlId,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureChartBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('ChartBlockModel');
    assertSupportedSimpleChanges('chart', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          height: changes.height,
          heightMode: changes.heightMode,
        }),
        stepParams: hasOwnDefined(changes, 'configure')
          ? {
              chartSettings: {
                configure: changes.configure,
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureActionPanelBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('ActionPanelBlockModel');
    assertSupportedSimpleChanges('actionPanel', changes, allowedKeys);
    const layoutValue = normalizeSimpleLayoutValue(changes.layout);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          displayTitle: changes.displayTitle,
          layout: layoutValue,
          ellipsis: changes.ellipsis,
        }),
        stepParams: hasDefinedValue(changes, ['layout', 'ellipsis'])
          ? {
              actionPanelBlockSetting: buildDefinedPayload({
                ...(hasOwnDefined(changes, 'layout') ? { layout: { layout: layoutValue } } : {}),
                ...(hasOwnDefined(changes, 'ellipsis') ? { ellipsis: { ellipsis: changes.ellipsis } } : {}),
              }),
            }
          : undefined,
      },
      options,
    );
  }

  private async configureJSBlock(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('JSBlockModel');
    assertSupportedSimpleChanges('jsBlock', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        decoratorProps: buildDefinedPayload({
          title: changes.title,
          description: changes.description,
          className: changes.className,
        }),
        stepParams: hasDefinedValue(changes, ['code', 'version'])
          ? {
              jsSettings: {
                runJs: buildDefinedPayload({
                  code: changes.code,
                  version: changes.version,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureActionColumn(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('TableActionsColumnModel');
    assertSupportedSimpleChanges('action column', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          tooltip: changes.tooltip,
          width: changes.width,
          fixed: changes.fixed,
        }),
        stepParams: hasOwnDefined(changes, 'title')
          ? {
              tableColumnSettings: {
                title: {
                  title: changes.title,
                },
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureJSColumn(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('JSColumnModel');
    assertSupportedSimpleChanges('jsColumn', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          tooltip: changes.tooltip,
          width: changes.width,
          fixed: changes.fixed,
        }),
        stepParams: buildDefinedPayload({
          ...(hasOwnDefined(changes, 'title')
            ? {
                tableColumnSettings: {
                  title: {
                    title: changes.title,
                  },
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['code', 'version'])
            ? {
                jsSettings: {
                  runJs: buildDefinedPayload({
                    code: changes.code,
                    version: changes.version,
                  }),
                },
              }
            : {}),
        }),
      },
      options,
    );
  }

  private async configureJSItem(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse('JSItemModel');
    assertSupportedSimpleChanges('jsItem', changes, allowedKeys);
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          label: changes.label,
          tooltip: changes.tooltip,
          extra: changes.extra,
          showLabel: changes.showLabel,
        }),
        decoratorProps: buildDefinedPayload({
          labelWidth: changes.labelWidth,
          labelWrap: changes.labelWrap,
        }),
        stepParams: hasDefinedValue(changes, ['code', 'version'])
          ? {
              jsSettings: {
                runJs: buildDefinedPayload({
                  code: changes.code,
                  version: changes.version,
                }),
              },
            }
          : undefined,
      },
      options,
    );
  }

  private async configureFieldWrapper(
    target: FlowSurfaceWriteTarget,
    current: any,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    assertSupportedSimpleChanges('field wrapper', changes, getConfigureOptionKeysForUse(current?.use));

    const rawWrapperChanges = _.omit(changes, ['clickToOpen', 'openView', 'code', 'version']);
    const wrapperChanges =
      current?.use === 'TableColumnModel' &&
      !hasOwnDefined(rawWrapperChanges, 'title') &&
      hasOwnDefined(rawWrapperChanges, 'label')
        ? {
            ...rawWrapperChanges,
            title: rawWrapperChanges.label,
          }
        : rawWrapperChanges;
    const innerUid = current?.subModels?.field?.uid;
    const innerField = innerUid
      ? current?.subModels?.field ||
        (await this.repository.findModelById(innerUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        }))
      : null;
    const currentFieldInit =
      current?.stepParams?.fieldSettings?.init || innerField?.stepParams?.fieldSettings?.init || {};
    const bindingChange = hasDefinedValue(wrapperChanges, ['fieldPath', 'associationPathName']);
    const normalizedBinding = bindingChange
      ? this.normalizeDisplayFieldBinding({
          wrapperUse: current?.use,
          dataSourceKey: currentFieldInit.dataSourceKey,
          collectionName: currentFieldInit.collectionName,
          fieldPath: hasOwnDefined(wrapperChanges, 'fieldPath') ? wrapperChanges.fieldPath : currentFieldInit.fieldPath,
          associationPathName: hasOwnDefined(wrapperChanges, 'associationPathName')
            ? wrapperChanges.associationPathName
            : currentFieldInit.associationPathName,
        })
      : null;
    const canSyncTitleField = TITLE_FIELD_SUPPORTED_WRAPPER_USES.has(current?.use || '');
    const hasExistingTitleField =
      !_.isUndefined(current?.props?.titleField) || !_.isUndefined(innerField?.props?.titleField);
    const shouldSyncTitleField =
      (canSyncTitleField && hasOwnDefined(wrapperChanges, 'titleField')) ||
      (AUTO_TITLE_FIELD_BINDING_WRAPPER_USES.has(current?.use || '') &&
        bindingChange &&
        (!!normalizedBinding?.usesAssociationValueBinding || hasExistingTitleField));
    const syncedTitleField = shouldSyncTitleField
      ? hasOwnDefined(wrapperChanges, 'titleField')
        ? wrapperChanges.titleField
        : normalizedBinding?.defaultTitleField ?? null
      : undefined;

    if (Object.keys(wrapperChanges).length) {
      await this.updateSettings(
        {
          target,
          props: buildDefinedPayload(
            current?.use === 'TableColumnModel'
              ? {
                  title: wrapperChanges.title,
                  tooltip: wrapperChanges.tooltip,
                  width: wrapperChanges.width,
                  fixed: wrapperChanges.fixed,
                  sorter: wrapperChanges.sorter,
                  editable: wrapperChanges.editable,
                  dataIndex: wrapperChanges.dataIndex,
                  ...(canSyncTitleField && shouldSyncTitleField ? { titleField: syncedTitleField } : {}),
                }
              : {
                  label: wrapperChanges.label,
                  tooltip: wrapperChanges.tooltip,
                  extra: wrapperChanges.extra,
                  showLabel: wrapperChanges.showLabel,
                  initialValue: wrapperChanges.initialValue,
                  required: wrapperChanges.required,
                  disabled: wrapperChanges.disabled,
                  multiple: wrapperChanges.multiple,
                  allowMultiple: wrapperChanges.allowMultiple,
                  maxCount: wrapperChanges.maxCount,
                  pattern: wrapperChanges.pattern,
                  ...(canSyncTitleField && shouldSyncTitleField ? { titleField: syncedTitleField } : {}),
                  name: wrapperChanges.name,
                },
          ),
          decoratorProps:
            current?.use === 'TableColumnModel'
              ? undefined
              : buildDefinedPayload({
                  labelWidth: wrapperChanges.labelWidth,
                  labelWrap: wrapperChanges.labelWrap,
                }),
          stepParams:
            hasDefinedValue(wrapperChanges, ['fieldPath', 'associationPathName']) ||
            (current?.use === 'TableColumnModel' && hasOwnDefined(wrapperChanges, 'title'))
              ? buildDefinedPayload({
                  ...(current?.use === 'TableColumnModel' && hasOwnDefined(wrapperChanges, 'title')
                    ? {
                        tableColumnSettings: {
                          title: {
                            title: wrapperChanges.title,
                          },
                        },
                      }
                    : {}),
                })
              : undefined,
        },
        options,
      );
    }

    if (bindingChange && normalizedBinding) {
      await this.patchFieldSettingsInitExact(
        current,
        {
          dataSourceKey: normalizedBinding.dataSourceKey,
          collectionName: normalizedBinding.collectionName,
          fieldPath: normalizedBinding.fieldPath,
          associationPathName: normalizedBinding.associationPathName,
        },
        options.transaction,
      );
      if (innerField?.uid) {
        await this.patchFieldSettingsInitExact(
          innerField,
          {
            dataSourceKey: normalizedBinding.dataSourceKey,
            collectionName: normalizedBinding.collectionName,
            fieldPath: normalizedBinding.fieldPath,
            associationPathName: normalizedBinding.associationPathName,
          },
          options.transaction,
        );
      }
    }

    if (shouldSyncTitleField) {
      if (!innerUid) {
        throw new Error(`flowSurfaces configure field wrapper '${current?.use}' cannot resolve inner field`);
      }
      await this.updateSettings(
        {
          target: {
            uid: innerUid,
          },
          props: {
            titleField: syncedTitleField,
          },
        },
        options,
      );
    }

    if (hasDefinedValue(changes, ['clickToOpen', 'openView', 'code', 'version'])) {
      if (!innerUid) {
        throw new Error(`flowSurfaces configure field wrapper '${current?.use}' cannot resolve inner field`);
      }
      return this.configureFieldNode(
        {
          uid: innerUid,
        },
        _.pick(changes, ['clickToOpen', 'openView', 'code', 'version']),
        options,
      );
    }

    return {
      uid: current.uid,
    };
  }

  private async configureFieldNode(
    target: FlowSurfaceWriteTarget,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const resolved = await this.locator.resolve(target, options);
    const current = await this.loadResolvedNode(resolved, options.transaction);
    assertSupportedSimpleChanges(
      'field',
      changes,
      getConfigureOptionKeysForUse(current?.use || 'DisplayTextFieldModel'),
    );
    const parentUid = current?.uid ? await this.locator.findParentUid(current.uid, options.transaction) : null;
    const parentWrapper = parentUid
      ? await this.repository.findModelById(parentUid, {
          transaction: options.transaction,
          includeAsyncNode: true,
        })
      : null;
    const isJsFieldNode = ['JSFieldModel', 'JSEditableFieldModel'].includes(current?.use || '');
    if (hasDefinedValue(changes, ['code', 'version']) && !isJsFieldNode) {
      throwBadRequest(`flowSurfaces configure field '${current?.use}' does not support code/version`);
    }
    const currentFieldInit =
      current?.stepParams?.fieldSettings?.init || parentWrapper?.stepParams?.fieldSettings?.init || {};
    const bindingChange = hasDefinedValue(changes, ['fieldPath', 'associationPathName']);
    const normalizedBinding = bindingChange
      ? this.normalizeDisplayFieldBinding({
          wrapperUse: parentWrapper?.use,
          dataSourceKey: currentFieldInit.dataSourceKey,
          collectionName: currentFieldInit.collectionName,
          fieldPath: hasOwnDefined(changes, 'fieldPath') ? changes.fieldPath : currentFieldInit.fieldPath,
          associationPathName: hasOwnDefined(changes, 'associationPathName')
            ? changes.associationPathName
            : currentFieldInit.associationPathName,
        })
      : null;
    const canSyncWrapperTitleField = TITLE_FIELD_SUPPORTED_WRAPPER_USES.has(parentWrapper?.use || '');
    const hasExistingTitleField =
      !_.isUndefined(parentWrapper?.props?.titleField) || !_.isUndefined(current?.props?.titleField);
    const shouldSyncTitleField =
      hasOwnDefined(changes, 'titleField') ||
      (AUTO_TITLE_FIELD_BINDING_WRAPPER_USES.has(parentWrapper?.use || '') &&
        bindingChange &&
        (!!normalizedBinding?.usesAssociationValueBinding || hasExistingTitleField));
    const syncedTitleField = shouldSyncTitleField
      ? hasOwnDefined(changes, 'titleField')
        ? changes.titleField
        : normalizedBinding?.defaultTitleField ?? null
      : undefined;

    if (parentWrapper?.uid && canSyncWrapperTitleField && shouldSyncTitleField) {
      await this.updateSettings(
        {
          target: {
            uid: parentWrapper.uid,
          },
          props: shouldSyncTitleField
            ? {
                titleField: syncedTitleField,
              }
            : undefined,
        },
        options,
      );
    }
    if (bindingChange && normalizedBinding) {
      if (parentWrapper?.uid) {
        await this.patchFieldSettingsInitExact(
          parentWrapper,
          {
            dataSourceKey: normalizedBinding.dataSourceKey,
            collectionName: normalizedBinding.collectionName,
            fieldPath: normalizedBinding.fieldPath,
            associationPathName: normalizedBinding.associationPathName,
          },
          options.transaction,
        );
      }
      await this.patchFieldSettingsInitExact(
        current,
        {
          dataSourceKey: normalizedBinding.dataSourceKey,
          collectionName: normalizedBinding.collectionName,
          fieldPath: normalizedBinding.fieldPath,
          associationPathName: normalizedBinding.associationPathName,
        },
        options.transaction,
      );
    }

    const effectiveClickToOpen = hasOwnDefined(changes, 'clickToOpen')
      ? changes.clickToOpen
      : !_.isUndefined(changes.openView)
        ? true
        : undefined;
    const exactBindingInit =
      bindingChange && normalizedBinding
        ? {
            fieldSettings: {
              init: this.buildExactFieldSettingsInitPayload({
                dataSourceKey: normalizedBinding.dataSourceKey,
                collectionName: normalizedBinding.collectionName,
                fieldPath: normalizedBinding.fieldPath,
                associationPathName: normalizedBinding.associationPathName,
              }),
            },
          }
        : undefined;
    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          icon: changes.icon,
          autoSize: changes.autoSize,
          allowClear: changes.allowClear,
          multiple: changes.multiple,
          allowMultiple: changes.allowMultiple,
          quickCreate: changes.quickCreate,
          mode: changes.mode,
          options: changes.options,
          ...(shouldSyncTitleField ? { titleField: syncedTitleField } : {}),
          ...(hasOwnDefined(changes, 'clickToOpen') || !_.isUndefined(changes.openView)
            ? { clickToOpen: effectiveClickToOpen }
            : {}),
        }),
        stepParams: buildDefinedPayload({
          ...(!parentWrapper?.uid && exactBindingInit ? exactBindingInit : {}),
          ...(hasOwnDefined(changes, 'clickToOpen') || !_.isUndefined(changes.openView)
            ? {
                displayFieldSettings: {
                  clickToOpen: {
                    clickToOpen: effectiveClickToOpen,
                  },
                },
              }
            : {}),
          ...(hasOwnDefined(changes, 'openView')
            ? {
                popupSettings: {
                  openView: changes.openView,
                },
              }
            : {}),
          ...(hasDefinedValue(changes, ['code', 'version'])
            ? {
                jsSettings: {
                  runJs: buildDefinedPayload({
                    code: changes.code,
                    version: changes.version,
                  }),
                },
              }
            : {}),
        }),
      },
      options,
    );
  }

  private async configureActionNode(
    target: FlowSurfaceWriteTarget,
    use: string,
    changes: Record<string, any>,
    options: { transaction?: any },
  ) {
    const allowedKeys = getConfigureOptionKeysForUse(use);
    assertSupportedSimpleChanges('action', changes, allowedKeys);
    const stepParams: Record<string, any> = {};
    if (hasDefinedValue(changes, ['title', 'tooltip', 'icon', 'type', 'danger', 'color', 'linkageRules'])) {
      stepParams.buttonSettings = {
        ...(hasDefinedValue(changes, ['title', 'tooltip', 'icon', 'type', 'danger', 'color'])
          ? {
              general: buildDefinedPayload({
                title: changes.title,
                tooltip: changes.tooltip,
                icon: changes.icon,
                type: changes.type,
                danger: changes.danger,
                color: changes.color,
              }),
            }
          : {}),
        ...(hasOwnDefined(changes, 'linkageRules') ? { linkageRules: changes.linkageRules } : {}),
      };
    }
    if (!_.isUndefined(changes.openView)) {
      if (use === 'UploadActionModel') {
        stepParams.selectExitRecordSettings = {
          openView: changes.openView,
        };
      } else if (!POPUP_ACTION_USES.has(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support openView`);
      } else {
        stepParams.popupSettings = {
          openView: changes.openView,
        };
      }
    }
    if (!_.isUndefined(changes.confirm)) {
      if (DELETE_ACTION_USES.has(use)) {
        stepParams.deleteSettings = {
          confirm: normalizeSimpleConfirm(changes.confirm),
        };
      } else if (CONFIRMABLE_SUBMIT_ACTION_USES.has(use)) {
        stepParams.submitSettings = {
          confirm: normalizeSimpleConfirm(changes.confirm),
        };
      } else if (['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(use)) {
        stepParams.assignSettings = {
          confirm: normalizeSimpleConfirm(changes.confirm),
        };
      } else {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support confirm`);
      }
    }
    if (hasOwnDefined(changes, 'assignValues')) {
      if (!['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support assignValues`);
      }
      stepParams.assignSettings = {
        ...(stepParams.assignSettings || {}),
        assignFieldValues: {
          assignedValues: changes.assignValues,
        },
      };
      stepParams.apply = {
        apply: {
          assignedValues: changes.assignValues,
        },
      };
    }
    if (hasOwnDefined(changes, 'editMode')) {
      if (use !== 'BulkEditActionModel') {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support editMode`);
      }
      stepParams.bulkEditSettings = {
        editMode: {
          value: changes.editMode,
        },
      };
    }
    if (hasOwnDefined(changes, 'updateMode')) {
      if (!['UpdateRecordActionModel', 'BulkUpdateActionModel'].includes(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support updateMode`);
      }
      stepParams.assignSettings = {
        ...(stepParams.assignSettings || {}),
        updateMode: {
          value: changes.updateMode,
        },
      };
    }
    if (hasOwnDefined(changes, 'duplicateMode')) {
      if (use !== 'DuplicateActionModel') {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support duplicateMode`);
      }
      stepParams.duplicateModeSettings = {
        duplicateMode: {
          duplicateMode: changes.duplicateMode,
        },
      };
    }
    if (hasOwnDefined(changes, 'collapsedRows') || hasOwnDefined(changes, 'defaultCollapsed')) {
      if (use !== 'FilterFormCollapseActionModel') {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support collapsedRows/defaultCollapsed`);
      }
      stepParams.collapseSettings = buildDefinedPayload({
        ...(hasOwnDefined(changes, 'collapsedRows')
          ? {
              toggle: {
                collapsedRows: changes.collapsedRows,
              },
            }
          : {}),
        ...(hasOwnDefined(changes, 'defaultCollapsed')
          ? {
              defaultCollapsed: {
                value: changes.defaultCollapsed,
              },
            }
          : {}),
      });
    }
    if (hasOwnDefined(changes, 'emailFieldNames') || hasOwnDefined(changes, 'defaultSelectAllRecords')) {
      if (use !== 'MailSendActionModel') {
        throwBadRequest(
          `flowSurfaces configure action '${use}' does not support emailFieldNames/defaultSelectAllRecords`,
        );
      }
      stepParams.sendEmailSettings = buildDefinedPayload({
        ...(hasOwnDefined(changes, 'emailFieldNames')
          ? {
              emailFieldNames: {
                value: changes.emailFieldNames,
              },
            }
          : {}),
        ...(hasOwnDefined(changes, 'defaultSelectAllRecords')
          ? {
              defaultSelectAllRecords: {
                value: changes.defaultSelectAllRecords,
              },
            }
          : {}),
      });
    }
    if (hasDefinedValue(changes, ['code', 'version'])) {
      if (!JS_ACTION_USES.has(use)) {
        throwBadRequest(`flowSurfaces configure action '${use}' does not support code/version`);
      }
      stepParams.clickSettings = {
        runJs: buildDefinedPayload({
          code: changes.code,
          version: changes.version,
        }),
      };
    }

    return this.updateSettings(
      {
        target,
        props: buildDefinedPayload({
          title: changes.title,
          tooltip: changes.tooltip,
          icon: changes.icon,
          type: changes.type,
          htmlType: changes.htmlType,
          position: changes.position,
          danger: changes.danger,
          color: changes.color,
        }),
        stepParams: Object.keys(stepParams).length ? stepParams : undefined,
      },
      options,
    );
  }

  private async buildFieldCatalog(target: FlowSurfaceWriteTarget, transaction?: any) {
    const resolved = await this.locator.resolve(target, { transaction });
    const container = await this.surfaceContext.resolveFieldContainer(resolved.uid, transaction).catch(() => null);
    if (!container) {
      return [];
    }
    if (container.wrapperUse === 'FilterFormItemModel') {
      const targets = await this.surfaceContext.collectFilterFormTargets(container.ownerUid, transaction);
      if (!targets.length) {
        const resourceContext = await this.locator
          .resolveCollectionContext(container.ownerUid, transaction)
          .catch(() => null);
        if (!resourceContext?.resourceInit) {
          return [];
        }
        return this.buildFieldCatalogEntriesForResource({
          ownerUse: container.ownerUse,
          resourceInit: resourceContext.resourceInit,
          requireDefaultTargetUid: false,
        });
      }
      return targets.flatMap((targetBlock) =>
        this.buildFieldCatalogEntriesForResource({
          ownerUse: container.ownerUse,
          resourceInit: targetBlock.resourceInit,
          targetBlockUid: targetBlock.ownerUid,
          targetLabel: targetBlock.label,
          multiTarget: targets.length > 1,
          requireDefaultTargetUid: targets.length > 1,
        }),
      );
    }
    const resourceContext = await this.locator.resolveCollectionContext(container.ownerUid, transaction);
    if (!resourceContext?.resourceInit) {
      return [];
    }
    return this.buildFieldCatalogEntriesForResource({
      ownerUse: container.ownerUse,
      resourceInit: resourceContext.resourceInit,
    });
  }

  private buildFieldCatalogEntriesForResource(input: {
    ownerUse: string;
    resourceInit: Record<string, any>;
    targetBlockUid?: string;
    targetLabel?: string;
    multiTarget?: boolean;
    requireDefaultTargetUid?: boolean;
  }) {
    const collection = this.getCollection(input.resourceInit.dataSourceKey, input.resourceInit.collectionName);
    const getFields = (targetCollection: any) => getCollectionFields(targetCollection);
    const isFilterFieldVisible = (field: any) => getFieldFilterable(field) !== false && !!getFieldInterface(field);
    const directFields = getFields(collection).filter((field) =>
      ['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel'].includes(input.ownerUse)
        ? isFilterFieldVisible(field)
        : !!getFieldInterface(field),
    );
    if (!directFields.length && !collection) {
      return [];
    }
    const relationFields = directFields.flatMap((field) => {
      const targetCollection = resolveFieldTargetCollection(
        field,
        input.resourceInit.dataSourceKey,
        (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
      );
      if (!isAssociationField(field) || !targetCollection) {
        return [];
      }
      return getFields(targetCollection)
        .filter((targetField) =>
          ['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel'].includes(input.ownerUse)
            ? isFilterFieldVisible(targetField)
            : !!getFieldInterface(targetField),
        )
        .map((targetField) => ({
          field: targetField,
          fieldPath: `${getFieldName(field)}.${getFieldName(targetField)}`,
          associationPathName: getFieldName(field),
          label: `${getFieldTitle(field)} / ${getFieldTitle(targetField)}`,
        }));
    });

    const containerKind = normalizeFieldContainerKind(input.ownerUse);
    const targetPrefix = input.multiTarget && input.targetLabel ? `${input.targetLabel} / ` : '';
    const baseEntries = [
      ...directFields.map((field) => ({
        field,
        fieldPath: getFieldName(field),
        associationPathName: undefined,
        label: getFieldTitle(field),
      })),
      ...relationFields,
    ];

    const semanticEntries = baseEntries
      .filter((item) => !!getFieldInterface(item?.field))
      .flatMap((item) => {
        const label = `${targetPrefix}${item.label}`;
        const entries: Array<Record<string, any>> = [];
        const pushEntry = (semantic: { renderer?: 'js'; type?: 'jsColumn' | 'jsItem' } = {}) => {
          const fieldCapability = resolveSupportedFieldCapability({
            containerUse: input.ownerUse,
            field: item.field,
            requestedRenderer: semantic.renderer,
            requestedType: semantic.type,
          });
          const use = fieldCapability.standaloneUse || fieldCapability.wrapperUse;
          if (!use) {
            return;
          }
          entries.push({
            key: semantic.type ? semantic.type : semantic.renderer === 'js' ? `js:${item.fieldPath}` : item.fieldPath,
            label: semantic.type ? `JS / ${semantic.type}` : semantic.renderer === 'js' ? `JS / ${label}` : label,
            kind: 'field',
            use,
            fieldUse: fieldCapability.standaloneUse || fieldCapability.fieldUse,
            wrapperUse: fieldCapability.wrapperUse,
            associationPathName: item.associationPathName,
            ...(semantic.renderer ? { renderer: semantic.renderer } : {}),
            ...(semantic.type ? { type: semantic.type } : {}),
            ...(input.targetBlockUid
              ? { defaultTargetUid: input.targetBlockUid, targetBlockUid: input.targetBlockUid }
              : {}),
            requiredInitParams: semantic.type
              ? []
              : fieldCapability.wrapperUse === 'FilterFormItemModel' && input.requireDefaultTargetUid
                ? ['fieldPath', 'defaultTargetUid']
                : ['fieldPath'],
            editableDomains: this.getEditableDomains(use),
            configureOptions: getConfigureOptionsForUse(use),
            settingsSchema: getSettingsSchemaForUse(use),
            settingsContract: getNodeContract(use).domains,
          });
        };

        pushEntry();
        if (containerKind === 'form' || containerKind === 'details' || containerKind === 'table') {
          pushEntry({ renderer: 'js' });
        }
        return entries;
      });

    if (containerKind === 'table') {
      semanticEntries.push({
        key: 'jsColumn',
        label: 'JS / jsColumn',
        kind: 'field',
        use: 'JSColumnModel',
        fieldUse: 'JSColumnModel',
        type: 'jsColumn',
        requiredInitParams: [],
        editableDomains: this.getEditableDomains('JSColumnModel'),
        configureOptions: getConfigureOptionsForUse('JSColumnModel'),
        settingsSchema: getSettingsSchemaForUse('JSColumnModel'),
        settingsContract: getNodeContract('JSColumnModel').domains,
      });
    }

    if (containerKind === 'form') {
      semanticEntries.push({
        key: 'jsItem',
        label: 'JS / jsItem',
        kind: 'field',
        use: 'JSItemModel',
        fieldUse: 'JSItemModel',
        type: 'jsItem',
        requiredInitParams: [],
        editableDomains: this.getEditableDomains('JSItemModel'),
        configureOptions: getConfigureOptionsForUse('JSItemModel'),
        settingsSchema: getSettingsSchemaForUse('JSItemModel'),
        settingsContract: getNodeContract('JSItemModel').domains,
      });
    }

    return semanticEntries;
  }

  private async findOwningBlockGrid(uid: string, transaction?: any) {
    let cursor = uid;
    while (cursor) {
      const node = await this.repository.findModelById(cursor, { transaction, includeAsyncNode: true });
      if (node?.use === 'BlockGridModel') {
        return node;
      }
      cursor = await this.locator.findParentUid(cursor, transaction);
    }
    return null;
  }

  private async persistFilterFormConnectConfig(
    input: {
      filterModelUid: string;
      filterFormOwnerUid: string;
      targetBlockUid: string;
      resourceInit: Record<string, any>;
      fieldPath: string;
      associationPathName?: string;
    },
    transaction?: any,
  ) {
    const blockGrid = await this.findOwningBlockGrid(input.filterFormOwnerUid, transaction);
    if (!blockGrid?.uid) {
      return;
    }
    const currentConfigs = _.castArray(blockGrid.filterManager || []);
    const nextConfigs = currentConfigs.filter((config: any) => config?.filterId !== input.filterModelUid);
    nextConfigs.push({
      filterId: input.filterModelUid,
      targetId: input.targetBlockUid,
      filterPaths: this.buildFilterFormTargetPaths(input.resourceInit, input.fieldPath, input.associationPathName),
    });
    await this.repository.patch(
      {
        uid: blockGrid.uid,
        filterManager: nextConfigs,
      },
      { transaction },
    );
  }

  private async removeFilterFormConnectConfig(filterModelUid: string, transaction?: any) {
    const blockGrid = await this.findOwningBlockGrid(filterModelUid, transaction);
    if (!blockGrid?.uid) {
      return;
    }
    const currentConfigs = _.castArray(blockGrid.filterManager || []);
    const nextConfigs = currentConfigs.filter((config: any) => config?.filterId !== filterModelUid);
    if (_.isEqual(nextConfigs, currentConfigs)) {
      return;
    }
    await this.repository.patch(
      {
        uid: blockGrid.uid,
        filterManager: nextConfigs,
      },
      { transaction },
    );
  }

  private async removeFilterFormTargetBindings(targetBlockUid: string, transaction?: any) {
    const blockGrid = await this.findOwningBlockGrid(targetBlockUid, transaction);
    if (!blockGrid?.uid) {
      return;
    }
    const currentConfigs = _.castArray(blockGrid.filterManager || []);
    const nextConfigs = currentConfigs.filter((config: any) => config?.targetId !== targetBlockUid);
    if (_.isEqual(nextConfigs, currentConfigs)) {
      return;
    }
    await this.repository.patch(
      {
        uid: blockGrid.uid,
        filterManager: nextConfigs,
      },
      { transaction },
    );
  }

  private async syncFilterFormConnectConfigForNode(node: any, transaction?: any) {
    if (node?.use !== 'FilterFormItemModel' || !node?.uid) {
      return;
    }

    const fieldInit = _.get(node, ['stepParams', 'fieldSettings', 'init']) || {};
    const defaultTargetUid = _.get(node, ['stepParams', 'filterFormItemSettings', 'init', 'defaultTargetUid']);
    if (!fieldInit?.fieldPath || !defaultTargetUid) {
      await this.removeFilterFormConnectConfig(node.uid, transaction);
      return;
    }

    const parentUid = await this.locator.findParentUid(node.uid, transaction);
    if (!parentUid) {
      return;
    }
    const container = await this.surfaceContext.resolveFieldContainer(parentUid, transaction).catch(() => null);
    if (!container || container.wrapperUse !== 'FilterFormItemModel') {
      return;
    }

    const target = await this.surfaceContext.resolveFilterFormTarget(container.ownerUid, defaultTargetUid, transaction);
    await this.persistFilterFormConnectConfig(
      {
        filterModelUid: node.uid,
        filterFormOwnerUid: container.ownerUid,
        targetBlockUid: target.ownerUid,
        resourceInit: target.resourceInit,
        fieldPath: fieldInit.fieldPath,
        associationPathName: fieldInit.associationPathName,
      },
      transaction,
    );
  }

  private async syncFieldBindingSettingsForNode(current: any, effectiveNode: any, transaction?: any) {
    const nextFieldSettings = _.cloneDeep(effectiveNode?.stepParams?.fieldSettings);
    if (!nextFieldSettings || !current?.uid) {
      return;
    }

    if (FIELD_WRAPPER_USES.has(current.use || '')) {
      const innerFieldUid = effectiveNode?.subModels?.field?.uid || current?.subModels?.field?.uid;
      if (innerFieldUid) {
        const innerField =
          current?.subModels?.field ||
          (await this.repository.findModelById(innerFieldUid, { transaction, includeAsyncNode: true }));
        if (innerField?.uid) {
          await this.repository.patch(
            {
              uid: innerField.uid,
              stepParams: {
                ...(innerField.stepParams || {}),
                fieldSettings: nextFieldSettings,
              },
            },
            { transaction },
          );
        }
      }
      if (current.use === 'FilterFormItemModel') {
        await this.syncFilterFormConnectConfigForNode(effectiveNode, transaction);
      }
      return;
    }

    const parentUid = await this.locator.findParentUid(current.uid, transaction);
    if (!parentUid) {
      return;
    }
    const parentNode = await this.repository.findModelById(parentUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (!FIELD_WRAPPER_USES.has(parentNode?.use || '')) {
      return;
    }

    const nextWrapper = {
      ...parentNode,
      stepParams: {
        ...(parentNode?.stepParams || {}),
        fieldSettings: nextFieldSettings,
      },
    };
    await this.repository.patch(
      {
        uid: parentUid,
        stepParams: nextWrapper.stepParams,
      },
      { transaction },
    );

    if (parentNode.use === 'FilterFormItemModel') {
      await this.syncFilterFormConnectConfigForNode(nextWrapper, transaction);
    }
  }

  private buildFilterFormTargetPaths(
    resourceInit: Record<string, any>,
    fieldPath: string,
    associationPathName?: string,
  ) {
    const persistedFieldPath = normalizeFieldPath(fieldPath, associationPathName);
    const collection = this.getCollection(resourceInit.dataSourceKey, resourceInit.collectionName);
    const field = resolveFieldFromCollection(collection, persistedFieldPath);
    const targetCollection = resolveFieldTargetCollection(
      field,
      resourceInit.dataSourceKey,
      (dataSourceKey, collectionName) => this.getCollection(dataSourceKey, collectionName),
    );
    if (getFieldTarget(field)) {
      return [`${persistedFieldPath}.${getAssociationFilterTargetKey(field, targetCollection)}`];
    }
    return [persistedFieldPath];
  }

  private getEditableDomains(use?: string): FlowSurfaceNodeDomain[] {
    return getEditableDomainsForUse(use);
  }

  private getCollection(dataSourceKey: string, collectionName: string) {
    const normalizedDataSourceKey = dataSourceKey || 'main';
    const dataSourceManager = this.plugin.app.dataSourceManager;
    const dataSource = dataSourceManager?.get?.(normalizedDataSourceKey);
    return (
      dataSource?.collectionManager?.getCollection?.(collectionName) ||
      this.plugin.app.db?.getCollection?.(collectionName)
    );
  }

  private async resolveFieldDefinition(input: {
    dataSourceKey: string;
    collectionName: string;
    associationPathName?: string;
    fieldPath: string;
  }) {
    const collection = this.getCollection(input.dataSourceKey, input.collectionName);
    const parsed = this.parseFieldPath(
      collection,
      input.fieldPath,
      input.associationPathName,
      input.dataSourceKey,
      input.collectionName,
    );
    const field = resolveFieldFromCollection(parsed.leafCollection, parsed.leafFieldPath);
    if (!field) {
      throw new Error(`flowSurfaces field '${input.collectionName}.${input.fieldPath}' not found`);
    }
    return {
      dataSourceKey: parsed.dataSourceKey || input.dataSourceKey,
      collectionName: parsed.collectionName || input.collectionName,
      associationPathName: parsed.associationPathName,
      fieldPath: parsed.fieldPath,
      field,
    };
  }

  private async ensureGridChild(parentUid: string, use: string, transaction?: any) {
    const existing = await this.repository.findModelByParentId(parentUid, {
      transaction,
      subKey: 'grid',
      includeAsyncNode: true,
    });
    if (existing?.uid) {
      return existing.uid;
    }
    const childUid = uid();
    await this.repository.upsertModel(
      {
        uid: childUid,
        parentId: parentUid,
        subKey: 'grid',
        subType: 'object',
        use,
      },
      { transaction },
    );
    return childUid;
  }

  private async ensureTableActionsColumn(tableUid: string, transaction?: any) {
    const table = await this.repository.findModelById(tableUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (table?.use !== 'TableBlockModel') {
      throw new Error(
        `flowSurfaces table recordActions require a TableBlockModel target, got '${table?.use || tableUid}'`,
      );
    }

    const attachedColumns = _.castArray(table?.subModels?.columns || []).filter(
      (item: any) => item?.use === 'TableActionsColumnModel' && item?.uid,
    );
    if (attachedColumns.length) {
      return attachedColumns[0].uid;
    }

    const columnTree = buildCanonicalTableActionsColumnNode();
    this.contractGuard.validateNodeTreeAgainstContract(columnTree);
    await this.repository.upsertModel(
      {
        parentId: tableUid,
        subKey: 'columns',
        subType: 'array',
        ...columnTree,
      },
      { transaction },
    );
    return columnTree.uid;
  }

  private async ensurePopupSurface(parentUid: string, transaction?: any) {
    const existingPage = await this.repository.findModelByParentId(parentUid, {
      transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });

    if (existingPage?.uid) {
      const tab = _.castArray(existingPage?.subModels?.tabs || [])[0];
      const grid =
        tab?.subModels?.grid ||
        (tab?.uid
          ? await this.repository.findModelByParentId(tab.uid, {
              transaction,
              subKey: 'grid',
              includeAsyncNode: true,
            })
          : null);
      if (tab?.uid && grid?.uid) {
        return {
          pageUid: existingPage.uid,
          tabUid: tab.uid,
          gridUid: grid.uid,
        };
      }
    }

    const tree = buildPopupPageTree({});
    await this.repository.upsertModel(
      {
        parentId: parentUid,
        subKey: 'page',
        subType: 'object',
        ...tree,
      },
      { transaction },
    );

    const persisted = await this.repository.findModelByParentId(parentUid, {
      transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });
    const tab = _.castArray(persisted?.subModels?.tabs || [])[0];
    const grid = tab?.subModels?.grid;
    if (!persisted?.uid || !tab?.uid || !grid?.uid) {
      throw new Error(`flowSurfaces failed to create popup surface under '${parentUid}'`);
    }
    return {
      pageUid: persisted.uid,
      tabUid: tab.uid,
      gridUid: grid.uid,
    };
  }

  private async ensureFlowRoutePageSchemaShell(pageSchemaUid: string, transaction?: any) {
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    if (!uiSchemas || !pageSchemaUid) {
      return;
    }
    const existing = await uiSchemas.findOne({
      filterByTk: pageSchemaUid,
      transaction,
    });
    if (existing) {
      return;
    }
    await uiSchemas.insert(
      {
        type: 'void',
        'x-component': 'FlowRoute',
        'x-uid': pageSchemaUid,
      },
      { transaction },
    );
  }

  private async removeFlowRoutePageSchemaShell(pageSchemaUid: string, transaction?: any) {
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    if (!uiSchemas || !pageSchemaUid) {
      return;
    }
    await uiSchemas.remove(pageSchemaUid, { transaction });
  }

  private normalizeDisplayFieldBinding(input: {
    wrapperUse?: string;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    associationPathName?: string;
  }) {
    const collection = this.getCollection(input.dataSourceKey, input.collectionName);
    const parsed = this.parseFieldPath(
      collection,
      input.fieldPath,
      input.associationPathName,
      input.dataSourceKey,
      input.collectionName,
    );
    const associationInterface = getFieldInterface(parsed.associationField);
    const shouldBindAssociationValue =
      DISPLAY_FIELD_WRAPPER_USES.has(input.wrapperUse || '') &&
      !!parsed.associationPathName &&
      parsed.fieldPath !== parsed.associationPathName &&
      MULTI_VALUE_ASSOCIATION_INTERFACES.has(associationInterface || '');

    if (shouldBindAssociationValue) {
      const associationFieldPath = parsed.associationPathName;
      if (!associationFieldPath) {
        throw new Error('flowSurfaces field binding requires associationPathName for multi-value association display');
      }
      return {
        dataSourceKey: parsed.dataSourceKey,
        collectionName: parsed.collectionName,
        fieldPath: associationFieldPath,
        associationPathName: undefined,
        defaultTitleField: parsed.leafFieldPath,
        usesAssociationValueBinding: true,
      };
    }

    return {
      dataSourceKey: parsed.dataSourceKey,
      collectionName: parsed.collectionName,
      fieldPath: parsed.fieldPath,
      associationPathName: parsed.associationPathName,
      defaultTitleField: undefined,
      usesAssociationValueBinding: false,
    };
  }

  private buildExactFieldSettingsInitPayload(input: {
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    associationPathName?: string;
  }) {
    return buildDefinedPayload({
      dataSourceKey: input.dataSourceKey,
      collectionName: input.collectionName,
      fieldPath: input.fieldPath,
      ...(typeof input.associationPathName !== 'undefined' ? { associationPathName: input.associationPathName } : {}),
    });
  }

  private async patchFieldSettingsInitExact(
    node: any,
    input: {
      dataSourceKey: string;
      collectionName: string;
      fieldPath: string;
      associationPathName?: string;
    },
    transaction?: any,
  ) {
    if (!node?.uid) {
      return;
    }
    const nextStepParams = {
      ...(node.stepParams || {}),
      fieldSettings: {
        ...(node.stepParams?.fieldSettings || {}),
        init: this.buildExactFieldSettingsInitPayload(input),
      },
    };
    await this.repository.patch(
      {
        uid: node.uid,
        stepParams: nextStepParams,
      },
      { transaction },
    );

    if (node.use === 'FilterFormItemModel') {
      await this.syncFilterFormConnectConfigForNode(
        {
          ...node,
          stepParams: nextStepParams,
        },
        transaction,
      );
    }
  }

  private parseFieldPath(
    collection: any,
    fieldPath: string,
    associationPathName?: string,
    dataSourceKey?: string,
    collectionName?: string,
  ) {
    const rawFieldPath = String(fieldPath || '').trim();
    const explicitAssociationPath = String(associationPathName || '').trim() || undefined;
    const parsedAssociationPath =
      explicitAssociationPath ||
      (rawFieldPath.includes('.') ? rawFieldPath.split('.').slice(0, -1).join('.') : undefined);
    const persistedFieldPath =
      explicitAssociationPath && !rawFieldPath.includes('.')
        ? `${explicitAssociationPath}.${rawFieldPath}`
        : rawFieldPath;
    const leafFieldPath = parsedAssociationPath ? persistedFieldPath.split('.').slice(-1)[0] : persistedFieldPath;
    const resolvedDataSourceKey = dataSourceKey || collection?.dataSourceKey || 'main';
    const resolvedCollectionName = collectionName || collection?.name || collection?.options?.name;

    if (!parsedAssociationPath) {
      return {
        leafCollection: collection,
        dataSourceKey: resolvedDataSourceKey,
        collectionName: resolvedCollectionName,
        fieldPath: persistedFieldPath,
        leafFieldPath,
        associationPathName: undefined,
        associationField: undefined,
      };
    }

    const associationField = resolveFieldFromCollection(collection, parsedAssociationPath);
    const targetCollection = resolveFieldTargetCollection(
      associationField,
      resolvedDataSourceKey,
      (resolvedDsKey, targetCollectionName) => this.getCollection(resolvedDsKey, targetCollectionName),
    );
    return {
      leafCollection: targetCollection || collection,
      dataSourceKey: resolvedDataSourceKey,
      collectionName: resolvedCollectionName,
      fieldPath: persistedFieldPath,
      leafFieldPath,
      associationPathName: parsedAssociationPath,
      associationField,
    };
  }

  private async loadResolvedNode(resolved: any, transaction?: any) {
    if (resolved?.kind === 'page' && resolved?.pageRoute) {
      return this.routeSync.buildPageTree(resolved.pageRoute, transaction);
    }
    if (resolved?.kind === 'tab' && resolved?.tabRoute) {
      return this.routeSync.buildTabAnchor(resolved.tabRoute, transaction);
    }
    if (resolved?.node?.uid) {
      return resolved.node;
    }
    return this.repository.findModelById(resolved.uid, { transaction, includeAsyncNode: true });
  }
}

function buildDefinedPayload(payload: Record<string, any>) {
  return _.pickBy(payload, (value) => !_.isUndefined(value));
}

function getSingleNodeSubModel(subModel?: FlowSurfaceNodeSubModel | null): FlowSurfaceNodeSpec | undefined {
  if (!subModel || Array.isArray(subModel)) {
    return undefined;
  }
  return subModel;
}

function getNodeSubModelList(subModel?: FlowSurfaceNodeSubModel | null): FlowSurfaceNodeSpec[] {
  if (!subModel) {
    return [];
  }
  return Array.isArray(subModel) ? subModel : [subModel];
}

function flattenModel(node: any, carry: Record<string, any> = {}) {
  if (!node?.uid) {
    return carry;
  }
  carry[node.uid] = {
    uid: node.uid,
    use: node.use,
    props: node.props,
    decoratorProps: node.decoratorProps,
    stepParams: node.stepParams,
    flowRegistry: node.flowRegistry,
  };
  Object.values(node.subModels || {}).forEach((value) => {
    _.castArray(value as any).forEach((child) => flattenModel(child, carry));
  });
  return carry;
}

function buildDefaultFieldState(containerUse: string, fieldUse: string, field: any) {
  const bindingDefaults = getFieldBindingDefaultProps(containerUse, fieldUse, field);
  return {
    wrapperProps: {},
    fieldProps: _.cloneDeep(bindingDefaults),
  };
}

function hasOwnDefined(input: Record<string, any>, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key) && !_.isUndefined(input[key]);
}

function hasDefinedValue(input: Record<string, any>, keys: string[]) {
  return keys.some((key) => hasOwnDefined(input, key));
}

function ensureNoRawSimpleChangeKeys(changes: Record<string, any>) {
  const rawKeys = ['props', 'decoratorProps', 'stepParams', 'flowRegistry', 'use', 'fieldUse'];
  const forbidden = Object.keys(changes).filter((key) => rawKeys.includes(key));
  if (forbidden.length) {
    throwBadRequest(
      `flowSurfaces configure does not accept raw keys: ${forbidden.join(
        ', ',
      )}; use catalog.configureOptions and configure.changes instead`,
    );
  }
}

function ensureNoRawDirectAddKeys(actionName: string, values: Record<string, any>, rawKeys: string[]) {
  const forbidden = rawKeys.filter((key) => hasOwnDefined(values || {}, key));
  if (!forbidden.length) {
    return;
  }
  throwBadRequest(
    `flowSurfaces ${actionName} does not accept raw keys: ${forbidden.join(
      ', ',
    )}; use settings with catalog.configureOptions or fall back to updateSettings/apply for low-level control`,
  );
}

function ensureNoDirectActionScopeKey(actionName: 'addAction' | 'addRecordAction', values: Record<string, any>) {
  if (_.isUndefined(values?.scope)) {
    return;
  }
  throwBadRequest(
    `flowSurfaces ${actionName} does not support scope; use addAction for non-record actions and addRecordAction for record actions`,
  );
}

function normalizeComposeFieldSpec(input: any, index: number) {
  if (typeof input === 'string') {
    const fieldPath = String(input || '').trim();
    if (!fieldPath) {
      throwBadRequest(`flowSurfaces compose field #${index + 1} cannot be empty`);
    }
    return {
      key: fieldPath,
      fieldPath,
      settings: {},
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces compose field #${index + 1} must be a string or object`);
  }
  if (input.use || input.fieldUse || input.stepParams || input.props || input.decoratorProps) {
    throwBadRequest('flowSurfaces compose field only accepts public semantic field fields');
  }
  const semanticType = String(input.type || '').trim() || undefined;
  const fieldPath = String(input.fieldPath || '').trim();
  const renderer = typeof input.renderer === 'undefined' ? undefined : String(input.renderer || '').trim();
  if (!fieldPath && !semanticType) {
    throwBadRequest(`flowSurfaces compose field #${index + 1} requires fieldPath`);
  }
  if (semanticType && fieldPath) {
    throwBadRequest(
      `flowSurfaces compose field #${index + 1} cannot mix fieldPath with synthetic field type '${semanticType}'`,
    );
  }
  return {
    key: String(input.key || semanticType || (renderer === 'js' ? `js:${fieldPath}` : fieldPath)).trim(),
    ...(fieldPath ? { fieldPath } : {}),
    associationPathName: String(input.associationPathName || '').trim() || undefined,
    ...(renderer ? { renderer } : {}),
    ...(semanticType ? { type: semanticType } : {}),
    target: String(input.target || '').trim() || undefined,
    settings: _.isPlainObject(input.settings) ? input.settings : {},
  };
}

function normalizeComposeActionSpec(input: any, index: number) {
  if (typeof input === 'string') {
    const type = String(input || '').trim();
    if (!type) {
      throwBadRequest(`flowSurfaces compose action #${index + 1} cannot be empty`);
    }
    return {
      key: type,
      type,
      settings: {},
      popup: undefined,
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces compose action #${index + 1} must be a string or object`);
  }
  if (input.use || input.fieldUse || input.stepParams || input.props || input.decoratorProps || input.flowRegistry) {
    throwBadRequest('flowSurfaces compose action only accepts public semantic action fields');
  }
  const type = String(input.type || '').trim();
  if (!type) {
    throwBadRequest(`flowSurfaces compose action #${index + 1} requires type`);
  }
  if (!_.isUndefined(input.scope)) {
    throwBadRequest(`flowSurfaces compose action #${index + 1} does not support scope, use actions or recordActions`);
  }
  return {
    key: String(input.key || type).trim(),
    type,
    settings: _.isPlainObject(input.settings) ? input.settings : {},
    popup: _.isPlainObject(input.popup) ? input.popup : undefined,
  };
}

function normalizeSimpleResourceInit(input: any) {
  if (!input) {
    return undefined;
  }
  if (!_.isPlainObject(input)) {
    throw new FlowSurfaceBadRequestError('flowSurfaces simple resource must be an object');
  }
  const normalized = buildDefinedPayload({
    dataSourceKey: input.dataSourceKey,
    collectionName: input.collectionName,
    associationName: input.associationName,
    associationPathName: input.associationPathName,
    sourceId: input.sourceId,
    filterByTk: input.filterByTk,
  });
  if (!Object.keys(normalized).length) {
    throw new FlowSurfaceBadRequestError('flowSurfaces simple resource cannot be empty');
  }
  return normalized;
}

function normalizeSimpleLayoutValue(layout: any) {
  if (_.isUndefined(layout)) {
    return undefined;
  }
  if (_.isPlainObject(layout)) {
    return layout.layout;
  }
  return layout;
}

function normalizeGridCardColumns(columns: any) {
  if (_.isUndefined(columns)) {
    return undefined;
  }
  if (_.isNumber(columns) && columns > 0) {
    return {
      xs: columns,
      sm: columns,
      md: columns,
      lg: columns,
      xl: columns,
      xxl: columns,
    };
  }
  if (_.isPlainObject(columns)) {
    const normalized = buildDefinedPayload({
      xs: columns.xs,
      sm: columns.sm,
      md: columns.md,
      lg: columns.lg,
      xl: columns.xl,
      xxl: columns.xxl,
    });
    if (!Object.keys(normalized).length) {
      throw new FlowSurfaceBadRequestError('flowSurfaces configure gridCard columns cannot be empty');
    }
    return normalized;
  }
  throw new FlowSurfaceBadRequestError('flowSurfaces configure gridCard columns must be a number or responsive object');
}

function normalizeSimpleConfirm(confirm: any) {
  if (_.isBoolean(confirm)) {
    return {
      enable: confirm,
    };
  }
  if (_.isPlainObject(confirm)) {
    return buildDefinedPayload({
      enable: confirm.enable,
      title: confirm.title,
      content: confirm.content,
    });
  }
  throw new FlowSurfaceBadRequestError('flowSurfaces configure confirm must be a boolean or object');
}

function assertSupportedSimpleChanges(context: string, changes: Record<string, any>, allowedKeys: string[]) {
  const unknownKeys = Object.keys(changes).filter((key) => !allowedKeys.includes(key));
  if (!unknownKeys.length) {
    return;
  }
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces configure ${context} does not support: ${unknownKeys.join(
      ', ',
    )}; supported configureOptions: ${allowedKeys.join(', ')}`,
  );
}

function hasNonEmptyGetWrapperValue(value: any) {
  if (_.isNil(value)) {
    return false;
  }
  if (_.isPlainObject(value)) {
    return Object.keys(value).length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

function hasLegacyLocatorFields(input: any, options: { allowRootUid?: boolean } = {}) {
  if (!_.isPlainObject(input)) {
    return false;
  }
  const keys = ['pageSchemaUid', 'tabSchemaUid', 'routeId', 'schemaUid'];
  if (options.allowRootUid) {
    keys.push('uid');
  }
  return keys.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function rethrowInlineConfigurationError(error: any, prefix: string): never {
  const message = `${prefix}: ${error?.message || String(error)}`;
  if (error instanceof FlowSurfaceBadRequestError) {
    throw new FlowSurfaceBadRequestError(message);
  }
  throw new Error(message);
}

function throwBadRequest(message: string): never {
  throw new FlowSurfaceBadRequestError(message);
}

function splitComposeFieldChanges(changes: Record<string, any>, wrapperUse?: string) {
  ensureNoRawSimpleChangeKeys(changes);
  const supportedKeys = getConfigureOptionKeysForUse(wrapperUse || 'FormItemModel');
  assertSupportedSimpleChanges('field', changes, supportedKeys);
  const wrapperChanges = _.pick(changes, [
    'label',
    'tooltip',
    'extra',
    'showLabel',
    'width',
    'fixed',
    'sorter',
    'fieldPath',
    'associationPathName',
    'initialValue',
    'required',
    'disabled',
    'maxCount',
    'pattern',
    'titleField',
    'dataIndex',
    'editable',
    'labelWidth',
    'labelWrap',
    'name',
    ...(wrapperUse === 'TableColumnModel' ? ['title'] : []),
  ]);
  const fieldChanges = _.pick(changes, [
    'clickToOpen',
    'openView',
    ...(wrapperUse === 'TableColumnModel' ? [] : ['title']),
    'icon',
    'autoSize',
    'allowClear',
    'multiple',
    'allowMultiple',
    'quickCreate',
    'mode',
    'options',
    'code',
    'version',
  ]);
  return {
    wrapperChanges: _.pickBy(wrapperChanges, (value) => !_.isUndefined(value)),
    fieldChanges: _.pickBy(fieldChanges, (value) => !_.isUndefined(value)),
  };
}

function getCatalogRecordActionContainerUse(use?: string) {
  switch (String(use || '').trim()) {
    case 'TableBlockModel':
    case 'TableActionsColumnModel':
      return 'TableActionsColumnModel';
    case 'DetailsBlockModel':
      return 'DetailsBlockModel';
    case 'ListBlockModel':
    case 'ListItemModel':
      return 'ListItemModel';
    case 'GridCardBlockModel':
    case 'GridCardItemModel':
      return 'GridCardItemModel';
    default:
      return null;
  }
}

function normalizeRowSpans(spans?: Array<number | undefined>) {
  const numericSpans = _.castArray(spans || []).map((span) => {
    if (_.isNumber(span) && span > 0) {
      return span;
    }
    return 1;
  });
  const total = numericSpans.reduce((sum, value) => sum + value, 0);
  if (!total) {
    return numericSpans.map(() => 24);
  }
  if (total === 24 && numericSpans.every((value) => Number.isInteger(value))) {
    return numericSpans;
  }
  const raw = numericSpans.map((value) => (value / total) * 24);
  const base = raw.map((value) => Math.max(1, Math.floor(value)));
  let remainder = 24 - base.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
    }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
  let cursor = 0;
  while (remainder > 0 && order.length) {
    base[order[cursor % order.length].index] += 1;
    remainder -= 1;
    cursor += 1;
  }
  while (remainder < 0 && order.length) {
    const target = order[(cursor + order.length - 1) % order.length].index;
    if (base[target] > 1) {
      base[target] -= 1;
      remainder += 1;
    }
    cursor += 1;
  }
  return base;
}

function isFieldNodeUse(use?: string) {
  return !!use && use.endsWith('FieldModel');
}

function getFieldBindingDefaultProps(containerUse: string, fieldUse: string, field: any) {
  const fieldInterface = getFieldInterface(field);
  const defaults: Record<string, any> = {};
  const isFilterField = ['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel'].includes(containerUse);

  if (fieldUse === 'TextareaFieldModel') {
    defaults.autoSize = {
      maxRows: 10,
      minRows: 3,
    };
  }

  if (fieldUse === 'FilterFormRecordSelectFieldModel') {
    defaults.allowMultiple = true;
    defaults.multiple = true;
    defaults.quickCreate = 'none';
  }

  if (fieldUse === 'SelectFieldModel') {
    if (['select', 'multipleSelect', 'radioGroup'].includes(fieldInterface)) {
      defaults.allowClear = true;
    }
    if (fieldInterface === 'checkboxGroup') {
      defaults.allowClear = true;
      defaults.mode = 'tags';
    }
    if (isFilterField && fieldInterface === 'checkbox') {
      defaults.allowClear = true;
      defaults.multiple = false;
      defaults.options = [
        {
          label: '{{t("Yes")}}',
          value: true,
        },
        {
          label: '{{t("No")}}',
          value: false,
        },
      ];
    }
  }

  return defaults;
}

function normalizeFieldContainerKind(containerUse?: string) {
  const normalized = String(containerUse || '').trim();
  if (
    [
      'FormBlockModel',
      'CreateFormModel',
      'EditFormModel',
      'FormGridModel',
      'FormItemModel',
      'AssignFormModel',
      'AssignFormGridModel',
    ].includes(normalized)
  ) {
    return 'form';
  }
  if (
    [
      'DetailsBlockModel',
      'DetailsGridModel',
      'DetailsItemModel',
      'ListBlockModel',
      'GridCardBlockModel',
      'ListItemModel',
      'GridCardItemModel',
    ].includes(normalized)
  ) {
    return 'details';
  }
  if (['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel'].includes(normalized)) {
    return 'filter-form';
  }
  if (['TableBlockModel', 'TableColumnModel'].includes(normalized)) {
    return 'table';
  }
  return null;
}

function normalizeFieldPath(fieldPath: string, associationPathName?: string) {
  const normalizedFieldPath = String(fieldPath || '').trim();
  const normalizedAssociationPath = String(associationPathName || '').trim();
  if (!normalizedAssociationPath || !normalizedFieldPath || normalizedFieldPath.includes('.')) {
    return normalizedFieldPath;
  }
  return `${normalizedAssociationPath}.${normalizedFieldPath}`;
}

function buildFilterFieldMeta(field: any) {
  return _.pickBy(
    {
      name: getFieldName(field),
      title: getFieldTitle(field),
      interface: getFieldInterface(field),
      type: getFieldType(field),
    },
    (value) => !_.isUndefined(value),
  );
}

function getCollectionFields(collection: any) {
  return _.castArray(collection?.getFields?.() || Array.from(collection?.fields?.values?.() || []));
}

function getCollectionTitle(collection: any) {
  return collection?.title || collection?.options?.title || collection?.name || collection?.options?.name;
}

function getFieldName(field: any) {
  return field?.name || field?.options?.name;
}

function getFieldTitle(field: any) {
  return field?.title || field?.options?.title || getFieldName(field);
}

function getFieldInterface(field: any) {
  return field?.interface || field?.options?.interface;
}

function getFieldType(field: any) {
  return field?.type || field?.options?.type;
}

function getFieldTarget(field: any) {
  return field?.target || field?.options?.target;
}

function getFieldFilterable(field: any) {
  if (!_.isUndefined(field?.filterable)) {
    return field.filterable;
  }
  return field?.options?.filterable;
}

function isAssociationField(field: any) {
  if (typeof field?.isAssociationField === 'function') {
    return field.isAssociationField();
  }
  return ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray'].includes(getFieldType(field));
}

function resolveFieldFromCollection(collection: any, fieldPath: string) {
  if (!collection || !fieldPath) {
    return null;
  }
  if (typeof collection?.getFieldByPath === 'function') {
    const direct = collection.getFieldByPath(fieldPath);
    if (direct) {
      return direct;
    }
  }

  const [head, ...rest] = String(fieldPath || '')
    .split('.')
    .filter(Boolean);
  const field = collection?.getField?.(head) || collection?.fields?.get?.(head);
  if (!field || rest.length === 0) {
    return field || null;
  }
  const targetCollection = resolveFieldTargetCollection(field, collection?.dataSourceKey, () => null);
  if (!targetCollection) {
    return null;
  }
  return resolveFieldFromCollection(targetCollection, rest.join('.'));
}

function resolveFieldTargetCollection(
  field: any,
  dataSourceKey: string,
  getCollection: (dataSourceKey: string, collectionName: string) => any,
) {
  return (
    (typeof field?.targetCollection === 'function' ? field.targetCollection() : field?.targetCollection) ||
    (getFieldTarget(field) ? getCollection(dataSourceKey || 'main', getFieldTarget(field)) : null)
  );
}

function getAssociationFilterTargetKey(field: any, targetCollection?: any) {
  const resolvedTargetCollection = targetCollection || resolveFieldTargetCollection(field, '', () => null);
  const filterTargetKey =
    resolvedTargetCollection?.filterTargetKey || resolvedTargetCollection?.options?.filterTargetKey;

  if (Array.isArray(filterTargetKey)) {
    return filterTargetKey[0] || 'id';
  }

  return filterTargetKey || 'id';
}
