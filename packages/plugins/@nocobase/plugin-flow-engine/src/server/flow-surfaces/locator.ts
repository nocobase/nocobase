/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type FlowModelRepository from '../repository';
import { normalizeApprovalSemanticUse } from './approval';
import { getChartBuilderResourceInit } from './chart-config';
import { FlowSurfaceBadRequestError } from './errors';
import type { FlowSurfaceReadLocator, FlowSurfaceResolveTarget, FlowSurfaceResolvedTarget } from './types';

export class SurfaceLocator {
  constructor(
    private readonly db: any,
    private readonly repository: FlowModelRepository,
  ) {}

  async resolve(
    target: FlowSurfaceResolveTarget,
    options: { transaction?: any } = {},
  ): Promise<FlowSurfaceResolvedTarget> {
    const transaction = options.transaction;
    if (target.uid) {
      return this.resolveByUid(target.uid, target, transaction);
    }

    if ('tabSchemaUid' in target && target.tabSchemaUid) {
      return this.resolveByUid(target.tabSchemaUid, target, transaction);
    }

    if ('pageSchemaUid' in target && target.pageSchemaUid) {
      return this.resolvePageSchemaUid(target.pageSchemaUid, target, transaction);
    }

    if ('routeId' in target && target.routeId) {
      const route = await this.db.getRepository('desktopRoutes').findOne({
        filterByTk: String(target.routeId),
        transaction,
      });
      if (isPageRoute(route)) {
        return this.resolvePageSchemaUid(route.get('schemaUid'), target, transaction);
      }
      if (route?.get?.('schemaUid')) {
        return this.resolveByUid(route.get('schemaUid'), target, transaction);
      }
    }

    throw new FlowSurfaceBadRequestError('flowSurfaces target not found');
  }

  async findParentUid(uid: string, transaction?: any) {
    const parentPath = await this.db.getRepository('flowModelTreePath').findOne({
      filter: {
        descendant: uid,
        depth: 1,
      },
      transaction,
    });
    return parentPath?.get?.('ancestor') || null;
  }

  async findRouteBySchemaUid(schemaUid: string, transaction?: any) {
    return this.db.getRepository('desktopRoutes').findOne({
      filter: {
        schemaUid,
      },
      transaction,
    });
  }

  async resolveCollectionContext(uid: string, transaction?: any) {
    let cursor = uid;
    while (cursor) {
      const model = await this.repository.findModelById(cursor, { transaction, includeAsyncNode: true });
      const resourceInit =
        _.get(model, ['stepParams', 'resourceSettings', 'init']) ||
        _.get(model, ['stepParams', 'TriggerChildPageSettings', 'init']) ||
        _.get(model, ['stepParams', 'ApprovalChildPageSettings', 'init']) ||
        (model?.use === 'ChartBlockModel'
          ? getChartBuilderResourceInit(_.get(model, ['stepParams', 'chartSettings', 'configure']))
          : null);
      if (resourceInit?.dataSourceKey && resourceInit?.collectionName) {
        return {
          ownerUid: cursor,
          model,
          resourceInit,
        };
      }

      const fieldInit = _.get(model, ['stepParams', 'fieldSettings', 'init']);
      if (fieldInit?.dataSourceKey && fieldInit?.collectionName) {
        return {
          ownerUid: cursor,
          model,
          resourceInit: {
            dataSourceKey: fieldInit.dataSourceKey,
            collectionName: fieldInit.collectionName,
            associationPathName: fieldInit.associationPathName,
          },
        };
      }

      cursor = await this.findParentUid(cursor, transaction);
    }

    return null;
  }

  private async resolveByUid(
    uid: string,
    target: FlowSurfaceResolveTarget,
    transaction?: any,
  ): Promise<FlowSurfaceResolvedTarget> {
    const node = await this.repository.findModelById(uid, { transaction, includeAsyncNode: true });
    const route = await this.findRouteBySchemaUid(uid, transaction);
    if (!node?.uid && !route) {
      throw new FlowSurfaceBadRequestError(`flowSurfaces uid '${uid}' not found`);
    }

    let pageRoute = null;
    let tabRoute = null;
    if (route?.get?.('type') === 'tabs') {
      tabRoute = route;
      pageRoute = route.get('parentId')
        ? await this.db.getRepository('desktopRoutes').findOne({
            filterByTk: String(route.get('parentId')),
            transaction,
          })
        : null;
    } else if (route?.get?.('type') === 'flowPage' || route?.get?.('type') === 'page') {
      pageRoute = route;
    } else if (node?.uid) {
      pageRoute =
        (await this.findPageRouteFromModel(node.uid, transaction).catch(() => {
          return null;
        })) || null;
      tabRoute = await this.findRouteBySchemaUid(node.uid, transaction);
      if (tabRoute?.get?.('type') !== 'tabs') {
        tabRoute = null;
      }
    }

    return {
      target,
      uid: node?.uid || uid,
      kind: tabRoute?.get?.('type') === 'tabs' ? 'tab' : isPageRoute(pageRoute) ? 'page' : inferKind(node?.use),
      node,
      route,
      pageRoute,
      tabRoute,
    };
  }

  private async resolvePageSchemaUid(
    pageSchemaUid: string,
    target: FlowSurfaceReadLocator,
    transaction?: any,
  ): Promise<FlowSurfaceResolvedTarget> {
    const pageModel = await this.repository.findModelByParentId(pageSchemaUid, {
      transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });
    const route = await this.db.getRepository('desktopRoutes').findOne({
      filter: {
        schemaUid: pageSchemaUid,
      },
      transaction,
    });

    if (pageModel?.uid) {
      return {
        target,
        uid: pageModel.uid,
        kind: 'page',
        node: pageModel,
        route,
        pageRoute: route,
        pageModel,
      };
    }

    if (route?.get?.('schemaUid')) {
      return {
        target,
        uid: route.get('schemaUid'),
        kind: 'page',
        route,
        pageRoute: route,
        pageModel,
      };
    }

    throw new FlowSurfaceBadRequestError('flowSurfaces target not found');
  }

  private async findPageRouteFromModel(uid: string, transaction?: any) {
    let cursor = uid;
    while (cursor) {
      const route = await this.findRouteBySchemaUid(cursor, transaction);
      if (route?.get?.('type') === 'flowPage' || route?.get?.('type') === 'page') {
        return route;
      }
      const parentUid = await this.findParentUid(cursor, transaction);
      if (!parentUid) {
        return null;
      }
      cursor = parentUid;
    }
    return null;
  }
}

function inferKind(use?: string): FlowSurfaceResolvedTarget['kind'] {
  const normalized = normalizeApprovalSemanticUse(use);
  if (normalized === 'RouteModel') {
    return 'node';
  }
  if (normalized === 'RootPageModel' || normalized === 'ChildPageModel') {
    return 'page';
  }
  if (normalized === 'RootPageTabModel' || normalized === 'ChildPageTabModel') {
    return 'tab';
  }
  if (/GridModel$/.test(normalized || '')) {
    return 'grid';
  }
  if (/BlockModel$/.test(normalized || '')) {
    return 'block';
  }
  return 'node';
}

function isPageRoute(route?: any) {
  const type = route?.get?.('type') || route?.type;
  return type === 'flowPage' || type === 'page';
}
