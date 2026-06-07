/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import type { ResourcerContext } from '@nocobase/resourcer';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../constants';
import { ensureDefaultUiLayout } from './ensureDefaultUiLayout';

const EMPTY_DESKTOP_ROUTE_FILTER = {
  id: {
    $eq: null,
  },
};

function getRequestedLayoutUid(layout: unknown) {
  const uid = Array.isArray(layout) ? layout[0] : layout;

  if (typeof uid === 'string' && uid.trim()) {
    return uid;
  }

  return DEFAULT_ADMIN_UI_LAYOUT.uid;
}

function getDesktopRouteLayoutFilterByUid(layoutUid: string) {
  const currentLayoutFilter = {
    'uiLayouts.uid': layoutUid,
  };

  if (layoutUid !== DEFAULT_ADMIN_UI_LAYOUT.uid) {
    return currentLayoutFilter;
  }

  return {
    $or: [currentLayoutFilter, { 'uiLayouts.id.$notExists': true }],
  };
}

async function getDesktopRouteLayoutFilter(ctx: ResourcerContext) {
  const layoutUid = getRequestedLayoutUid(ctx.action?.params.layout);

  if (layoutUid === DEFAULT_ADMIN_UI_LAYOUT.uid) {
    return getDesktopRouteLayoutFilterByUid(layoutUid);
  }

  const uiLayout = await ctx.db.getRepository('uiLayouts').findOne({
    filter: {
      uid: layoutUid,
      enabled: true,
    },
  });

  if (!uiLayout) {
    return EMPTY_DESKTOP_ROUTE_FILTER;
  }

  return getDesktopRouteLayoutFilterByUid(layoutUid);
}

function getRouteValue(route: unknown, key: string) {
  if (!route || typeof route !== 'object') {
    return;
  }

  const maybeModel = route as { get?: (field: string) => unknown };
  if (typeof maybeModel.get === 'function') {
    return maybeModel.get(key);
  }

  return (route as Record<string, unknown>)[key];
}

function collectRouteIds(routes: unknown[], ids: Set<string>) {
  for (const route of routes) {
    const id = getRouteValue(route, 'id');
    if (id !== null && id !== undefined) {
      ids.add(String(id));
    }

    const children = getRouteValue(route, 'children');
    if (Array.isArray(children)) {
      collectRouteIds(children, ids);
    }
  }
}

function removeNestedRootRoutes(routes: unknown) {
  if (!Array.isArray(routes)) {
    return routes;
  }

  const routeIds = new Set<string>();
  collectRouteIds(routes, routeIds);

  return routes.filter((route) => {
    const parentId = getRouteValue(route, 'parentId');
    return parentId === null || parentId === undefined || !routeIds.has(String(parentId));
  });
}

async function addDesktopRouteLayoutFilter(ctx: ResourcerContext, next: () => Promise<void>) {
  ctx.action?.mergeParams({
    filter: await getDesktopRouteLayoutFilter(ctx),
  });

  await next();

  ctx.body = removeNestedRootRoutes(ctx.body);
}

export class PluginUiLayoutServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:listAccessible', addDesktopRouteLayoutFilter);
  }

  async install() {
    await ensureDefaultUiLayout(this.db);
  }

  async afterEnable() {
    await ensureDefaultUiLayout(this.db);
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginUiLayoutServer;
