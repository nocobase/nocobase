/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '@nocobase/client';

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
          name: 'filter',
          title: "{{t('Filter')}}",
          Component: 'FilterActionInitializer',
          schema: {
            'x-align': 'left',
          },
        },
        {
          name: 'refresh',
          title: "{{t('Refresh')}}",
          Component: 'RefreshActionInitializer',
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
 * use `auditLogsTableActionInitializers` instead
 * 操作记录表格操作配置
 */
export const auditLogsTableActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'AuditLogsTableActionInitializers',
  ...commonOptions,
});

export const auditLogsTableActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'auditLogsTable:configureActions',
    ...commonOptions,
  },
  auditLogsTableActionInitializers_deprecated,
);
