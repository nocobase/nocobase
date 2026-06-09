/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../constants';

export type DatabaseHookOptions = {
  transaction?: Transaction;
  where?: Record<string, unknown>;
};

type SyncLegacyPermissionOptions = DatabaseHookOptions & {
  defaultUnassignedToAdminLayout?: boolean;
};

async function getDesktopRouteLayoutUidMap(
  db: Database,
  desktopRouteIds: unknown[],
  options?: SyncLegacyPermissionOptions,
) {
  const routeIds = Array.from(
    new Set(
      desktopRouteIds
        .filter((desktopRouteId) => desktopRouteId !== null && desktopRouteId !== undefined)
        .map((desktopRouteId) => String(desktopRouteId)),
    ),
  );
  if (!routeIds.length) {
    return new Map<string, string[]>();
  }

  const routes = await db.getRepository('desktopRoutes').find({
    filter: {
      id: routeIds,
    },
    appends: ['uiLayouts'],
    transaction: options?.transaction,
  });
  const layoutUidsByRouteId = new Map<string, string[]>();

  for (const route of routes) {
    const routeId = route.get('id');
    const uiLayouts = route.get('uiLayouts');
    if (routeId === null || routeId === undefined) {
      continue;
    }

    const uiLayoutUids = Array.isArray(uiLayouts)
      ? Array.from(
          new Set(
            uiLayouts
              .map((uiLayout) => uiLayout.get('uid'))
              .filter((uiLayoutUid): uiLayoutUid is string => typeof uiLayoutUid === 'string' && !!uiLayoutUid),
          ),
        )
      : [];

    layoutUidsByRouteId.set(
      String(routeId),
      uiLayoutUids.length > 0 || !options?.defaultUnassignedToAdminLayout
        ? uiLayoutUids
        : [DEFAULT_ADMIN_UI_LAYOUT.uid],
    );
  }

  return layoutUidsByRouteId;
}

async function grantLegacyAdminLayoutAccess(
  db: Database,
  permissions: Model[],
  routeLayoutUidMap: Map<string, string[]>,
  options?: DatabaseHookOptions,
  onlyAdminLayoutRoutes = false,
) {
  if (!db.getCollection('rolesUiLayouts')) {
    return;
  }

  const roleNames = Array.from(
    new Set(
      permissions
        .filter((permission) => {
          const uiLayoutUids = routeLayoutUidMap.get(String(permission.get('desktopRouteId')));
          if (!uiLayoutUids) {
            return false;
          }

          return onlyAdminLayoutRoutes ? uiLayoutUids.includes(DEFAULT_ADMIN_UI_LAYOUT.uid) : true;
        })
        .map((permission) => permission.get('roleName'))
        .filter((roleName): roleName is string => typeof roleName === 'string' && !!roleName),
    ),
  );
  const layoutPermissionsRepository = db.getRepository('rolesUiLayouts');

  for (const roleName of roleNames) {
    await layoutPermissionsRepository.firstOrCreate({
      filterKeys: ['roleName', 'uiLayoutUid'],
      values: {
        roleName,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
      transaction: options?.transaction,
    });
  }
}

export async function syncLegacyRoleDesktopRoutePermissions(
  db: Database,
  permissions: Model[],
  options?: SyncLegacyPermissionOptions,
  routeLayoutUidMap?: Map<string, string[]>,
) {
  if (
    !db.getCollection('desktopRoutes') ||
    !db.getCollection('rolesDesktopRoutes') ||
    !db.getCollection('rolesUiLayoutDesktopRoutes')
  ) {
    return;
  }

  const scopedPermissionsRepository = db.getRepository('rolesUiLayoutDesktopRoutes');
  const resolvedRouteLayoutUidMap =
    routeLayoutUidMap ??
    (await getDesktopRouteLayoutUidMap(
      db,
      permissions.map((permission) => permission.get('desktopRouteId')),
      options,
    ));

  if (options?.defaultUnassignedToAdminLayout) {
    await grantLegacyAdminLayoutAccess(db, permissions, resolvedRouteLayoutUidMap, options, true);
  }

  for (const permission of permissions) {
    const roleName = permission.get('roleName');
    const desktopRouteId = permission.get('desktopRouteId');
    if (typeof roleName !== 'string' || desktopRouteId === null || desktopRouteId === undefined) {
      continue;
    }

    const uiLayoutUids = resolvedRouteLayoutUidMap.get(String(desktopRouteId)) ?? [];
    for (const uiLayoutUid of uiLayoutUids) {
      await scopedPermissionsRepository.firstOrCreate({
        filterKeys: ['roleName', 'uiLayoutUid', 'desktopRouteId'],
        values: {
          roleName,
          uiLayoutUid,
          desktopRouteId,
        },
        transaction: options?.transaction,
      });
    }
  }
}

async function syncExistingLegacyRoleDesktopRoutePermissionsInTransaction(db: Database, options?: DatabaseHookOptions) {
  if (
    !db.getCollection('desktopRoutes') ||
    !db.getCollection('rolesDesktopRoutes') ||
    !db.getCollection('rolesUiLayouts') ||
    !db.getCollection('rolesUiLayoutDesktopRoutes')
  ) {
    return;
  }

  const permissions = await db.getRepository('rolesDesktopRoutes').find({
    fields: ['roleName', 'desktopRouteId'],
    transaction: options?.transaction,
  });
  const routeLayoutUidMap = await getDesktopRouteLayoutUidMap(
    db,
    permissions.map((permission) => permission.get('desktopRouteId')),
    {
      ...options,
      defaultUnassignedToAdminLayout: true,
    },
  );

  await grantLegacyAdminLayoutAccess(db, permissions, routeLayoutUidMap, options);
  await syncLegacyRoleDesktopRoutePermissions(db, permissions, options, routeLayoutUidMap);
}

export async function syncExistingLegacyRoleDesktopRoutePermissions(db: Database, options?: DatabaseHookOptions) {
  if (options?.transaction) {
    await syncExistingLegacyRoleDesktopRoutePermissionsInTransaction(db, options);
    return;
  }

  await db.sequelize.transaction(async (transaction) => {
    await syncExistingLegacyRoleDesktopRoutePermissionsInTransaction(db, {
      ...options,
      transaction,
    });
  });
}

export async function removeLegacyRoleDesktopRoutePermissions(
  db: Database,
  permissions: Model[],
  options?: DatabaseHookOptions,
) {
  if (!db.getCollection('rolesUiLayoutDesktopRoutes')) {
    return;
  }

  for (const permission of permissions) {
    const roleName = permission.get('roleName');
    const desktopRouteId = permission.get('desktopRouteId');
    if (typeof roleName !== 'string' || desktopRouteId === null || desktopRouteId === undefined) {
      continue;
    }

    await db.getRepository('rolesUiLayoutDesktopRoutes').destroy({
      filter: {
        roleName,
        desktopRouteId,
      },
      transaction: options?.transaction,
    });
  }
}
