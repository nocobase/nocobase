/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer, useActionAvailable } from '@nocobase/client';

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
 * use `kanbanActionInitializers` instead
 */
export const kanbanActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'KanbanActionInitializers',
  ...commonOptions,
});

export const kanbanActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'kanban:configureActions',
    ...commonOptions,
  },
  kanbanActionInitializers_deprecated,
);
