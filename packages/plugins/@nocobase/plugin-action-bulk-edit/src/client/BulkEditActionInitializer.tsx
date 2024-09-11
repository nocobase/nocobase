/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockInitializer, useOpenModeContext, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';

export const BulkEditActionInitializer = () => {
  const { defaultOpenMode } = useOpenModeContext();

  const schema = {
    type: 'void',
    title: '{{t("Bulk edit")}}',
    'x-component': 'Action',
    'x-action': 'customize:bulkEdit',
    'x-action-settings': {
      updateMode: 'selected',
    },
    'x-component-props': {
      openMode: defaultOpenMode,
      icon: 'EditOutlined',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{t("Bulk edit")}}',
        'x-component': 'Action.Container',
        'x-component-props': {
          className: 'nb-action-popup',
        },
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            'x-initializer': 'popup:addTab',
            'x-initializer-props': {
              gridInitializer: 'popup:bulkEdit:addBlock',
            },
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Bulk edit")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'popup:bulkEdit:addBlock',
                    properties: {},
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const itemConfig = useSchemaInitializerItem();
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
