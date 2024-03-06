import { BlockInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';

export const BulkEditActionInitializer = () => {
  const schema = {
    type: 'void',
    title: '{{t("Bulk edit")}}',
    'x-component': 'Action',
    'x-action': 'customize:bulkEdit',
    'x-action-settings': {
      updateMode: 'selected',
    },
    'x-component-props': {
      openMode: 'drawer',
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
            'x-initializer': 'TabPaneInitializersForBulkEditFormBlock',
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
