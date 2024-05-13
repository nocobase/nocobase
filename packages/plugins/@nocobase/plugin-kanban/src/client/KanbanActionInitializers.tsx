/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer, useCollection_deprecated } from '@nocobase/client';

const commonOptions = {
  name: 'kanban:configureActions',
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
      useVisible() {
        const collection = useCollection_deprecated();
        return (collection as any).template !== 'view' || collection?.writableView;
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
