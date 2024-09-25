/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useActionAvailable } from '../../useActionAvailable';

const commonOptions = {
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      name: 'filter',
      title: "{{t('Filter')}}",
      Component: 'FilterActionInitializer',
      schema: {
        'x-align': 'left',
      },
    },
    {
      name: 'addNew',
      title: "{{t('Add new')}}",
      Component: 'CreateActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible: () => useActionAvailable('create'),
    },
    {
      name: 'refresh',
      title: "{{t('Refresh')}}",
      Component: 'RefreshActionInitializer',
      schema: {
        'x-align': 'right',
      },
    },
    {
      name: 'import',
      title: "{{t('Import')}}",
      Component: 'ImportActionInitializer',
      schema: {
        'x-align': 'right',
        'x-acl-action': 'importXlsx',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible: () => useActionAvailable('import'),
    },
    {
      name: 'export',
      title: "{{t('Export')}}",
      Component: 'ExportActionInitializer',
      useVisible: () => useActionAvailable('export'),
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
    },
    {
      name: 'customRequest',
      title: '{{t("Custom request")}}',
      Component: 'CustomRequestInitializer',
      schema: {
        'x-action': 'customize:table:request:global',
      },
    },
  ],
};

/**
 * @deprecated
 * use `listActionInitializers` instead
 * 表单的操作配置
 */
export const listActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'ListActionInitializers',
  ...commonOptions,
});

export const listActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'list:configureActions',
    ...commonOptions,
  },
  listActionInitializers_deprecated,
);
