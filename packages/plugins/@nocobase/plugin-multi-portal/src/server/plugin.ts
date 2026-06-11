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
const ROLE_MULTI_PORTAL_PERMISSION_ACTIONS = ['roles.multiPortals:*'];

type MultiPortalRuntimeField = (typeof MULTI_PORTAL_RUNTIME_FIELDS)[number];
type MultiPortalUiLayoutRuntimeField = (typeof MULTI_PORTAL_UI_LAYOUT_RUNTIME_FIELDS)[number];

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

async function prepareAccessibleDesktopRoutesForMultiPortal(ctx: ResourcerContext) {
  const portal = await findRequestedMultiPortal(ctx);
  if (!portal) {
    return true;
  }

  const portalUid = portal.get('uid');
  const uiLayoutUid = portal.get('uiLayoutUid');
  if (typeof portalUid !== 'string' || !portalUid || typeof uiLayoutUid !== 'string' || !uiLayoutUid) {
    return false;
  }

  if (!(await canAccessMultiPortal(ctx, portalUid))) {
    return false;
  }

  if (ctx.action?.params) {
    ctx.action.params.layout = uiLayoutUid;
  }
  return true;
}

async function addMultiPortalListAccessibleGuard(ctx: ResourcerContext, next: () => Promise<void>) {
  const allowed = await prepareAccessibleDesktopRoutesForMultiPortal(ctx);
  if (!allowed) {
    ctx.body = [];
    return;
  }

  await next();
}

async function addMultiPortalGetAccessibleGuard(ctx: ResourcerContext, next: () => Promise<void>) {
  const allowed = await prepareAccessibleDesktopRoutesForMultiPortal(ctx);
  if (!allowed) {
    ctx.status = 204;
    ctx.body = undefined;
    return;
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
