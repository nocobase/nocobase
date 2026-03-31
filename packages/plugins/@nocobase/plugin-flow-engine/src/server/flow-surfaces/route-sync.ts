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
import { buildSyntheticRootPageTabModel } from './builder';

export class FlowSurfaceRouteSync {
  constructor(
    private readonly db: any,
    private readonly repository: FlowModelRepository,
  ) {}

  async buildPageTree(pageRouteLike: any, transaction?: any) {
    const pageRoute = await this.hydrateRoute(pageRouteLike, transaction);
    const pageSchemaUid = pageRoute?.get?.('schemaUid') || pageRoute?.schemaUid;
    const pageModel = await this.repository.findModelByParentId(pageSchemaUid, {
      transaction,
      subKey: 'page',
      includeAsyncNode: true,
    });
    const tabs = await Promise.all(
      _.sortBy(
        _.castArray(pageRoute?.get?.('children') || pageRoute?.children || []),
        (item: any) => item?.get?.('sort') ?? item?.sort,
      ).map((route) => this.buildTabAnchor(route, transaction)),
    );
    const routeBacked = this.readPageRouteBackedState(pageRoute, pageModel);

    if (pageModel?.uid) {
      return {
        ...pageModel,
        props: {
          ...(pageModel.props || {}),
          routeId: pageRoute?.get?.('id') || pageRoute?.id,
          ...routeBacked,
        },
        stepParams: {
          ...(pageModel.stepParams || {}),
          pageSettings: {
            ...(pageModel.stepParams?.pageSettings || {}),
            general: {
              ...(pageModel.stepParams?.pageSettings?.general || {}),
              ...routeBacked,
            },
          },
        },
        subModels: {
          ...(pageModel.subModels || {}),
          tabs,
        },
      };
    }

    return {
      uid: pageSchemaUid,
      use: 'RootPageModel',
      props: {
        routeId: pageRoute?.get?.('id') || pageRoute?.id,
        ...routeBacked,
      },
      stepParams: {
        pageSettings: {
          general: {
            ...routeBacked,
          },
        },
      },
      subModels: {
        tabs,
      },
    };
  }

  async buildTabAnchor(tabRouteLike: any, transaction?: any) {
    const tabRoute = await this.hydrateRoute(tabRouteLike, transaction);
    const schemaUid = tabRoute?.get?.('schemaUid') || tabRoute?.schemaUid;
    const routeNode = await this.repository.findModelById(schemaUid, {
      transaction,
      includeAsyncNode: true,
    });
    const grid =
      routeNode?.subModels?.grid ||
      (await this.repository.findModelByParentId(schemaUid, {
        transaction,
        subKey: 'grid',
        includeAsyncNode: true,
      }));

    return buildSyntheticRootPageTabModel({
      uid: schemaUid,
      use: routeNode?.use || 'RootPageTabModel',
      props: routeNode?.props || {},
      decoratorProps: routeNode?.decoratorProps || {},
      flowRegistry: readRouteOptions(tabRoute).flowRegistry || routeNode?.flowRegistry || {},
      stepParams: routeNode?.stepParams || {},
      route: tabRoute?.toJSON?.() || tabRoute,
      title: readRouteProp(tabRoute, 'title'),
      icon: readRouteProp(tabRoute, 'icon'),
      documentTitle: readRouteOptions(tabRoute).documentTitle,
      grid,
    });
  }

  async removeRouteAnchorChildren(schemaUid: string, transaction?: any) {
    if (!schemaUid) {
      return;
    }
    const node = await this.repository.findModelById(schemaUid, {
      transaction,
      includeAsyncNode: true,
    });
    const children = Object.values(node?.subModels || {}).flatMap((value) => _.castArray(value as any));
    for (const child of children) {
      await this.repository.remove(child.uid, { transaction });
    }

    const asyncGridChild = await this.repository.findModelByParentId(schemaUid, {
      transaction,
      subKey: 'grid',
      includeAsyncNode: true,
    });
    if (asyncGridChild?.uid) {
      await this.repository.remove(asyncGridChild.uid, { transaction });
    }
  }

  async removeTabAnchorTree(schemaUid: string, transaction?: any) {
    const tabAnchor = await this.findPersistedTabAnchor(schemaUid, transaction);
    if (tabAnchor?.uid) {
      await this.repository.remove(tabAnchor.uid, { transaction });
      return;
    }
    await this.removeRouteAnchorChildren(schemaUid, transaction);
  }

  async persistPageSettings(target: any, current: any, nextPayload: Record<string, any>, transaction?: any) {
    const route = await this.hydrateRoute(target.pageRoute, transaction);
    const routeValues = this.buildPageRoutePatch(current, nextPayload, route);

    if (Object.keys(routeValues).length) {
      await this.db.getRepository('desktopRoutes').update({
        filterByTk: String(route.get('id')),
        values: routeValues,
        transaction,
      });
    }

    const pageSchemaUid = route?.get?.('schemaUid') || route?.schemaUid;
    const pageModel =
      target.pageModel ||
      (pageSchemaUid
        ? await this.repository.findModelByParentId(pageSchemaUid, {
            transaction,
            subKey: 'page',
            includeAsyncNode: true,
          })
        : null);
    if (pageModel?.uid) {
      await this.repository.patch(
        {
          ...this.normalizePagePayload(current, nextPayload, routeValues),
          uid: pageModel.uid,
        },
        { transaction },
      );
    }
  }

  async persistTabSettings(target: any, current: any, nextPayload: Record<string, any>, transaction?: any) {
    const route = await this.hydrateRoute(target.tabRoute, transaction);
    const routeValues = this.buildTabRoutePatch(current, nextPayload, route);
    if (Object.keys(routeValues).length) {
      await this.db.getRepository('desktopRoutes').update({
        filterByTk: String(route.get('id')),
        values: routeValues,
        transaction,
      });
    }

    const tabAnchor = await this.findPersistedTabAnchor(target.uid || current?.uid, transaction);
    if (!tabAnchor?.uid) {
      return;
    }

    const latestRoute = await this.hydrateRoute(target.tabRoute, transaction);
    await this.repository.patch(
      this.normalizeTabPayload(await this.buildTabAnchor(latestRoute, transaction), nextPayload, routeValues),
      { transaction },
    );
  }

  async findPersistedTabAnchor(schemaUid: string, transaction?: any) {
    const node = await this.repository.findModelById(schemaUid, {
      transaction,
      includeAsyncNode: true,
    });
    if (node?.use === 'RootPageTabModel' || node?.use === 'ChildPageTabModel') {
      return node;
    }
    return null;
  }

  async hydrateRoute(routeLike: any, transaction?: any) {
    if (!routeLike?.get?.('id')) {
      return routeLike;
    }
    return this.db.getRepository('desktopRoutes').findOne({
      filterByTk: String(routeLike.get('id')),
      appends: ['children'],
      transaction,
    });
  }

  private readPageRouteBackedState(route: any, pageModel?: any) {
    return {
      title:
        readRouteProp(route, 'title') ?? pageModel?.props?.title ?? pageModel?.stepParams?.pageSettings?.general?.title,
      icon:
        readRouteProp(route, 'icon') ?? pageModel?.props?.icon ?? pageModel?.stepParams?.pageSettings?.general?.icon,
      enableTabs: !!(
        readRouteProp(route, 'enableTabs') ??
        pageModel?.props?.enableTabs ??
        pageModel?.stepParams?.pageSettings?.general?.enableTabs
      ),
      enableHeader: firstDefined(
        readRouteProp(route, 'enableHeader'),
        pageModel?.props?.enableHeader,
        pageModel?.stepParams?.pageSettings?.general?.enableHeader,
      ),
      displayTitle: !!(
        readRouteProp(route, 'displayTitle') ??
        pageModel?.props?.displayTitle ??
        pageModel?.stepParams?.pageSettings?.general?.displayTitle ??
        true
      ),
    };
  }

  private buildPageRoutePatch(current: any, nextPayload: Record<string, any>, route: any) {
    const nextProps = nextPayload.props || {};
    const nextGeneral = nextPayload.stepParams?.pageSettings?.general || {};
    const routePatch: Record<string, any> = {};
    const nextTitle = firstDefined(nextGeneral.title, nextProps.title);
    const nextIcon = firstDefined(nextGeneral.icon, nextProps.icon);
    const nextEnableTabs = firstDefined(nextGeneral.enableTabs, nextProps.enableTabs);
    const nextEnableHeader = firstDefined(nextGeneral.enableHeader, nextProps.enableHeader);
    const nextDisplayTitle = firstDefined(nextGeneral.displayTitle, nextProps.displayTitle);

    if (!_.isUndefined(nextTitle)) {
      routePatch.title = nextTitle;
    }
    if (!_.isUndefined(nextIcon)) {
      routePatch.icon = nextIcon;
    }
    if (!_.isUndefined(nextEnableTabs)) {
      routePatch.enableTabs = !!nextEnableTabs;
    }
    if (!_.isUndefined(nextEnableHeader)) {
      routePatch.enableHeader = !!nextEnableHeader;
    }
    if (!_.isUndefined(nextDisplayTitle)) {
      routePatch.displayTitle = !!nextDisplayTitle;
    }

    if (!Object.keys(routePatch).length) {
      return {};
    }

    return {
      title: routePatch.title ?? readRouteProp(route, 'title') ?? current?.props?.title,
      ...(!_.isUndefined(routePatch.icon) ? { icon: routePatch.icon } : {}),
      enableTabs: routePatch.enableTabs ?? !!(readRouteProp(route, 'enableTabs') ?? current?.props?.enableTabs),
      ...(!_.isUndefined(routePatch.enableHeader)
        ? { enableHeader: routePatch.enableHeader }
        : !_.isUndefined(readRouteProp(route, 'enableHeader'))
          ? { enableHeader: !!readRouteProp(route, 'enableHeader') }
          : {}),
      displayTitle:
        routePatch.displayTitle ??
        !!(
          readRouteProp(route, 'displayTitle') ??
          current?.props?.displayTitle ??
          current?.stepParams?.pageSettings?.general?.displayTitle ??
          true
        ),
    };
  }

  private normalizePagePayload(current: any, nextPayload: Record<string, any>, routePatch: Record<string, any>) {
    if (!Object.keys(routePatch).length) {
      return nextPayload;
    }
    const pageSettings = current?.stepParams?.pageSettings || {};
    const nextPageSettings = nextPayload.stepParams?.pageSettings || {};
    return {
      ...nextPayload,
      props: {
        ...(current?.props || {}),
        ...(nextPayload.props || {}),
        ...routePatch,
      },
      stepParams: {
        ...(current?.stepParams || {}),
        ...(nextPayload.stepParams || {}),
        pageSettings: {
          ...pageSettings,
          ...nextPageSettings,
          general: {
            ...(pageSettings.general || {}),
            ...(nextPageSettings.general || {}),
            ...routePatch,
          },
        },
      },
    };
  }

  private buildTabRoutePatch(_current: any, nextPayload: Record<string, any>, route: any) {
    const nextProps = nextPayload.props || {};
    const nextTab = nextPayload.stepParams?.pageTabSettings?.tab || {};
    const routeOptions = readRouteOptions(route);
    const patch: Record<string, any> = {};
    const nextTitle = firstDefined(nextTab.title, nextProps.title);
    const nextIcon = firstDefined(nextTab.icon, nextProps.icon);

    if (!_.isUndefined(nextTitle)) {
      patch.title = nextTitle;
    }
    if (!_.isUndefined(nextIcon)) {
      patch.icon = nextIcon;
    }

    const nextOptions = {
      ...(routeOptions || {}),
      ...(!_.isUndefined(nextTab.documentTitle) ? { documentTitle: nextTab.documentTitle } : {}),
      ...(!_.isUndefined(nextPayload.flowRegistry) ? { flowRegistry: nextPayload.flowRegistry } : {}),
    };

    if (!_.isEqual(nextOptions, routeOptions || {})) {
      patch.options = nextOptions;
    }

    if (!Object.keys(patch).length) {
      return {};
    }

    return {
      ...(!_.isUndefined(patch.title) ? { title: patch.title } : {}),
      ...(!_.isUndefined(patch.icon) ? { icon: patch.icon } : {}),
      ...(patch.options ? { options: patch.options } : {}),
    };
  }

  normalizeTabPayload(current: any, nextPayload: Record<string, any>, routePatch: Record<string, any>) {
    const currentTab = current?.stepParams?.pageTabSettings?.tab || {};
    const nextTab = nextPayload.stepParams?.pageTabSettings?.tab || {};
    const routeBackedTab = {
      ...(!_.isUndefined(routePatch.title) ? { title: routePatch.title } : {}),
      ...(!_.isUndefined(routePatch.icon) ? { icon: routePatch.icon } : {}),
      ...(!_.isUndefined(routePatch.options?.documentTitle) ? { documentTitle: routePatch.options.documentTitle } : {}),
    };

    return {
      ...nextPayload,
      props: {
        ...(current?.props || {}),
        ...(nextPayload.props || {}),
        ..._.pick(routeBackedTab, ['title', 'icon']),
      },
      stepParams: {
        ...(current?.stepParams || {}),
        ...(nextPayload.stepParams || {}),
        pageTabSettings: {
          ...(current?.stepParams?.pageTabSettings || {}),
          ...(nextPayload.stepParams?.pageTabSettings || {}),
          tab: {
            ...currentTab,
            ...nextTab,
            ...routeBackedTab,
          },
        },
      },
      flowRegistry: !_.isUndefined(routePatch.options?.flowRegistry)
        ? routePatch.options.flowRegistry
        : !_.isUndefined(nextPayload.flowRegistry)
          ? nextPayload.flowRegistry
          : current?.flowRegistry,
    };
  }
}

function readRouteProp(route: any, key: string) {
  return route?.get?.(key) ?? route?.[key];
}

function readRouteOptions(route: any) {
  return route?.get?.('options') || route?.options || {};
}

function firstDefined<T>(...values: T[]): T | undefined {
  return values.find((value) => !_.isUndefined(value));
}
