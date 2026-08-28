/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BelongsToManyRepository, Database, TargetKey, Transaction } from '@nocobase/database';
import { throwBadRequest, throwForbidden } from './errors';

export const DEFAULT_ADMIN_UI_LAYOUT_UID = 'admin-layout-model';
export const DEFAULT_MOBILE_UI_LAYOUT_UID = 'mobile-layout-model';
export const DEFAULT_ADMIN_MULTI_PORTAL_UID = '__default_admin__';
export const DEFAULT_MOBILE_MULTI_PORTAL_UID = '__default_mobile__';

const RESERVED_MULTI_PORTAL_UIDS = new Set([DEFAULT_ADMIN_MULTI_PORTAL_UID, DEFAULT_MOBILE_MULTI_PORTAL_UID]);

export type FlowSurfaceNavigationRequestRoles = readonly string[] | string;

export type FlowSurfaceResolvedMultiPortal = {
  uid: string;
  title: string;
  icon?: string | null;
  routeName?: string;
  routePath?: string;
  authCheck?: boolean;
  enabled: true;
  layoutUid: string;
  layoutType?: string;
};

export type FlowSurfaceNavigationTarget = {
  kind: 'layout' | 'portal';
  uid: string;
  title: string;
  icon?: string | null;
  layoutUid: string;
  layoutType?: string;
  routeName?: string;
  routePath?: string;
  authCheck?: boolean;
  default?: boolean;
  portalUid?: string;
};

export type FlowSurfaceNavigationTargetsResult = {
  version: '1';
  capabilities: {
    multiPortal: boolean;
  };
  targets: FlowSurfaceNavigationTarget[];
};

type PortalResolveOptions = {
  actionName: string;
  path: string;
  currentRoles?: FlowSurfaceNavigationRequestRoles;
  transaction?: Transaction;
};

function readRecordField(record: unknown, field: string) {
  if (!record || typeof record !== 'object') {
    return undefined;
  }
  const model = record as { get?: (key: string) => unknown };
  if (typeof model.get === 'function') {
    return model.get(field);
  }
  return (record as Record<string, unknown>)[field];
}

function readStringField(record: unknown, field: string) {
  const value = readRecordField(record, field);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeRoles(currentRoles?: FlowSurfaceNavigationRequestRoles) {
  const roles = Array.isArray(currentRoles) ? currentRoles : typeof currentRoles === 'string' ? [currentRoles] : [];
  return roles.map((role) => String(role || '').trim()).filter(Boolean);
}

function normalizeRelationRouteId(routeId: unknown): TargetKey | undefined {
  return routeId === null || typeof routeId === 'undefined' ? undefined : (routeId as TargetKey);
}

export class FlowSurfaceNavigationTargetsService {
  constructor(private readonly db: Database) {}

  hasMultiPortalCapability() {
    try {
      return (
        !!this.db.getCollection('multiPortals') && !!this.db.getCollection('desktopRoutes')?.getField?.('multiPortals')
      );
    } catch (error) {
      return false;
    }
  }

  hasUiLayoutCapability() {
    try {
      return !!this.db.getCollection('uiLayouts') && !!this.db.getCollection('desktopRoutes')?.getField?.('uiLayouts');
    } catch (error) {
      return false;
    }
  }

  normalizePortalUid(value: unknown) {
    const portalUid = String(value || '').trim();
    return portalUid || undefined;
  }

  async listNavigationTargets(
    currentRoles?: FlowSurfaceNavigationRequestRoles,
    transaction?: Transaction,
  ): Promise<FlowSurfaceNavigationTargetsResult> {
    const layoutTargets = await this.listLayoutTargets(transaction);
    const multiPortal = this.hasMultiPortalCapability();
    const portalTargets = multiPortal ? await this.listAccessiblePortalTargets(currentRoles, transaction) : [];
    return {
      version: '1',
      capabilities: {
        multiPortal,
      },
      targets: [...layoutTargets, ...portalTargets],
    };
  }

  async resolvePortal(portalUidValue: unknown, options: PortalResolveOptions): Promise<FlowSurfaceResolvedMultiPortal> {
    const portalUid = this.normalizePortalUid(portalUidValue);
    if (!portalUid) {
      throwBadRequest(`flowSurfaces ${options.actionName} ${options.path} must be a non-empty string`, {
        ruleId: 'navigation-portal-invalid',
        path: options.path,
      });
    }
    if (!this.hasMultiPortalCapability()) {
      throwBadRequest(`flowSurfaces ${options.actionName} ${options.path} requires the Multi-portal capability`, {
        ruleId: 'navigation-portal-unsupported',
        path: options.path,
        details: { portalUid },
      });
    }
    if (RESERVED_MULTI_PORTAL_UIDS.has(portalUid)) {
      throwBadRequest(
        `flowSurfaces ${options.actionName} ${options.path} cannot use reserved default portal uid '${portalUid}'; use layoutUid semantics instead`,
        {
          ruleId: 'navigation-portal-reserved',
          path: options.path,
          details: { portalUid },
        },
      );
    }

    const portal = await this.db.getRepository('multiPortals').findOne({
      filter: { uid: portalUid },
      fields: ['uid', 'title', 'icon', 'routeName', 'routePath', 'authCheck', 'enabled', 'uiLayoutUid'],
      transaction: options.transaction,
    });
    if (!portal) {
      throwBadRequest(`flowSurfaces ${options.actionName} ${options.path} references missing portal '${portalUid}'`, {
        ruleId: 'navigation-portal-not-found',
        path: options.path,
        details: { portalUid },
      });
    }
    if (readRecordField(portal, 'enabled') !== true) {
      throwBadRequest(`flowSurfaces ${options.actionName} portal '${portalUid}' is disabled`, {
        ruleId: 'navigation-portal-disabled',
        path: options.path,
        details: { portalUid },
      });
    }

    const layoutUid = readStringField(portal, 'uiLayoutUid');
    if (!layoutUid || !this.db.getCollection('uiLayouts')) {
      throwBadRequest(`flowSurfaces ${options.actionName} portal '${portalUid}' has no available backing UI layout`, {
        ruleId: 'navigation-portal-layout-not-found',
        path: options.path,
        details: { portalUid, layoutUid: layoutUid || null },
      });
    }
    const layout = await this.db.getRepository('uiLayouts').findOne({
      filter: { uid: layoutUid },
      fields: ['uid', 'layoutType', 'enabled'],
      transaction: options.transaction,
    });
    if (!layout) {
      throwBadRequest(
        `flowSurfaces ${options.actionName} portal '${portalUid}' backing UI layout '${layoutUid}' does not exist`,
        {
          ruleId: 'navigation-portal-layout-not-found',
          path: options.path,
          details: { portalUid, layoutUid },
        },
      );
    }
    if (readRecordField(layout, 'enabled') !== true) {
      throwBadRequest(
        `flowSurfaces ${options.actionName} portal '${portalUid}' backing UI layout '${layoutUid}' is disabled`,
        {
          ruleId: 'navigation-portal-layout-disabled',
          path: options.path,
          details: { portalUid, layoutUid },
        },
      );
    }
    if (!(await this.canAccessPortal(portalUid, options.currentRoles, options.transaction))) {
      throwForbidden(
        `flowSurfaces ${options.actionName} current roles cannot access portal '${portalUid}'`,
        'FLOW_SURFACE_NAVIGATION_PORTAL_FORBIDDEN',
        {
          ruleId: 'navigation-portal-forbidden',
          path: options.path,
          details: { portalUid },
        },
      );
    }

    return {
      uid: portalUid,
      title: readStringField(portal, 'title') || portalUid,
      icon: readStringField(portal, 'icon') || null,
      routeName: readStringField(portal, 'routeName'),
      routePath: readStringField(portal, 'routePath'),
      authCheck: readRecordField(portal, 'authCheck') === true,
      enabled: true,
      layoutUid,
      layoutType: readStringField(layout, 'layoutType'),
    };
  }

  async readRoutePortalUids(routeId: unknown, transaction?: Transaction): Promise<string[]> {
    const relationRouteId = normalizeRelationRouteId(routeId);
    if (typeof relationRouteId === 'undefined' || !this.hasMultiPortalCapability()) {
      return [];
    }
    const portals = await this.db
      .getRepository<BelongsToManyRepository>('desktopRoutes.multiPortals', relationRouteId)
      .find({ fields: ['uid'], transaction });
    return Array.from(
      new Set(
        portals
          .map((portal: unknown) => readStringField(portal, 'uid'))
          .filter((portalUid: string | undefined): portalUid is string => !!portalUid),
      ),
    );
  }

  async assertRouteBelongsToPortal(
    actionName: string,
    routeId: unknown,
    portalUid: string,
    path: string,
    transaction?: Transaction,
  ) {
    const routePortalUids = await this.readRoutePortalUids(routeId, transaction);
    if (routePortalUids.includes(portalUid)) {
      return;
    }
    throwBadRequest(`flowSurfaces ${actionName} ${path} does not belong to portal '${portalUid}'`, {
      ruleId: 'navigation-route-portal-mismatch',
      path,
      details: {
        routeId,
        portalUid,
        routePortalUids,
      },
    });
  }

  async attachRouteTreeToPortals(
    routeId: unknown,
    portalUids: string[],
    options: {
      portalOnly: boolean;
      transaction?: Transaction;
    },
  ) {
    const normalizedPortalUids = Array.from(new Set(portalUids.map((uid) => String(uid || '').trim()).filter(Boolean)));
    const relationRouteId = normalizeRelationRouteId(routeId);
    if (typeof relationRouteId === 'undefined' || !normalizedPortalUids.length || !this.hasMultiPortalCapability()) {
      return;
    }
    const routeIds = await this.collectRouteTreeIds(relationRouteId, options.transaction);
    for (const currentRouteId of routeIds) {
      await this.db
        .getRepository<BelongsToManyRepository>('desktopRoutes.multiPortals', currentRouteId)
        .set({ tk: normalizedPortalUids, transaction: options.transaction });
      if (options.portalOnly && this.hasUiLayoutCapability()) {
        await this.db
          .getRepository<BelongsToManyRepository>('desktopRoutes.uiLayouts', currentRouteId)
          .set({ tk: [], transaction: options.transaction });
      }
    }
    if (options.portalOnly) {
      await this.removeDefaultLayoutRoutePermissions(routeIds, options.transaction);
    }
    for (const portalUid of normalizedPortalUids) {
      await this.grantDefaultPortalRouteAccess(portalUid, routeIds, options.transaction);
    }
  }

  private async listLayoutTargets(transaction?: Transaction): Promise<FlowSurfaceNavigationTarget[]> {
    const targets: FlowSurfaceNavigationTarget[] = [];
    if (this.db.getCollection('uiLayouts')) {
      const layouts = await this.db.getRepository('uiLayouts').find({
        filter: { enabled: true },
        fields: ['uid', 'title', 'layoutType', 'routeName', 'routePath', 'authCheck'],
        sort: ['uid'],
        transaction,
      });
      for (const layout of layouts) {
        const layoutUid = readStringField(layout, 'uid');
        if (!layoutUid) {
          continue;
        }
        targets.push({
          kind: 'layout',
          uid: layoutUid,
          title: readStringField(layout, 'title') || layoutUid,
          layoutUid,
          layoutType: readStringField(layout, 'layoutType'),
          routeName: readStringField(layout, 'routeName'),
          routePath: readStringField(layout, 'routePath'),
          authCheck: readRecordField(layout, 'authCheck') === true,
          ...(layoutUid === DEFAULT_ADMIN_UI_LAYOUT_UID ? { default: true } : {}),
        });
      }
    }
    if (!targets.some((target) => target.uid === DEFAULT_ADMIN_UI_LAYOUT_UID)) {
      targets.unshift({
        kind: 'layout',
        uid: DEFAULT_ADMIN_UI_LAYOUT_UID,
        title: 'Admin',
        layoutUid: DEFAULT_ADMIN_UI_LAYOUT_UID,
        layoutType: 'desktop',
        routeName: 'admin',
        routePath: '/admin',
        authCheck: true,
        default: true,
      });
    }
    return targets.sort((left, right) => {
      if (left.default) {
        return -1;
      }
      if (right.default) {
        return 1;
      }
      return left.uid.localeCompare(right.uid);
    });
  }

  private async listAccessiblePortalTargets(
    currentRoles?: FlowSurfaceNavigationRequestRoles,
    transaction?: Transaction,
  ): Promise<FlowSurfaceNavigationTarget[]> {
    const roles = normalizeRoles(currentRoles);
    let accessiblePortalUids: string[] | undefined;
    if (!roles.includes('root')) {
      if (!roles.length || !this.db.getCollection('rolesMultiPortals')) {
        return [];
      }
      const grants = await this.db.getRepository('rolesMultiPortals').find({
        fields: ['multiPortalUid'],
        filter: { roleName: roles },
        transaction,
      });
      accessiblePortalUids = Array.from(
        new Set(
          grants
            .map((grant: unknown) => readStringField(grant, 'multiPortalUid'))
            .filter((portalUid: string | undefined): portalUid is string => !!portalUid),
        ),
      );
      if (!accessiblePortalUids.length) {
        return [];
      }
    }

    const accessiblePortalUidSet = accessiblePortalUids ? new Set(accessiblePortalUids) : undefined;
    const filter: Record<string, unknown> = {
      enabled: true,
      'uid.$notIn': Array.from(RESERVED_MULTI_PORTAL_UIDS),
    };
    const portals = await this.db.getRepository('multiPortals').find({
      filter,
      fields: ['uid', 'title', 'icon', 'routeName', 'routePath', 'authCheck', 'enabled', 'uiLayoutUid'],
      sort: ['uid'],
      transaction,
    });
    const targets: FlowSurfaceNavigationTarget[] = [];
    for (const portal of portals) {
      const portalUid = readStringField(portal, 'uid');
      const layoutUid = readStringField(portal, 'uiLayoutUid');
      if (
        !portalUid ||
        (accessiblePortalUidSet && !accessiblePortalUidSet.has(portalUid)) ||
        !layoutUid ||
        !this.db.getCollection('uiLayouts')
      ) {
        continue;
      }
      const layout = await this.db.getRepository('uiLayouts').findOne({
        filter: { uid: layoutUid, enabled: true },
        fields: ['layoutType'],
        transaction,
      });
      if (!layout) {
        continue;
      }
      targets.push({
        kind: 'portal',
        uid: portalUid,
        portalUid,
        title: readStringField(portal, 'title') || portalUid,
        icon: readStringField(portal, 'icon') || null,
        layoutUid,
        layoutType: readStringField(layout, 'layoutType'),
        routeName: readStringField(portal, 'routeName'),
        routePath: readStringField(portal, 'routePath'),
        authCheck: readRecordField(portal, 'authCheck') === true,
      });
    }
    return targets;
  }

  private async canAccessPortal(
    portalUid: string,
    currentRoles?: FlowSurfaceNavigationRequestRoles,
    transaction?: Transaction,
  ) {
    const roles = normalizeRoles(currentRoles);
    if (roles.includes('root')) {
      return true;
    }
    if (!roles.length || !this.db.getCollection('rolesMultiPortals')) {
      return false;
    }
    const count = await this.db.getRepository('rolesMultiPortals').count({
      filter: {
        roleName: roles,
        multiPortalUid: portalUid,
      },
      transaction,
    });
    return count > 0;
  }

  private async collectRouteTreeIds(routeId: TargetKey, transaction?: Transaction): Promise<TargetKey[]> {
    const routeIds: TargetKey[] = [routeId];
    const children = await this.db.getRepository('desktopRoutes').find({
      fields: ['id'],
      filter: { parentId: routeId },
      transaction,
    });
    for (const child of children) {
      const childId = normalizeRelationRouteId(readRecordField(child, 'id'));
      if (typeof childId !== 'undefined') {
        routeIds.push(...(await this.collectRouteTreeIds(childId, transaction)));
      }
    }
    return routeIds;
  }

  private async removeDefaultLayoutRoutePermissions(routeIds: TargetKey[], transaction?: Transaction) {
    if (!routeIds.length || !this.db.getCollection('rolesDesktopRoutes')) {
      return;
    }
    await this.db.getRepository('rolesDesktopRoutes').destroy({
      filter: { desktopRouteId: routeIds },
      transaction,
    });
  }

  private async grantDefaultPortalRouteAccess(portalUid: string, routeIds: TargetKey[], transaction?: Transaction) {
    if (
      !routeIds.length ||
      !this.db.getCollection('rolesMultiPortalRoutePolicies') ||
      !this.db.getCollection('rolesMultiPortalDesktopRoutes')
    ) {
      return;
    }
    const policies = await this.db.getRepository('rolesMultiPortalRoutePolicies').find({
      fields: ['roleName'],
      filter: {
        multiPortalUid: portalUid,
        allowNewMenu: true,
      },
      transaction,
    });
    const roleNames = Array.from(
      new Set(
        policies
          .map((policy: unknown) => readStringField(policy, 'roleName'))
          .filter((roleName: string | undefined): roleName is string => !!roleName),
      ),
    );
    const repository = this.db.getRepository('rolesMultiPortalDesktopRoutes');
    for (const roleName of roleNames) {
      for (const desktopRouteId of routeIds) {
        await repository.firstOrCreate({
          filterKeys: ['roleName', 'multiPortalUid', 'desktopRouteId'],
          values: {
            roleName,
            multiPortalUid: portalUid,
            desktopRouteId,
          },
          transaction,
        });
      }
    }
  }
}
