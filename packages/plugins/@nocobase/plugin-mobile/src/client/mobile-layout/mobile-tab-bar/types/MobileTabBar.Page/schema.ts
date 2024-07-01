/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface GetMobileTabBarPageItemDataOptions {
  schemaPageUid: string;
  url?: string;
  values: any;
}

export function getMobileTabBarPageItemData(options: GetMobileTabBarPageItemDataOptions) {
  const { schemaPageUid, url, values } = options;
  return {
    url,
    parentId: null,
    options: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-toolbar-props': {
        // draggable: false,
      },
      'x-settings': 'mobile:tab-bar:schema',
      'x-component': 'MobileTabBar.Page',
      'x-component-props': {
        ...values,
        schemaPageUid: schemaPageUid,
      },
    },
  };
}
