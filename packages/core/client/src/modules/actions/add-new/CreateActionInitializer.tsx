import React from 'react';
import { useSchemaInitializerItem } from '../../../application';
import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const CreateActionInitializer = () => {
  const schema = {
    type: 'void',
    'x-action': 'create',
    'x-acl-action': 'create',
    title: "{{t('Add new')}}",
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:addNew',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      openMode: 'drawer',
      type: 'primary',
      component: 'CreateRecordAction',
      icon: 'PlusOutlined',
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
                    'x-initializer': 'popup:addNew:addBlock',
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
  return <ActionInitializer {...itemConfig} item={itemConfig} schema={schema} />;
};
