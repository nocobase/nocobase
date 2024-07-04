/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface GetMobileTabBarLinkItemDataOptions {
  url?: string;
  values: any;
}

export function getMobileTabBarLinkItemData(options: GetMobileTabBarLinkItemDataOptions) {
  const { url, values } = options;
  return {
    url,
    parentId: null,
    options: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-settings': 'mobile:tab-bar:link',
      'x-component': 'MobileTabBar.Link',
      'x-toolbar-props': {
        showBorder: false,
        showBackground: true,
      },
      'x-component-props': {
        ...values,
      },
    },
  };
}
