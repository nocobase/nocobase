/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CompatibleSchemaInitializer,
  InitializerWithSwitch,
  useActionAvailable,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React from 'react';
import { generateNTemplate } from '../../../locale';

const CalendarActionInitializer = (props) => {
  const itemConfig = useSchemaInitializerItem();
  return <InitializerWithSwitch {...itemConfig} {...props} item={itemConfig} type={'x-action'} />;
};

const commonOptions = {
  title: generateNTemplate('Configure actions'),
  icon: 'SettingOutlined',
  style: { marginLeft: 8 },
  items: [
    {
      name: 'today',
      title: generateNTemplate('Today'),
      Component: CalendarActionInitializer,
      schema: {
        title: generateNTemplate('Today'),
        'x-component': 'CalendarV2.Today',
        'x-action': `calendar:today`,
        'x-align': 'left',
      },
    },
    {
      name: 'turnPages',
      title: generateNTemplate('Turn pages'),
      Component: CalendarActionInitializer,
      schema: {
        title: generateNTemplate('Turn pages'),
        'x-component': 'CalendarV2.Nav',
        'x-action': `calendar:nav`,
        'x-align': 'left',
      },
    },
    {
      name: 'title',
      title: generateNTemplate('Title'),
      Component: CalendarActionInitializer,
      schema: {
        title: generateNTemplate('Title'),
        'x-component': 'CalendarV2.Title',
        'x-action': `calendar:title`,
        'x-align': 'left',
      },
    },
    {
      name: 'selectView',
      title: generateNTemplate('Select view'),
      Component: CalendarActionInitializer,
      schema: {
        title: generateNTemplate('Select view'),
        'x-component': 'CalendarV2.ViewSelect',
        'x-action': `calendar:viewSelect`,
        'x-align': 'right',
        'x-designer': 'Action.Designer',
      },
    },
    {
      name: 'filter',
      title: generateNTemplate('Filter'),
      Component: 'FilterActionInitializer',
      schema: {
        'x-align': 'right',
      },
    },
    {
      name: 'addNew',
      title: generateNTemplate('Add new'),
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
      type: 'item',
      title: "{{t('Refresh')}}",
      name: 'refresh',
      Component: 'RefreshActionInitializer',
      schema: {
        'x-align': 'right',
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
 * use `calendarActionInitializers` instead
 * 日历的操作配置
 */
export const CalendarActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CalendarActionInitializers',
  ...commonOptions,
});

export const calendarActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'calendar:configureActions',
    ...commonOptions,
  },
  CalendarActionInitializers_deprecated,
);
