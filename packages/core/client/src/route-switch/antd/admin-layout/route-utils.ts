/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoBaseDesktopRoute, NocoBaseDesktopRouteType } from './route-types';

export function findRouteBySchemaUid(schemaUid: string, treeArray: NocoBaseDesktopRoute[]) {
  if (!treeArray) return;

  for (const node of treeArray) {
    if (schemaUid === node.schemaUid || schemaUid === node.menuSchemaUid) {
      return node;
    }

    if (node.children?.length) {
      const result = findRouteBySchemaUid(schemaUid, node.children);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function findRouteById(id: string, treeArray: NocoBaseDesktopRoute[]) {
  for (const node of treeArray) {
    if (Number(id) === Number(node.id)) {
      return node;
    }

    if (node.children?.length) {
      const result = findRouteById(id, node.children);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function findFirstPageRoute(routes: NocoBaseDesktopRoute[]) {
  if (!routes) return;

  for (const route of routes.filter((item) => !item.hideInMenu)) {
    if (route.type === NocoBaseDesktopRouteType.page || route.type === NocoBaseDesktopRouteType.flowPage) {
      return route;
    }

    if (route.type === NocoBaseDesktopRouteType.group && route.children?.length) {
      const result = findFirstPageRoute(route.children);
      if (result) return result;
    }
  }
}

export function isGroup(groupId: string, allAccessRoutes: NocoBaseDesktopRoute[]) {
  const route = findRouteById(groupId, allAccessRoutes);
  return route?.type === NocoBaseDesktopRouteType.group;
}
