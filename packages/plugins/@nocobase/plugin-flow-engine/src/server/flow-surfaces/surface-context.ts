/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import FlowModelRepository from '../repository';
import { getAvailableBlockCatalogItems } from './catalog';
import { getChartBuilderResourceInit } from './chart-config';
import { throwBadRequest } from './errors';
import { SurfaceLocator } from './locator';
import {
  getApprovalDefaultGridUse,
  getApprovalFieldWrapperUse,
  isApprovalTaskCardGridUse,
  normalizeApprovalSemanticUse,
} from './approval';
import {
  canCatalogAddBlock,
  isFormBlockUse,
  isDetailsBlockUse,
  isFilterFormBlockUse,
  isPageRouteType,
  isPopupHostUse,
  isTabsRouteType,
} from './placement';
import type { FlowSurfaceWriteTarget } from './types';
const FILTER_TARGET_BLOCK_USES = new Set([
  'TableBlockModel',
  'CalendarBlockModel',
  'KanbanBlockModel',
  'DetailsBlockModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'ChartBlockModel',
  'MapBlockModel',
  'CommentsBlockModel',
]);
const DETAILS_CARD_BLOCK_USES = new Set(['ListBlockModel', 'GridCardBlockModel', 'KanbanBlockModel']);
const DETAILS_CARD_ITEM_USES = new Set(['ListItemModel', 'GridCardItemModel', 'KanbanCardItemModel']);
const RECORD_ACTION_ITEM_USES = new Set(['ListItemModel', 'GridCardItemModel']);
const BLOCK_ACTION_CONTAINER_USES = new Set(['ListBlockModel', 'GridCardBlockModel', 'KanbanBlockModel']);

function getDefaultGridUse(ownerUse: string | undefined, fallbackUse: string) {
  return getApprovalDefaultGridUse(ownerUse) || fallbackUse;
}

function getFieldWrapperUse(containerUse: string | undefined, fallbackUse: string) {
  return getApprovalFieldWrapperUse(containerUse) || fallbackUse;
}

export class FlowSurfaceContextResolver {
  constructor(
    private readonly repository: FlowModelRepository,
    private readonly locator: SurfaceLocator,
    private readonly options: {
      hydrateRoute: (routeLike: any, transaction?: any) => Promise<any>;
      ensureGridChild: (parentUid: string, use: string, transaction?: any) => Promise<string>;
      ensurePopupSurface: (parentUid: string, transaction?: any) => Promise<any>;
      getCollection: (dataSourceKey: string, collectionName: string) => any;
    },
  ) {}

  private resolveBlockCatalogContainerUse(targetNode?: any, resolved?: any) {
    if (!targetNode && !resolved) {
      return undefined;
    }

    if (targetNode?.use?.endsWith?.('GridModel')) {
      return targetNode.use;
    }

    if (targetNode?.subModels?.grid?.use) {
      return targetNode.subModels.grid.use;
    }

    const firstTab = _.castArray(targetNode?.subModels?.tabs || [])[0];
    if (firstTab?.subModels?.grid?.use) {
      return firstTab.subModels.grid.use;
    }

    const directDefaultGridUse = getApprovalDefaultGridUse(targetNode?.use);
    if (directDefaultGridUse) {
      return directDefaultGridUse;
    }

    const firstTabDefaultGridUse = getApprovalDefaultGridUse(firstTab?.use);
    if (firstTabDefaultGridUse) {
      return firstTabDefaultGridUse;
    }

    return undefined;
  }

  filterBlocksByTarget(targetNode?: any, resolved?: any) {
    const containerUse = this.resolveBlockCatalogContainerUse(targetNode, resolved);
    const blocks = getAvailableBlockCatalogItems(containerUse);
    if (!targetNode && !resolved) {
      return blocks;
    }
    if (canCatalogAddBlock({ node: targetNode, resolved })) {
      return blocks;
    }
    return [];
  }

  async resolveFilterFormTarget(filterFormOwnerUid: string, targetBlockUid?: string, transaction?: any) {
    const targets = await this.collectFilterFormTargets(filterFormOwnerUid, transaction);
    if (!targets.length) {
      throwBadRequest('flowSurfaces addField cannot find filter targets on the current surface');
    }

    if (targetBlockUid) {
      const matched = targets.find((item) => item.ownerUid === targetBlockUid);
      if (!matched) {
        throwBadRequest(
          `flowSurfaces addField filter target '${targetBlockUid}' is not available on the current surface`,
        );
      }
      return matched;
    }

    if (targets.length > 1) {
      throwBadRequest(
        'flowSurfaces addField on filter-form requires defaultTargetUid when multiple target blocks are available',
      );
    }

    return targets[0];
  }

  async collectFilterFormTargets(uid: string, transaction?: any) {
    const blockGrid = await this.findOwningBlockGrid(uid, transaction);
    if (!blockGrid?.uid) {
      return [];
    }

    return _.castArray(blockGrid.subModels?.items || [])
      .filter((item: any) => FILTER_TARGET_BLOCK_USES.has(item?.use) && item?.uid)
      .map((item: any) => {
        const resourceInit =
          _.get(item, ['stepParams', 'resourceSettings', 'init']) ||
          (item?.use === 'ChartBlockModel'
            ? getChartBuilderResourceInit(_.get(item, ['stepParams', 'chartSettings', 'configure']))
            : null);
        if (!resourceInit?.dataSourceKey || !resourceInit?.collectionName) {
          return null;
        }
        const collection = this.options.getCollection(resourceInit.dataSourceKey, resourceInit.collectionName);
        return {
          ownerUid: item.uid,
          label:
            _.get(item, ['stepParams', 'cardSettings', 'titleDescription', 'title']) ||
            item?.decoratorProps?.title ||
            item?.props?.title ||
            collection?.title ||
            collection?.name ||
            item.uid,
          resourceInit,
        };
      })
      .filter(Boolean);
  }

  async resolveBlockParent(target: FlowSurfaceWriteTarget, transaction?: any) {
    const resolved = await this.locator.resolve(target, { transaction });
    const node =
      resolved.node || (await this.repository.findModelById(resolved.uid, { transaction, includeAsyncNode: true }));
    const normalizedUse = normalizeApprovalSemanticUse(node?.use);
    if (node?.use?.endsWith('GridModel')) {
      if (isApprovalTaskCardGridUse(node.use)) {
        throwBadRequest(`flowSurfaces addBlock target '${node.use}' does not support blocks`);
      }
      return {
        parentUid: node.uid,
        subKey: 'items',
        subType: 'array',
      };
    }
    if (normalizedUse === 'ChildPageTabModel') {
      return {
        parentUid:
          node?.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(node.uid, getDefaultGridUse(node.use, 'BlockGridModel'), transaction)),
        subKey: 'items',
        subType: 'array',
      };
    }
    if (normalizedUse === 'ChildPageModel') {
      const firstTab = _.castArray(node?.subModels?.tabs || [])[0];
      if (!firstTab?.uid) {
        throwBadRequest(`flowSurfaces addBlock target '${node.use}' is missing its popup tab subtree`);
      }
      return {
        parentUid:
          firstTab?.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(
            firstTab.uid,
            getDefaultGridUse(firstTab.use, 'BlockGridModel'),
            transaction,
          )),
        subKey: 'items',
        subType: 'array',
      };
    }
    if (isPopupHostUse(node?.use) || normalizeApprovalSemanticUse(node?.subModels?.page?.use) === 'ChildPageModel') {
      const popupSurface = await this.options.ensurePopupSurface(node.uid, transaction);
      return {
        parentUid: popupSurface.gridUid,
        subKey: 'items',
        subType: 'array',
        popupSurface,
      };
    }
    if (isTabsRouteType(resolved.tabRoute) || (node?.use === 'RouteModel' && isTabsRouteType(resolved.route))) {
      return {
        parentUid:
          node?.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(
            resolved.tabRoute?.get?.('schemaUid') || node.uid,
            getDefaultGridUse(node?.use, 'BlockGridModel'),
            transaction,
          )),
        subKey: 'items',
        subType: 'array',
      };
    }
    if (isPageRouteType(resolved.pageRoute)) {
      const pageRoute = await this.options.hydrateRoute(resolved.pageRoute, transaction);
      const firstTab = _.sortBy(
        _.castArray(pageRoute?.get?.('children') || pageRoute?.children || []).map((item) => item?.toJSON?.() || item),
        'sort',
      )[0];
      if (!firstTab?.schemaUid) {
        throwBadRequest('flowSurfaces addBlock requires a tab under page');
      }
      return this.resolveBlockParent({ uid: firstTab.schemaUid }, transaction);
    }
    throwBadRequest(`flowSurfaces addBlock target '${node?.use || resolved.uid}' is not a grid surface`);
  }

  async resolveFieldContainer(uid: string, transaction?: any) {
    const target = await this.locator.resolve({ uid }, { transaction });
    const node = target.node || (await this.repository.findModelById(uid, { transaction, includeAsyncNode: true }));
    const use = node?.use;
    const normalizedUse = normalizeApprovalSemanticUse(use);
    if (isFormBlockUse(use)) {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        parentUid:
          node.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(node.uid, getDefaultGridUse(use, 'FormGridModel'), transaction)),
        subKey: 'items',
        subType: 'array',
        wrapperUse: getFieldWrapperUse(use, 'FormItemModel'),
      };
    }
    if (normalizedUse === 'FormGridModel') {
      const parentUid = await this.locator.findParentUid(node.uid, transaction);
      const parent = parentUid ? await this.repository.findModelById(parentUid, { transaction }) : null;
      return {
        ownerUid: parent?.uid || node.uid,
        ownerUse: parent?.use || use,
        parentUid: node.uid,
        subKey: 'items',
        subType: 'array',
        wrapperUse: getFieldWrapperUse(parent?.use || use, 'FormItemModel'),
      };
    }
    if (isDetailsBlockUse(use)) {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        parentUid:
          node.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(node.uid, getDefaultGridUse(use, 'DetailsGridModel'), transaction)),
        subKey: 'items',
        subType: 'array',
        wrapperUse: getFieldWrapperUse(use, 'DetailsItemModel'),
      };
    }
    if (DETAILS_CARD_BLOCK_USES.has(use)) {
      const itemUid = node.subModels?.item?.uid;
      if (!itemUid) {
        throwBadRequest(`flowSurfaces addField target '${use}' is missing its item subtree`);
      }
      return {
        ownerUid: node.uid,
        ownerUse: use,
        parentUid:
          node.subModels?.item?.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(itemUid, 'DetailsGridModel', transaction)),
        subKey: 'items',
        subType: 'array',
        wrapperUse: 'DetailsItemModel',
      };
    }
    if (DETAILS_CARD_ITEM_USES.has(use)) {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        parentUid:
          node.subModels?.grid?.uid || (await this.options.ensureGridChild(node.uid, 'DetailsGridModel', transaction)),
        subKey: 'items',
        subType: 'array',
        wrapperUse: 'DetailsItemModel',
      };
    }
    if (normalizedUse === 'DetailsGridModel') {
      const parentUid = await this.locator.findParentUid(node.uid, transaction);
      const parent = parentUid ? await this.repository.findModelById(parentUid, { transaction }) : null;
      return {
        ownerUid: parent?.uid || node.uid,
        ownerUse: parent?.use || use,
        parentUid: node.uid,
        subKey: 'items',
        subType: 'array',
        wrapperUse: getFieldWrapperUse(parent?.use || use, 'DetailsItemModel'),
      };
    }
    if (isFilterFormBlockUse(use)) {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        parentUid:
          node.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(node.uid, 'FilterFormGridModel', transaction)),
        subKey: 'items',
        subType: 'array',
        wrapperUse: 'FilterFormItemModel',
      };
    }
    if (use === 'FilterFormGridModel') {
      const parentUid = await this.locator.findParentUid(node.uid, transaction);
      const parent = parentUid ? await this.repository.findModelById(parentUid, { transaction }) : null;
      return {
        ownerUid: parent?.uid || node.uid,
        ownerUse: parent?.use || use,
        parentUid: node.uid,
        subKey: 'items',
        subType: 'array',
        wrapperUse: 'FilterFormItemModel',
      };
    }
    if (use === 'TableBlockModel') {
      return {
        ownerUid: node.uid,
        ownerUse: use,
        parentUid: node.uid,
        subKey: 'columns',
        subType: 'array',
        wrapperUse: 'TableColumnModel',
      };
    }
    throwBadRequest(`flowSurfaces addField target '${use || uid}' is not a field container`);
  }

  async resolveActionContainer(target: FlowSurfaceWriteTarget, transaction?: any) {
    const resolved = await this.locator.resolve(target, { transaction });
    const node =
      resolved.node || (await this.repository.findModelById(resolved.uid, { transaction, includeAsyncNode: true }));
    if (
      ['TableBlockModel', 'CalendarBlockModel', 'TableActionsColumnModel'].includes(node?.use) ||
      node?.use === 'ActionPanelBlockModel' ||
      BLOCK_ACTION_CONTAINER_USES.has(node?.use) ||
      RECORD_ACTION_ITEM_USES.has(node?.use)
    ) {
      return {
        parentUid: node.uid,
        subKey: 'actions',
        subType: 'array',
        ownerUid: node.uid,
        ownerUse: node.use,
      };
    }
    if (isFormBlockUse(node?.use) || isDetailsBlockUse(node?.use) || isFilterFormBlockUse(node?.use)) {
      return {
        parentUid: node.uid,
        subKey: 'actions',
        subType: 'array',
        ownerUid: node.uid,
        ownerUse: node.use,
      };
    }
    if (node?.subModels?.actions) {
      return {
        parentUid: node.uid,
        subKey: 'actions',
        subType: 'array',
        ownerUid: node.uid,
        ownerUse: node.use,
      };
    }
    throwBadRequest(`flowSurfaces addAction target '${node?.use || resolved.uid}' is not an action container`);
  }

  async resolveGridNode(uid: string, transaction?: any) {
    const resolved = await this.locator.resolve({ uid }, { transaction });
    const node = resolved.node || (await this.repository.findModelById(uid, { transaction, includeAsyncNode: true }));
    const normalizedUse = normalizeApprovalSemanticUse(node?.use);
    if (node?.use?.endsWith('GridModel')) {
      return node;
    }
    if (
      (resolved.tabRoute?.get?.('type') === 'tabs' || resolved.route?.get?.('type') === 'tabs') &&
      node?.use === 'RouteModel'
    ) {
      return this.repository.findModelById(
        node?.subModels?.grid?.uid ||
          (await this.options.ensureGridChild(
            resolved.tabRoute?.get?.('schemaUid') || node.uid,
            getDefaultGridUse(node?.use, 'BlockGridModel'),
            transaction,
          )),
        { transaction, includeAsyncNode: true },
      );
    }
    if (node?.subModels?.grid?.uid) {
      return this.repository.findModelById(node.subModels.grid.uid, { transaction, includeAsyncNode: true });
    }
    if (normalizedUse === 'ChildPageTabModel') {
      return this.repository.findModelById(
        await this.options.ensureGridChild(node.uid, getDefaultGridUse(node?.use, 'BlockGridModel'), transaction),
        { transaction, includeAsyncNode: true },
      );
    }
    if (normalizedUse === 'ChildPageModel') {
      const firstTab = _.castArray(node?.subModels?.tabs || [])[0];
      if (!firstTab?.uid) {
        throwBadRequest(`flowSurfaces setLayout target '${uid}' is missing its popup tab subtree`);
      }
      const gridUid =
        firstTab?.subModels?.grid?.uid ||
        (await this.options.ensureGridChild(
          firstTab.uid,
          getDefaultGridUse(firstTab.use, 'BlockGridModel'),
          transaction,
        ));
      return this.repository.findModelById(gridUid, { transaction, includeAsyncNode: true });
    }
    if (isFormBlockUse(node?.use)) {
      return this.repository.findModelById(
        await this.options.ensureGridChild(node.uid, getDefaultGridUse(node?.use, 'FormGridModel'), transaction),
        { transaction, includeAsyncNode: true },
      );
    }
    if (isDetailsBlockUse(node?.use)) {
      return this.repository.findModelById(
        await this.options.ensureGridChild(node.uid, getDefaultGridUse(node?.use, 'DetailsGridModel'), transaction),
        { transaction, includeAsyncNode: true },
      );
    }
    if (isFilterFormBlockUse(node?.use)) {
      return this.repository.findModelById(
        await this.options.ensureGridChild(node.uid, 'FilterFormGridModel', transaction),
        { transaction, includeAsyncNode: true },
      );
    }
    throwBadRequest(`flowSurfaces setLayout target '${uid}' is not a grid node`);
  }

  async findOwningBlockGrid(uid: string, transaction?: any) {
    let cursor = uid;
    while (cursor) {
      const node = await this.repository.findModelById(cursor, { transaction, includeAsyncNode: true });
      if (normalizeApprovalSemanticUse(node?.use) === 'BlockGridModel') {
        return node;
      }
      cursor = await this.locator.findParentUid(cursor, transaction);
    }
    return null;
  }
}
