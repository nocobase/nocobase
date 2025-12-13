/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import {
  SchemaSettings,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsTemplate,
  useDesignable,
  useRecord,
  useOpenModeContext,
  useCollection,
  ISchema,
} from '@nocobase/client';
import { usePluginTranslation } from './locale';

export const blockTabsSettings = new SchemaSettings({
  name: 'blockTabsSettings',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
      useComponentProps: () => {
        const { t } = usePluginTranslation();
        return {
          title: t('Block Tabs'),
        };
      },
    },
    {
      name: 'addTab',
      Component: SchemaSettingsModalItem,
      useComponentProps: () => {
        const { t } = usePluginTranslation();
        const { dn } = useDesignable();
        const fieldSchema = useFieldSchema();
        const { isMobile } = useOpenModeContext() || {};
        const record = useRecord();
        const collection = useCollection();

        // 智能确定initializer
        const getInitializer = () => {
          let initializer = 'page:addBlock';
          if (isMobile) {
            initializer = 'mobile:addBlock';
          }
          if (collection) {
            initializer = 'popup:common:addBlock';
            if (!record) {
              initializer = 'popup:addNew:addBlock';
            }
          }
          return initializer;
        };

        return {
          title: t('Add tab'),
          schema: {
            type: 'object',
            title: t('Add tab'),
            properties: {
              title: {
                title: t('Tab name'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                'x-component-props': {},
              },
            },
          } as ISchema,
          initialValues: {},
          onSubmit: ({ title, icon }) => {
            const initializer = getInitializer();

            dn.insertBeforeEnd({
              type: 'void',
              title,
              'x-component': 'BlockTabs.TabPane',
              'x-designer': 'BlockTabs.TabPane.Designer',
              'x-component-props': {
                icon,
              },
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': initializer,
                  properties: {},
                },
              },
            });
          },
        };
      },
    },
    {
      name: 'template',
      Component: SchemaSettingsTemplate,
      useComponentProps: () => {
        const field = useField();
        return {
          componentName: 'BlockTabs',
          collectionName: field?.componentProps?.collectionName,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'remove',
      Component: SchemaSettingsRemove,
      useComponentProps: () => {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {},
        };
      },
    },
  ],
});
