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
import type { Database, Model, Transaction } from '@nocobase/database';
import {
  applyDefaultRoleMultiPortalAccess,
  ensureDefaultRoleMultiPortalAccess,
} from './ensureDefaultRoleMultiPortalAccess';

const MULTI_PORTAL_RUNTIME_FIELDS = ['uid', 'title', 'routeName', 'routePath', 'authCheck', 'enabled'] as const;
const MULTI_PORTAL_RUNTIME_QUERY_FIELDS = [...MULTI_PORTAL_RUNTIME_FIELDS, 'uiLayoutUid'] as const;
const MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS = ['layoutType'] as const;
const DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS = ['id', 'title', 'hidden', 'parentId', 'options'] as const;
const MULTI_PORTAL_MANAGEMENT_ACTIONS = [
  'multiPortals:list',
  'multiPortals:get',
  'multiPortals:create',
  'multiPortals:update',
  'multiPortals:destroy',
];
const ROLE_MULTI_PORTAL_PERMISSION_ACTIONS = ['roles.multiPortals:*', 'rolesMultiPortalDesktopRoutes:*'];

type MultiPortalRuntimeField = (typeof MULTI_PORTAL_RUNTIME_FIELDS)[number];
type MultiPortalUiLayoutRuntimeField = (typeof MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS)[number];
type DesktopRouteRolePermissionTargetField = (typeof DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS)[number];
type DesktopRouteCreateValue = Record<string, unknown> & {
  children?: unknown;
};
interface MultiPortalAccessContext {
  portalUid: string;
  uiLayoutUid: string;
}
type DatabaseHookOptions = {
  transaction?: Transaction;
};

function getRecordField(record: unknown, field: string) {
  if (!record || typeof record !== 'object') {
    return;
  }

  const maybeModel = record as {
    get?: (field: string) => unknown;
  };
  if (typeof maybeModel.get === 'function') {
    return maybeModel.get(field);
  }

  return (record as Record<string, unknown>)[field];
}

function pickMultiPortalUiLayoutRuntimeFields(record: unknown) {
  const result = {} as Record<MultiPortalUiLayoutRuntimeField, unknown>;
  for (const field of MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS) {
    result[field] = getRecordField(record, field);
  }
  return result;
}

function pickMultiPortalRuntimeFields(record: unknown) {
  const result = {} as Record<MultiPortalRuntimeField | 'uiLayout', unknown>;
  for (const field of MULTI_PORTAL_RUNTIME_FIELDS) {
    result[field] = getRecordField(record, field);
  }
  result.uiLayout = pickMultiPortalUiLayoutRuntimeFields(getRecordField(record, 'uiLayout'));
  return result;
}

function getExplicitRequestedLayoutUid(layout: unknown) {
  const uid = Array.isArray(layout) ? layout[0] : layout;

  if (typeof uid === 'string' && uid.trim()) {
    return uid;
  }
}

function getRequestedMultiPortalUid(ctx: ResourcerContext) {
  const portalUid = getExplicitRequestedLayoutUid(ctx.action?.params.portal);
  const layoutUid = getExplicitRequestedLayoutUid(ctx.action?.params.layout);
  if (portalUid && layoutUid) {
    ctx.throw(400, 'layout and portal cannot be used together');
    return;
  }

  return portalUid ?? layoutUid;
}

function getCurrentRoles(ctx: ResourcerContext) {
  const currentRoles = ctx.state.currentRoles;
  if (!Array.isArray(currentRoles)) {
    return [];
  }

  return currentRoles.filter((role): role is string => typeof role === 'string');
}

async function findRequestedMultiPortal(ctx: ResourcerContext) {
  const portalUid = getRequestedMultiPortalUid(ctx);
  if (!portalUid) {
    return;
  }

  return ctx.db.getRepository('multiPortals').findOne({
    filter: {
      uid: portalUid,
      enabled: true,
    },
    fields: ['uid', 'uiLayoutUid'],
  });
}

function getDesktopRoutePortalFilter(multiPortalUid: string) {
  return {
    'multiPortals.uid': multiPortalUid,
  };
}

function isDesktopRouteCreateValue(value: unknown): value is DesktopRouteCreateValue {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function withDesktopRouteMultiPortal(value: unknown, multiPortalUid: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => withDesktopRouteMultiPortal(item, multiPortalUid));
  }

  if (!isDesktopRouteCreateValue(value)) {
    return value;
  }

  const { uiLayouts: _uiLayouts, ...route } = value;

  return {
    ...route,
    multiPortals: [multiPortalUid],
    ...(Array.isArray(value.children) ? { children: withDesktopRouteMultiPortal(value.children, multiPortalUid) } : {}),
  };
}

async function canAccessMultiPortal(ctx: ResourcerContext, multiPortalUid: string) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return true;
  }
  if (!currentRoles.length) {
    return false;
  }

  const count = await ctx.db.getRepository('rolesMultiPortals').count({
    filter: {
      roleName: currentRoles,
      multiPortalUid,
    },
  });
  return count > 0;
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

async function getMultiPortalAccessibleRouteIds(ctx: ResourcerContext, multiPortalUid: string) {
  const currentRoles = getCurrentRoles(ctx);
  if (currentRoles.includes('root')) {
    return;
  }
  if (!currentRoles.length) {
    return new Set<string>();
  }

  const routePermissions = await ctx.db.getRepository('rolesMultiPortalDesktopRoutes').find({
    fields: ['desktopRouteId'],
    filter: {
      roleName: currentRoles,
      multiPortalUid,
    },
  });
  const routeIds = new Set<string>();

  for (const permission of routePermissions) {
    const routeId = permission.get('desktopRouteId');
    if (routeId !== null && routeId !== undefined) {
      routeIds.add(String(routeId));
    }
  }

  if (routeIds.size === 0) {
    return routeIds;
  }

  const portalRoutes = await ctx.db.getRepository('desktopRoutes').find({
    fields: ['id'],
    filter: {
      ...getDesktopRoutePortalFilter(multiPortalUid),
      id: Array.from(routeIds),
    },
  });
  const portalRouteIds = new Set<string>();

  for (const route of portalRoutes) {
    const routeId = route.get('id');
    if (routeId !== null && routeId !== undefined) {
      portalRouteIds.add(String(routeId));
    }
  }

  await removeRouteIdsWithUnauthorizedAncestors(ctx, portalRouteIds);
  return portalRouteIds;
}

function pickDesktopRouteRolePermissionTargetFields(
  route: unknown,
): Record<DesktopRouteRolePermissionTargetField | 'children', unknown> {
  const result = {} as Record<DesktopRouteRolePermissionTargetField | 'children', unknown>;
  for (const field of DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS) {
    result[field] = getRecordField(route, field) ?? null;
  }

  const children = getRecordField(route, 'children');
  result.children = Array.isArray(children)
    ? children.map((child) => pickDesktopRouteRolePermissionTargetFields(child))
    : [];

  return result;
}

async function replaceListAccessibleRoutesWithPortalScopedRoutes(
  ctx: ResourcerContext,
  portalContext: MultiPortalAccessContext,
) {
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext.portalUid);
  if (routeIds && routeIds.size === 0) {
    ctx.body = [];
    return;
  }

  ctx.body = await ctx.db.getRepository('desktopRoutes').find({
    tree: true,
    sort: 'sort',
    filter: {
      ...getDesktopRoutePortalFilter(portalContext.portalUid),
      ...(routeIds ? { id: Array.from(routeIds) } : {}),
    },
  });
}

async function replaceGetAccessibleRouteWithPortalScopedRoute(
  ctx: ResourcerContext,
  portalContext: MultiPortalAccessContext,
) {
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext.portalUid);
  if (routeIds && routeIds.size === 0) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  const route = await ctx.db.getRepository('desktopRoutes').findOne({
    sort: 'sort',
    filterByTk: ctx.action?.params.filterByTk,
    filter: {
      ...ctx.action?.params.filter,
      ...getDesktopRoutePortalFilter(portalContext.portalUid),
      ...(routeIds ? { id: Array.from(routeIds) } : {}),
    },
  });

  if (!route) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  ctx.status = 200;
  ctx.body = route;
}

async function prepareAccessibleDesktopRoutesForMultiPortal(ctx: ResourcerContext) {
  const portal = await findRequestedMultiPortal(ctx);
  if (!portal) {
    return;
  }

  const portalUid = portal.get('uid');
  const uiLayoutUid = portal.get('uiLayoutUid');
  if (typeof portalUid !== 'string' || !portalUid || typeof uiLayoutUid !== 'string' || !uiLayoutUid) {
    return null;
  }

  if (!(await canAccessMultiPortal(ctx, portalUid))) {
    return null;
  }

  if (ctx.action?.params) {
    ctx.action.params.layout = uiLayoutUid;
  }
  return {
    portalUid,
    uiLayoutUid,
  };
}

async function addMultiPortalListAccessibleGuard(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalContext = await prepareAccessibleDesktopRoutesForMultiPortal(ctx);
  if (portalContext === null) {
    ctx.body = [];
    return;
  }

  await next();
  if (portalContext) {
    await replaceListAccessibleRoutesWithPortalScopedRoutes(ctx, portalContext);
  }
}

async function addMultiPortalGetAccessibleGuard(ctx: ResourcerContext, next: () => Promise<void>) {
  const portalContext = await prepareAccessibleDesktopRoutesForMultiPortal(ctx);
  if (portalContext === null) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  await next();
  if (portalContext) {
    await replaceGetAccessibleRouteWithPortalScopedRoute(ctx, portalContext);
  }
}

async function mapMultiPortalLayoutToUiLayoutForRolePermissionTargets(
  ctx: ResourcerContext,
  next: () => Promise<void>,
) {
  const portal = await findRequestedMultiPortal(ctx);
  const portalUid = portal?.get('uid');
  if (typeof portalUid === 'string' && portalUid) {
    const routes = (await ctx.db.getRepository('desktopRoutes').find({
      tree: true,
      sort: 'sort',
      filter: getDesktopRoutePortalFilter(portalUid),
      fields: [...DESKTOP_ROUTE_ROLE_PERMISSION_TARGET_FIELDS],
    })) as unknown[];

    ctx.status = 200;
    ctx.body = routes.map((route) => pickDesktopRouteRolePermissionTargetFields(route));
    return;
  }

  await next();
}

async function addDesktopRouteCreateMultiPortal(ctx: ResourcerContext, next: () => Promise<void>) {
  const portal = await findRequestedMultiPortal(ctx);
  const portalUid = portal?.get('uid');

  if (typeof portalUid === 'string' && portalUid) {
    ctx.action?.mergeParams({
      values: withDesktopRouteMultiPortal(ctx.action?.params.values, portalUid),
    });
  }

  await next();
}

async function listEnabledMultiPortals(ctx: ResourcerContext, next: () => Promise<void>) {
  const records = await ctx.db.getRepository('multiPortals').find({
    filter: {
      enabled: true,
    },
    fields: [...MULTI_PORTAL_RUNTIME_QUERY_FIELDS],
    appends: ['uiLayout'],
    sort: ['uid'],
  });

  ctx.body = records.map((record) => pickMultiPortalRuntimeFields(record));
  await next();
}

async function grantDefaultAccessToNewMultiPortal(db: Database, multiPortal: Model, options?: DatabaseHookOptions) {
  if (multiPortal.get('enabled') !== true) {
    return;
  }
  const multiPortalUid = multiPortal.get('uid');
  if (typeof multiPortalUid !== 'string' || !multiPortalUid) {
    return;
  }
  if (!db.getCollection('roles') || !db.getCollection('rolesMultiPortals')) {
    return;
  }

  const roles = await db.getRepository('roles').find({
    fields: ['name'],
    filter: {
      allowNewMultiPortal: true,
    },
    transaction: options?.transaction,
  });
  const records = roles
    .map((role) => role.get('name'))
    .filter((roleName): roleName is string => typeof roleName === 'string' && !!roleName)
    .map((roleName) => ({
      roleName,
      multiPortalUid,
    }));

  if (!records.length) {
    return;
  }

  const repository = db.getRepository('rolesMultiPortals');
  for (const values of records) {
    await repository.firstOrCreate({
      filterKeys: ['roleName', 'multiPortalUid'],
      values,
      transaction: options?.transaction,
    });
  }
}

export class PluginMultiPortalServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:listAccessible',
      addMultiPortalListAccessibleGuard,
    );
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:getAccessible', addMultiPortalGetAccessibleGuard);
    this.app.resourceManager.registerPreActionHandler(
      'desktopRoutes:listRolePermissionTargets',
      mapMultiPortalLayoutToUiLayoutForRolePermissionTargets,
    );
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:create', addDesktopRouteCreateMultiPortal);
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:updateOrCreate', addDesktopRouteCreateMultiPortal);
  }

  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.multi-portal',
      actions: MULTI_PORTAL_MANAGEMENT_ACTIONS,
    });
    this.app.acl.registerSnippet({
      name: 'pm.acl.roles',
      actions: ROLE_MULTI_PORTAL_PERMISSION_ACTIONS,
    });
    this.app.acl.allow('multiPortals', 'listEnabled', 'public');
    this.app.resourceManager.registerActionHandler('multiPortals:listEnabled', listEnabledMultiPortals);
    this.app.db.on('roles.beforeCreate', (role: Model) => {
      applyDefaultRoleMultiPortalAccess(role);
    });
    this.app.db.on('multiPortals.afterCreate', async (multiPortal: Model, options?: DatabaseHookOptions) => {
      await grantDefaultAccessToNewMultiPortal(this.app.db, multiPortal, options);
    });
  }

  async install() {
    await ensureDefaultRoleMultiPortalAccess(this.db);
  }

  async afterEnable() {
    await ensureDefaultRoleMultiPortalAccess(this.db);
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginMultiPortalServer;
