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

const MULTI_PORTAL_RUNTIME_FIELDS = ['uid', 'title', 'routeName', 'routePath', 'authCheck', 'enabled'] as const;
const MULTI_PORTAL_RUNTIME_QUERY_FIELDS = [...MULTI_PORTAL_RUNTIME_FIELDS, 'uiLayoutUid'] as const;
const MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS = ['layoutType'] as const;
const ROLE_MULTI_PORTAL_PERMISSION_ACTIONS = ['roles.multiPortals:*', 'rolesMultiPortalDesktopRoutes:*'];
const DEFAULT_ADMIN_UI_LAYOUT_UID = 'admin-layout-model';

type MultiPortalRuntimeField = (typeof MULTI_PORTAL_RUNTIME_FIELDS)[number];
type MultiPortalUiLayoutRuntimeField = (typeof MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS)[number];
interface MultiPortalAccessContext {
  portalUid: string;
  uiLayoutUid: string;
}

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

function getCurrentRoles(ctx: ResourcerContext) {
  const currentRoles = ctx.state.currentRoles;
  if (!Array.isArray(currentRoles)) {
    return [];
  }

  return currentRoles.filter((role): role is string => typeof role === 'string');
}

async function findRequestedMultiPortal(ctx: ResourcerContext) {
  const portalUid = getExplicitRequestedLayoutUid(ctx.action?.params.layout);
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

  await removeRouteIdsWithUnauthorizedAncestors(ctx, routeIds);
  return routeIds;
}

function getDesktopRouteLayoutFilter(uiLayoutUid: string) {
  if (uiLayoutUid === DEFAULT_ADMIN_UI_LAYOUT_UID) {
    return {
      $or: [{ 'uiLayouts.uid': uiLayoutUid }, { 'uiLayouts.uid.$notExists': true }],
    };
  }

  return {
    'uiLayouts.uid': uiLayoutUid,
  };
}

async function replaceListAccessibleRoutesWithPortalScopedRoutes(
  ctx: ResourcerContext,
  portalContext: MultiPortalAccessContext,
) {
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext.portalUid);
  if (!routeIds) {
    return;
  }
  if (routeIds.size === 0) {
    ctx.body = [];
    return;
  }

  ctx.body = await ctx.db.getRepository('desktopRoutes').find({
    tree: true,
    sort: 'sort',
    filter: {
      ...getDesktopRouteLayoutFilter(portalContext.uiLayoutUid),
      id: Array.from(routeIds),
    },
  });
}

async function replaceGetAccessibleRouteWithPortalScopedRoute(
  ctx: ResourcerContext,
  portalContext: MultiPortalAccessContext,
) {
  const routeIds = await getMultiPortalAccessibleRouteIds(ctx, portalContext.portalUid);
  if (!routeIds) {
    return;
  }
  if (routeIds.size === 0) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
  }

  const route = await ctx.db.getRepository('desktopRoutes').findOne({
    sort: 'sort',
    ...ctx.action?.params,
    filter: {
      ...getDesktopRouteLayoutFilter(portalContext.uiLayoutUid),
      id: Array.from(routeIds),
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
  const uiLayoutUid = portal?.get('uiLayoutUid');
  if (typeof uiLayoutUid === 'string' && uiLayoutUid) {
    ctx.action.params.layout = uiLayoutUid;
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
  }

  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.acl.roles',
      actions: ROLE_MULTI_PORTAL_PERMISSION_ACTIONS,
    });
    this.app.acl.allow('multiPortals', 'listEnabled', 'public');
    this.app.resourceManager.registerActionHandler('multiPortals:listEnabled', listEnabledMultiPortals);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginMultiPortalServer;
