/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { NAMESPACE } from '../locale';

export const createActionSchema = {
  type: 'void',
  'x-component': 'Action',
  title: `{{t("Add New", { ns: "${NAMESPACE}" })}}`,
  'x-align': 'right',
  'x-component-props': {
    type: 'primary',
  },
  properties: {
    drawer: {
      type: 'void',
      'x-component': 'Action.Drawer',
      title: "{{t('Add New')}}",
      'x-decorator': 'Form',
      properties: {
        form: {
          type: 'void',
          properties: {
            title: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            collection: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            type: {
              type: 'string',
              'x-decorator': 'FormItem',
              title: 'Type',
              'x-component': 'Radio.Group',
              default: 'form',
              enum: '{{ formTypes }}',
            },
            description: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            enabledPassword: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              default: false,
            },
            password: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              'x-reactions': {
                dependencies: ['enabledPassword'],
                fulfill: {
                  state: {
                    required: '{{$deps[0]}}',
                  },
                },
              },
            },
            enabled: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              default: true,
            },
          },
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            submit: {
              title: 'Submit',
              'x-component': 'Action',
              'x-use-component-props': 'useSubmitActionProps',
            },
          },
        },
      },
    },
  },
};
