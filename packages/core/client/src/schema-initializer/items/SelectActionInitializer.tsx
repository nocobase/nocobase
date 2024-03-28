import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const SelectActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Select") }}',
    'x-action': 'update',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-component-props': {
      openMode: 'drawer',
    },
    properties: {
      drawer: {
        type: 'void',
        'x-component': 'AssociationField.Selector',
        title: '{{ t("Select record") }}',
        'x-component-props': {
          className: 'nb-record-picker-selector',
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'popup:tableSelector:addBlock',
            properties: {},
          },
          footer: {
            'x-component': 'Action.Container.Footer',
            'x-component-props': {},
            properties: {
              actions: {
                type: 'void',
                'x-component': 'ActionBar',
                'x-component-props': {},
                properties: {
                  submit: {
                    title: '{{ t("Submit") }}',
                    'x-action': 'submit',
                    'x-component': 'Action',
                    'x-use-component-props': 'usePickActionProps',
                    // 'x-designer': 'Action.Designer',
                    'x-toolbar': 'ActionSchemaToolbar',
                    'x-settings': 'actionSettings:submit',
                    'x-component-props': {
                      type: 'primary',
                      htmlType: 'submit',
                    },
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
