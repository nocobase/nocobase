import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const CreateChildNodeInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Add Child") }}',
    'x-action': 'create',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-component-props': {
      icon: 'PlusOutlined',
      openMode: 'drawer',
      type: 'primary',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Add record") }}',
        'x-component': 'Action.Container',
        'x-component-props': {
          className: 'nb-action-popup',
        },
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            'x-initializer': 'TabPaneInitializersForCreateFormBlock',
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Add new")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'CreateFormBlockInitializers',
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
  return <ActionInitializer {...props} schema={schema} />;
};
