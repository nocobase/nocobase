/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../application/schema-initializer/CompatibleSchemaInitializer';

const commonOptions = {
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: "{{t('Enable actions')}}",
      name: 'enableActions',
      children: [
        {
          name: 'addNew',
          title: "{{t('Add new')}}",
          Component: 'CreateActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
        {
          name: 'delete',
          title: "{{t('Delete')}}",
          Component: 'BulkDestroyActionInitializer',
          schema: {
            'x-align': 'right',
          },
        },
      ],
    },
  ],
};

/**
 * @deprecated
 * use `subTableActionInitializers` instead
 * 表格操作配置
 */
export const subTableActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'SubTableActionInitializers',
  ...commonOptions,
});

export const subTableActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'subTable:configureActions',
    ...commonOptions,
  },
  subTableActionInitializers_deprecated,
);
