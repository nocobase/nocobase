/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function getMobileTabBarItemData(schemaId: string, values: any) {
  return {
    url: `/schema/${schemaId}`,
    parentId: null,
    title: values.title,
    options: {
      type: 'void',
      'x-decorator': 'BlockItem',
      'x-toolbar-props': {
        draggable: false,
      },
      'x-settings': 'mobile:tab-bar:schema',
      'x-component': 'MobileTabBar.Schema',
      'x-component-props': {
        ...values,
        schemaId: schemaId,
      },
    },
  };
}
