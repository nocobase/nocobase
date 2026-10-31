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
