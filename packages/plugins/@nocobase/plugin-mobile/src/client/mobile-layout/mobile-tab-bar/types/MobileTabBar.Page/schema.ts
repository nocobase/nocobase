/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mobileTabBarPageSettings } from './settings';

export interface GetMobileTabBarPageItemDataOptions {
  pageSchemaUid: string;
  url?: string;
  values: any;
}

export function getMobileTabBarPageItemData(options: GetMobileTabBarPageItemDataOptions) {
  const { pageSchemaUid, url, values } = options;
  return {
    url,
    parentId: null,
    options: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-settings': mobileTabBarPageSettings.name,
      'x-component': 'MobileTabBar.Page',
      'x-component-props': {
        ...values,
        pageSchemaUid: pageSchemaUid,
      },
    },
  };
}
