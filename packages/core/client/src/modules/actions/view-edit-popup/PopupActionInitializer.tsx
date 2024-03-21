import React from 'react';
import { useSchemaInitializerItem } from '../../../application';
import { BlockInitializer } from '../../../schema-initializer/items';

export const PopupActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Popup") }}',
    'x-action': 'customize:popup',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:popup',
    'x-component': props?.['x-component'] || 'Action.Link',
    'x-component-props': {
      openMode: 'drawer',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Popup") }}',
        'x-component': 'Action.Container',
        'x-component-props': {
          className: 'nb-action-popup',
        },
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            'x-initializer': 'TabPaneInitializers',
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Details")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'popup:common:addBlock',
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
