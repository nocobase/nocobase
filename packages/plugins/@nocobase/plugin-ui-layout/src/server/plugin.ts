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
import type { Database, Model, MultipleRelationRepository } from '@nocobase/database';
import { DEFAULT_ADMIN_UI_LAYOUT, NAMESPACE } from '../constants';
import { applyDefaultRoleUiLayoutAccess, ensureDefaultRoleUiLayoutAccess } from './ensureDefaultRoleUiLayoutAccess';
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

const UI_LAYOUT_ROLE_PERMISSION_TARGET_FIELDS = ['uid', 'title', 'layoutType', 'routeName', 'enabled'] as const;

const DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS = ['id', 'title', 'hidden', 'parentId', 'options'] as const;

type MultipleRelationRepositoryWithAdd = MultipleRelationRepository & {
  add: (values: unknown) => Promise<void>;
};

const ROUTES_MANAGEMENT_ACTIONS = ['desktopRoutes:list'];

const ROLE_UI_LAYOUT_PERMISSION_ACTIONS = [
  'rolesUiLayouts:*',
  'rolesUiLayoutDesktopRoutes:*',
  'uiLayouts:listRolePermissionTargets',
  'desktopRoutes:listRolePermissionTargets',
];
const DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG = 'plugin-ui-layout:desktop-route-write-layout';

const DEFAULT_ADMIN_UI_LAYOUT_PROTECTED_FIELDS = [
  'uid',
  'layoutType',
  'routeName',
  'routePath',
  'authCheck',
  'enabled',
] as const;

type DesktopRouteCreateValue = Record<string, unknown> & {
  children?: unknown;
  uiLayouts?: unknown;
};

type UiLayoutActionParams = {
  filter?: Record<string, unknown>;
  filterByTk?: unknown;
  filterByTks?: unknown;
  values?: unknown;
};

type DesktopRouteLike = Record<string, unknown> & {
  get?: (field: string) => unknown;
  setDataValue?: (field: string, value: unknown) => void;
  _options?: {
    includeNames?: string[];
  };
};

type UiLayoutRuntimeField = (typeof UI_LAYOUT_RUNTIME_FIELDS)[number];
type UiLayoutRolePermissionTargetField = (typeof UI_LAYOUT_ROLE_PERMISSION_TARGET_FIELDS)[number];
type DesktopRouteRolePermissionTargetField = (typeof DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS)[number];

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

function hasActionParam(params: unknown, key: string) {
  return !!params && typeof params === 'object' && Object.prototype.hasOwnProperty.call(params, key);
}

function getDesktopRouteLayoutFilterByUid(layoutUid: string) {
  return {
    'uiLayouts.uid': layoutUid,
  };
}

function isDesktopRouteCreateValue(value: unknown): value is DesktopRouteCreateValue {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isUiLayoutActionParams(value: unknown): value is UiLayoutActionParams {
  return isDesktopRouteCreateValue(value);
}

function isDefaultAdminUiLayoutRecord(record: Model) {
  return record.get('uid') === DEFAULT_ADMIN_UI_LAYOUT.uid;
}

function hasUnsafeDefaultAdminUiLayoutValues(values: unknown) {
  if (!isDesktopRouteCreateValue(values)) {
    return false;
  }

  return DEFAULT_ADMIN_UI_LAYOUT_PROTECTED_FIELDS.some(
    (field) => Object.prototype.hasOwnProperty.call(values, field) && values[field] !== DEFAULT_ADMIN_UI_LAYOUT[field],
  );
}

async function findUiLayoutActionTargets(ctx: ResourcerContext) {
  const params = ctx.action?.params;
  if (!isUiLayoutActionParams(params)) {
    return [];
  }

  const repository = ctx.db.getRepository('uiLayouts');
  const filterByTk = params.filterByTk ?? params.filterByTks;
  if (filterByTk !== undefined && filterByTk !== null) {
    return repository.find({
      filterByTk,
    });
  }

  if (params.filter && Object.keys(params.filter).length) {
    return repository.find({
      filter: params.filter,
    });
  }

  return [];
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
  const requestedLayout = ctx.action?.params.layout;
  const layoutUid =
    requestedLayout === undefined ? DEFAULT_ADMIN_UI_LAYOUT.uid : getExplicitRequestedLayoutUid(requestedLayout);
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

function removeNestedRootRoutes(routes: unknown): unknown[] {
  if (!Array.isArray(routes)) {
    return [];
  }

  const routeIds = new Set<string>();
  collectRouteIds(routes, routeIds);

  return routes.filter((route) => {
    const parentId = getRouteParentId(route);
    return !parentId || !routeIds.has(parentId);
  });
}

async function removeRouteIdsWithUnauthorizedAncestors(ctx: ResourcerContext, routeIds: Set<string>) {
  if (routeIds.size === 0) {
    return;
  }

  const parentIdByRouteId = new Map<string, string | undefined>();
  let pendingRouteIds = new Set(routeIds);

  while (pendingRouteIds.size > 0) {
    const routes = await ctx.db.getRepository('desktopRoutes').find({
      fields: ['id', 'parentId'],
      filter: {
        id: Array.from(pendingRouteIds),
      },
    });
    pendingRouteIds = new Set<string>();

    for (const route of routes) {
      const routeId = route.get('id');
      if (routeId === null || routeId === undefined) {
        continue;
      }

      const normalizedRouteId = String(routeId);
      const parentId = route.get('parentId');
      const normalizedParentId = parentId === null || parentId === undefined ? undefined : String(parentId);
      parentIdByRouteId.set(normalizedRouteId, normalizedParentId);

      if (normalizedParentId && !parentIdByRouteId.has(normalizedParentId)) {
        pendingRouteIds.add(normalizedParentId);
      }
    }
  }

  for (const routeId of Array.from(routeIds)) {
    const visitedRouteIds = new Set<string>([routeId]);
    let parentId = parentIdByRouteId.get(routeId);

    while (parentId) {
      if (!routeIds.has(parentId) || visitedRouteIds.has(parentId)) {
        routeIds.delete(routeId);
        break;
      }

      visitedRouteIds.add(parentId);
      parentId = parentIdByRouteId.get(parentId);
    }
  }
}

async function addDesktopRouteWriteLayout(ctx: ResourcerContext, next: () => Promise<void>) {
  const params = ctx.action?.params;
  const hasExplicitLayoutScope = hasActionParam(params, 'layout');
  const explicitLayoutUid = hasExplicitLayoutScope ? getExplicitRequestedLayoutUid(params.layout) : undefined;

  if (hasExplicitLayoutScope && !explicitLayoutUid) {
    ctx.throw(400, ctx.t('Invalid layout scope', { ns: NAMESPACE }));
    return;
  }

  const layoutUid = explicitLayoutUid ?? DEFAULT_ADMIN_UI_LAYOUT.uid;
  const uiLayout = await ctx.db.getRepository('uiLayouts').findOne({
    filter: {
      uid: layoutUid,
      enabled: true,
    },
  });

  if (!uiLayout && hasExplicitLayoutScope) {
    ctx.throw(400, ctx.t('Invalid layout scope', { ns: NAMESPACE }));
    return;
  }

  if (uiLayout) {
    ctx.action?.mergeParams({
      values: withDesktopRouteUiLayout(ctx.action?.params.values, layoutUid),
    });
  }

  await next();
}

async function preventUiLayoutUidChange(ctx: ResourcerContext, next: () => Promise<void>) {
  const values = ctx.action?.params.values;
  if (!isDesktopRouteCreateValue(values) || !Object.prototype.hasOwnProperty.call(values, 'uid')) {
    await next();
    return;
  }

  const requestedUid = values.uid;
  const filterByTk = ctx.action?.params.filterByTk;
  if (
    typeof requestedUid !== 'string' ||
    filterByTk === null ||
    filterByTk === undefined ||
    Array.isArray(filterByTk)
  ) {
    ctx.throw(400, ctx.t('UID cannot be changed', { ns: NAMESPACE }));
    return;
  }

  const record = await ctx.db.getRepository('uiLayouts').findOne({
    filterByTk,
  });
  if (record && record.get('uid') !== requestedUid) {
    ctx.throw(400, ctx.t('UID cannot be changed', { ns: NAMESPACE }));
    return;
  }

  await next();
}

async function preventDefaultAdminUiLayoutUpdate(ctx: ResourcerContext, next: () => Promise<void>) {
  if (!hasUnsafeDefaultAdminUiLayoutValues(ctx.action?.params.values)) {
    await next();
    return;
  }

  const targets = await findUiLayoutActionTargets(ctx);
  if (targets.some(isDefaultAdminUiLayoutRecord)) {
    ctx.throw(400, ctx.t('Default AdminLayout cannot be changed', { ns: NAMESPACE }));
    return;
  }

  await next();
}

async function preventDefaultAdminUiLayoutDestroy(ctx: ResourcerContext, next: () => Promise<void>) {
  const targets = await findUiLayoutActionTargets(ctx);
  if (targets.some(isDefaultAdminUiLayoutRecord)) {
    ctx.throw(400, ctx.t('Default AdminLayout cannot be deleted', { ns: NAMESPACE }));
    return;
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

  const routePermissions = await ctx.db.getRepository('rolesDesktopRoutes').find({
    fields: ['desktopRouteId'],
    filter: {
      roleName: currentRoles,
    },
  });
  const permittedRouteIds = new Set<string>();

  for (const permission of routePermissions) {
    const routeId = permission.get('desktopRouteId');
    if (routeId !== null && routeId !== undefined) {
      permittedRouteIds.add(String(routeId));
    }
  }

  if (permittedRouteIds.size === 0) {
    return permittedRouteIds;
  }

  const layoutRoutes = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    filter: {
      ...getDesktopRouteLayoutFilterByUid(layoutUid),
      id: Array.from(permittedRouteIds),
    },
  });
  const routeIds = new Set<string>();

  for (const route of layoutRoutes) {
    const routeId = route.get('id');
    if (routeId !== null && routeId !== undefined) {
      routeIds.add(String(routeId));
    }
  }

  await removeRouteIdsWithUnauthorizedAncestors(ctx, routeIds);
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

function pickUiLayoutRolePermissionTargetFields(record: { get: (field: string) => unknown }) {
  const result = {} as Record<UiLayoutRolePermissionTargetField, unknown>;
  for (const field of UI_LAYOUT_ROLE_PERMISSION_TARGET_FIELDS) {
    result[field] = record.get(field);
  }
  return result;
}

function pickDesktopRouteRolePermissionTargetFields(
  route: unknown,
): Record<DesktopRouteRolePermissionTargetField | 'children', unknown> {
  const result = {} as Record<DesktopRouteRolePermissionTargetField | 'children', unknown>;
  for (const field of DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS) {
    result[field] = getRouteValue(route, field) ?? null;
  }

  const children = getRouteValue(route, 'children');
  result.children = Array.isArray(children)
    ? children.map((child) => pickDesktopRouteRolePermissionTargetFields(child))
    : [];

  return result;
}

async function listAccessibleUiLayouts(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = await ctx.db.getRepository('uiLayouts').find({
    filter: {
      enabled: true,
    },
    fields: [...UI_LAYOUT_RUNTIME_FIELDS],
    sort: ['uid'],
  });

  ctx.body = records.map((record) => pickUiLayoutRuntimeFields(record));
  await next();
}

async function listEnabledUiLayouts(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = await ctx.db.getRepository('uiLayouts').find({
    filter: {
      enabled: true,
    },
    fields: [...UI_LAYOUT_RUNTIME_FIELDS],
    sort: ['uid'],
  });

  ctx.body = records.map((record) => pickUiLayoutRuntimeFields(record));
  await next();
}

async function listUiLayoutRolePermissionTargets(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = await ctx.db.getRepository('uiLayouts').find({
    filter: {
      enabled: true,
    },
    fields: [...UI_LAYOUT_ROLE_PERMISSION_TARGET_FIELDS],
    sort: ['uid'],
  });

  ctx.body = records.map((record) => pickUiLayoutRolePermissionTargetFields(record));
  await next();
}

async function listDesktopRouteRolePermissionTargets(ctx: ResourcerContext, next: () => Promise<void>) {
  const layoutContext = await getDesktopRouteLayoutContext(ctx);
  if (!layoutContext.valid) {
    ctx.body = [];
    await next();
    return;
  }

  const routes = (await ctx.db.getRepository('desktopRoutes').find({
    tree: true,
    sort: 'sort',
    filter: layoutContext.filter,
    fields: [...DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS],
  })) as unknown[];

  ctx.body = removeNestedRootRoutes(routes).map((route) => pickDesktopRouteRolePermissionTargetFields(route));
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
  const uiLayoutUids =
    Array.isArray(uiLayouts) && uiLayouts.length > 0
      ? Array.from(
          new Set(
            uiLayouts
              .map((uiLayout) => uiLayout.get('uid'))
              .filter((uiLayoutUid): uiLayoutUid is string => typeof uiLayoutUid === 'string' && !!uiLayoutUid),
          ),
        )
      : [DEFAULT_ADMIN_UI_LAYOUT.uid];
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
  const records = roleNames.flatMap((roleName) =>
    uiLayoutUids.map((uiLayoutUid) => ({
      roleName,
      uiLayoutUid,
      desktopRouteId,
    })),
  );

  for (const values of records) {
    await repository.firstOrCreate({
      filterKeys: ['roleName', 'uiLayoutUid', 'desktopRouteId'],
      values,
      transaction: options?.transaction,
    });
  }
}

async function syncExplicitLegacyRoleDesktopRouteAdd(
  db: Database,
  roleName: unknown,
  desktopRouteIds: unknown,
  options?: DatabaseHookOptions,
) {
  if (typeof roleName !== 'string' || !roleName || !db.getCollection('rolesDesktopRoutes')) {
    return;
  }

  const normalizedDesktopRouteIds = (Array.isArray(desktopRouteIds) ? desktopRouteIds : [desktopRouteIds]).filter(
    (desktopRouteId) => desktopRouteId !== null && desktopRouteId !== undefined,
  );
  if (!normalizedDesktopRouteIds.length) {
    return;
  }

  const permissions = await db.getRepository('rolesDesktopRoutes').find({
    fields: ['roleName', 'desktopRouteId'],
    filter: {
      roleName,
      desktopRouteId: normalizedDesktopRouteIds,
    },
    transaction: options?.transaction,
  });

  await syncLegacyRoleDesktopRoutePermissions(db, permissions, {
    ...options,
    defaultUnassignedToAdminLayout: true,
  });
}

export class PluginUiLayoutServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.routes',
      actions: ROUTES_MANAGEMENT_ACTIONS,
    });
    this.app.acl.registerSnippet({
      name: 'pm.acl.roles',
      actions: ROLE_UI_LAYOUT_PERMISSION_ACTIONS,
    });
    this.app.acl.allow('uiLayouts', 'listEnabled', 'public');
    this.app.acl.allow('uiLayouts', 'listAccessible', 'loggedIn');

    this.app.resourceManager.registerActionHandler('uiLayouts:listEnabled', listEnabledUiLayouts);
    this.app.resourceManager.registerActionHandler('uiLayouts:listAccessible', listAccessibleUiLayouts);
    this.app.resourceManager.registerActionHandler(
      'uiLayouts:listRolePermissionTargets',
      listUiLayoutRolePermissionTargets,
    );
    this.app.resourceManager.registerActionHandler(
      'desktopRoutes:listRolePermissionTargets',
      listDesktopRouteRolePermissionTargets,
    );
    this.app.resourceManager.registerActionHandler('roles.desktopRoutes:add', async (ctx: ResourcerContext, next) => {
      const repository = (ctx.db as Database).getRepository<MultipleRelationRepositoryWithAdd>(
        ctx.action.resourceName,
        ctx.action.sourceId,
      );
      const values = ctx.action.params.filterByTk || ctx.action.params.filterByTks || ctx.action.params.values;

      await repository.add(values);
      await syncExplicitLegacyRoleDesktopRouteAdd(this.app.db, ctx.action.sourceId, values);

      ctx.status = 200;
      await next();
    });
    this.app.resourceManager.registerPreActionHandler('uiLayouts:update', preventUiLayoutUidChange);
    this.app.resourceManager.registerPreActionHandler('uiLayouts:update', preventDefaultAdminUiLayoutUpdate);
    this.app.resourceManager.registerPreActionHandler('uiLayouts:destroy', preventDefaultAdminUiLayoutDestroy);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:create', addDesktopRouteWriteLayout, {
      tag: DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG,
    });
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:updateOrCreate', addDesktopRouteWriteLayout, {
      tag: DESKTOP_ROUTE_WRITE_LAYOUT_HANDLER_TAG,
    });
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:listAccessible', addDesktopRouteLayoutFilter);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:getAccessible', addDesktopRouteGetLayoutFilter);
    this.app.db.on('roles.beforeCreate', (role: Model) => {
      applyDefaultRoleUiLayoutAccess(role);
    });
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
    await ensureDefaultRoleUiLayoutAccess(this.db);
    await syncExistingLegacyRoleDesktopRoutePermissions(this.db);
  }

  async afterEnable() {
    await ensureDefaultUiLayout(this.db);
    await ensureDefaultRoleUiLayoutAccess(this.db);
    await syncExistingLegacyRoleDesktopRoutePermissions(this.db);
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginUiLayoutServer;
