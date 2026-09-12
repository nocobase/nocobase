/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const NAMESPACE = '@nocobase/plugin-ui-layout';

export const UI_LAYOUT_TYPE_DESKTOP = 'desktop';
export const UI_LAYOUT_TYPE_MOBILE = 'mobile';

export const DEFAULT_ADMIN_UI_LAYOUT = {
  title: 'Desktop layout',
  uid: 'admin-layout-model',
  layoutType: UI_LAYOUT_TYPE_DESKTOP,
  routeName: 'admin',
  routePath: '/admin',
  authCheck: true,
  enabled: true,
} as const;

export const DEFAULT_MOBILE_UI_LAYOUT = {
  title: 'Mobile layout',
  uid: 'mobile-layout-model',
  layoutType: UI_LAYOUT_TYPE_MOBILE,
  routeName: 'mobile',
  routePath: '/mobile',
  authCheck: true,
  enabled: true,
} as const;
