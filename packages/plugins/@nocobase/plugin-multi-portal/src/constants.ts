/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const DEFAULT_ADMIN_MULTI_PORTAL_UID = '__default_admin__';
export const DEFAULT_MOBILE_MULTI_PORTAL_UID = '__default_mobile__';
export const NAMESPACE = '@nocobase/plugin-multi-portal';
export const ADMIN_UI_LAYOUT_UID = 'admin-layout-model';
export const MOBILE_UI_LAYOUT_UID = 'mobile-layout-model';

export const MULTI_PORTAL_UI_LAYOUT_UIDS = [ADMIN_UI_LAYOUT_UID, MOBILE_UI_LAYOUT_UID] as const;

export type MultiPortalUiLayoutUid = (typeof MULTI_PORTAL_UI_LAYOUT_UIDS)[number];
export type MultiPortalLayoutType = 'desktop' | 'mobile';

const DEFAULT_LAYOUT_MULTI_PORTAL_UIDS = new Set<string>([
  DEFAULT_ADMIN_MULTI_PORTAL_UID,
  DEFAULT_MOBILE_MULTI_PORTAL_UID,
]);
const MULTI_PORTAL_UI_LAYOUT_UID_SET = new Set<string>(MULTI_PORTAL_UI_LAYOUT_UIDS);

export function isDefaultLayoutMultiPortalUid(uid: unknown): uid is string {
  return typeof uid === 'string' && DEFAULT_LAYOUT_MULTI_PORTAL_UIDS.has(uid);
}

export function isMultiPortalUiLayoutUid(uid: unknown): uid is MultiPortalUiLayoutUid {
  return typeof uid === 'string' && MULTI_PORTAL_UI_LAYOUT_UID_SET.has(uid);
}

/**
 * Layout route names of the two fixed Portals, which are also the UI Layout route names. Core and plugins register their
 * own routes inside these namespaces (for example `admin.workflow.tasks` and `mobile.page.*`), so they must stay
 * stable even though the Portal identities and route paths live in the database. Only user-created Portals use the
 * `multiPortalLayout_<uid>` route name instead.
 */
export const DEFAULT_LAYOUT_ROUTE_NAME_BY_UI_LAYOUT_UID: Record<MultiPortalUiLayoutUid, string> = {
  [ADMIN_UI_LAYOUT_UID]: 'admin',
  [MOBILE_UI_LAYOUT_UID]: 'mobile',
};

export function getMultiPortalLayoutType(uid: unknown): MultiPortalLayoutType | undefined {
  if (uid === ADMIN_UI_LAYOUT_UID) {
    return 'desktop';
  }
  if (uid === MOBILE_UI_LAYOUT_UID) {
    return 'mobile';
  }
}
