/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import React from 'react';
import { usePluginTranslation } from './locale';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';

// 根据当前初始化器上下文决定内部使用的初始化器
const getInnerInitializer = (currentInitializer: string): string => {
  switch (currentInitializer) {
    case 'popup:addNew:addBlock':
      return 'popup:addNew:addBlock';
    case 'popup:common:addBlock':
      return 'popup:common:addBlock';
    case 'popup:bulkEdit:addBlock':
      return 'popup:bulkEdit:addBlock';
    case 'RecordFormBlockInitializers':
      return 'RecordFormBlockInitializers';
    case 'mobile:addBlock':
      return 'mobile:addBlock';
    case 'mobilePage:addBlock':
      return 'mobilePage:addBlock';
    case 'page:addBlock':
    default:
      return 'page:addBlock';
  }
};

export const BlockTabsInitializer = () => {
  const { t } = usePluginTranslation();
  const { insert, options } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();

  // 根据当前初始化器上下文决定内部使用的初始化器
  const innerInitializer = getInnerInitializer(options?.name || 'page:addBlock');

  const onClick = () => {
    insert({
      type: 'void',
      'x-settings': 'blockTabsSettings',
      'x-decorator': 'BlockItem',
      'x-decorator-props': {
        name: 'blockTabs',
      },
      'x-component': 'BlockTabs',
      properties: {
        [uid()]: {
          type: 'void',
          title: '{{t("Tab 1")}}',
          'x-component': 'BlockTabs.TabPane',
          'x-designer': 'BlockTabs.TabPane.Designer',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': innerInitializer,
              properties: {},
            },
          },
        },
        [uid()]: {
          type: 'void',
          title: '{{t("Tab 2")}}',
          'x-component': 'BlockTabs.TabPane',
          'x-designer': 'BlockTabs.TabPane.Designer',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': innerInitializer,
              properties: {},
            },
          },
        },
      },
    });
  };

  return <SchemaInitializerItem {...itemConfig} onClick={onClick} />;
};
