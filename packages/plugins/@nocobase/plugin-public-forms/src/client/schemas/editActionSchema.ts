/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const editActionSchema = {
  type: 'void',
  title: 'Edit',
  'x-component': 'Action.Link',
  'x-component-props': {
    openMode: 'drawer',
    icon: 'EditOutlined',
  },
  properties: {
    drawer: {
      type: 'void',
      title: 'Edit',
      'x-component': 'Action.Drawer',
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useEditFormProps',
          properties: {
            title: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
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
    },
  },
};
