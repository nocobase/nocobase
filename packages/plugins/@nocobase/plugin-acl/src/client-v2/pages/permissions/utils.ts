/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PluginSettingsPageType } from '@nocobase/client-v2';
import type { Role } from '../../registries';

export type TFunction = (key: string, options?: Record<string, unknown>) => string;

export interface RoleSnippetsPayload {
  data?: string[];
}

export function toRoleSnippetsPayload(responseData: unknown): RoleSnippetsPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as RoleSnippetsPayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

export function translateTitle(title: unknown, t: TFunction) {
  if (typeof title !== 'string') {
    return title;
  }
  return t(title) || t('Unnamed');
}

export function mergeRoleSnippets(role: Role, snippets: string[]): Role {
  return {
    ...role,
    snippets,
  };
}

export function getSettingsChildren(item: PluginSettingsPageType): PluginSettingsPageType[] {
  return item.children ? [...item.children] : [];
}

export interface RoutePermissionNode {
  id: number;
  parentId?: number;
  children?: RoutePermissionNode[];
}

export function withAncestorIds<T extends RoutePermissionNode>(
  ids: number[],
  node: T,
  nodeById: Map<number, T>,
): number[] {
  const nextIds = [...ids];
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent) {
      break;
    }
    if (!nextIds.includes(parentId)) {
      nextIds.push(parentId);
    }
    parentId = parent.parentId;
  }
  return nextIds;
}

export function withoutEmptyAncestorIds<T extends RoutePermissionNode>(
  ids: number[],
  node: T,
  nodeById: Map<number, T>,
): number[] {
  let nextIds = ids;
  let parentId = node.parentId;
  while (parentId) {
    const children = nodeById.get(parentId)?.children ?? [];
    if (children.some((child) => nextIds.includes(child.id))) {
      break;
    }
    nextIds = nextIds.filter((id) => id !== parentId);
    parentId = nodeById.get(parentId)?.parentId;
  }
  return nextIds;
}
