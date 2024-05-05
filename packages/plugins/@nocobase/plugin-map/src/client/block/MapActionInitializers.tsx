/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer, useCollection_deprecated } from '@nocobase/client';

/**
 * @deprecated
 * use `mapActionInitializers` instead
 * 表格操作配置
 */
export const mapActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'MapActionInitializers',
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
            return collection.template !== 'sql';
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
    {
      name: 'divider',
      type: 'divider',
      useVisible() {
        const collection = useCollection_deprecated();
        return collection.template !== 'sql';
      },
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
      children: [],
      useVisible() {
        const collection = useCollection_deprecated();
        return collection.template !== 'sql';
      },
    },
  ],
});

export const mapActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'map:configureActions',
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
              return collection.template !== 'sql';
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
      {
        name: 'divider',
        type: 'divider',
        useVisible() {
          const collection = useCollection_deprecated();
          return collection.template !== 'sql';
        },
      },
      {
        type: 'subMenu',
        title: '{{t("Customize")}}',
        name: 'customize',
        children: [],
        useVisible() {
          const collection = useCollection_deprecated();
          return collection.template !== 'sql';
        },
      },
    ],
  },
  mapActionInitializers_deprecated,
);
