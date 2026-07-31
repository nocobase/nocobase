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

const DEFAULT_LAYOUT_MULTI_PORTAL_UIDS = new Set<string>([
  DEFAULT_ADMIN_MULTI_PORTAL_UID,
  DEFAULT_MOBILE_MULTI_PORTAL_UID,
]);

export function isDefaultLayoutMultiPortalUid(uid: unknown): uid is string {
  return typeof uid === 'string' && DEFAULT_LAYOUT_MULTI_PORTAL_UIDS.has(uid);
}
