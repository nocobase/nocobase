/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoBaseDesktopRouteType } from '@nocobase/client';

export function getSchemaUidByRouteId(routeId: number, treeArray: any[], isMobile: boolean) {
  for (const node of treeArray) {
    if (node.id === routeId) {
      if (node.type === NocoBaseDesktopRouteType.page) {
        return node.schemaUid;
      }
      return node.schemaUid;
    }

    if (node.children?.length) {
      const result = getSchemaUidByRouteId(routeId, node.children, isMobile);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function getRouteNodeByRouteId(routeId: number, treeArray: any[]) {
  for (const node of treeArray) {
    if (node.id === routeId) {
      return node;
    }

    if (node.children?.length) {
      const result = getRouteNodeByRouteId(routeId, node.children);
      if (result) {
        return result;
      }
    }
  }
  return null;
}
