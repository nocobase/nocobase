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

const UI_LAYOUT_RUNTIME_FIELDS = [
  'uid',
  'title',
  'layoutType',
  'routeName',
  'routePath',
  'authCheck',
  'enabled',
] as const;

const UI_LAYOUT_MANAGEMENT_ACTIONS = [
  'uiLayouts:list',
  'uiLayouts:get',
  'uiLayouts:create',
  'uiLayouts:update',
  'uiLayouts:destroy',
];

type DesktopRouteCreateValue = Record<string, unknown> & {
  children?: unknown;
  uiLayouts?: unknown;
};

type DesktopRouteLike = Record<string, unknown> & {
  get?: (field: string) => unknown;
  setDataValue?: (field: string, value: unknown) => void;
  _options?: {
    includeNames?: string[];
  };
};

type UiLayoutRuntimeField = (typeof UI_LAYOUT_RUNTIME_FIELDS)[number];

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

function isDesktopRouteCreateValue(value: unknown): value is DesktopRouteCreateValue {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasUiLayout(uiLayout: unknown, layoutUid: string) {
  if (uiLayout === layoutUid) {
    return true;
  }

  return isDesktopRouteCreateValue(uiLayout) && uiLayout.uid === layoutUid;
}

function mergeUiLayoutValue(uiLayouts: unknown, layoutUid: string) {
  if (Array.isArray(uiLayouts)) {
    if (uiLayouts.some((uiLayout) => hasUiLayout(uiLayout, layoutUid))) {
      return uiLayouts;
    }

    return [...uiLayouts, layoutUid];
  }

  if (hasUiLayout(uiLayouts, layoutUid)) {
    return uiLayouts;
  }

  return uiLayouts == null ? [layoutUid] : [uiLayouts, layoutUid];
}

function withDesktopRouteUiLayout(value: unknown, layoutUid: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => withDesktopRouteUiLayout(item, layoutUid));
  }

  if (!isDesktopRouteCreateValue(value)) {
    return value;
  }

  return {
    ...value,
    uiLayouts: mergeUiLayoutValue(value.uiLayouts, layoutUid),
    ...(Array.isArray(value.children) ? { children: withDesktopRouteUiLayout(value.children, layoutUid) } : {}),
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

  const maybeModel = route as DesktopRouteLike;
  if (typeof maybeModel.get === 'function') {
    return maybeModel.get(key);
  }

  return (route as Record<string, unknown>)[key];
}

function getRouteId(route: unknown) {
  const id = getRouteValue(route, 'id');
  return id === null || id === undefined ? undefined : String(id);
}

function getRouteParentId(route: unknown) {
  const parentId = getRouteValue(route, 'parentId');
  return parentId === null || parentId === undefined ? undefined : String(parentId);
}

function setRouteChildren(route: unknown, children: unknown[] | undefined) {
  if (!route || typeof route !== 'object') {
    return;
  }

  const maybeModel = route as DesktopRouteLike;
  if (typeof maybeModel.setDataValue === 'function') {
    maybeModel.setDataValue('children', children);
  } else {
    maybeModel.children = children;
  }

  if (!maybeModel._options) {
    return;
  }

  if (!maybeModel._options.includeNames) {
    maybeModel._options.includeNames = ['children'];
    return;
  }

  if (!maybeModel._options.includeNames.includes('children')) {
    maybeModel._options.includeNames.push('children');
  }
}

function collectRouteIds(routes: unknown[], ids: Set<string>) {
  for (const route of routes) {
    const id = getRouteId(route);
    if (id) {
      ids.add(id);
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
    const parentId = getRouteParentId(route);
    return !parentId || !routeIds.has(parentId);
  });
}

async function addDesktopRouteCreateLayout(ctx: ResourcerContext, next: () => Promise<void>) {
  const layoutUid = getRequestedLayoutUid(ctx.action?.params.layout);
  const uiLayout = await ctx.db.getRepository('uiLayouts').findOne({
    filter: {
      uid: layoutUid,
      enabled: true,
    },
  });

  if (uiLayout) {
    ctx.action?.mergeParams({
      values: withDesktopRouteUiLayout(ctx.action?.params.values, layoutUid),
    });
  }

  await next();
}

function getCurrentRoles(ctx: ResourcerContext) {
  const currentRoles = ctx.state.currentRoles;
  if (!Array.isArray(currentRoles)) {
    return [];
  }

  return currentRoles.filter((role): role is string => typeof role === 'string');
}

async function getAccessibleDesktopRouteIds(ctx: ResourcerContext) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return;
  }

  const roles = await ctx.db.getRepository('roles').find({
    filterByTk: currentRoles,
    appends: ['desktopRoutes'],
  });
  const routeIds = new Set<string>();

  for (const role of roles) {
    const routes = role.get('desktopRoutes');
    if (Array.isArray(routes)) {
      collectRouteIds(routes, routeIds);
    }
  }

  return routeIds;
}

function removeInaccessibleRoute(route: unknown, allowedRouteIds: Set<string> | undefined) {
  if (!route || !allowedRouteIds) {
    return route;
  }

  const id = getRouteId(route);
  if (!id || !allowedRouteIds.has(id)) {
    return null;
  }

  return route;
}

function buildAccessibleRouteTreeWithAncestors(routes: unknown[], accessibleRouteIds: Set<string>) {
  const routeById = new Map<string, unknown>();
  const childrenByParentId = new Map<string, unknown[]>();
  const roots: unknown[] = [];

  for (const route of routes) {
    const id = getRouteId(route);
    if (!id) {
      continue;
    }

    setRouteChildren(route, undefined);
    routeById.set(id, route);
  }

  for (const route of routes) {
    const id = getRouteId(route);
    if (!id || !routeById.has(id)) {
      continue;
    }

    const parentId = getRouteParentId(route);
    if (!parentId || !routeById.has(parentId)) {
      roots.push(route);
      continue;
    }

    const children = childrenByParentId.get(parentId) ?? [];
    children.push(route);
    childrenByParentId.set(parentId, children);
  }

  const visitRoute = (route: unknown, visitingRouteIds: Set<string>): unknown | undefined => {
    const id = getRouteId(route);
    if (!id || visitingRouteIds.has(id)) {
      return undefined;
    }

    visitingRouteIds.add(id);
    const children = childrenByParentId.get(id) ?? [];
    const visibleChildren = children
      .map((child) => visitRoute(child, visitingRouteIds))
      .filter((child): child is unknown => child !== undefined);
    visitingRouteIds.delete(id);

    if (!accessibleRouteIds.has(id) && visibleChildren.length === 0) {
      return undefined;
    }

    setRouteChildren(route, visibleChildren.length > 0 ? visibleChildren : undefined);
    return route;
  };

  return roots
    .map((route) => visitRoute(route, new Set<string>()))
    .filter((route): route is unknown => route !== undefined);
}

async function includeRouteAncestorsForListAccessible(
  ctx: ResourcerContext,
  routes: unknown,
  layoutFilter: Record<string, unknown>,
) {
  if (!Array.isArray(routes) || getCurrentRoles(ctx).includes('root')) {
    return routes;
  }

  const accessibleRouteIds = new Set<string>();
  collectRouteIds(routes, accessibleRouteIds);
  if (accessibleRouteIds.size === 0) {
    return routes;
  }

  const layoutRoutes = await ctx.db.getRepository('desktopRoutes').find({
    sort: 'sort',
    filter: layoutFilter,
  });

  return buildAccessibleRouteTreeWithAncestors(layoutRoutes, accessibleRouteIds);
}

async function addDesktopRouteLayoutFilter(ctx: ResourcerContext, next: () => Promise<void>) {
  const layoutFilter = await getDesktopRouteLayoutFilter(ctx);
  ctx.action?.mergeParams({
    filter: layoutFilter,
  });

  await next();

  ctx.body = removeNestedRootRoutes(await includeRouteAncestorsForListAccessible(ctx, ctx.body, layoutFilter));
}

async function addDesktopRouteGetLayoutFilter(ctx: ResourcerContext, next: () => Promise<void>) {
  ctx.action?.mergeParams({
    filter: await getDesktopRouteLayoutFilter(ctx),
  });

  await next();

  const route = removeInaccessibleRoute(ctx.body, await getAccessibleDesktopRouteIds(ctx));
  if (route === null) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  ctx.body = route;
}

function pickUiLayoutRuntimeFields(record: { get: (field: string) => unknown }) {
  const result = {} as Record<UiLayoutRuntimeField, unknown>;
  for (const field of UI_LAYOUT_RUNTIME_FIELDS) {
    result[field] = record.get(field);
  }
  return result;
}

async function listAccessibleUiLayouts(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = await ctx.db.getRepository('uiLayouts').find({
    filter: {
      enabled: true,
    },
    fields: [...UI_LAYOUT_RUNTIME_FIELDS],
    sort: ['id'],
  });

  ctx.body = records.map((record) => pickUiLayoutRuntimeFields(record));
  await next();
}

export class PluginUiLayoutServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.ui-layout',
      actions: UI_LAYOUT_MANAGEMENT_ACTIONS,
    });
    this.app.acl.allow('uiLayouts', 'listAccessible', 'loggedIn');

    this.app.resourceManager.registerActionHandler('uiLayouts:listAccessible', listAccessibleUiLayouts);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:create', addDesktopRouteCreateLayout);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:listAccessible', addDesktopRouteLayoutFilter);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:getAccessible', addDesktopRouteGetLayoutFilter);
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
