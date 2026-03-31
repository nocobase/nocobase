/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  Selector: {
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
};
