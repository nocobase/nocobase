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
  hidden?: boolean;
  children?: RoutePermissionNode[];
}

export type RoutePermissionPredicate<T> = (node: T) => boolean;

const alwaysTraversable = () => true;

export interface PermissionChangeSet {
  add: number[];
  remove: number[];
}

// Compare the role's grants with the next selection inside one scope, so grants outside that scope (hidden routes,
// other layouts) are preserved instead of being replaced by a full `set`.
export function getPermissionChanges(
  selectedIds: number[],
  nextSelectedIds: number[],
  scopeIds: number[],
): PermissionChangeSet {
  const scope = new Set(scopeIds);
  const selected = new Set(selectedIds.filter((id) => scope.has(id)));
  const nextSelected = new Set(nextSelectedIds.filter((id) => scope.has(id)));
  return {
    add: scopeIds.filter((id) => nextSelected.has(id) && !selected.has(id)),
    remove: scopeIds.filter((id) => selected.has(id) && !nextSelected.has(id)),
  };
}

function hasSelectedDescendant(items: RoutePermissionNode[] | undefined, ids: number[]): boolean {
  return (items ?? []).some((item) => ids.includes(item.id) || hasSelectedDescendant(item.children, ids));
}

export function withAncestorIds<T extends RoutePermissionNode>(
  ids: number[],
  node: T,
  nodeById: Map<number, T>,
  canTraverse: RoutePermissionPredicate<T> = alwaysTraversable,
): number[] {
  const nextIds = [...ids];
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    // The tree query restores path ancestors that do not match the request filter, so only cascade into visible nodes
    if (!parent || !canTraverse(parent)) {
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
  canTraverse: RoutePermissionPredicate<T> = alwaysTraversable,
): number[] {
  let nextIds = ids;
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent || !canTraverse(parent)) {
      break;
    }
    // A filtered-out intermediate node is not part of the role's visible grants, so look at every descendant
    if (hasSelectedDescendant(parent.children, nextIds)) {
      break;
    }
    nextIds = nextIds.filter((id) => id !== parentId);
    parentId = parent.parentId;
  }
  return nextIds;
}
