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
import type { Database, Model } from '@nocobase/database';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../constants';
import { ensureDefaultUiLayout } from './ensureDefaultUiLayout';
import {
  type DatabaseHookOptions,
  removeLegacyRoleDesktopRoutePermissions,
  syncExistingLegacyRoleDesktopRoutePermissions,
  syncLegacyRoleDesktopRoutePermissions,
} from './syncLegacyRoleLayoutPermissions';

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

const ROLE_UI_LAYOUT_PERMISSION_ACTIONS = ['rolesUiLayouts:*', 'rolesUiLayoutDesktopRoutes:*'];

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

type DesktopRouteLayoutContext = {
  filter: Record<string, unknown>;
  layoutUid?: string;
  valid: boolean;
};

function getRequestedLayoutUid(layout: unknown) {
  return getExplicitRequestedLayoutUid(layout) ?? DEFAULT_ADMIN_UI_LAYOUT.uid;
}

function getExplicitRequestedLayoutUid(layout: unknown) {
  const uid = Array.isArray(layout) ? layout[0] : layout;

  if (typeof uid === 'string' && uid.trim()) {
    return uid;
  }
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

async function getDesktopRouteLayoutContext(ctx: ResourcerContext): Promise<DesktopRouteLayoutContext> {
  const layoutUid = getExplicitRequestedLayoutUid(ctx.action?.params.layout);
  if (!layoutUid) {
    return {
      filter: EMPTY_DESKTOP_ROUTE_FILTER,
      valid: false,
    };
  }

  const uiLayout = await ctx.db.getRepository('uiLayouts').findOne({
    filter: {
      uid: layoutUid,
      enabled: true,
    },
  });

  if (!uiLayout) {
    return {
      filter: EMPTY_DESKTOP_ROUTE_FILTER,
      layoutUid,
      valid: false,
    };
  }

  return {
    filter: getDesktopRouteLayoutFilterByUid(layoutUid),
    layoutUid,
    valid: true,
  };
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

async function includeDescendantRouteIds(ctx: ResourcerContext, routeIds: Set<string>) {
  let pendingParentIds = new Set(routeIds);

  while (pendingParentIds.size > 0) {
    const childRoutes = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id', 'parentId'],
      filter: {
        parentId: Array.from(pendingParentIds),
      },
    });
    pendingParentIds = new Set<string>();

    for (const route of childRoutes) {
      const routeId = route.get('id');
      if (routeId === null || routeId === undefined) {
        continue;
      }

      const normalizedRouteId = String(routeId);
      if (routeIds.has(normalizedRouteId)) {
        continue;
      }

      routeIds.add(normalizedRouteId);
      pendingParentIds.add(normalizedRouteId);
    }
  }
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

async function getLayoutAccessibleRouteIds(ctx: ResourcerContext, layoutUid: string) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return;
  }

  const scopedRoutePermissions = await ctx.db.getRepository('rolesUiLayoutDesktopRoutes').find({
    fields: ['desktopRouteId'],
    filter: {
      roleName: currentRoles,
      uiLayoutUid: layoutUid,
    },
  });
  const routeIds = new Set<string>();

  for (const permission of scopedRoutePermissions) {
    const routeId = permission.get('desktopRouteId');
    if (routeId !== null && routeId !== undefined) {
      routeIds.add(String(routeId));
    }
  }

  await includeDescendantRouteIds(ctx, routeIds);
  return routeIds;
}

async function canAccessLayout(ctx: ResourcerContext, layoutUid: string) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return true;
  }

  if (!currentRoles.length) {
    return false;
  }

  const count = await ctx.db.getRepository('rolesUiLayouts').count({
    filter: {
      roleName: currentRoles,
      uiLayoutUid: layoutUid,
    },
  });

  return count > 0;
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
  const layoutContext = await getDesktopRouteLayoutContext(ctx);
  ctx.action?.mergeParams({
    filter: layoutContext.filter,
  });

  await next();

  if (!layoutContext.valid || !layoutContext.layoutUid) {
    ctx.body = [];
    return;
  }

  if (getCurrentRoles(ctx).includes('root')) {
    ctx.body = removeNestedRootRoutes(
      await includeRouteAncestorsForListAccessible(ctx, ctx.body, layoutContext.filter),
    );
    return;
  }

  if (!(await canAccessLayout(ctx, layoutContext.layoutUid))) {
    ctx.body = [];
    return;
  }

  const routeIds = await getLayoutAccessibleRouteIds(ctx, layoutContext.layoutUid);
  if (!routeIds || routeIds.size === 0) {
    ctx.body = [];
    return;
  }

  const routes = await ctx.db.getRepository('desktopRoutes').find({
    tree: true,
    sort: 'sort',
    filter: {
      ...ctx.action?.params.filter,
      id: Array.from(routeIds),
    },
  });
  ctx.body = removeNestedRootRoutes(await includeRouteAncestorsForListAccessible(ctx, routes, layoutContext.filter));
}

async function addDesktopRouteGetLayoutFilter(ctx: ResourcerContext, next: () => Promise<void>) {
  const layoutContext = await getDesktopRouteLayoutContext(ctx);
  ctx.action?.mergeParams({
    filter: layoutContext.filter,
  });

  await next();

  if (!layoutContext.valid || !layoutContext.layoutUid) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  if (getCurrentRoles(ctx).includes('root')) {
    if (ctx.body) {
      return;
    }
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  if (!(await canAccessLayout(ctx, layoutContext.layoutUid))) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  const routeIds = await getLayoutAccessibleRouteIds(ctx, layoutContext.layoutUid);
  let route = removeInaccessibleRoute(ctx.body, routeIds);
  if (!route && routeIds && routeIds.size > 0) {
    route = await ctx.db.getRepository('desktopRoutes').findOne({
      sort: 'sort',
      ...ctx.action?.params,
      filter: {
        ...ctx.action?.params.filter,
        id: Array.from(routeIds),
      },
    });
  }

  if (route == null) {
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
  const currentRoles = getCurrentRoles(ctx);
  const filter: Record<string, unknown> = {
    enabled: true,
  };

  if (!currentRoles.includes('root')) {
    const permissions = await ctx.db.getRepository('rolesUiLayouts').find({
      fields: ['uiLayoutUid'],
      filter: {
        roleName: currentRoles,
      },
    });
    const uiLayoutUids = Array.from(
      new Set(
        permissions
          .map((permission) => permission.get('uiLayoutUid'))
          .filter((uiLayoutUid): uiLayoutUid is string => typeof uiLayoutUid === 'string' && !!uiLayoutUid),
      ),
    );

    filter.uid = uiLayoutUids.length > 0 ? uiLayoutUids : { $eq: null };
  }

  const records = await ctx.db.getRepository('uiLayouts').find({
    filter,
    fields: [...UI_LAYOUT_RUNTIME_FIELDS],
    sort: ['id'],
  });

  ctx.body = records.map((record) => pickUiLayoutRuntimeFields(record));
  await next();
}

async function grantDefaultAccessToNewUiLayout(db: Database, uiLayout: Model, options?: DatabaseHookOptions) {
  if (uiLayout.get('enabled') !== true) {
    return;
  }
  const uiLayoutUid = uiLayout.get('uid');
  if (typeof uiLayoutUid !== 'string' || !uiLayoutUid) {
    return;
  }
  if (!db.getCollection('roles') || !db.getCollection('rolesUiLayouts')) {
    return;
  }

  const roles = await db.getRepository('roles').find({
    fields: ['name'],
    filter: {
      allowNewUiLayout: true,
    },
    transaction: options?.transaction,
  });
  const records = roles
    .map((role) => role.get('name'))
    .filter((roleName): roleName is string => typeof roleName === 'string' && !!roleName)
    .map((roleName) => ({
      roleName,
      uiLayoutUid,
    }));

  if (!records.length) {
    return;
  }

  const repository = db.getRepository('rolesUiLayouts');
  for (const values of records) {
    await repository.firstOrCreate({
      filterKeys: ['roleName', 'uiLayoutUid'],
      values,
      transaction: options?.transaction,
    });
  }
}

async function grantDefaultMenuAccessToNewDesktopRoute(
  db: Database,
  desktopRoute: Model,
  options?: DatabaseHookOptions,
) {
  const desktopRouteId = desktopRoute.get('id');
  if (desktopRouteId === null || desktopRouteId === undefined) {
    return;
  }
  if (
    !db.getCollection('roles') ||
    !db.getCollection('desktopRoutes') ||
    !db.getCollection('rolesUiLayouts') ||
    !db.getCollection('rolesUiLayoutDesktopRoutes')
  ) {
    return;
  }

  const route = await db.getRepository('desktopRoutes').findOne({
    filterByTk: desktopRouteId,
    appends: ['uiLayouts'],
    transaction: options?.transaction,
  });
  const uiLayouts = route?.get('uiLayouts');
  if (!Array.isArray(uiLayouts) || uiLayouts.length === 0) {
    return;
  }
  const uiLayoutUids = Array.from(
    new Set(
      uiLayouts
        .map((uiLayout) => uiLayout.get('uid'))
        .filter((uiLayoutUid): uiLayoutUid is string => typeof uiLayoutUid === 'string' && !!uiLayoutUid),
    ),
  );
  if (!uiLayoutUids.length) {
    return;
  }

  const roles = await db.getRepository('roles').find({
    fields: ['name'],
    filter: {
      allowNewMenu: true,
    },
    transaction: options?.transaction,
  });
  const roleNames = roles
    .map((role) => role.get('name'))
    .filter((roleName): roleName is string => typeof roleName === 'string' && !!roleName);
  if (!roleNames.length) {
    return;
  }

  const repository = db.getRepository('rolesUiLayoutDesktopRoutes');
  const layoutAccessRecords = await db.getRepository('rolesUiLayouts').find({
    fields: ['roleName', 'uiLayoutUid'],
    filter: {
      roleName: roleNames,
      uiLayoutUid: uiLayoutUids,
    },
    transaction: options?.transaction,
  });
  const records = layoutAccessRecords
    .map((layoutAccess) => {
      const roleName = layoutAccess.get('roleName');
      const uiLayoutUid = layoutAccess.get('uiLayoutUid');
      if (typeof roleName !== 'string' || !roleName || typeof uiLayoutUid !== 'string' || !uiLayoutUid) {
        return;
      }

      return {
        roleName,
        uiLayoutUid,
        desktopRouteId,
      };
    })
    .filter((record): record is { roleName: string; uiLayoutUid: string; desktopRouteId: unknown } => !!record);

  for (const values of records) {
    await repository.firstOrCreate({
      filterKeys: ['roleName', 'uiLayoutUid', 'desktopRouteId'],
      values,
      transaction: options?.transaction,
    });
  }
}

export class PluginUiLayoutServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.ui-layout',
      actions: UI_LAYOUT_MANAGEMENT_ACTIONS,
    });
    this.app.acl.registerSnippet({
      name: 'pm.acl.roles',
      actions: ROLE_UI_LAYOUT_PERMISSION_ACTIONS,
    });
    this.app.acl.allow('uiLayouts', 'listAccessible', 'loggedIn');

    this.app.resourceManager.registerActionHandler('uiLayouts:listAccessible', listAccessibleUiLayouts);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:create', addDesktopRouteCreateLayout);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:listAccessible', addDesktopRouteLayoutFilter);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:getAccessible', addDesktopRouteGetLayoutFilter);
    this.app.db.on('uiLayouts.afterCreate', async (uiLayout: Model, options?: DatabaseHookOptions) => {
      await grantDefaultAccessToNewUiLayout(this.app.db, uiLayout, options);
    });
    this.app.db.on(
      'desktopRoutes.afterCreateWithAssociations',
      async (desktopRoute: Model, options?: DatabaseHookOptions) => {
        await grantDefaultMenuAccessToNewDesktopRoute(this.app.db, desktopRoute, options);
      },
    );
    this.app.db.on(
      'rolesDesktopRoutes.afterBulkCreate',
      async (permissions: Model[], options?: DatabaseHookOptions) => {
        await syncLegacyRoleDesktopRoutePermissions(this.app.db, permissions, options);
      },
    );
    this.app.db.on('rolesDesktopRoutes.beforeBulkDestroy', async (options?: DatabaseHookOptions) => {
      if (!this.app.db.getCollection('rolesDesktopRoutes') || !options?.where) {
        return;
      }

      const permissions = await this.app.db.getRepository('rolesDesktopRoutes').find({
        where: options.where,
        transaction: options.transaction,
      });
      await removeLegacyRoleDesktopRoutePermissions(this.app.db, permissions, options);
    });
  }

  async install() {
    await ensureDefaultUiLayout(this.db);
    await syncExistingLegacyRoleDesktopRoutePermissions(this.db);
  }

  async afterEnable() {
    await ensureDefaultUiLayout(this.db);
    await syncExistingLegacyRoleDesktopRoutePermissions(this.db);
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginUiLayoutServer;
