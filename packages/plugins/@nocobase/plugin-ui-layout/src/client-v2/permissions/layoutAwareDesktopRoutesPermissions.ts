/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';

type Translate = (key: string) => unknown;

interface ACLSettingsUILike {
  addPermissionsTab?: (options: {
    key: string;
    label: string;
    sort?: number;
    componentLoader: () => Promise<unknown>;
  }) => void;
}

interface ACLPluginLike {
  settingsUI?: ACLSettingsUILike;
}

interface ApplicationPluginManagerLike {
  get?: (name: string) => unknown;
}

export interface LayoutScopedPermissionChangesInput {
  currentLayoutRouteIds: number[];
  nextSelectedIds: number[];
  selectedIds: number[];
}

function normalizeLayoutUid(layoutUid: unknown) {
  if (typeof layoutUid === 'string' && layoutUid.trim()) {
    return layoutUid;
  }

  return DEFAULT_ADMIN_UI_LAYOUT.uid;
}

export function createDesktopRouteLayoutPermissionFilter(layoutUid: unknown): Record<string, unknown> {
  const normalizedLayoutUid = normalizeLayoutUid(layoutUid);
  const routeVisibilityFilter = {
    hidden: { $ne: true },
  };

  return {
    ...routeVisibilityFilter,
    'uiLayouts.uid': normalizedLayoutUid,
  };
}

function uniqueOrdered(values: number[]) {
  const seen = new Set<number>();

  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

export function getLayoutScopedPermissionChanges(input: LayoutScopedPermissionChangesInput) {
  const currentLayoutRouteIdSet = new Set(input.currentLayoutRouteIds);
  const selectedIdSet = new Set(input.selectedIds.filter((id) => currentLayoutRouteIdSet.has(id)));
  const nextSelectedIdSet = new Set(input.nextSelectedIds.filter((id) => currentLayoutRouteIdSet.has(id)));
  const orderedRouteIds = uniqueOrdered([
    ...input.currentLayoutRouteIds,
    ...input.selectedIds,
    ...input.nextSelectedIds,
  ]);

  return {
    add: orderedRouteIds.filter(
      (id) => currentLayoutRouteIdSet.has(id) && nextSelectedIdSet.has(id) && !selectedIdSet.has(id),
    ),
    remove: orderedRouteIds.filter(
      (id) => currentLayoutRouteIdSet.has(id) && selectedIdSet.has(id) && !nextSelectedIdSet.has(id),
    ),
  };
}

export function registerLayoutAwareDesktopRoutesPermissionsTab(app: Application, t: Translate) {
  const pluginManager = (app as Application & { pm?: ApplicationPluginManagerLike }).pm;
  if (!pluginManager?.get) {
    return;
  }

  const aclPlugin = (pluginManager.get('acl') || pluginManager.get('@nocobase/plugin-acl')) as
    | ACLPluginLike
    | undefined;

  if (!aclPlugin?.settingsUI?.addPermissionsTab) {
    return;
  }

  aclPlugin.settingsUI.addPermissionsTab({
    key: 'menu',
    label: String(t('Desktop routes')),
    sort: 20,
    componentLoader: () => import('./LayoutAwareDesktopRoutesPermissionsTab'),
  });
  aclPlugin.settingsUI.addPermissionsTab({
    key: 'mobile-routes',
    label: String(t('Mobile routes')),
    sort: 21,
    componentLoader: async () => {
      const module = await import('./LayoutAwareDesktopRoutesPermissionsTab');
      return { default: module.MobileRoutesPermissionsTab };
    },
  });
}

export interface LayoutRoutePermissionNode {
  id: number;
  parentId?: number;
  readOnly?: boolean;
  hidden?: boolean;
  layoutUids?: string[];
  children?: LayoutRoutePermissionNode[];
}

export type LayoutRoutePermissionPredicate<T> = (node: T) => boolean;

const alwaysTraversable = () => true;

export function normalizeLayoutUids(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item : (item as { uid?: string } | undefined)?.uid))
    .filter((uid): uid is string => typeof uid === 'string' && uid.length > 0);
}

export function withAncestorIds<T extends LayoutRoutePermissionNode>(
  ids: number[],
  node: T,
  nodeById: Map<number, T>,
  canTraverse: LayoutRoutePermissionPredicate<T> = alwaysTraversable,
): number[] {
  const nextIds = [...ids];
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    // Read-only ancestors (pages and their child routes) are kept by applyPermissionChanges. Ancestors restored by the
    // tree query may belong to another layout or be hidden, so only cascade into nodes that match the current view.
    if (!parent || parent.readOnly || !canTraverse(parent)) {
      break;
    }
    if (!nextIds.includes(parentId)) {
      nextIds.push(parentId);
    }
    parentId = parent.parentId;
  }
  return nextIds;
}

export function withoutEmptyAncestorIds<T extends LayoutRoutePermissionNode>(
  ids: number[],
  node: T,
  nodeById: Map<number, T>,
  canTraverse: LayoutRoutePermissionPredicate<T> = alwaysTraversable,
): number[] {
  let nextIds = ids;
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodeById.get(parentId);
    if (!parent || parent.readOnly || !canTraverse(parent)) {
      break;
    }
    const children = parent.children ?? [];
    if (children.some((child) => nextIds.includes(child.id))) {
      break;
    }
    nextIds = nextIds.filter((id) => id !== parentId);
    parentId = parent.parentId;
  }
  return nextIds;
}
